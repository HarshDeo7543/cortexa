import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
    getApplication,
    updateApplicationReview,
    updateApplicationSignedDocument,
    type ApplicationStatus,
    type Review
} from '@/lib/aws/dynamodb'
import { getUserRole, isJuniorReviewer, isComplianceOfficer, isAdmin } from '@/lib/auth/roles'
import { signPdfDocument } from '@/lib/documents/sign-pdf'

// POST: Review application (approve/reject)
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
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

        const userRole = await getUserRole(user.id)
        const isJunior = await isJuniorReviewer(user.id)
        const isCompliance = await isComplianceOfficer(user.id)
        const userIsAdmin = await isAdmin(user.id)

        // Check if this reviewer has already reviewed this application
        const hasAlreadyReviewed = application.reviews?.some(
            (review: Review) => review.reviewerId === user.id
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
            // Compliance review stage - ONLY compliance officers can review here
            if (!isCompliance && !userIsAdmin) {
                return NextResponse.json(
                    { error: 'Only Compliance Officers can review at this stage' },
                    { status: 403 }
                )
            }

            // Junior reviewers cannot review at compliance stage
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
            reviewerId: user.id,
            reviewerName: user.user_metadata?.name || user.email || 'Unknown',
            action,
            comment: comment || undefined,
            timestamp: new Date().toISOString(),
        }

        // Update application
        await updateApplicationReview(id, newStatus, review, currentStep)

        // If fully approved, sign the PDF document
        let verificationCode: string | undefined
        if (newStatus === 'approved' && application.s3Key) {
            try {
                // Check if it's a PDF file
                if (application.fileName.toLowerCase().endsWith('.pdf')) {
                    // Find the junior reviewer from the existing reviews (already in the array before this review)
                    const juniorReview = application.reviews?.find(
                        (r: Review) => r.reviewerRole === 'junior_reviewer' && r.action === 'approved'
                    )

                    // Current user is the compliance officer
                    const complianceOfficerName = user.user_metadata?.name || user.email || 'Unknown'
                    const juniorReviewerName = juniorReview?.reviewerName || 'Unknown'

                    console.log(`[Review] Signing PDF with reviewers:`, { juniorReviewerName, complianceOfficerName })

                    const signResult = await signPdfDocument(id, application.s3Key, {
                        juniorReviewerName,
                        complianceOfficerName,
                    })
                    verificationCode = signResult.verificationCode

                    // Update application with signed document key
                    await updateApplicationSignedDocument(id, signResult.signedS3Key, signResult.verificationCode)

                    console.log(`[Review] Document signed with verification code: ${verificationCode}`)
                } else {
                    console.log(`[Review] Skipping signing - not a PDF file: ${application.fileName}`)
                }
            } catch (signError) {
                console.error('[Review] Failed to sign PDF:', signError)
                // Don't fail the approval, just log the error
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


