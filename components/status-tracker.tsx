"use client"

import { CheckCircle, Clock, XCircle, FileCheck, FileX, RotateCcw } from "lucide-react"
import type { ApplicationStatus, WorkflowStep } from "@/lib/aws/dynamodb"

interface StatusStep {
  label: string
  status: "completed" | "current" | "pending" | "rejected"
}

interface StatusTrackerProps {
  currentStatus: ApplicationStatus
  currentStep: number
  isReviewer?: boolean
  workflow?: WorkflowStep[]
  workflowCurrentIndex?: number
}

export default function StatusTracker({
  currentStatus,
  currentStep,
  isReviewer = false,
  workflow,
  workflowCurrentIndex = 0,
}: StatusTrackerProps) {

  const getSteps = (): StatusStep[] => {
    // Dynamic multi-officer workflow
    if (workflow && workflow.length > 0) {
      const steps: StatusStep[] = [
        { label: "Submitted", status: "pending" },
        { label: "Junior Review", status: "pending" },
      ]

      // Add a step for each compliance officer
      for (let i = 0; i < workflow.length; i++) {
        const step = workflow[i]
        const name = step.officerName.split(' ')[0] // First name only for compact display
        steps.push({
          label: workflow.length > 1 ? `CO: ${name}` : "Compliance Review",
          status: "pending",
        })
      }

      steps.push({ label: "Completed", status: "pending" })

      // Set statuses
      if (currentStatus === 'rejected') {
        // Everything before the rejection is completed
        steps[0].status = "completed" // Submitted
        steps[1].status = "completed" // Junior review

        for (let i = 0; i < workflow.length; i++) {
          if (workflow[i].status === 'approved') {
            steps[i + 2].status = "completed"
          } else if (workflow[i].status === 'rejected') {
            steps[i + 2].status = "rejected"
            break
          }
        }
      } else if (currentStatus === 'approved') {
        steps.forEach(step => step.status = "completed")
      } else if (currentStatus === 'rolled_back') {
        steps[0].status = "completed"
        steps[1].status = "completed"
        // Show all CO steps as pending (rolled back)
      } else if (currentStatus === 'compliance_review') {
        steps[0].status = "completed" // Submitted
        steps[1].status = "completed" // Junior review

        for (let i = 0; i < workflow.length; i++) {
          if (workflow[i].status === 'approved') {
            steps[i + 2].status = "completed"
          } else if (i === workflowCurrentIndex) {
            steps[i + 2].status = "current"
          }
        }
      } else if (currentStatus === 'submitted') {
        steps[0].status = "current"
      } else if (currentStatus === 'junior_review') {
        steps[0].status = "completed"
        steps[1].status = "current"
      }

      return steps
    }

    // Legacy fixed-step workflow
    const steps: StatusStep[] = [
      { label: "Submitted", status: "pending" },
      { label: "Junior Review", status: "pending" },
      { label: "Compliance Review", status: "pending" },
      { label: "Completed", status: "pending" },
    ]

    if (currentStatus === "rejected") {
      for (let i = 0; i < currentStep; i++) {
        steps[i].status = "completed"
      }
      steps[currentStep].status = "rejected"
    } else if (currentStatus === "approved") {
      steps.forEach(step => step.status = "completed")
    } else if (currentStatus === "rolled_back") {
      steps[0].status = "completed"
      steps[1].status = "completed"
    } else {
      const stepMapping: Record<string, number> = {
        submitted: 0,
        junior_review: 1,
        compliance_review: 2,
        approved: 3,
        rejected: -1,
      }
      const currentIndex = stepMapping[currentStatus] ?? 0
      steps.forEach((step, index) => {
        if (index < currentIndex) {
          step.status = "completed"
        } else if (index === currentIndex) {
          step.status = "current"
        }
      })
    }

    return steps
  }

  const steps = getSteps()
  const totalSteps = steps.length

  const getIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-6 h-6 text-green-500" />
      case "current":
        return <Clock className="w-6 h-6 text-primary animate-pulse" />
      case "rejected":
        return <XCircle className="w-6 h-6 text-destructive" />
      default:
        return <div className="w-6 h-6 rounded-full border-2 border-muted-foreground" />
    }
  }

  const getStatusMessage = (): { icon: React.ReactNode; message: string; color: string } => {
    const prefix = isReviewer ? "This application" : "Your application"

    switch (currentStatus) {
      case "submitted":
        return {
          icon: <Clock className="w-5 h-5" />,
          message: `${prefix} has been submitted and is waiting for review.`,
          color: "text-blue-500 bg-blue-500/10 border-blue-500/30",
        }
      case "junior_review":
        return {
          icon: <Clock className="w-5 h-5" />,
          message: `${prefix} is being reviewed by a Junior Reviewer.`,
          color: "text-amber-500 bg-amber-500/10 border-amber-500/30",
        }
      case "compliance_review": {
        const currentOfficer = workflow?.[workflowCurrentIndex]
        const totalOfficers = workflow?.length || 1
        const completedOfficers = workflow?.filter(w => w.status === 'approved').length || 0
        const officerInfo = currentOfficer
          ? ` Currently with ${currentOfficer.officerName} (${completedOfficers}/${totalOfficers} reviewed).`
          : ''
        return {
          icon: <FileCheck className="w-5 h-5" />,
          message: `${prefix} is in compliance review.${officerInfo}`,
          color: "text-purple-500 bg-purple-500/10 border-purple-500/30",
        }
      }
      case "approved":
        return {
          icon: <CheckCircle className="w-5 h-5" />,
          message: isReviewer
            ? "This application has been approved by all assigned officers."
            : "Congratulations! Your application has been approved. You can now download your document.",
          color: "text-green-500 bg-green-500/10 border-green-500/30",
        }
      case "rejected":
        return {
          icon: <FileX className="w-5 h-5" />,
          message: isReviewer
            ? "This application was rejected."
            : "Your application was rejected. Please review the comments and resubmit if needed.",
          color: "text-destructive bg-destructive/10 border-destructive/30",
        }
      case "rolled_back":
        return {
          icon: <RotateCcw className="w-5 h-5" />,
          message: isReviewer
            ? "This application's verification was rolled back and requires re-review."
            : "Your application's verification was rolled back. It is being re-reviewed.",
          color: "text-amber-500 bg-amber-500/10 border-amber-500/30",
        }
      default:
        return {
          icon: <Clock className="w-5 h-5" />,
          message: "Processing...",
          color: "text-muted-foreground bg-muted border-border",
        }
    }
  }

  const statusInfo = getStatusMessage()

  // Calculate progress percentage
  const completedSteps = steps.filter(s => s.status === 'completed').length
  const progressPercent = currentStatus === 'approved'
    ? 100
    : currentStatus === 'rejected'
      ? (completedSteps / (totalSteps - 1)) * 100
      : (completedSteps / (totalSteps - 1)) * 100

  return (
    <div className="space-y-6">
      {/* Status Message */}
      <div className={`flex items-center gap-3 p-4 rounded-lg border ${statusInfo.color}`}>
        {statusInfo.icon}
        <p className="text-sm font-medium">{statusInfo.message}</p>
      </div>

      {/* Progress Timeline */}
      <div className="relative">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={index} className="flex flex-col items-center relative z-10" style={{ flex: 1 }}>
              <div className={`flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 ${
                step.status === "completed" ? "bg-green-500/10 border-green-500" :
                step.status === "current" ? "bg-primary/10 border-primary" :
                step.status === "rejected" ? "bg-destructive/10 border-destructive" :
                "bg-muted border-muted-foreground/30"
              }`}>
                {getIcon(step.status)}
              </div>
              <span className={`mt-2 text-[10px] sm:text-xs font-medium text-center leading-tight max-w-[70px] ${
                step.status === "completed" ? "text-green-500" :
                step.status === "current" ? "text-primary" :
                step.status === "rejected" ? "text-destructive" :
                "text-muted-foreground"
              }`}>
                {step.label}
              </span>
            </div>
          ))}
        </div>

        {/* Progress Line */}
        <div className="absolute top-5 sm:top-6 left-6 right-6 h-0.5 bg-muted -z-0">
          <div
            className={`h-full transition-all duration-500 ${
              currentStatus === "rejected" ? "bg-destructive" : "bg-green-500"
            }`}
            style={{ width: `${Math.min(progressPercent, 100)}%` }}
          />
        </div>
      </div>
    </div>
  )
}
