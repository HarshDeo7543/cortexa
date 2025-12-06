import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
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

        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const application = await getApplication(id)

        if (!application) {
            return NextResponse.json({ error: 'Application not found' }, { status: 404 })
        }

        const userRole = await getUserRole(user.id)

        // Check access: user can only view their own, reviewers/admin can view all
        if (userRole === 'user' && application.userId !== user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        // Generate download URL if approved or for reviewers
        let downloadUrl: string | null = null
        if (application.status === 'approved' || userRole !== 'user') {
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
