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
  MessageSquare,
  Loader2,
  ExternalLink,
  Shield,
  FileCheck,
  AlertCircle
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
    if (user) {
      fetchApplication()
    }
  }, [user, id])

  const fetchApplication = async () => {
    try {
      const response = await fetch(`/api/applications/${id}`)
      if (response.ok) {
        const result = await response.json()
        setData(result)
      } else {
        setError("Application not found")
      }
    } catch (err) {
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
        body: JSON.stringify({
          action,
          comment: reviewComment || undefined,
        }),
      })

      if (response.ok) {
        await fetchApplication()
        setReviewComment("")
      } else {
        const errorData = await response.json()
        setReviewError(errorData.error || "Failed to submit review")
      }
    } catch (err) {
      setReviewError("Failed to submit review")
    } finally {
      setIsReviewing(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
      submitted: { bg: "bg-blue-50 dark:bg-blue-900/20", text: "text-blue-600 dark:text-blue-400", label: "Submitted" },
      junior_review: { bg: "bg-amber-50 dark:bg-amber-900/20", text: "text-amber-600 dark:text-amber-400", label: "Junior Review" },
      compliance_review: { bg: "bg-indigo-50 dark:bg-indigo-900/20", text: "text-indigo-600 dark:text-indigo-400", label: "Compliance Review" },
      approved: { bg: "bg-emerald-50 dark:bg-emerald-900/20", text: "text-emerald-600 dark:text-emerald-400", label: "Approved" },
      rejected: { bg: "bg-rose-50 dark:bg-rose-900/20", text: "text-rose-600 dark:text-rose-400", label: "Rejected" },
    }
    const badge = badges[status] || badges.submitted
    return (
      <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    )
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
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
        <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <div className="bg-white dark:bg-card rounded-lg border border-slate-200 dark:border-border p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-900/20 mx-auto mb-4 flex items-center justify-center">
              <XCircle className="w-6 h-6 text-rose-500" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{error || "Error"}</h3>
            <Link href="/applications">
              <Button variant="outline" size="sm">Back to Applications</Button>
            </Link>
          </div>
        </main>
      </div>
    )
  }

  const { application, downloadUrl, canReview } = data
  const canReviewNow = canReview && 
    (application.status === "submitted" || 
     application.status === "junior_review" || 
     application.status === "compliance_review")

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-background">
      <Navbar />
      
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link 
            href={canReview ? "/review" : "/applications"} 
            className="inline-flex items-center text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            {canReview ? "Back to Review Queue" : "Back to My Applications"}
          </Link>
          {getStatusBadge(application.status)}
        </div>

        {/* Success Message */}
        {showSuccess && (
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" />
              <div>
                <p className="font-medium text-emerald-800 dark:text-emerald-300">Application submitted successfully!</p>
                <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-0.5">Track its progress below.</p>
              </div>
            </div>
          </div>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-12 gap-5">
          
          {/* Left Column - Main Content */}
          <div className="col-span-12 lg:col-span-8 space-y-5">
            
            {/* Document Header Card */}
            <div className="bg-white dark:bg-card rounded-lg border border-slate-200 dark:border-border p-5">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-7 h-7 text-slate-600 dark:text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl font-semibold text-slate-900 dark:text-white mb-1">
                    {application.documentType}
                  </h1>
                  <p className="text-sm text-slate-500 mb-3">
                    ID: {application.id.slice(0, 8)}...{application.id.slice(-4)}
                  </p>
                  <StatusTracker 
                    currentStatus={application.status} 
                    currentStep={application.currentStep}
                    isReviewer={canReview}
                  />
                </div>
              </div>
            </div>

            {/* Applicant Details */}
            <div className="bg-white dark:bg-card rounded-lg border border-slate-200 dark:border-border p-5">
              <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-4">
                Applicant Information
              </h2>
              
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                <div>
                  <p className="text-xs text-slate-400 mb-1">Full Name</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{application.fullName}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">Father/Husband Name</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{application.fatherHusbandName}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                    <User className="w-3 h-3" /> Age
                  </p>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{application.age} years</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                    <Phone className="w-3 h-3" /> Phone
                  </p>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{application.phone}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                    <Mail className="w-3 h-3" /> Email
                  </p>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{application.email}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                    <CreditCard className="w-3 h-3" /> Aadhar
                  </p>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{application.aadharNumber}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> Address
                  </p>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{application.address}</p>
                </div>
              </div>
            </div>

            {/* Document Details */}
            <div className="bg-white dark:bg-card rounded-lg border border-slate-200 dark:border-border p-5">
              <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-4">
                Document Details
              </h2>
              
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                <div>
                  <p className="text-xs text-slate-400 mb-1">Document Type</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{application.documentType}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">File Name</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{application.fileName}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Required By
                  </p>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {new Date(application.requiredByDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                {application.governmentDepartment && (
                  <div>
                    <p className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                      <Building className="w-3 h-3" /> Department
                    </p>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{application.governmentDepartment}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-slate-400 mb-1">Digital Signature</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-white italic">"{application.digitalSignature}"</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Submitted
                  </p>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{formatDate(application.createdAt)}</p>
                </div>
              </div>

              {/* Download/View Buttons */}
              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-border flex gap-3">
                {application.status === "approved" && downloadUrl && (
                  <a href={downloadUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
                    <Button className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700">
                      <Download className="w-4 h-4" />
                      Download Verified Document
                    </Button>
                  </a>
                )}
                {canReview && downloadUrl && (
                  <a href={downloadUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
                    <Button variant="outline" className="w-full gap-2">
                      <ExternalLink className="w-4 h-4" />
                      View Document
                    </Button>
                  </a>
                )}
              </div>

              {/* Verification Code */}
              {application.verificationCode && application.status === 'approved' && (
                <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-medium text-emerald-800 dark:text-emerald-300">Verification Code:</span>
                    <code className="text-xs font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 rounded">
                      {application.verificationCode}
                    </code>
                  </div>
                </div>
              )}
            </div>

            {/* Review History */}
            {application.reviews.length > 0 && (
              <div className="bg-white dark:bg-card rounded-lg border border-slate-200 dark:border-border p-5">
                <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-4">
                  Review History
                </h2>
                
                <div className="space-y-3">
                  {application.reviews.map((review: Review, index: number) => (
                    <div 
                      key={index} 
                      className={`p-4 rounded-lg border ${
                        review.action === "approved" 
                          ? "bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800/30" 
                          : "bg-rose-50 dark:bg-rose-900/10 border-rose-200 dark:border-rose-800/30"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {review.action === "approved" 
                            ? <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            : <XCircle className="w-4 h-4 text-rose-600" />
                          }
                          <span className="text-sm font-medium text-slate-900 dark:text-white capitalize">
                            {review.reviewerRole.replace("_", " ")}
                          </span>
                          <span className={`text-xs px-1.5 py-0.5 rounded ${
                            review.action === "approved" 
                              ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                              : "bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400"
                          }`}>
                            {review.action}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500">
                          {formatDate(review.timestamp)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        by {review.reviewerName}
                      </p>
                      {review.comment && (
                        <p className="mt-2 text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 p-2 rounded border border-slate-100 dark:border-slate-700">
                          "{review.comment}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Actions */}
          <div className="col-span-12 lg:col-span-4 space-y-5">
            
            {/* Review Actions */}
            {canReviewNow && (
              <div className="bg-white dark:bg-card rounded-lg border border-slate-200 dark:border-border p-5 sticky top-24">
                <div className="flex items-center gap-2 mb-4">
                  <FileCheck className="w-5 h-5 text-slate-600" />
                  <h2 className="font-medium text-slate-900 dark:text-white">Review Application</h2>
                </div>
                
                {reviewError && (
                  <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5" />
                      <p className="text-sm text-rose-700 dark:text-rose-400">{reviewError}</p>
                    </div>
                  </div>
                )}
                
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-slate-500 block mb-1.5">
                      Comment (optional)
                    </label>
                    <Textarea
                      placeholder="Add review notes..."
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      rows={3}
                      className="text-sm"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Button 
                      onClick={() => handleReview("approved")}
                      disabled={isReviewing}
                      className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700"
                    >
                      {isReviewing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                      Approve
                    </Button>
                    <Button 
                      onClick={() => handleReview("rejected")}
                      disabled={isReviewing}
                      variant="outline"
                      className="w-full gap-2 border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-800 dark:hover:bg-rose-900/20"
                    >
                      {isReviewing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <XCircle className="w-4 h-4" />
                      )}
                      Reject
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Info */}
            <div className="bg-white dark:bg-card rounded-lg border border-slate-200 dark:border-border p-5">
              <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-4">Summary</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Status</span>
                  {getStatusBadge(application.status)}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Reviews</span>
                  <span className="font-medium text-slate-900 dark:text-white">{application.reviews.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">File Size</span>
                  <span className="font-medium text-slate-900 dark:text-white">{Math.round(application.fileSize / 1024)} KB</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Last Updated</span>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {new Date(application.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
