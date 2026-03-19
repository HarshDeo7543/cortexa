import { NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/firebase/server'
import {
    getApplication,
    updateSubstitutionAndWorkflow,
    type WorkflowStep,
} from '@/lib/aws/dynamodb'
import { isComplianceOfficer, isAdmin } from '@/lib/auth/roles'
import { createActivityLog, generateLogId } from '@/lib/aws/activity-logs'
import { getUser } from '@/lib/firebase/admin'
import { sendSubstitutionResponseNotification } from '@/lib/email/resend'

// POST: New compliance officer accepts or rejects a substitution request
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

        const isCO = await isComplianceOfficer(authUser.uid)
        const userIsAdmin = await isAdmin(authUser.uid)

        if (!isCO && !userIsAdmin) {
            return NextResponse.json(
                { error: 'Only Compliance Officers can respond to substitution requests' },
                { status: 403 }
            )
        }

        const body = await request.json()
        const { requestId, action, comment } = body

        if (!requestId || !action || !['accepted', 'rejected'].includes(action)) {
            return NextResponse.json(
                { error: 'Request ID and valid action (accepted/rejected) are required' },
                { status: 400 }
            )
        }

        const application = await getApplication(id)
        if (!application) {
            return NextResponse.json({ error: 'Application not found' }, { status: 404 })
        }

        const requests = application.substitutionRequests || []
        const requestIndex = requests.findIndex(r => r.id === requestId)

        if (requestIndex === -1) {
            return NextResponse.json(
                { error: 'Substitution request not found' },
                { status: 404 }
            )
        }

        const subRequest = requests[requestIndex]

        // Only the assigned-to officer can respond
        if (subRequest.assignedTo !== authUser.uid && !userIsAdmin) {
            return NextResponse.json(
                { error: 'Only the assigned officer can respond to this request' },
                { status: 403 }
            )
        }

        if (subRequest.status !== 'pending') {
            return NextResponse.json(
                { error: 'This request has already been responded to' },
                { status: 400 }
            )
        }

        // Update the request
        const updatedRequests = [...requests]
        updatedRequests[requestIndex] = {
            ...subRequest,
            status: action,
            respondedAt: new Date().toISOString(),
            responseComment: comment || undefined,
        }

        let updatedWorkflow: WorkflowStep[] | undefined

        if (action === 'accepted') {
            // Replace the officer in the workflow
            const workflow = [...(application.workflow || [])]
            const stepIndex = subRequest.workflowStepIndex

            if (stepIndex >= 0 && stepIndex < workflow.length) {
                const firebaseUser = await getUser(authUser.uid)
                const officerName = firebaseUser?.displayName || authUser.email || 'Unknown'

                workflow[stepIndex] = {
                    ...workflow[stepIndex],
                    officerId: authUser.uid,
                    officerName: officerName,
                    officerEmail: authUser.email || '',
                }
                updatedWorkflow = workflow
            }
        }

        await updateSubstitutionAndWorkflow(id, updatedRequests, updatedWorkflow)

        // Log the activity
        const firebaseUser = await getUser(authUser.uid)
        const userName = firebaseUser?.displayName || authUser.email || 'Unknown'

        await createActivityLog({
            id: generateLogId(),
            timestamp: new Date().toISOString(),
            actorId: authUser.uid,
            actorName: userName,
            actorRole: 'compliance_officer',
            actorEmail: authUser.email || '',
            actionType: action === 'accepted' ? 'reassignment_accepted' : 'reassignment_rejected',
            targetType: 'application',
            targetId: id,
            targetName: application.documentType,
            details: `${action === 'accepted' ? 'Accepted' : 'Rejected'} substitution request from ${subRequest.requestedByName}${comment ? `. Comment: ${comment}` : ''}`,
            metadata: {
                requestedBy: subRequest.requestedByName,
                documentType: application.documentType,
            }
        })

        // Send notification emails
        const recipients: { email: string; name: string }[] = []

        // Notify the requester
        recipients.push({ email: subRequest.requestedByEmail, name: subRequest.requestedByName })

        // Notify all workflow officers
        const workflowToNotify = updatedWorkflow || application.workflow || []
        for (const step of workflowToNotify) {
            if (!recipients.find(r => r.email === step.officerEmail)) {
                recipients.push({ email: step.officerEmail, name: step.officerName })
            }
        }

        // Notify junior reviewer
        if (application.juniorReviewerEmail && !recipients.find(r => r.email === application.juniorReviewerEmail)) {
            recipients.push({
                email: application.juniorReviewerEmail,
                name: application.juniorReviewerName || 'Junior Reviewer',
            })
        }

        await sendSubstitutionResponseNotification({
            recipients,
            documentType: application.documentType,
            respondedBy: userName,
            action,
            comment,
        })

        return NextResponse.json({
            success: true,
            message: `Substitution ${action}`,
        })
    } catch (error) {
        console.error('Substitution respond error:', error)
        return NextResponse.json(
            { error: 'Failed to respond to substitution request' },
            { status: 500 }
        )
    }
}
