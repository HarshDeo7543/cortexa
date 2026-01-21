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
  Plus, 
  Eye,
  Loader2 
} from "lucide-react"
import type { Application } from "@/lib/aws/dynamodb"
import Link from "next/link"

type UserRole = 'user' | 'junior_reviewer' | 'compliance_officer' | 'admin'

export default function ApplicationsPage() {
  const router = useRouter()
  const { user, role, loading: authLoading } = useAuth()
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>("all")
  
  // Use role from auth context (Firebase custom claims)
  const userRole = (role || 'user') as UserRole
  const roleLoading = authLoading

  useEffect(() => {
    if (user) {
      fetchApplications()
    }
  }, [user])

  // Redirect reviewers to /review page
  useEffect(() => {
    if (!roleLoading && role && role !== 'user') {
      router.push('/review')
    }
  }, [role, roleLoading, router])

  const fetchApplications = async () => {
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
        label: "Submitted"
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

  const filteredApplications = filter === "all" 
    ? applications 
    : applications.filter(app => app.status === filter)

  if (authLoading || loading || roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  // If user is a reviewer, show loading while redirecting
  if (userRole && userRole !== 'user') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    router.push("/auth/signin?callbackUrl=/applications")
    return null
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Applications</h1>
            <p className="text-muted-foreground">
              Track and manage your document applications
            </p>
          </div>
          <Link href="/apply">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Application
            </Button>
          </Link>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {[
            { value: "all", label: "All" },
            { value: "submitted", label: "Submitted" },
            { value: "junior_review", label: "Junior Review" },
            { value: "compliance_review", label: "Compliance Review" },
            { value: "approved", label: "Approved" },
            { value: "rejected", label: "Rejected" },
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
              {tab.label}
            </button>
          ))}
        </div>

        {/* Applications List */}
        {filteredApplications.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No applications found</h3>
            <p className="text-muted-foreground mb-4">
              {filter === "all" 
                ? "You haven't submitted any applications yet." 
                : `No applications with status "${filter}".`}
            </p>
            <Link href="/apply">
              <Button>Submit your first application</Button>
            </Link>
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
                        {app.fileName} • Submitted {new Date(app.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    {getStatusBadge(app.status)}
                    <Link href={`/applications/${app.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
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
