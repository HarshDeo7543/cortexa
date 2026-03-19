// Professional HTML email templates for Cortexa notifications

const BASE_STYLES = `
  body { margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
  .container { max-width: 560px; margin: 0 auto; padding: 40px 20px; }
  .card { background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; }
  .header { padding: 28px 32px 20px; border-bottom: 1px solid #f1f5f9; }
  .header h1 { margin: 0; font-size: 18px; font-weight: 600; color: #0f172a; }
  .header p { margin: 6px 0 0; font-size: 13px; color: #64748b; }
  .body { padding: 24px 32px; }
  .body p { margin: 0 0 14px; font-size: 14px; line-height: 1.6; color: #334155; }
  .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
  .detail-label { color: #64748b; }
  .detail-value { color: #0f172a; font-weight: 500; }
  .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
  .badge-green { background: #ecfdf5; color: #059669; }
  .badge-red { background: #fef2f2; color: #dc2626; }
  .badge-amber { background: #fffbeb; color: #d97706; }
  .badge-blue { background: #eff6ff; color: #2563eb; }
  .badge-purple { background: #faf5ff; color: #7c3aed; }
  .btn { display: inline-block; padding: 10px 24px; border-radius: 8px; font-size: 14px; font-weight: 600; text-decoration: none; }
  .btn-primary { background: #0f172a; color: #ffffff; }
  .btn-green { background: #059669; color: #ffffff; }
  .footer { padding: 20px 32px; background: #f8fafc; border-top: 1px solid #f1f5f9; }
  .footer p { margin: 0; font-size: 12px; color: #94a3b8; text-align: center; }
  .reason-box { background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 14px 18px; margin: 14px 0; }
  .reason-box p { color: #991b1b; margin: 0; font-size: 13px; }
  .info-box { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 14px 18px; margin: 14px 0; }
  .info-box p { color: #1e40af; margin: 0; font-size: 13px; }
`

function wrapTemplate(content: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>${BASE_STYLES}</style></head>
<body>
  <div class="container">
    <div class="card">
      ${content}
    </div>
    <div style="text-align: center; padding: 20px 0;">
      <p style="font-size: 12px; color: #94a3b8; margin: 0;">Cortexa Document Verification Platform</p>
    </div>
  </div>
</body>
</html>`
}

export function statusChangeTemplate(params: {
  recipientName: string
  documentType: string
  applicantName: string
  previousStatus: string
  newStatus: string
  reviewerName: string
  reviewerRole: string
  comment?: string
  applicationId: string
}): string {
  const statusBadge = params.newStatus === 'approved'
    ? '<span class="badge badge-green">Approved</span>'
    : params.newStatus === 'rejected'
      ? '<span class="badge badge-red">Rejected</span>'
      : '<span class="badge badge-blue">In Review</span>'

  return wrapTemplate(`
    <div class="header">
      <h1>Document Status Update</h1>
      <p>A document has been reviewed</p>
    </div>
    <div class="body">
      <p>Hi ${params.recipientName},</p>
      <p>The status of a document has been updated:</p>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <tr><td style="padding: 8px 0; font-size: 13px; color: #64748b; width: 120px;">Document</td><td style="padding: 8px 0; font-size: 13px; color: #0f172a; font-weight: 500;">${params.documentType}</td></tr>
        <tr><td style="padding: 8px 0; font-size: 13px; color: #64748b;">Applicant</td><td style="padding: 8px 0; font-size: 13px; color: #0f172a; font-weight: 500;">${params.applicantName}</td></tr>
        <tr><td style="padding: 8px 0; font-size: 13px; color: #64748b;">Reviewed by</td><td style="padding: 8px 0; font-size: 13px; color: #0f172a; font-weight: 500;">${params.reviewerName} (${params.reviewerRole})</td></tr>
        <tr><td style="padding: 8px 0; font-size: 13px; color: #64748b;">New Status</td><td style="padding: 8px 0;">${statusBadge}</td></tr>
      </table>
      ${params.comment ? `<div class="info-box"><p><strong>Comment:</strong> "${params.comment}"</p></div>` : ''}
    </div>
    <div class="footer"><p>This is an automated notification from Cortexa.</p></div>
  `)
}

export function verifiedDocumentTemplate(params: {
  userName: string
  documentType: string
  verificationCode: string
  downloadUrl: string
}): string {
  return wrapTemplate(`
    <div class="header">
      <h1>🎉 Document Verified Successfully</h1>
      <p>Your document is ready for download</p>
    </div>
    <div class="body">
      <p>Hi ${params.userName},</p>
      <p>Great news! Your <strong>${params.documentType}</strong> has been successfully verified by all assigned compliance officers and is now ready for download.</p>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <tr><td style="padding: 8px 0; font-size: 13px; color: #64748b; width: 140px;">Verification Code</td><td style="padding: 8px 0; font-size: 14px; color: #0f172a; font-weight: 600; font-family: monospace;">${params.verificationCode}</td></tr>
      </table>
      <div style="text-align: center; padding: 12px 0;">
        <a href="${params.downloadUrl}" class="btn btn-green">Download Verified Document</a>
      </div>
      <p style="font-size: 12px; color: #94a3b8; margin-top: 16px;">This download link will expire in 1 hour. You can always access your document from your dashboard.</p>
    </div>
    <div class="footer"><p>This is an automated notification from Cortexa.</p></div>
  `)
}

export function rollbackTemplate(params: {
  recipientName: string
  documentType: string
  applicantName: string
  rolledBackBy: string
  reason: string
  applicationId: string
}): string {
  return wrapTemplate(`
    <div class="header">
      <h1>⚠️ Document Version Rolled Back</h1>
      <p>A verified document has been rolled back</p>
    </div>
    <div class="body">
      <p>Hi ${params.recipientName},</p>
      <p>A previously verified document has been <strong>rolled back</strong> and requires re-verification.</p>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <tr><td style="padding: 8px 0; font-size: 13px; color: #64748b; width: 120px;">Document</td><td style="padding: 8px 0; font-size: 13px; color: #0f172a; font-weight: 500;">${params.documentType}</td></tr>
        <tr><td style="padding: 8px 0; font-size: 13px; color: #64748b;">Applicant</td><td style="padding: 8px 0; font-size: 13px; color: #0f172a; font-weight: 500;">${params.applicantName}</td></tr>
        <tr><td style="padding: 8px 0; font-size: 13px; color: #64748b;">Rolled back by</td><td style="padding: 8px 0; font-size: 13px; color: #0f172a; font-weight: 500;">${params.rolledBackBy}</td></tr>
      </table>
      <div class="reason-box">
        <p><strong>Reason:</strong> ${params.reason}</p>
      </div>
    </div>
    <div class="footer"><p>This is an automated notification from Cortexa.</p></div>
  `)
}

export function reassignmentRequestTemplate(params: {
  recipientName: string
  documentType: string
  applicantName: string
  requestedBy: string
  reason: string
  isTargetOfficer: boolean
  applicationId: string
}): string {
  const actionSection = params.isTargetOfficer
    ? `<p>You have been requested to take over this review. Please log in to your dashboard to <strong>accept</strong> or <strong>reject</strong> this assignment.</p>`
    : `<p>This is an informational notification. The substitution is pending acceptance by the new officer.</p>`

  return wrapTemplate(`
    <div class="header">
      <h1>🔄 Review Reassignment Request</h1>
      <p>A compliance officer has requested a substitution</p>
    </div>
    <div class="body">
      <p>Hi ${params.recipientName},</p>
      <p><strong>${params.requestedBy}</strong> has requested a review substitution for the following document:</p>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <tr><td style="padding: 8px 0; font-size: 13px; color: #64748b; width: 120px;">Document</td><td style="padding: 8px 0; font-size: 13px; color: #0f172a; font-weight: 500;">${params.documentType}</td></tr>
        <tr><td style="padding: 8px 0; font-size: 13px; color: #64748b;">Applicant</td><td style="padding: 8px 0; font-size: 13px; color: #0f172a; font-weight: 500;">${params.applicantName}</td></tr>
      </table>
      <div class="info-box">
        <p><strong>Reason:</strong> ${params.reason}</p>
      </div>
      ${actionSection}
    </div>
    <div class="footer"><p>This is an automated notification from Cortexa.</p></div>
  `)
}

export function substitutionResponseTemplate(params: {
  recipientName: string
  documentType: string
  respondedBy: string
  action: 'accepted' | 'rejected'
  comment?: string
}): string {
  const badge = params.action === 'accepted'
    ? '<span class="badge badge-green">Accepted</span>'
    : '<span class="badge badge-red">Rejected</span>'

  return wrapTemplate(`
    <div class="header">
      <h1>Substitution ${params.action === 'accepted' ? 'Accepted' : 'Rejected'}</h1>
      <p>Reassignment request has been ${params.action}</p>
    </div>
    <div class="body">
      <p>Hi ${params.recipientName},</p>
      <p>The substitution request for <strong>${params.documentType}</strong> has been ${params.action} by <strong>${params.respondedBy}</strong>.</p>
      <div style="margin: 16px 0;">${badge}</div>
      ${params.comment ? `<div class="info-box"><p><strong>Comment:</strong> "${params.comment}"</p></div>` : ''}
    </div>
    <div class="footer"><p>This is an automated notification from Cortexa.</p></div>
  `)
}

export function workflowDefinedTemplate(params: {
  recipientName: string
  documentType: string
  applicantName: string
  officers: { name: string; order: number }[]
  isAssignedOfficer: boolean
  assignedOrder?: number
}): string {
  const officerList = params.officers
    .map(o => `<li style="padding: 4px 0; font-size: 13px; color: #334155;">${o.order}. ${o.name}</li>`)
    .join('')

  const assignedNote = params.isAssignedOfficer
    ? `<p>You have been assigned as <strong>reviewer #${params.assignedOrder}</strong> in this workflow. You will be notified when it is your turn to review.</p>`
    : ''

  return wrapTemplate(`
    <div class="header">
      <h1>📋 Workflow Defined</h1>
      <p>A review workflow has been set for a document</p>
    </div>
    <div class="body">
      <p>Hi ${params.recipientName},</p>
      <p>A review workflow has been defined for the following document:</p>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <tr><td style="padding: 8px 0; font-size: 13px; color: #64748b; width: 120px;">Document</td><td style="padding: 8px 0; font-size: 13px; color: #0f172a; font-weight: 500;">${params.documentType}</td></tr>
        <tr><td style="padding: 8px 0; font-size: 13px; color: #64748b;">Applicant</td><td style="padding: 8px 0; font-size: 13px; color: #0f172a; font-weight: 500;">${params.applicantName}</td></tr>
      </table>
      <p><strong>Review Order:</strong></p>
      <ol style="margin: 8px 0; padding-left: 20px;">${officerList}</ol>
      ${assignedNote}
    </div>
    <div class="footer"><p>This is an automated notification from Cortexa.</p></div>
  `)
}
