"use client"

import { useEffect, useState, use } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/components/providers/auth-provider"
import Navbar from "@/components/navbar"
import StatusTracker from "@/components/status-tracker"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"
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
  const isPending = ["submitted", "junior_review", "compliance_review"].includes(application.status)
  const canReviewNow = canReview && isPending
  const isOwner = !canReview // If can't review, they're the applicant

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      submitted: "Submitted",
      junior_review: "In Review",
      compliance_review: "Final Review",
      approved: "Approved",
      rejected: "Rejected",
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
              'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
            }`}>
              {getStatusLabel(application.status)}
            </span>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-8 pb-8 border-b border-slate-100 dark:border-slate-800">
          <StatusTracker currentStatus={application.status} currentStep={application.currentStep} isReviewer={canReview} />
        </div>

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
                      "{review.comment}"
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
