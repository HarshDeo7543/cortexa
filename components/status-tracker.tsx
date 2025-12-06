"use client"

import { CheckCircle, Clock, XCircle, FileCheck, FileX, ArrowRight } from "lucide-react"
import type { ApplicationStatus } from "@/lib/aws/dynamodb"

interface StatusStep {
  label: string
  status: "completed" | "current" | "pending" | "rejected"
}

interface StatusTrackerProps {
  currentStatus: ApplicationStatus
  currentStep: number
}

export default function StatusTracker({ currentStatus, currentStep }: StatusTrackerProps) {
  const getSteps = (): StatusStep[] => {
    const steps: StatusStep[] = [
      { label: "Submitted", status: "pending" },
      { label: "Junior Review", status: "pending" },
      { label: "Compliance Review", status: "pending" },
      { label: "Completed", status: "pending" },
    ]

    if (currentStatus === "rejected") {
      // Show rejection at the failed step
      for (let i = 0; i < currentStep; i++) {
        steps[i].status = "completed"
      }
      steps[currentStep].status = "rejected"
    } else if (currentStatus === "approved") {
      // All steps completed
      steps.forEach(step => step.status = "completed")
    } else {
      // In progress
      const stepMapping: Record<ApplicationStatus, number> = {
        submitted: 0,
        junior_review: 1,
        compliance_review: 2,
        approved: 3,
        rejected: -1,
      }
      const currentIndex = stepMapping[currentStatus]
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
    switch (currentStatus) {
      case "submitted":
        return {
          icon: <Clock className="w-5 h-5" />,
          message: "Your application has been submitted and is waiting for review.",
          color: "text-blue-500 bg-blue-500/10 border-blue-500/30",
        }
      case "junior_review":
        return {
          icon: <Clock className="w-5 h-5" />,
          message: "Your application is being reviewed by a Junior Reviewer.",
          color: "text-amber-500 bg-amber-500/10 border-amber-500/30",
        }
      case "compliance_review":
        return {
          icon: <FileCheck className="w-5 h-5" />,
          message: "Your application passed junior review and is now with the Compliance Officer.",
          color: "text-purple-500 bg-purple-500/10 border-purple-500/30",
        }
      case "approved":
        return {
          icon: <CheckCircle className="w-5 h-5" />,
          message: "Congratulations! Your application has been approved. You can now download your document.",
          color: "text-green-500 bg-green-500/10 border-green-500/30",
        }
      case "rejected":
        return {
          icon: <FileX className="w-5 h-5" />,
          message: "Your application was rejected. Please review the comments and resubmit if needed.",
          color: "text-destructive bg-destructive/10 border-destructive/30",
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
            <div key={index} className="flex flex-col items-center relative z-10">
              <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 ${
                step.status === "completed" ? "bg-green-500/10 border-green-500" :
                step.status === "current" ? "bg-primary/10 border-primary" :
                step.status === "rejected" ? "bg-destructive/10 border-destructive" :
                "bg-muted border-muted-foreground/30"
              }`}>
                {getIcon(step.status)}
              </div>
              <span className={`mt-2 text-xs font-medium text-center ${
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
        <div className="absolute top-6 left-6 right-6 h-0.5 bg-muted -z-0">
          <div 
            className={`h-full transition-all duration-500 ${
              currentStatus === "rejected" ? "bg-destructive" : "bg-green-500"
            }`}
            style={{ 
              width: currentStatus === "approved" ? "100%" :
                     currentStatus === "rejected" ? `${(currentStep / 3) * 100}%` :
                     `${(currentStep / 3) * 100}%`
            }}
          />
        </div>
      </div>
    </div>
  )
}
