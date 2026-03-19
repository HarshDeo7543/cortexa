import { NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/firebase/server'
import {
    getApplication,
    updateApplicationWorkflow,
    type WorkflowStep,
} from '@/lib/aws/dynamodb'
import { isJuniorReviewer, isAdmin } from '@/lib/auth/roles'
import { createActivityLog, generateLogId } from '@/lib/aws/activity-logs'
import { getUser } from '@/lib/firebase/admin'
import { listUsers } from '@/lib/firebase/admin'
import { sendWorkflowDefinedNotification, sendStatusChangeNotification } from '@/lib/email/resend'

// POST: Junior reviewer defines the compliance officer workflow
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
                { error: 'Only Junior Reviewers can define the workflow' },
                { status: 403 }
            )
        }

        const body = await request.json()
        const { officerIds } = body as { officerIds: string[] }

        if (!officerIds || !Array.isArray(officerIds) || officerIds.length === 0) {
            return NextResponse.json(
                { error: 'At least one compliance officer must be selected' },
                { status: 400 }
            )
        }

        const application = await getApplication(id)
        if (!application) {
            return NextResponse.json({ error: 'Application not found' }, { status: 404 })
        }

        // Only allow workflow definition on submitted/junior_review status
        if (application.status !== 'submitted' && application.status !== 'junior_review') {
            return NextResponse.json(
                { error: 'Workflow can only be defined for submitted or junior review applications' },
                { status: 400 }
            )
        }

        // Validate all officer IDs are valid compliance officers
        const allUsers = await listUsers()
        const complianceOfficers = allUsers.filter(u => u.role === 'compliance_officer')
        const coMap = new Map(complianceOfficers.map(co => [co.id, co]))

        for (const oid of officerIds) {
            if (!coMap.has(oid)) {
                return NextResponse.json(
                    { error: `User ${oid} is not a valid compliance officer` },
                    { status: 400 }
                )
            }
        }

        // Build workflow steps
        const workflow: WorkflowStep[] = officerIds.map(oid => {
            const co = coMap.get(oid)!
            return {
                officerId: co.id,
                officerName: co.name || co.email,
                officerEmail: co.email,
                status: 'pending' as const,
            }
        })

        // Get junior reviewer info
        const firebaseUser = await getUser(authUser.uid)
        const jrName = firebaseUser?.displayName || authUser.email || 'Unknown'
        const jrEmail = authUser.email || ''

        // Update application with workflow
        await updateApplicationWorkflow(id, workflow, authUser.uid, jrName, jrEmail)

        // Add a review entry for junior reviewer's approval (the act of defining workflow = junior approval)
        // We already set status to compliance_review in updateApplicationWorkflow

        // Log the activity
        await createActivityLog({
            id: generateLogId(),
            timestamp: new Date().toISOString(),
            actorId: authUser.uid,
            actorName: jrName,
            actorRole: 'junior_reviewer',
            actorEmail: jrEmail,
            actionType: 'workflow_defined',
            targetType: 'application',
            targetId: id,
            targetName: application.documentType,
            details: `Defined workflow with ${workflow.length} compliance officer(s): ${workflow.map(w => w.officerName).join(', ')}`,
            metadata: {
                officerCount: workflow.length,
                documentType: application.documentType,
                applicantName: application.fullName,
            }
        })

        // Send email notifications to all officers and junior reviewer
        const emailRecipients = workflow.map((step, idx) => ({
            email: step.officerEmail,
            name: step.officerName,
            order: idx + 1,
        }))

        // Also notify the first officer that it's their turn
        await sendWorkflowDefinedNotification({
            recipients: emailRecipients,
            documentType: application.documentType,
            applicantName: application.fullName,
            officers: workflow.map((w, idx) => ({ name: w.officerName, order: idx + 1 })),
        })

        // Notify the first compliance officer about the pending review
        const firstOfficer = workflow[0]
        await sendStatusChangeNotification({
            recipients: [{ email: firstOfficer.officerEmail, name: firstOfficer.officerName }],
            documentType: application.documentType,
            applicantName: application.fullName,
            previousStatus: application.status,
            newStatus: 'compliance_review',
            reviewerName: jrName,
            reviewerRole: 'Junior Reviewer',
            applicationId: id,
        })

        return NextResponse.json({
            success: true,
            message: `Workflow defined with ${workflow.length} compliance officer(s)`,
            workflow,
        })
    } catch (error) {
        console.error('Define workflow error:', error)
        return NextResponse.json(
            { error: 'Failed to define workflow' },
            { status: 500 }
        )
    }
}
