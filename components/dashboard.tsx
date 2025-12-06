"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Search, Filter, Clock, CheckCircle, XCircle, FileText, Loader2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Navbar from "@/components/navbar"
import { useAuth } from "@/components/providers/auth-provider"
import type { Application } from "@/lib/aws/dynamodb"
import Link from "next/link"

type Status = "all" | "submitted" | "junior_review" | "compliance_review" | "approved" | "rejected"

export default function Dashboard() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState<Status>("all")
  const [searchQuery, setSearchQuery] = useState("")

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
        setApplications(data.applications || [])
      }
    } catch (error) {
      console.error("Failed to fetch applications:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredApplications = applications.filter((app) => {
    const statusMatch = selectedStatus === "all" || app.status === selectedStatus
    const searchMatch =
      app.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.documentType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.fileName?.toLowerCase().includes(searchQuery.toLowerCase())
    return statusMatch && searchMatch
  })

  const stats = {
    pending: applications.filter((a) => 
      a.status === "submitted" || 
      a.status === "junior_review" || 
      a.status === "compliance_review"
    ).length,
    approved: applications.filter((a) => a.status === "approved").length,
    rejected: applications.filter((a) => a.status === "rejected").length,
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { color: string; label: string }> = {
      submitted: { color: "bg-blue-500/10 text-blue-500", label: "Submitted" },
      junior_review: { color: "bg-amber-500/10 text-amber-500", label: "Junior Review" },
      compliance_review: { color: "bg-purple-500/10 text-purple-500", label: "Compliance Review" },
      approved: { color: "bg-green-500/10 text-green-500", label: "Approved" },
      rejected: { color: "bg-red-500/10 text-red-500", label: "Rejected" },
    }
    const badge = badges[status] || badges.submitted
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.label}
      </span>
    )
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    router.push("/auth/signin")
    return null
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <div className="relative z-10">
        <main className="max-w-7xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
              <p className="text-muted-foreground">Overview of all applications</p>
            </div>
            <Button variant="outline" onClick={fetchApplications} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Pending</p>
                  <p className="text-2xl font-bold text-amber-500">{stats.pending}</p>
                </div>
                <Clock className="w-8 h-8 text-amber-500 opacity-60" />
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Approved</p>
                  <p className="text-2xl font-bold text-green-500">{stats.approved}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500 opacity-60" />
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Rejected</p>
                  <p className="text-2xl font-bold text-red-500">{stats.rejected}</p>
                </div>
                <XCircle className="w-8 h-8 text-red-500 opacity-60" />
              </div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="bg-card border border-border rounded-xl p-6 mb-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search by name, document type..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Filter className="w-5 h-5 text-muted-foreground" />
            </div>

            <div className="flex gap-3 flex-wrap">
              {[
                { value: "all", label: "All" },
                { value: "submitted", label: "Submitted" },
                { value: "junior_review", label: "Junior Review" },
                { value: "compliance_review", label: "Compliance" },
                { value: "approved", label: "Approved" },
                { value: "rejected", label: "Rejected" },
              ].map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setSelectedStatus(filter.value as Status)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                    selectedStatus === filter.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {/* Applications List */}
          {loading ? (
            <div className="bg-card border border-border rounded-xl p-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Loading applications...</p>
            </div>
          ) : filteredApplications.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-12 text-center">
              <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No applications found</h3>
              <p className="text-muted-foreground">
                {searchQuery || selectedStatus !== "all"
                  ? "Try adjusting your filters"
                  : "No applications have been submitted yet"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredApplications.map((app) => (
                <Link key={app.id} href={`/applications/${app.id}`}>
                  <div className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition cursor-pointer">
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
                      {getStatusBadge(app.status)}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
