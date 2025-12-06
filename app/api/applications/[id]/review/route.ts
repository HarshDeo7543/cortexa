import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
    getApplication,
    updateApplicationReview,
    type ApplicationStatus,
    type Review
} from '@/lib/aws/dynamodb'
import { getUserRole, isJuniorReviewer, isComplianceOfficer } from '@/lib/auth/roles'

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

        const userRole = await getUserRole(user.id)
        const isJunior = await isJuniorReviewer(user.id)
        const isCompliance = await isComplianceOfficer(user.id)

        let newStatus: ApplicationStatus
        let currentStep: number
        let reviewerRole: 'junior_reviewer' | 'compliance_officer'

        // Determine what action to take based on current status and user role
        if (application.status === 'submitted' || application.status === 'junior_review') {
            // Junior review stage
            if (!isJunior) {
                return NextResponse.json(
                    { error: 'Only Junior Reviewers can review at this stage' },
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
            // Compliance review stage
            if (!isCompliance) {
                return NextResponse.json(
                    { error: 'Only Compliance Officers can review at this stage' },
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

        return NextResponse.json({
            success: true,
            newStatus,
            message: action === 'approved'
                ? 'Application approved successfully'
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
