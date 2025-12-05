"use client"

import { useState } from "react"
import { CheckCircle, Clock, XCircle, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

interface ApprovalWorkflowProps {
  documentId: string
}

const APPROVERS = [
  {
    id: "1",
    name: "Finance Manager",
    role: "Manager Review",
    status: "approved",
    date: "2025-12-04",
    comment: "Numbers look good, approved.",
  },
  {
    id: "2",
    name: "CFO",
    role: "Executive Review",
    status: "pending",
    date: null,
    comment: null,
  },
  {
    id: "3",
    name: "CEO",
    role: "Final Approval",
    status: "pending",
    date: null,
    comment: null,
  },
]

export default function ApprovalWorkflow({ documentId }: ApprovalWorkflowProps) {
  const [comment, setComment] = useState("")
  const [approvers, setApprovers] = useState(APPROVERS)

  const handleApprove = () => {
    alert("Document approved - feature integration coming soon")
    setComment("")
  }

  const handleReject = () => {
    alert("Document rejected - feature integration coming soon")
    setComment("")
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="w-5 h-5 text-green-400" />
      case "rejected":
        return <XCircle className="w-5 h-5 text-red-400" />
      default:
        return <Clock className="w-5 h-5 text-yellow-400" />
    }
  }

  return (
    <div className="glass-card p-6">
      <h3 className="text-lg font-bold mb-6">Approval Workflow</h3>

      {/* Approvers List */}
      <div className="space-y-4 mb-6">
        {approvers.map((approver, index) => (
          <div key={approver.id}>
            <div className="flex items-start gap-3 pb-4">
              <div className="mt-1">{getStatusIcon(approver.status)}</div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-medium">{approver.name}</p>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      approver.status === "approved"
                        ? "bg-green-500/20 text-green-300"
                        : approver.status === "rejected"
                          ? "bg-red-500/20 text-red-300"
                          : "bg-yellow-500/20 text-yellow-300"
                    }`}
                  >
                    {approver.status.charAt(0).toUpperCase() + approver.status.slice(1)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-1">{approver.role}</p>
                {approver.date && <p className="text-xs text-muted-foreground">{approver.date}</p>}
                {approver.comment && (
                  <div className="mt-2 p-2 bg-secondary/50 rounded text-sm text-muted-foreground">
                    "{approver.comment}"
                  </div>
                )}
              </div>
            </div>
            {index < approvers.length - 1 && (
              <div className="h-6 flex items-center justify-center mb-2">
                <div className="w-0.5 h-full bg-border"></div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Current User Action */}
      <div className="border-t border-border pt-6">
        <p className="text-sm font-medium mb-3">Your Review</p>
        <Textarea
          placeholder="Add a comment or review notes..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="bg-input border-border text-foreground placeholder:text-muted-foreground mb-3 text-sm"
          rows={3}
        />
        <div className="flex gap-2">
          <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white gap-2" onClick={handleApprove}>
            <CheckCircle size={16} />
            Approve
          </Button>
          <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white gap-2" onClick={handleReject}>
            <XCircle size={16} />
            Reject
          </Button>
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="mt-6 pt-6 border-t border-border">
        <p className="text-sm font-medium mb-3">Activity</p>
        <div className="space-y-3 text-sm">
          <div className="flex gap-3">
            <User className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
            <div className="text-muted-foreground">
              <p>Document submitted by John Smith</p>
              <p className="text-xs mt-1">2 days ago</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
