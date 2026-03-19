"use client"

import { useEffect, useState, use } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/components/providers/auth-provider"
import Navbar from "@/components/navbar"
import StatusTracker from "@/components/status-tracker"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Loader2,
  CheckCircle,
  XCircle,
  RotateCcw,
  Send,
  ArrowRightLeft,
  GripVertical,
  Plus,
  X,
  Mail,
  AlertTriangle,
  Clock,
} from "lucide-react"
import type { Application, Review, WorkflowStep, SubstitutionRequest } from "@/lib/aws/dynamodb"
import Link from "next/link"

interface ApplicationDetailData {
  application: Application
  downloadUrl: string | null
  canReview: boolean
}

interface ComplianceOfficer {
  id: string
  name: string
  email: string
}

type UserRole = 'user' | 'junior_reviewer' | 'compliance_officer' | 'admin'

export default function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, role, loading: authLoading } = useAuth()
  const [data, setData] = useState<ApplicationDetailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [reviewComment, setReviewComment] = useState("")
  const [isReviewing, setIsReviewing] = useState(false)
  const [reviewError, setReviewError] = useState("")
  const showSuccess = searchParams.get("success") === "true"

  // Workflow builder state
  const [officers, setOfficers] = useState<ComplianceOfficer[]>([])
  const [selectedOfficerIds, setSelectedOfficerIds] = useState<string[]>([])
  const [isDefiningWorkflow, setIsDefiningWorkflow] = useState(false)
  const [workflowError, setWorkflowError] = useState("")

  // Rollback state
  const [showRollback, setShowRollback] = useState(false)
  const [rollbackReason, setRollbackReason] = useState("")
  const [isRollingBack, setIsRollingBack] = useState(false)
  const [rollbackError, setRollbackError] = useState("")

  // Reassign state
  const [showReassign, setShowReassign] = useState(false)
  const [reassignOfficerId, setReassignOfficerId] = useState("")
  const [reassignReason, setReassignReason] = useState("")
  const [isReassigning, setIsReassigning] = useState(false)
  const [reassignError, setReassignError] = useState("")

  // Notify user state
  const [isNotifying, setIsNotifying] = useState(false)
  const [notifyMessage, setNotifyMessage] = useState("")

  // Substitution response state
  const [isRespondingSub, setIsRespondingSub] = useState(false)

  const userRole = (role || 'user') as UserRole

  useEffect(() => {
    if (user) fetchApplication()
  }, [user, id])

  useEffect(() => {
    if (user && (userRole === 'junior_reviewer' || userRole === 'admin')) {
      fetchOfficers()
    }
  }, [user, userRole])

  const fetchApplication = async () => {
    try {
      const response = await fetch(`/api/applications/${id}`)
      if (response.ok) {
        setData(await response.json())
      } else {
        setError("Application not found")
      }
    } catch {
      setError("Failed to load application")
    } finally {
      setLoading(false)
    }
  }

  const fetchOfficers = async () => {
    try {
      const response = await fetch("/api/users/compliance-officers")
      if (response.ok) {
        const data = await response.json()
        setOfficers(data.officers || [])
      }
    } catch {
      console.error("Failed to fetch officers")
    }
  }

  const handleReview = async (action: "approved" | "rejected") => {
    if (!data) return
    setIsReviewing(true)
    setReviewError("")
    try {
      const response = await fetch(`/api/applications/${id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, comment: reviewComment || undefined }),
      })
      if (response.ok) {
        await fetchApplication()
        setReviewComment("")
      } else {
        const errorData = await response.json()
        setReviewError(errorData.error || "Failed to submit review")
      }
    } catch {
      setReviewError("Failed to submit review")
    } finally {
      setIsReviewing(false)
    }
  }

  const handleDefineWorkflow = async () => {
    if (selectedOfficerIds.length === 0) {
      setWorkflowError("Select at least one compliance officer")
      return
    }
    setIsDefiningWorkflow(true)
    setWorkflowError("")
    try {
      const response = await fetch(`/api/applications/${id}/workflow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ officerIds: selectedOfficerIds }),
      })
      if (response.ok) {
        await fetchApplication()
        setSelectedOfficerIds([])
      } else {
        const errorData = await response.json()
        setWorkflowError(errorData.error || "Failed to define workflow")
      }
    } catch {
      setWorkflowError("Failed to define workflow")
    } finally {
      setIsDefiningWorkflow(false)
    }
  }

  const handleRollback = async () => {
    if (!rollbackReason.trim()) {
      setRollbackError("Reason is required")
      return
    }
    setIsRollingBack(true)
    setRollbackError("")
    try {
      const response = await fetch(`/api/applications/${id}/rollback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rollbackReason }),
      })
      if (response.ok) {
        await fetchApplication()
        setShowRollback(false)
        setRollbackReason("")
      } else {
        const errorData = await response.json()
        setRollbackError(errorData.error || "Failed to rollback")
      }
    } catch {
      setRollbackError("Failed to rollback")
    } finally {
      setIsRollingBack(false)
    }
  }

  const handleReassign = async () => {
    if (!reassignOfficerId || !reassignReason.trim()) {
      setReassignError("Select an officer and provide a reason")
      return
    }
    setIsReassigning(true)
    setReassignError("")
    try {
      const response = await fetch(`/api/applications/${id}/reassign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newOfficerId: reassignOfficerId, reason: reassignReason }),
      })
      if (response.ok) {
        await fetchApplication()
        setShowReassign(false)
        setReassignReason("")
        setReassignOfficerId("")
      } else {
        const errorData = await response.json()
        setReassignError(errorData.error || "Failed to reassign")
      }
    } catch {
      setReassignError("Failed to reassign")
    } finally {
      setIsReassigning(false)
    }
  }

  const handleNotifyUser = async () => {
    setIsNotifying(true)
    setNotifyMessage("")
    try {
      const response = await fetch(`/api/applications/${id}/notify-user`, {
        method: "POST",
      })
      const result = await response.json()
      if (response.ok) {
        setNotifyMessage(result.message)
      } else {
        setNotifyMessage(result.error || "Failed to notify user")
      }
    } catch {
      setNotifyMessage("Failed to notify user")
    } finally {
      setIsNotifying(false)
    }
  }

  const handleSubstitutionResponse = async (requestId: string, action: 'accepted' | 'rejected') => {
    setIsRespondingSub(true)
    try {
      const response = await fetch(`/api/applications/${id}/reassign/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, action }),
      })
      if (response.ok) {
        await fetchApplication()
      }
    } catch {
      console.error("Failed to respond to substitution")
    } finally {
      setIsRespondingSub(false)
    }
  }

  const addOfficer = (officerId: string) => {
    if (!selectedOfficerIds.includes(officerId)) {
      setSelectedOfficerIds([...selectedOfficerIds, officerId])
    }
  }

  const removeOfficer = (officerId: string) => {
    setSelectedOfficerIds(selectedOfficerIds.filter(id => id !== officerId))
  }

  const moveOfficer = (index: number, direction: 'up' | 'down') => {
    const newIds = [...selectedOfficerIds]
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    if (swapIndex < 0 || swapIndex >= newIds.length) return
    ;[newIds[index], newIds[swapIndex]] = [newIds[swapIndex], newIds[index]]
    setSelectedOfficerIds(newIds)
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
      </div>
    )
  }

  if (!user) {
    router.push(`/auth/signin?callbackUrl=/applications/${id}`)
    return null
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950">
        <Navbar />
        <main className="max-w-lg mx-auto px-6 py-16 text-center">
          <p className="text-slate-600 dark:text-slate-400 mb-4">{error}</p>
          <Link href="/applications">
            <Button variant="outline">Go Back</Button>
          </Link>
        </main>
      </div>
    )
  }

  const { application, downloadUrl, canReview } = data
  const isPending = ["submitted", "junior_review", "compliance_review", "rolled_back"].includes(application.status)
  const isOwner = !canReview
  const isJunior = userRole === 'junior_reviewer' || userRole === 'admin'
  const isCO = userRole === 'compliance_officer' || userRole === 'admin'

  // Check if current user is the active compliance officer in workflow
  const isCurrentWorkflowOfficer = application.workflow &&
    application.workflow.length > 0 &&
    application.status === 'compliance_review' &&
    application.workflow[application.workflowCurrentIndex ?? 0]?.officerId === user.uid

  // Check if user can review now
  const canReviewNow = canReview && isPending && (
    // Junior reviewer can review at submitted/junior_review stage
    (isJunior && (application.status === 'submitted' || application.status === 'junior_review')) ||
    // CO can review if they are the current workflow officer
    (isCO && isCurrentWorkflowOfficer) ||
    // CO can review in legacy mode (no workflow)
    (isCO && application.status === 'compliance_review' && !application.workflow?.length)
  )

  // Can define workflow (junior reviewer, when status is submitted/junior_review, no workflow yet)
  const canDefineWorkflow = isJunior && (application.status === 'submitted' || application.status === 'junior_review')

  // Can rollback (junior reviewer/admin, when status is approved)
  const canRollback = isJunior && application.status === 'approved'

  // Can reassign (CO assigned to this step, during compliance_review)
  const canReassignSelf = isCO && !isJunior &&
    application.status === 'compliance_review' &&
    application.workflow?.some(step => step.officerId === user.uid && step.status === 'pending')

  // Can notify user  (junior reviewer, when status approved)
  const canNotify = isJunior && application.status === 'approved'

  // Pending substitution requests for current user
  const pendingSubRequests = (application.substitutionRequests || []).filter(
    req => req.assignedTo === user.uid && req.status === 'pending'
  )

  // Get officers not in the current workflow for reassignment dropdown
  const availableForReassign = officers.filter(
    o => !application.workflow?.some(w => w.officerId === o.id) && o.id !== user.uid
  )

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      submitted: "Submitted",
      junior_review: "In Review",
      compliance_review: "Compliance Review",
      approved: "Approved",
      rejected: "Rejected",
      rolled_back: "Rolled Back",
    }
    return labels[status] || status
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <Navbar />

      <main className="max-w-3xl mx-auto px-6 py-8">
        {/* Back Link */}
        <div className="mb-6">
          <Link
            href={canReview ? "/review" : "/applications"}
            className="text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white"
          >
            ← Back to {canReview ? "review" : "applications"}
          </Link>
        </div>

        {/* Status Alert - Only for applicant (owner) */}
        {isOwner && application.status === "rejected" && (
          <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/50 rounded-lg px-5 py-4 mb-6">
            <p className="text-rose-800 dark:text-rose-300 font-medium text-sm">Application rejected</p>
            <p className="text-rose-600 dark:text-rose-400 text-sm mt-1">Please review the comments below. You may resubmit if needed.</p>
          </div>
        )}

        {showSuccess && (
          <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 rounded-lg px-5 py-4 mb-6">
            <p className="text-emerald-800 dark:text-emerald-300 text-sm font-medium">Application submitted successfully</p>
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
                {application.documentType}
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Submitted {new Date(application.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
            </div>
            <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${
              application.status === 'approved' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
              application.status === 'rejected' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' :
              application.status === 'rolled_back' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
              'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
            }`}>
              {getStatusLabel(application.status)}
            </span>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-8 pb-8 border-b border-slate-100 dark:border-slate-800">
          <StatusTracker
            currentStatus={application.status}
            currentStep={application.currentStep}
            isReviewer={canReview}
            workflow={application.workflow}
            workflowCurrentIndex={application.workflowCurrentIndex}
          />
        </div>

        {/* Pending substitution requests for current user */}
        {pendingSubRequests.length > 0 && (
          <div className="mb-8 pb-8 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-4">Substitution Request</h2>
            {pendingSubRequests.map(req => (
              <div key={req.id} className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <p className="text-sm text-amber-800 dark:text-amber-300 mb-2">
                  <strong>{req.requestedByName}</strong> has requested you to take over their review.
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-400 mb-3">
                  Reason: &quot;{req.reason}&quot;
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleSubstitutionResponse(req.id, 'accepted')}
                    disabled={isRespondingSub}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {isRespondingSub && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSubstitutionResponse(req.id, 'rejected')}
                    disabled={isRespondingSub}
                    className="border-rose-200 text-rose-600 hover:bg-rose-50"
                  >
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Workflow Builder - Junior Reviewer */}
        {canDefineWorkflow && (
          <div className="mb-8 pb-8 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-4">
              Define review workflow
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Select compliance officers and set the order in which they will review this document.
            </p>

            {workflowError && (
              <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/30 rounded-lg text-sm text-rose-700 dark:text-rose-400">
                {workflowError}
              </div>
            )}

            {/* Selected Officers (ordered) */}
            {selectedOfficerIds.length > 0 && (
              <div className="mb-4 space-y-2">
                <p className="text-xs font-medium text-slate-500 mb-2">Review Order:</p>
                {selectedOfficerIds.map((oid, idx) => {
                  const officer = officers.find(o => o.id === oid)
                  if (!officer) return null
                  return (
                    <div
                      key={oid}
                      className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900 rounded-lg px-3 py-2"
                    >
                      <span className="text-xs font-bold text-slate-400 w-5">{idx + 1}.</span>
                      <GripVertical className="w-4 h-4 text-slate-300 cursor-grab" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900 dark:text-white">{officer.name}</p>
                        <p className="text-xs text-slate-500">{officer.email}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => moveOfficer(idx, 'up')}
                          disabled={idx === 0}
                          className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30"
                          title="Move up"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => moveOfficer(idx, 'down')}
                          disabled={idx === selectedOfficerIds.length - 1}
                          className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30"
                          title="Move down"
                        >
                          ↓
                        </button>
                        <button
                          onClick={() => removeOfficer(oid)}
                          className="p-1 text-rose-400 hover:text-rose-600"
                          title="Remove"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Available Officers to Add */}
            <div className="mb-4">
              <p className="text-xs font-medium text-slate-500 mb-2">Available Officers:</p>
              <div className="space-y-1">
                {officers.filter(o => !selectedOfficerIds.includes(o.id)).map(officer => (
                  <button
                    key={officer.id}
                    onClick={() => addOfficer(officer.id)}
                    className="w-full flex items-center gap-3 text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    <Plus className="w-4 h-4 text-emerald-500" />
                    <div>
                      <p className="text-sm text-slate-900 dark:text-white">{officer.name}</p>
                      <p className="text-xs text-slate-500">{officer.email}</p>
                    </div>
                  </button>
                ))}
                {officers.filter(o => !selectedOfficerIds.includes(o.id)).length === 0 && (
                  <p className="text-xs text-slate-400 py-2">All compliance officers have been added</p>
                )}
              </div>
            </div>

            <Button
              onClick={handleDefineWorkflow}
              disabled={isDefiningWorkflow || selectedOfficerIds.length === 0}
              className="bg-slate-900 dark:bg-white dark:text-slate-900 hover:bg-slate-800"
            >
              {isDefiningWorkflow && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <Send className="w-4 h-4 mr-2" />
              Define Workflow & Approve ({selectedOfficerIds.length} officer{selectedOfficerIds.length !== 1 ? 's' : ''})
            </Button>
          </div>
        )}

        {/* Workflow Progress (when workflow is defined) */}
        {application.workflow && application.workflow.length > 0 && (
          <div className="mb-8 pb-8 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-4">
              Compliance review workflow
            </h2>
            <div className="space-y-3">
              {application.workflow.map((step, idx) => (
                <div
                  key={`${step.officerId}-${idx}`}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${
                    step.status === 'approved'
                      ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'
                      : step.status === 'rejected'
                        ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800'
                        : idx === (application.workflowCurrentIndex ?? 0) && application.status === 'compliance_review'
                          ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800'
                          : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <span className="text-xs font-bold text-slate-400 w-5">{idx + 1}.</span>
                  {step.status === 'approved' ? (
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                  ) : step.status === 'rejected' ? (
                    <XCircle className="w-5 h-5 text-rose-500" />
                  ) : idx === (application.workflowCurrentIndex ?? 0) && application.status === 'compliance_review' ? (
                    <Clock className="w-5 h-5 text-blue-500 animate-pulse" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-slate-300" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{step.officerName}</p>
                    <p className="text-xs text-slate-500">{step.officerEmail}</p>
                    {step.comment && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">&quot;{step.comment}&quot;</p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className={`text-xs font-medium ${
                      step.status === 'approved' ? 'text-emerald-600' :
                      step.status === 'rejected' ? 'text-rose-600' :
                      idx === (application.workflowCurrentIndex ?? 0) && application.status === 'compliance_review'
                        ? 'text-blue-600' : 'text-slate-400'
                    }`}>
                      {step.status === 'approved' ? 'Approved' :
                       step.status === 'rejected' ? 'Rejected' :
                       idx === (application.workflowCurrentIndex ?? 0) && application.status === 'compliance_review'
                         ? 'Current' : 'Pending'}
                    </span>
                    {step.reviewedAt && (
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {new Date(step.reviewedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Document Actions */}
        {downloadUrl && (
          <div className="mb-8 pb-8 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900 dark:text-white">{application.fileName}</p>
                <p className="text-sm text-slate-500 mt-0.5">{Math.round(application.fileSize / 1024)} KB</p>
              </div>
              <a href={downloadUrl} target="_blank" rel="noopener noreferrer">
                <Button
                  variant={application.status === "approved" ? "default" : "outline"}
                  className={application.status === "approved" ? "bg-teal-600 hover:bg-teal-700" : ""}
                >
                  {application.status === "approved" ? "Download verified document" : "View document"}
                </Button>
              </a>
            </div>

            {application.verificationCode && application.status === 'approved' && (
              <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg">
                <p className="text-sm text-emerald-800 dark:text-emerald-300">
                  Verification code: <code className="font-mono font-medium">{application.verificationCode}</code>
                </p>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons: Rollback + Notify */}
        {(canRollback || canNotify) && (
          <div className="mb-8 pb-8 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-4">Actions</h2>
            <div className="flex flex-wrap gap-3">
              {canNotify && (
                <div className="flex-1">
                  <Button
                    onClick={handleNotifyUser}
                    disabled={isNotifying}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 w-full"
                  >
                    {isNotifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                    Notify User — Document is Ready
                  </Button>
                  {notifyMessage && (
                    <p className="text-xs text-slate-500 mt-2">{notifyMessage}</p>
                  )}
                </div>
              )}
              {canRollback && (
                <Button
                  variant="outline"
                  onClick={() => setShowRollback(!showRollback)}
                  className="border-orange-200 text-orange-600 hover:bg-orange-50 gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Rollback Version
                </Button>
              )}
            </div>

            {showRollback && (
              <div className="mt-4 p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
                <div className="flex items-start gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5" />
                  <p className="text-sm text-orange-800 dark:text-orange-300">
                    Rolling back will require all compliance officers to re-review this document.
                  </p>
                </div>
                {rollbackError && (
                  <p className="text-sm text-rose-600 mb-2">{rollbackError}</p>
                )}
                <Textarea
                  placeholder="Reason for rollback (required)..."
                  value={rollbackReason}
                  onChange={(e) => setRollbackReason(e.target.value)}
                  rows={2}
                  className="mb-3"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={handleRollback}
                    disabled={isRollingBack}
                    className="bg-orange-600 hover:bg-orange-700 text-white"
                    size="sm"
                  >
                    {isRollingBack && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                    Confirm Rollback
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setShowRollback(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Reassign — for compliance officers */}
        {canReassignSelf && (
          <div className="mb-8 pb-8 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-4">Reassignment</h2>
            <Button
              variant="outline"
              onClick={() => setShowReassign(!showReassign)}
              className="gap-2"
            >
              <ArrowRightLeft className="w-4 h-4" />
              Request Substitution
            </Button>

            {showReassign && (
              <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                  Select another compliance officer to take over your review step.
                </p>
                {reassignError && (
                  <p className="text-sm text-rose-600 mb-2">{reassignError}</p>
                )}
                <select
                  value={reassignOfficerId}
                  onChange={(e) => setReassignOfficerId(e.target.value)}
                  className="w-full p-2 rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white mb-3"
                >
                  <option value="">Select compliance officer...</option>
                  {availableForReassign.map(o => (
                    <option key={o.id} value={o.id}>{o.name} ({o.email})</option>
                  ))}
                </select>
                <Textarea
                  placeholder="Reason for reassignment (required)..."
                  value={reassignReason}
                  onChange={(e) => setReassignReason(e.target.value)}
                  rows={2}
                  className="mb-3"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={handleReassign}
                    disabled={isReassigning}
                    size="sm"
                  >
                    {isReassigning && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                    Send Request
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setShowReassign(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Details */}
        <div className="mb-8 pb-8 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-4">Applicant details</h2>

          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            <div>
              <p className="text-sm text-slate-500">Name</p>
              <p className="text-slate-900 dark:text-white">{application.fullName}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Phone</p>
              <p className="text-slate-900 dark:text-white">{application.phone}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Email</p>
              <p className="text-slate-900 dark:text-white">{application.email}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Aadhar</p>
              <p className="text-slate-900 dark:text-white">{application.aadharNumber}</p>
            </div>
            <div className="col-span-2">
              <p className="text-sm text-slate-500">Address</p>
              <p className="text-slate-900 dark:text-white">{application.address}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Required by</p>
              <p className="text-slate-900 dark:text-white">
                {new Date(application.requiredByDate).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
            </div>
            {application.governmentDepartment && (
              <div>
                <p className="text-sm text-slate-500">Department</p>
                <p className="text-slate-900 dark:text-white">{application.governmentDepartment}</p>
              </div>
            )}
          </div>
        </div>

        {/* Review Actions */}
        {canReviewNow && (
          <div className="mb-8 pb-8 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-4">Review action</h2>

            {reviewError && (
              <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/30 rounded-lg text-sm text-rose-700 dark:text-rose-400">
                {reviewError}
              </div>
            )}

            <Textarea
              placeholder="Add a comment (optional)"
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              rows={3}
              className="mb-4"
            />

            <div className="flex gap-3">
              <Button
                onClick={() => handleReview("approved")}
                disabled={isReviewing}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isReviewing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Approve
              </Button>
              <Button
                onClick={() => handleReview("rejected")}
                disabled={isReviewing}
                variant="outline"
                className="border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-800 dark:hover:bg-rose-950/30"
              >
                {isReviewing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Reject
              </Button>
            </div>
          </div>
        )}

        {/* Substitution Request History */}
        {application.substitutionRequests && application.substitutionRequests.length > 0 && canReview && (
          <div className="mb-8 pb-8 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-4">Substitution requests</h2>
            <div className="space-y-3">
              {application.substitutionRequests.map((req: SubstitutionRequest) => (
                <div key={req.id} className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-slate-900 dark:text-white">
                        <strong>{req.requestedByName}</strong> → <strong>{req.assignedToName}</strong>
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">Reason: &quot;{req.reason}&quot;</p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      req.status === 'accepted' ? 'bg-emerald-100 text-emerald-700' :
                      req.status === 'rejected' ? 'bg-rose-100 text-rose-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                    </span>
                  </div>
                  {req.responseComment && (
                    <p className="text-xs text-slate-500 mt-1">Response: &quot;{req.responseComment}&quot;</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Version History */}
        {application.versions && application.versions.length > 0 && canReview && (
          <div className="mb-8 pb-8 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-4">Version history</h2>
            <div className="space-y-3">
              {application.versions.map((version, idx) => (
                <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">Version {version.versionNumber}</p>
                      {version.rollbackReason && (
                        <p className="text-xs text-orange-600 mt-0.5">
                          Rolled back by {version.rolledBackBy}: &quot;{version.rollbackReason}&quot;
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-slate-400">
                      {new Date(version.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Review History */}
        {application.reviews.length > 0 && (
          <div>
            <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-4">Review history</h2>

            <div className="space-y-4">
              {application.reviews.map((review: Review, i: number) => (
                <div key={i} className="pb-4 border-b border-slate-100 dark:border-slate-800 last:border-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {review.reviewerName}
                      </p>
                      <p className="text-sm text-slate-500 capitalize">
                        {review.reviewerRole.replace("_", " ")}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`text-sm font-medium ${
                        review.action === "approved" ? "text-emerald-600" : "text-rose-600"
                      }`}>
                        {review.action === "approved" ? "Approved" : "Rejected"}
                      </span>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {new Date(review.timestamp).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                  {review.comment && (
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                      &quot;{review.comment}&quot;
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
