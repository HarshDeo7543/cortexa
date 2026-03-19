import { Resend } from 'resend'
import {
    statusChangeTemplate,
    verifiedDocumentTemplate,
    rollbackTemplate,
    reassignmentRequestTemplate,
    substitutionResponseTemplate,
    workflowDefinedTemplate,
} from './email-templates'

// Initialize Resend client (gracefully handles missing key)
const resend = process.env.RESEND_API_KEY
    ? new Resend(process.env.RESEND_API_KEY)
    : null

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Cortexa <noreply@cortexa.dev>'

if (!resend) {
    console.warn('[Email] Resend not configured - emails will be logged only')
}

/**
 * Core email send function with graceful fallback
 */
async function sendEmail(to: string | string[], subject: string, html: string): Promise<boolean> {
    const recipients = Array.isArray(to) ? to : [to]

    console.log(`[Email] Sending "${subject}" to: ${recipients.join(', ')}`)

    if (!resend) {
        console.log('[Email] Resend not configured - email logged but not sent')
        return false
    }

    try {
        const { data, error } = await resend.emails.send({
            from: FROM_EMAIL,
            to: recipients,
            subject,
            html,
        })

        if (error) {
            console.error('[Email] Send failed:', error)
            return false
        }

        console.log(`[Email] Sent successfully, id: ${data?.id}`)
        return true
    } catch (error) {
        console.error('[Email] Send error:', error)
        return false
    }
}

/**
 * Send status change notification to junior reviewer and assigned compliance officers
 */
export async function sendStatusChangeNotification(params: {
    recipients: { email: string; name: string }[]
    documentType: string
    applicantName: string
    previousStatus: string
    newStatus: string
    reviewerName: string
    reviewerRole: string
    comment?: string
    applicationId: string
}): Promise<void> {
    for (const recipient of params.recipients) {
        const html = statusChangeTemplate({
            recipientName: recipient.name,
            documentType: params.documentType,
            applicantName: params.applicantName,
            previousStatus: params.previousStatus,
            newStatus: params.newStatus,
            reviewerName: params.reviewerName,
            reviewerRole: params.reviewerRole,
            comment: params.comment,
            applicationId: params.applicationId,
        })

        await sendEmail(
            recipient.email,
            `Document Status Update: ${params.documentType} - ${params.newStatus.replace('_', ' ').toUpperCase()}`,
            html
        )
    }
}

/**
 * Send verified document notification to the user with download link
 */
export async function sendVerifiedDocumentNotification(params: {
    userEmail: string
    userName: string
    documentType: string
    verificationCode: string
    downloadUrl: string
}): Promise<boolean> {
    const html = verifiedDocumentTemplate({
        userName: params.userName,
        documentType: params.documentType,
        verificationCode: params.verificationCode,
        downloadUrl: params.downloadUrl,
    })

    return sendEmail(
        params.userEmail,
        `✅ Your ${params.documentType} has been verified - Download Ready`,
        html
    )
}

/**
 * Send rollback notification to all associated members
 */
export async function sendRollbackNotification(params: {
    recipients: { email: string; name: string }[]
    documentType: string
    applicantName: string
    rolledBackBy: string
    reason: string
    applicationId: string
}): Promise<void> {
    for (const recipient of params.recipients) {
        const html = rollbackTemplate({
            recipientName: recipient.name,
            documentType: params.documentType,
            applicantName: params.applicantName,
            rolledBackBy: params.rolledBackBy,
            reason: params.reason,
            applicationId: params.applicationId,
        })

        await sendEmail(
            recipient.email,
            `⚠️ Document Rolled Back: ${params.documentType}`,
            html
        )
    }
}

/**
 * Send reassignment request notification
 */
export async function sendReassignmentNotification(params: {
    recipients: { email: string; name: string }[]
    targetOfficer: { email: string; name: string }
    documentType: string
    applicantName: string
    requestedBy: string
    reason: string
    applicationId: string
}): Promise<void> {
    // Notify all associated members
    for (const recipient of params.recipients) {
        const isTarget = recipient.email === params.targetOfficer.email
        const html = reassignmentRequestTemplate({
            recipientName: recipient.name,
            documentType: params.documentType,
            applicantName: params.applicantName,
            requestedBy: params.requestedBy,
            reason: params.reason,
            isTargetOfficer: isTarget,
            applicationId: params.applicationId,
        })

        await sendEmail(
            recipient.email,
            isTarget
                ? `🔄 You've been requested to review: ${params.documentType}`
                : `🔄 Reassignment Request: ${params.documentType}`,
            html
        )
    }
}

/**
 * Send substitution response notification
 */
export async function sendSubstitutionResponseNotification(params: {
    recipients: { email: string; name: string }[]
    documentType: string
    respondedBy: string
    action: 'accepted' | 'rejected'
    comment?: string
}): Promise<void> {
    for (const recipient of params.recipients) {
        const html = substitutionResponseTemplate({
            recipientName: recipient.name,
            documentType: params.documentType,
            respondedBy: params.respondedBy,
            action: params.action,
            comment: params.comment,
        })

        await sendEmail(
            recipient.email,
            `Substitution ${params.action === 'accepted' ? 'Accepted' : 'Rejected'}: ${params.documentType}`,
            html
        )
    }
}

/**
 * Send workflow defined notification to all assigned compliance officers
 */
export async function sendWorkflowDefinedNotification(params: {
    recipients: { email: string; name: string; order?: number }[]
    documentType: string
    applicantName: string
    officers: { name: string; order: number }[]
}): Promise<void> {
    for (const recipient of params.recipients) {
        const isAssignedOfficer = !!recipient.order
        const html = workflowDefinedTemplate({
            recipientName: recipient.name,
            documentType: params.documentType,
            applicantName: params.applicantName,
            officers: params.officers,
            isAssignedOfficer,
            assignedOrder: recipient.order,
        })

        await sendEmail(
            recipient.email,
            `📋 Workflow Defined: ${params.documentType}`,
            html
        )
    }
}
