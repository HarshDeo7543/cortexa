import { NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/firebase/server'
import { getApplication } from '@/lib/aws/dynamodb'
import { getPresignedDownloadUrl } from '@/lib/aws/s3'
import { getUserRole } from '@/lib/auth/roles'

// GET: Get single application by ID
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        const user = await getAuthenticatedUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const application = await getApplication(id)

        if (!application) {
            return NextResponse.json({ error: 'Application not found' }, { status: 404 })
        }

        const userRole = await getUserRole(user.uid)

        // Check access: user can only view their own, reviewers/admin can view all
        if (userRole === 'user' && application.userId !== user.uid) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        // Generate download URL if approved or for reviewers
        let downloadUrl: string | null = null
        if (application.status === 'approved') {
            // For approved applications, serve the signed document if available
            const keyToDownload = application.signedS3Key || application.s3Key
            downloadUrl = await getPresignedDownloadUrl(keyToDownload)
        } else if (userRole !== 'user') {
            // Reviewers can download the original document
            downloadUrl = await getPresignedDownloadUrl(application.s3Key)
        }

        return NextResponse.json({
            application,
            downloadUrl,
            canReview: userRole !== 'user',
        })
    } catch (error) {
        console.error('Get application error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch application' },
            { status: 500 }
        )
    }
}
