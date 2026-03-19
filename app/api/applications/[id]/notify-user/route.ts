import { NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/firebase/server'
import { getApplication } from '@/lib/aws/dynamodb'
import { isJuniorReviewer, isAdmin } from '@/lib/auth/roles'
import { getPresignedDownloadUrl } from '@/lib/aws/s3'
import { createActivityLog, generateLogId } from '@/lib/aws/activity-logs'
import { getUser } from '@/lib/firebase/admin'
import { sendVerifiedDocumentNotification } from '@/lib/email/resend'

// POST: Junior reviewer notifies user that their document is ready
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
                { error: 'Only Junior Reviewers can notify users' },
                { status: 403 }
            )
        }

        const application = await getApplication(id)
        if (!application) {
            return NextResponse.json({ error: 'Application not found' }, { status: 404 })
        }

        if (application.status !== 'approved') {
            return NextResponse.json(
                { error: 'Can only notify user for approved documents' },
                { status: 400 }
            )
        }

        // Generate a download URL for the verified document
        const keyToDownload = application.signedS3Key || application.s3Key
        const downloadUrl = await getPresignedDownloadUrl(keyToDownload, 3600) // 1 hour

        // Send email to the applicant
        const sent = await sendVerifiedDocumentNotification({
            userEmail: application.email,
            userName: application.fullName,
            documentType: application.documentType,
            verificationCode: application.verificationCode || 'N/A',
            downloadUrl,
        })

        // Log the activity
        const firebaseUser = await getUser(authUser.uid)
        const userName = firebaseUser?.displayName || authUser.email || 'Unknown'

        await createActivityLog({
            id: generateLogId(),
            timestamp: new Date().toISOString(),
            actorId: authUser.uid,
            actorName: userName,
            actorRole: 'junior_reviewer',
            actorEmail: authUser.email || '',
            actionType: 'user_notified',
            targetType: 'application',
            targetId: id,
            targetName: application.documentType,
            details: `Notified user ${application.fullName} (${application.email}) that their verified document is ready for download`,
            metadata: {
                applicantEmail: application.email,
                documentType: application.documentType,
            }
        })

        return NextResponse.json({
            success: true,
            message: sent
                ? `Notification email sent to ${application.email}`
                : `Notification logged (email service not configured). User: ${application.email}`,
            emailSent: sent,
        })
    } catch (error) {
        console.error('Notify user error:', error)
        return NextResponse.json(
            { error: 'Failed to notify user' },
            { status: 500 }
        )
    }
}
