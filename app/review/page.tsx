"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/providers/auth-provider"
import Navbar from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye,
  ClipboardCheck,
  Users,
  Loader2,
  RefreshCw
} from "lucide-react"
import type { Application } from "@/lib/aws/dynamodb"
import Link from "next/link"

export default function ReviewPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>("pending")

  useEffect(() => {
    if (user) {
      fetchApplications()
    }
  }, [user])

  const fetchApplications = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/applications")
      if (response.ok) {
        const data = await response.json()
        setApplications(data.applications)
      }
    } catch (error) {
      console.error("Failed to fetch applications:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
      submitted: { 
        color: "bg-blue-500/10 text-blue-500 border-blue-500/30", 
        icon: <Clock className="w-3 h-3" />,
        label: "Awaiting Review"
      },
      junior_review: { 
        color: "bg-amber-500/10 text-amber-500 border-amber-500/30", 
        icon: <Clock className="w-3 h-3" />,
        label: "Junior Review"
      },
      compliance_review: { 
        color: "bg-purple-500/10 text-purple-500 border-purple-500/30", 
        icon: <Clock className="w-3 h-3" />,
        label: "Compliance Review"
      },
      approved: { 
        color: "bg-green-500/10 text-green-500 border-green-500/30", 
        icon: <CheckCircle className="w-3 h-3" />,
        label: "Approved"
      },
      rejected: { 
        color: "bg-destructive/10 text-destructive border-destructive/30", 
        icon: <XCircle className="w-3 h-3" />,
        label: "Rejected"
      },
    }
    const badge = badges[status] || badges.submitted
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${badge.color}`}>
        {badge.icon}
        {badge.label}
      </span>
    )
  }

  const filteredApplications = (() => {
    switch (filter) {
      case "pending":
        return applications.filter(app => 
          app.status === "submitted" || 
          app.status === "junior_review" || 
          app.status === "compliance_review"
        )
      case "approved":
        return applications.filter(app => app.status === "approved")
      case "rejected":
        return applications.filter(app => app.status === "rejected")
      default:
        return applications
    }
  })()

  const stats = {
    pending: applications.filter(app => 
      app.status === "submitted" || 
      app.status === "junior_review" || 
      app.status === "compliance_review"
    ).length,
    approved: applications.filter(app => app.status === "approved").length,
    rejected: applications.filter(app => app.status === "rejected").length,
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    router.push("/auth/signin?callbackUrl=/review")
    return null
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <ClipboardCheck className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Review Dashboard</h1>
              <p className="text-muted-foreground">
                Review and process document applications
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={fetchApplications}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm mb-1">Pending Review</p>
                <p className="text-3xl font-bold text-amber-500">{stats.pending}</p>
              </div>
              <Clock className="w-10 h-10 text-amber-500/50" />
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm mb-1">Approved</p>
                <p className="text-3xl font-bold text-green-500">{stats.approved}</p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-500/50" />
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm mb-1">Rejected</p>
                <p className="text-3xl font-bold text-destructive">{stats.rejected}</p>
              </div>
              <XCircle className="w-10 h-10 text-destructive/50" />
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { value: "pending", label: "Pending", count: stats.pending },
            { value: "approved", label: "Approved", count: stats.approved },
            { value: "rejected", label: "Rejected", count: stats.rejected },
            { value: "all", label: "All", count: applications.length },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                filter === tab.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Applications List */}
        {filteredApplications.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <ClipboardCheck className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No applications to review</h3>
            <p className="text-muted-foreground">
              {filter === "pending" 
                ? "All applications have been reviewed!" 
                : "No applications match the selected filter."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredApplications.map((app) => (
              <div 
                key={app.id} 
                className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <FileText className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{app.documentType}</h3>
                      <p className="text-sm text-muted-foreground">
                        {app.fullName} • {app.fileName}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Submitted: {new Date(app.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    {getStatusBadge(app.status)}
                    <Link href={`/applications/${app.id}`}>
                      <Button size="sm">
                        <Eye className="w-4 h-4 mr-2" />
                        Review
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
