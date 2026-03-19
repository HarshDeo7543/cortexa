import { NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/firebase/server'
import {
    getApplication,
    addSubstitutionRequest,
    type SubstitutionRequest,
} from '@/lib/aws/dynamodb'
import { isComplianceOfficer, isAdmin } from '@/lib/auth/roles'
import { createActivityLog, generateLogId } from '@/lib/aws/activity-logs'
import { getUser, listUsers } from '@/lib/firebase/admin'
import { sendReassignmentNotification } from '@/lib/email/resend'
import { v4 as uuidv4 } from 'uuid'

// POST: Compliance officer requests a substitution
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
                { error: 'Only Compliance Officers can request reassignment' },
                { status: 403 }
            )
        }

        const body = await request.json()
        const { newOfficerId, reason } = body

        if (!newOfficerId || !reason || typeof reason !== 'string' || reason.trim().length === 0) {
            return NextResponse.json(
                { error: 'New officer ID and reason are required' },
                { status: 400 }
            )
        }

        const application = await getApplication(id)
        if (!application) {
            return NextResponse.json({ error: 'Application not found' }, { status: 404 })
        }

        if (application.status !== 'compliance_review') {
            return NextResponse.json(
                { error: 'Reassignment is only available during compliance review' },
                { status: 400 }
            )
        }

        if (!application.workflow || application.workflow.length === 0) {
            return NextResponse.json(
                { error: 'No workflow defined for this application' },
                { status: 400 }
            )
        }

        // Find the requesting officer's step in the workflow
        const stepIndex = application.workflow.findIndex(
            step => step.officerId === authUser.uid && step.status === 'pending'
        )

        if (stepIndex === -1) {
            return NextResponse.json(
                { error: 'You are not currently assigned to review this application' },
                { status: 403 }
            )
        }

        // Validate the new officer
        const allUsers = await listUsers()
        const newOfficer = allUsers.find(u => u.id === newOfficerId && u.role === 'compliance_officer')

        if (!newOfficer) {
            return NextResponse.json(
                { error: 'Selected user is not a valid compliance officer' },
                { status: 400 }
            )
        }

        // Check the new officer is not already in the workflow
        const alreadyInWorkflow = application.workflow.some(step => step.officerId === newOfficerId)
        if (alreadyInWorkflow) {
            return NextResponse.json(
                { error: 'This officer is already in the workflow' },
                { status: 400 }
            )
        }

        // Check for pending substitution request for the same step
        const existingPending = (application.substitutionRequests || []).find(
            req => req.workflowStepIndex === stepIndex && req.status === 'pending'
        )
        if (existingPending) {
            return NextResponse.json(
                { error: 'A substitution request for this step is already pending' },
                { status: 400 }
            )
        }

        const firebaseUser = await getUser(authUser.uid)
        const requesterName = firebaseUser?.displayName || authUser.email || 'Unknown'

        // Create substitution request
        const newRequest: SubstitutionRequest = {
            id: uuidv4(),
            requestedBy: authUser.uid,
            requestedByName: requesterName,
            requestedByEmail: authUser.email || '',
            assignedTo: newOfficerId,
            assignedToName: newOfficer.name || newOfficer.email,
            assignedToEmail: newOfficer.email,
            reason: reason.trim(),
            status: 'pending',
            workflowStepIndex: stepIndex,
            createdAt: new Date().toISOString(),
        }

        const allRequests = [...(application.substitutionRequests || []), newRequest]
        await addSubstitutionRequest(id, allRequests)

        // Log the activity
        await createActivityLog({
            id: generateLogId(),
            timestamp: new Date().toISOString(),
            actorId: authUser.uid,
            actorName: requesterName,
            actorRole: 'compliance_officer',
            actorEmail: authUser.email || '',
            actionType: 'reassignment_requested',
            targetType: 'application',
            targetId: id,
            targetName: application.documentType,
            details: `Requested substitution to ${newOfficer.name || newOfficer.email}. Reason: ${reason.trim()}`,
            metadata: {
                newOfficerId,
                newOfficerName: newOfficer.name || newOfficer.email,
                documentType: application.documentType,
            }
        })

        // Build recipients list: all workflow officers + junior reviewer
        const recipients: { email: string; name: string }[] = []

        for (const step of application.workflow) {
            recipients.push({ email: step.officerEmail, name: step.officerName })
        }

        // Add the new officer (target)
        recipients.push({ email: newOfficer.email, name: newOfficer.name || newOfficer.email })

        // Add junior reviewer
        if (application.juniorReviewerEmail) {
            recipients.push({
                email: application.juniorReviewerEmail,
                name: application.juniorReviewerName || 'Junior Reviewer',
            })
        }

        // Deduplicate by email
        const uniqueRecipients = Array.from(
            new Map(recipients.map(r => [r.email, r])).values()
        )

        await sendReassignmentNotification({
            recipients: uniqueRecipients,
            targetOfficer: { email: newOfficer.email, name: newOfficer.name || newOfficer.email },
            documentType: application.documentType,
            applicantName: application.fullName,
            requestedBy: requesterName,
            reason: reason.trim(),
            applicationId: id,
        })

        return NextResponse.json({
            success: true,
            message: 'Substitution request sent successfully',
            requestId: newRequest.id,
        })
    } catch (error) {
        console.error('Reassign error:', error)
        return NextResponse.json(
            { error: 'Failed to process reassignment' },
            { status: 500 }
        )
    }
}
