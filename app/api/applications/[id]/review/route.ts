import { NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/firebase/server'
import {
    getApplication,
    updateApplicationReview,
    updateWorkflowStep,
    updateApplicationSignedDocument,
    type ApplicationStatus,
    type Review,
    type WorkflowStep,
} from '@/lib/aws/dynamodb'
import { getUserRole, isJuniorReviewer, isComplianceOfficer, isAdmin } from '@/lib/auth/roles'
import { signPdfDocument } from '@/lib/documents/sign-pdf'
import { createActivityLog, generateLogId, type ActivityType } from '@/lib/aws/activity-logs'
import { getUser } from '@/lib/firebase/admin'
import { sendStatusChangeNotification } from '@/lib/email/resend'

// POST: Review application (approve/reject)
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        const authUser = await getAuthenticatedUser()

        if (!authUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { action, comment } = body

        if (!action || !['approved', 'rejected'].includes(action)) {
            return NextResponse.json(
                { error: 'Invalid action. Must be "approved" or "rejected"' },
                { status: 400 }
            )
        }

        const application = await getApplication(id)

        if (!application) {
            return NextResponse.json({ error: 'Application not found' }, { status: 404 })
        }

        // Check if application is already finalized
        if (application.status === 'approved' || application.status === 'rejected') {
            return NextResponse.json(
                { error: 'Application has already been finalized and cannot be reviewed again' },
                { status: 400 }
            )
        }

        // Get user details from Firebase Admin
        const firebaseUser = await getUser(authUser.uid)
        const userName = firebaseUser?.displayName || authUser.email || 'Unknown'

        const userRole = await getUserRole(authUser.uid)
        const isJunior = await isJuniorReviewer(authUser.uid)
        const isCompliance = await isComplianceOfficer(authUser.uid)
        const userIsAdmin = await isAdmin(authUser.uid)

        // Check if this reviewer has already reviewed this application
        const hasAlreadyReviewed = application.reviews?.some(
            (review: Review) => review.reviewerId === authUser.uid
        )

        if (hasAlreadyReviewed && !userIsAdmin) {
            return NextResponse.json(
                { error: 'You have already reviewed this application' },
                { status: 400 }
            )
        }

        let newStatus: ApplicationStatus
        let currentStep: number
        let reviewerRole: 'junior_reviewer' | 'compliance_officer'

        // ========= MULTI-OFFICER WORKFLOW PATH =========
        if (application.workflow && application.workflow.length > 0 && application.status === 'compliance_review') {
            // Multi-officer workflow mode
            if (!isCompliance && !userIsAdmin) {
                return NextResponse.json(
                    { error: 'Only Compliance Officers can review at this stage' },
                    { status: 403 }
                )
            }

            const currentIndex = application.workflowCurrentIndex ?? 0
            const currentStepData = application.workflow[currentIndex]

            if (!currentStepData) {
                return NextResponse.json(
                    { error: 'Workflow configuration error' },
                    { status: 500 }
                )
            }

            // Only the current officer (or admin) can review
            if (currentStepData.officerId !== authUser.uid && !userIsAdmin) {
                return NextResponse.json(
                    { error: `It is not your turn to review. Current reviewer: ${currentStepData.officerName}` },
                    { status: 403 }
                )
            }

            reviewerRole = 'compliance_officer'

            // Update the workflow step
            const updatedWorkflow: WorkflowStep[] = [...application.workflow]
            updatedWorkflow[currentIndex] = {
                ...updatedWorkflow[currentIndex],
                status: action === 'approved' ? 'approved' : 'rejected',
                comment: comment || undefined,
                reviewedAt: new Date().toISOString(),
            }

            if (action === 'rejected') {
                // Any rejection stops the workflow
                newStatus = 'rejected'
                currentStep = currentIndex + 2 // +2 because step 1 is submission, step 2 is first compliance
                const review: Review = {
                    reviewerRole,
                    reviewerId: authUser.uid,
                    reviewerName: userName,
                    action,
                    comment: comment || undefined,
                    timestamp: new Date().toISOString(),
                }
                await updateApplicationReview(id, newStatus, review, currentStep)
                await updateWorkflowStep(id, updatedWorkflow, currentIndex, newStatus, currentStep)

                // Send email notifications
                await sendWorkflowNotifications(application, newStatus, userName, reviewerRole, comment, id)

                return NextResponse.json({
                    success: true,
                    newStatus,
                    message: 'Application rejected',
                })
            }

            // Approved - check if there are more officers
            const nextIndex = currentIndex + 1
            const isLastOfficer = nextIndex >= updatedWorkflow.length

            if (isLastOfficer) {
                // All officers have approved - final approval
                newStatus = 'approved'
                currentStep = updatedWorkflow.length + 1
            } else {
                // Move to next officer
                newStatus = 'compliance_review'
                currentStep = nextIndex + 2
            }

            const review: Review = {
                reviewerRole,
                reviewerId: authUser.uid,
                reviewerName: userName,
                action,
                comment: comment || undefined,
                timestamp: new Date().toISOString(),
            }

            await updateApplicationReview(id, newStatus, review, currentStep)
            await updateWorkflowStep(id, updatedWorkflow, isLastOfficer ? currentIndex : nextIndex, newStatus, currentStep)

            // If fully approved, sign the PDF
            let verificationCode: string | undefined
            if (newStatus === 'approved' && application.s3Key) {
                verificationCode = await signDocument(id, application, userName, updatedWorkflow)
            }

            // Send email notifications
            await sendWorkflowNotifications(application, newStatus, userName, reviewerRole, comment, id, nextIndex)

            return NextResponse.json({
                success: true,
                newStatus,
                verificationCode,
                message: newStatus === 'approved'
                    ? `Application fully approved by all ${updatedWorkflow.length} compliance officers!${verificationCode ? ` Verification Code: ${verificationCode}` : ''}`
                    : `Approved by ${userName}. Moved to next reviewer: ${updatedWorkflow[nextIndex]?.officerName}`,
            })
        }

        // ========= LEGACY / NON-WORKFLOW PATH =========
        // Determine what action to take based on current status and user role
        // STRICT WORKFLOW: submitted -> junior_review -> compliance_review -> approved
        if (application.status === 'submitted' || application.status === 'junior_review') {
            // Junior review stage - ONLY junior reviewers can review here
            if (!isJunior && !userIsAdmin) {
                return NextResponse.json(
                    { error: 'Only Junior Reviewers can review at this stage' },
                    { status: 403 }
                )
            }

            // Compliance officers cannot review at junior stage
            if (isCompliance && !isJunior && !userIsAdmin) {
                return NextResponse.json(
                    { error: 'Compliance Officers must wait for Junior Review to complete' },
                    { status: 403 }
                )
            }

            reviewerRole = 'junior_reviewer'

            if (action === 'approved') {
                newStatus = 'compliance_review'
                currentStep = 2
            } else {
                newStatus = 'rejected'
                currentStep = 1
            }
        } else if (application.status === 'compliance_review') {
            // Compliance review stage (no workflow defined - legacy single-officer path)
            if (!isCompliance && !userIsAdmin) {
                return NextResponse.json(
                    { error: 'Only Compliance Officers can review at this stage' },
                    { status: 403 }
                )
            }

            if (isJunior && !isCompliance && !userIsAdmin) {
                return NextResponse.json(
                    { error: 'Junior Reviewers cannot review at Compliance stage' },
                    { status: 403 }
                )
            }

            reviewerRole = 'compliance_officer'

            if (action === 'approved') {
                newStatus = 'approved'
                currentStep = 3
            } else {
                newStatus = 'rejected'
                currentStep = 2
            }
        } else {
            return NextResponse.json(
                { error: 'Application cannot be reviewed in current status' },
                { status: 400 }
            )
        }

        // Create review record
        const review: Review = {
            reviewerRole,
            reviewerId: authUser.uid,
            reviewerName: userName,
            action,
            comment: comment || undefined,
            timestamp: new Date().toISOString(),
        }

        // Update application
        await updateApplicationReview(id, newStatus, review, currentStep)

        // Log the activity
        const activityType: ActivityType = action === 'approved'
            ? (newStatus === 'approved' ? 'application_approved' : 'application_reviewed')
            : 'application_rejected'

        await createActivityLog({
            id: generateLogId(),
            timestamp: new Date().toISOString(),
            actorId: authUser.uid,
            actorName: userName,
            actorRole: reviewerRole,
            actorEmail: authUser.email || 'Unknown',
            actionType: activityType,
            targetType: 'application',
            targetId: id,
            targetName: application.documentType,
            details: `${action === 'approved' ? 'Approved' : 'Rejected'} application for ${application.fullName}${comment ? ` - Comment: ${comment}` : ''}`,
            metadata: {
                previousStatus: application.status,
                newStatus,
                applicantName: application.fullName,
                documentType: application.documentType,
            }
        })

        // Send email notifications
        await sendWorkflowNotifications(application, newStatus, userName, reviewerRole, comment, id)

        // If fully approved, sign the PDF document
        let verificationCode: string | undefined
        if (newStatus === 'approved' && application.s3Key) {
            try {
                if (application.fileName.toLowerCase().endsWith('.pdf')) {
                    const juniorReview = application.reviews?.find(
                        (r: Review) => r.reviewerRole === 'junior_reviewer' && r.action === 'approved'
                    )

                    const complianceOfficerName = userName
                    const juniorReviewerName = juniorReview?.reviewerName || application.juniorReviewerName || 'Unknown'

                    const signResult = await signPdfDocument(id, application.s3Key, {
                        juniorReviewerName,
                        complianceOfficerName,
                    })
                    verificationCode = signResult.verificationCode

                    await updateApplicationSignedDocument(id, signResult.signedS3Key, signResult.verificationCode)
                }
            } catch (signError) {
                console.error('[Review] Failed to sign PDF:', signError)
            }
        }

        return NextResponse.json({
            success: true,
            newStatus,
            verificationCode,
            message: action === 'approved'
                ? newStatus === 'approved'
                    ? `Application fully approved! ${verificationCode ? `Verification Code: ${verificationCode}` : 'Document is now verified.'}`
                    : 'Application approved and moved to Compliance Review'
                : 'Application rejected'
        })
    } catch (error) {
        console.error('Review application error:', error)
        return NextResponse.json(
            { error: 'Failed to review application' },
            { status: 500 }
        )
    }
}

// Helper: sign the PDF document
async function signDocument(
    id: string,
    application: {
        s3Key: string
        fileName: string
        reviews?: Review[]
        juniorReviewerName?: string
        workflow?: WorkflowStep[]
    },
    currentReviewerName: string,
    workflow: WorkflowStep[]
): Promise<string | undefined> {
    try {
        if (!application.fileName.toLowerCase().endsWith('.pdf')) {
            return undefined
        }

        const juniorReview = application.reviews?.find(
            (r: Review) => r.reviewerRole === 'junior_reviewer' && r.action === 'approved'
        )
        const juniorReviewerName = juniorReview?.reviewerName || application.juniorReviewerName || 'Unknown'

        // Use the last compliance officer's name (the one who gave final approval)
        const complianceOfficerName = currentReviewerName

        const signResult = await signPdfDocument(id, application.s3Key, {
            juniorReviewerName,
            complianceOfficerName,
        })

        await updateApplicationSignedDocument(id, signResult.signedS3Key, signResult.verificationCode)

        return signResult.verificationCode
    } catch (error) {
        console.error('[Review] Failed to sign PDF:', error)
        return undefined
    }
}

// Helper: send email notifications based on workflow
async function sendWorkflowNotifications(
    application: {
        workflow?: WorkflowStep[]
        juniorReviewerEmail?: string
        juniorReviewerName?: string
        documentType: string
        fullName: string
    },
    newStatus: ApplicationStatus,
    reviewerName: string,
    reviewerRole: string,
    comment: string | undefined,
    applicationId: string,
    nextOfficerIndex?: number
): Promise<void> {
    try {
        const recipients: { email: string; name: string }[] = []

        // Add junior reviewer
        if (application.juniorReviewerEmail) {
            recipients.push({
                email: application.juniorReviewerEmail,
                name: application.juniorReviewerName || 'Junior Reviewer',
            })
        }

        // Add all workflow officers
        if (application.workflow) {
            for (const step of application.workflow) {
                if (!recipients.find(r => r.email === step.officerEmail)) {
                    recipients.push({ email: step.officerEmail, name: step.officerName })
                }
            }
        }

        // If there's a next officer, make sure they know it's their turn
        if (nextOfficerIndex !== undefined && application.workflow && application.workflow[nextOfficerIndex]) {
            const nextOfficer = application.workflow[nextOfficerIndex]
            if (!recipients.find(r => r.email === nextOfficer.officerEmail)) {
                recipients.push({ email: nextOfficer.officerEmail, name: nextOfficer.officerName })
            }
        }

        if (recipients.length > 0) {
            await sendStatusChangeNotification({
                recipients,
                documentType: application.documentType,
                applicantName: application.fullName,
                previousStatus: 'compliance_review',
                newStatus,
                reviewerName,
                reviewerRole: reviewerRole === 'junior_reviewer' ? 'Junior Reviewer' : 'Compliance Officer',
                comment,
                applicationId,
            })
        }
    } catch (error) {
        console.error('[Review] Failed to send notification emails:', error)
    }
}
