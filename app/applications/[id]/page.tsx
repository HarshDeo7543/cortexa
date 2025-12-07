"use client"

import { useEffect, useState, use } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/components/providers/auth-provider"
import Navbar from "@/components/navbar"
import StatusTracker from "@/components/status-tracker"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { 
  FileText, 
  Download, 
  ArrowLeft, 
  User, 
  Calendar, 
  MapPin,
  Phone,
  Mail,
  CreditCard,
  Building,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  ExternalLink,
  Shield,
  AlertTriangle
} from "lucide-react"
import type { Application, Review } from "@/lib/aws/dynamodb"
import Link from "next/link"

interface ApplicationDetailData {
  application: Application
  downloadUrl: string | null
  canReview: boolean
}

export default function ApplicationDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading: authLoading } = useAuth()
  const [data, setData] = useState<ApplicationDetailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [reviewComment, setReviewComment] = useState("")
  const [isReviewing, setIsReviewing] = useState(false)
  const [reviewError, setReviewError] = useState("")
  const showSuccess = searchParams.get("success") === "true"

  useEffect(() => {
    if (user) fetchApplication()
  }, [user, id])

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

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-background flex items-center justify-center">
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
      <div className="min-h-screen bg-slate-50 dark:bg-background">
        <Navbar />
        <main className="max-w-lg mx-auto px-4 py-16 text-center">
          <XCircle className="w-12 h-12 text-rose-400 mx-auto mb-4" />
          <p className="text-slate-700 dark:text-slate-300 mb-4">{error}</p>
          <Link href="/applications"><Button variant="outline">Go Back</Button></Link>
        </main>
      </div>
    )
  }

  const { application, downloadUrl, canReview } = data
  const isPending = ["submitted", "junior_review", "compliance_review"].includes(application.status)
  const canReviewNow = canReview && isPending

  const statusConfig: Record<string, { color: string; bg: string; label: string }> = {
    submitted: { color: "text-blue-600", bg: "bg-blue-50", label: "Submitted" },
    junior_review: { color: "text-amber-600", bg: "bg-amber-50", label: "Junior Review" },
    compliance_review: { color: "text-indigo-600", bg: "bg-indigo-50", label: "Compliance Review" },
    approved: { color: "text-emerald-600", bg: "bg-emerald-50", label: "Approved" },
    rejected: { color: "text-rose-600", bg: "bg-rose-50", label: "Rejected" },
  }
  const status = statusConfig[application.status] || statusConfig.submitted

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-background">
      <Navbar />
      
      <main className="max-w-6xl mx-auto px-6 py-5">
        {/* Top Bar */}
        <div className="flex items-center justify-between mb-4">
          <Link href={canReview ? "/review" : "/applications"} className="text-slate-500 hover:text-slate-800 dark:hover:text-white text-sm flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
            {status.label}
          </span>
        </div>

        {/* Status Alert */}
        {application.status === "rejected" && (
          <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-lg px-4 py-3 mb-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-rose-800 dark:text-rose-300 font-medium text-sm">Your application was rejected.</p>
              <p className="text-rose-600 dark:text-rose-400 text-sm">Please review the comments and resubmit if needed.</p>
            </div>
          </div>
        )}

        {showSuccess && (
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg px-4 py-3 mb-4 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            <p className="text-emerald-800 dark:text-emerald-300 text-sm font-medium">Application submitted successfully!</p>
          </div>
        )}

        {/* Header Card */}
        <div className="bg-white dark:bg-card border border-slate-200 dark:border-border rounded-lg p-5 mb-4">
          <div className="flex items-start justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <FileText className="w-6 h-6 text-slate-500" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-slate-900 dark:text-white">{application.documentType}</h1>
                <p className="text-sm text-slate-500">ID: {application.id.slice(0, 8)}</p>
              </div>
            </div>
            <div className="flex gap-2">
              {downloadUrl && (
                <a href={downloadUrl} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant={application.status === "approved" ? "default" : "outline"} className={application.status === "approved" ? "bg-emerald-600 hover:bg-emerald-700" : ""}>
                    {application.status === "approved" ? <Download className="w-4 h-4 mr-1.5" /> : <ExternalLink className="w-4 h-4 mr-1.5" />}
                    {application.status === "approved" ? "Download" : "View"}
                  </Button>
                </a>
              )}
            </div>
          </div>
          
          {/* Status Tracker - inline */}
          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-border">
            <StatusTracker currentStatus={application.status} currentStep={application.currentStep} isReviewer={canReview} />
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          
          {/* Left: Details */}
          <div className="lg:col-span-2 space-y-4">
            
            {/* Applicant + Document in one row on large screens */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Applicant */}
              <div className="bg-white dark:bg-card border border-slate-200 dark:border-border rounded-lg p-4">
                <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-3">Applicant</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-900 dark:text-white font-medium">{application.fullName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-700 dark:text-slate-300">{application.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-700 dark:text-slate-300">{application.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CreditCard className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-700 dark:text-slate-300">{application.aadharNumber}</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                    <span className="text-slate-700 dark:text-slate-300">{application.address}</span>
                  </div>
                </div>
              </div>

              {/* Document */}
              <div className="bg-white dark:bg-card border border-slate-200 dark:border-border rounded-lg p-4">
                <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-3">Document</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">File</span>
                    <span className="text-slate-900 dark:text-white font-medium truncate max-w-[180px]">{application.fileName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Required by</span>
                    <span className="text-slate-700 dark:text-slate-300">
                      {new Date(application.requiredByDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  {application.governmentDepartment && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Department</span>
                      <span className="text-slate-700 dark:text-slate-300">{application.governmentDepartment}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-500">Submitted</span>
                    <span className="text-slate-700 dark:text-slate-300">
                      {new Date(application.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>
                
                {application.verificationCode && application.status === 'approved' && (
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-border flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs text-emerald-700 dark:text-emerald-400">
                      Verified: <code className="font-mono">{application.verificationCode}</code>
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Review History */}
            {application.reviews.length > 0 && (
              <div className="bg-white dark:bg-card border border-slate-200 dark:border-border rounded-lg p-4">
                <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-3">Review History</h3>
                <div className="space-y-2">
                  {application.reviews.map((review: Review, i: number) => (
                    <div key={i} className={`flex items-center justify-between p-3 rounded-lg ${review.action === "approved" ? "bg-emerald-50 dark:bg-emerald-900/10" : "bg-rose-50 dark:bg-rose-900/10"}`}>
                      <div className="flex items-center gap-3">
                        {review.action === "approved" ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-rose-500" />}
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-white capitalize">{review.reviewerRole.replace("_", " ")}</p>
                          <p className="text-xs text-slate-500">{review.reviewerName}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-xs font-medium ${review.action === "approved" ? "text-emerald-600" : "text-rose-600"}`}>{review.action}</p>
                        <p className="text-xs text-slate-500">{new Date(review.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Actions */}
          <div className="space-y-4">
            {canReviewNow && (
              <div className="bg-white dark:bg-card border border-slate-200 dark:border-border rounded-lg p-4">
                <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-3">Take Action</h3>
                
                {reviewError && (
                  <div className="mb-3 p-2 bg-rose-50 dark:bg-rose-900/20 rounded text-sm text-rose-600">{reviewError}</div>
                )}
                
                <Textarea
                  placeholder="Add comment (optional)"
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  rows={3}
                  className="mb-3 text-sm"
                />
                
                <div className="space-y-2">
                  <Button onClick={() => handleReview("approved")} disabled={isReviewing} className="w-full bg-emerald-600 hover:bg-emerald-700">
                    {isReviewing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                    Approve
                  </Button>
                  <Button onClick={() => handleReview("rejected")} disabled={isReviewing} variant="outline" className="w-full border-rose-200 text-rose-600 hover:bg-rose-50">
                    {isReviewing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
                    Reject
                  </Button>
                </div>
              </div>
            )}

            {/* Quick Stats */}
            <div className="bg-white dark:bg-card border border-slate-200 dark:border-border rounded-lg p-4">
              <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-3">Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Reviews</span>
                  <span className="text-slate-900 dark:text-white font-medium">{application.reviews.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">File size</span>
                  <span className="text-slate-700 dark:text-slate-300">{Math.round(application.fileSize / 1024)} KB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Last updated</span>
                  <span className="text-slate-700 dark:text-slate-300">{new Date(application.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
