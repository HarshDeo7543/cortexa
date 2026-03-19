"use client"

import { CheckCircle, Clock, XCircle, User, ArrowRightLeft } from "lucide-react"
import type { WorkflowStep, SubstitutionRequest } from "@/lib/aws/dynamodb"

interface ApprovalWorkflowProps {
  workflow?: WorkflowStep[]
  workflowCurrentIndex?: number
  substitutionRequests?: SubstitutionRequest[]
  status: string
}

export default function ApprovalWorkflow({
  workflow,
  workflowCurrentIndex = 0,
  substitutionRequests = [],
  status,
}: ApprovalWorkflowProps) {

  if (!workflow || workflow.length === 0) {
    return (
      <div className="bg-white dark:bg-card rounded-lg border border-slate-200 dark:border-border p-6">
        <h3 className="text-lg font-bold mb-4">Approval Workflow</h3>
        <p className="text-sm text-muted-foreground">No workflow has been defined yet. The junior reviewer will define the review workflow.</p>
      </div>
    )
  }

  const getStatusIcon = (step: WorkflowStep, index: number) => {
    if (step.status === "approved") return <CheckCircle className="w-5 h-5 text-green-500" />
    if (step.status === "rejected") return <XCircle className="w-5 h-5 text-red-500" />
    if (index === workflowCurrentIndex && status === 'compliance_review') {
      return <Clock className="w-5 h-5 text-amber-500 animate-pulse" />
    }
    return <div className="w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-600" />
  }

  const getStatusBadge = (step: WorkflowStep, index: number) => {
    if (step.status === "approved") return { text: "Approved", cls: "bg-green-500/20 text-green-600 dark:text-green-400" }
    if (step.status === "rejected") return { text: "Rejected", cls: "bg-red-500/20 text-red-600 dark:text-red-400" }
    if (index === workflowCurrentIndex && status === 'compliance_review') {
      return { text: "In Review", cls: "bg-amber-500/20 text-amber-600 dark:text-amber-400" }
    }
    return { text: "Pending", cls: "bg-slate-500/20 text-slate-500" }
  }

  // Find substitution requests for each step
  const getStepSubRequests = (stepIndex: number) => {
    return substitutionRequests.filter(r => r.workflowStepIndex === stepIndex)
  }

  return (
    <div className="bg-white dark:bg-card rounded-lg border border-slate-200 dark:border-border p-6">
      <h3 className="text-lg font-bold mb-6">Approval Workflow</h3>

      {/* Approvers List */}
      <div className="space-y-4 mb-6">
        {workflow.map((step, index) => {
          const badge = getStatusBadge(step, index)
          const subRequests = getStepSubRequests(index)

          return (
            <div key={`${step.officerId}-${index}`}>
              <div className="flex items-start gap-3 pb-4">
                <div className="mt-1">{getStatusIcon(step, index)}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-slate-900 dark:text-white">{step.officerName}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${badge.cls}`}>
                      {badge.text}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Compliance Officer • Step {index + 1}
                  </p>
                  <p className="text-xs text-muted-foreground">{step.officerEmail}</p>
                  {step.reviewedAt && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(step.reviewedAt).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })}
                    </p>
                  )}
                  {step.comment && (
                    <div className="mt-2 p-2 bg-secondary/50 rounded text-sm text-muted-foreground">
                      &quot;{step.comment}&quot;
                    </div>
                  )}

                  {/* Substitution requests for this step */}
                  {subRequests.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {subRequests.map(req => (
                        <div key={req.id} className="flex items-center gap-2 text-xs text-slate-500">
                          <ArrowRightLeft className="w-3 h-3" />
                          <span>
                            Substitution: {req.requestedByName} → {req.assignedToName}
                            <span className={`ml-1 font-medium ${
                              req.status === 'accepted' ? 'text-green-600' :
                              req.status === 'rejected' ? 'text-red-600' :
                              'text-amber-600'
                            }`}>
                              ({req.status})
                            </span>
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {index < workflow.length - 1 && (
                <div className="h-6 flex items-center justify-center mb-2">
                  <div className="w-0.5 h-full bg-border"></div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Activity Summary */}
      <div className="pt-4 border-t border-border">
        <p className="text-sm font-medium mb-2">Summary</p>
        <div className="text-sm text-muted-foreground">
          <p>
            {workflow.filter(s => s.status === 'approved').length} of {workflow.length} officers have approved
          </p>
        </div>
      </div>
    </div>
  )
}
