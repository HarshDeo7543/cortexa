import { NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/firebase/server'
import {
    getApplication,
    rollbackApplication,
    type DocumentVersion,
    type WorkflowStep,
    type ApplicationStatus,
} from '@/lib/aws/dynamodb'
import { isJuniorReviewer, isAdmin } from '@/lib/auth/roles'
import { createActivityLog, generateLogId } from '@/lib/aws/activity-logs'
import { getUser } from '@/lib/firebase/admin'
import { sendRollbackNotification } from '@/lib/email/resend'

// POST: Rollback a verified document version
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

        const isJunior = await isJuniorReviewer(authUser.uid)
        const userIsAdmin = await isAdmin(authUser.uid)

        if (!isJunior && !userIsAdmin) {
            return NextResponse.json(
                { error: 'Only Junior Reviewers or Admins can rollback documents' },
                { status: 403 }
            )
        }

        const body = await request.json()
        const { reason } = body

        if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
            return NextResponse.json(
                { error: 'A reason for rollback is required' },
                { status: 400 }
            )
        }

        const application = await getApplication(id)
        if (!application) {
            return NextResponse.json({ error: 'Application not found' }, { status: 404 })
        }

        // Only allow rollback on approved applications
        if (application.status !== 'approved') {
            return NextResponse.json(
                { error: 'Only approved applications can be rolled back' },
                { status: 400 }
            )
        }

        const firebaseUser = await getUser(authUser.uid)
        const userName = firebaseUser?.displayName || authUser.email || 'Unknown'

        // Save current approved version to version history
        const existingVersions = application.versions || []
        const newVersion: DocumentVersion = {
            versionNumber: existingVersions.length + 1,
            s3Key: application.s3Key,
            signedS3Key: application.signedS3Key,
            verificationCode: application.verificationCode,
            createdAt: application.updatedAt,
            createdBy: application.reviews?.[application.reviews.length - 1]?.reviewerName || 'Unknown',
            rolledBackAt: new Date().toISOString(),
            rolledBackBy: userName,
            rollbackReason: reason.trim(),
        }

        const versions = [...existingVersions, newVersion]

        // Reset workflow steps to pending
        const resetWorkflow: WorkflowStep[] = (application.workflow || []).map(step => ({
            ...step,
            status: 'pending' as const,
            comment: undefined,
            reviewedAt: undefined,
        }))

        // Reset to compliance_review so officers can re-review
        const newStatus: ApplicationStatus = resetWorkflow.length > 0 ? 'compliance_review' : 'junior_review'
        const workflowIdx = 0

        await rollbackApplication(id, versions, newStatus, resetWorkflow, workflowIdx)

        // Log the activity
        await createActivityLog({
            id: generateLogId(),
            timestamp: new Date().toISOString(),
            actorId: authUser.uid,
            actorName: userName,
            actorRole: 'junior_reviewer',
            actorEmail: authUser.email || '',
            actionType: 'document_rolled_back',
            targetType: 'application',
            targetId: id,
            targetName: application.documentType,
            details: `Rolled back verified document. Reason: ${reason.trim()}`,
            metadata: {
                versionNumber: newVersion.versionNumber,
                documentType: application.documentType,
                applicantName: application.fullName,
            }
        })

        // Send rollback email notification to all associated compliance officers
        const recipients: { email: string; name: string }[] = []

        // Add all workflow officers
        if (application.workflow) {
            for (const step of application.workflow) {
                recipients.push({ email: step.officerEmail, name: step.officerName })
            }
        }

        // Add junior reviewer if not the one doing the rollback
        if (application.juniorReviewerEmail && application.juniorReviewerEmail !== authUser.email) {
            recipients.push({
                email: application.juniorReviewerEmail,
                name: application.juniorReviewerName || 'Junior Reviewer',
            })
        }

        if (recipients.length > 0) {
            await sendRollbackNotification({
                recipients,
                documentType: application.documentType,
                applicantName: application.fullName,
                rolledBackBy: userName,
                reason: reason.trim(),
                applicationId: id,
            })
        }

        return NextResponse.json({
            success: true,
            message: 'Document version rolled back successfully',
            newStatus,
            versionNumber: newVersion.versionNumber,
        })
    } catch (error) {
        console.error('Rollback error:', error)
        return NextResponse.json(
            { error: 'Failed to rollback document' },
            { status: 500 }
        )
    }
}
