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
  CheckCircle,
  XCircle,
  MessageSquare,
  Loader2
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
        setError(errorData.error || "Failed to submit review")
      }
    } catch (err) {
      setError("Failed to submit review")
    } finally {
      setIsReviewing(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    router.push(`/auth/signin?callbackUrl=/applications/${id}`)
    return null
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <main className="max-w-4xl mx-auto px-6 py-8">
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <XCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
            <h3 className="text-lg font-semibold mb-2">{error || "Error"}</h3>
            <Link href="/applications">
              <Button variant="outline">Back to Applications</Button>
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
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Back Button - context aware */}
        <Link 
          href={canReview ? "/review" : "/applications"} 
          className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {canReview ? "Back to Review Queue" : "Back to My Applications"}
        </Link>

        {/* Success Message */}
        {showSuccess && (
          <div className="bg-green-500/10 border border-green-500/30 text-green-500 p-4 rounded-lg mb-6 flex items-center gap-3">
            <CheckCircle className="w-5 h-5" />
            <p className="font-medium">Application submitted successfully! You can track its progress below.</p>
          </div>
        )}

        {/* Header */}
        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-primary/10 rounded-lg flex items-center justify-center">
              <FileText className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{application.documentType}</h1>
              <p className="text-muted-foreground">
                Application ID: {application.id.slice(0, 8)}...
              </p>
            </div>
          </div>
          
          {/* Status Tracker */}
          <StatusTracker 
            currentStatus={application.status} 
            currentStep={application.currentStep}
            isReviewer={canReview}
          />
        </div>

        {/* Applicant Details */}
        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Applicant Details
          </h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Full Name</p>
              <p className="font-medium">{application.fullName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Father/Husband Name</p>
              <p className="font-medium">{application.fatherHusbandName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <User className="w-3 h-3" /> Age
              </p>
              <p className="font-medium">{application.age} years</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Phone className="w-3 h-3" /> Phone
              </p>
              <p className="font-medium">{application.phone}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Mail className="w-3 h-3" /> Email
              </p>
              <p className="font-medium">{application.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <CreditCard className="w-3 h-3" /> Aadhar Number
              </p>
              <p className="font-medium">{application.aadharNumber}</p>
            </div>
            <div className="col-span-2">
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <MapPin className="w-3 h-3" /> Address
              </p>
              <p className="font-medium">{application.address}</p>
            </div>
          </div>
        </div>

        {/* Document Details */}
        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Document Details
          </h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Document Type</p>
              <p className="font-medium">{application.documentType}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">File Name</p>
              <p className="font-medium">{application.fileName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Required By
              </p>
              <p className="font-medium">{new Date(application.requiredByDate).toLocaleDateString()}</p>
            </div>
            {application.governmentDepartment && (
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Building className="w-3 h-3" /> Department
                </p>
                <p className="font-medium">{application.governmentDepartment}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Digital Signature</p>
              <p className="font-medium italic">"{application.digitalSignature}"</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Submitted On</p>
              <p className="font-medium">{new Date(application.createdAt).toLocaleString()}</p>
            </div>
          </div>

          {/* Download Button */}
          {application.status === "approved" && downloadUrl && (
            <div className="mt-4 pt-4 border-t border-border">
              <a href={downloadUrl} target="_blank" rel="noopener noreferrer">
                <Button className="w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Download Approved Document
                </Button>
              </a>
            </div>
          )}

          {/* View Document for Reviewers */}
          {canReview && downloadUrl && (
            <div className="mt-4 pt-4 border-t border-border">
              <a href={downloadUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="w-full">
                  <FileText className="w-4 h-4 mr-2" />
                  View Document
                </Button>
              </a>
            </div>
          )}
        </div>

        {/* Review History */}
        {application.reviews.length > 0 && (
          <div className="bg-card border border-border rounded-xl p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              Review History
            </h2>
            
            <div className="space-y-4">
              {application.reviews.map((review: Review, index: number) => (
                <div 
                  key={index} 
                  className={`p-4 rounded-lg border ${
                    review.action === "approved" 
                      ? "bg-green-500/5 border-green-500/30" 
                      : "bg-destructive/5 border-destructive/30"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {review.action === "approved" 
                        ? <CheckCircle className="w-4 h-4 text-green-500" />
                        : <XCircle className="w-4 h-4 text-destructive" />
                      }
                      <span className="font-medium capitalize">
                        {review.reviewerRole.replace("_", " ")}
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {new Date(review.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Reviewed by: {review.reviewerName}
                  </p>
                  {review.comment && (
                    <p className="mt-2 text-sm bg-background/50 p-2 rounded">
                      "{review.comment}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Review Actions */}
        {canReviewNow && (
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-primary" />
              Review Application
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground block mb-2">
                  Comment (optional)
                </label>
                <Textarea
                  placeholder="Add a comment explaining your decision..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  rows={3}
                />
              </div>
              
              <div className="flex gap-4">
                <Button 
                  onClick={() => handleReview("approved")}
                  disabled={isReviewing}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {isReviewing ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  )}
                  Approve
                </Button>
                <Button 
                  onClick={() => handleReview("rejected")}
                  disabled={isReviewing}
                  variant="destructive"
                  className="flex-1"
                >
                  {isReviewing ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <XCircle className="w-4 h-4 mr-2" />
                  )}
                  Reject
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
