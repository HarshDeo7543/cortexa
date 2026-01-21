"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/providers/auth-provider"
import Navbar from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Eye,
  ClipboardCheck,
  Loader2,
  RefreshCw,
  Search,
  Calendar,
  User,
  ChevronRight,
  Filter,
  TrendingUp,
  ArrowRight
} from "lucide-react"
import type { Application } from "@/lib/aws/dynamodb"
import Link from "next/link"

type UserRole = 'user' | 'junior_reviewer' | 'compliance_officer' | 'admin'

export default function ReviewPage() {
  const router = useRouter()
  const { user, role, loading: authLoading } = useAuth()
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>("pending")
  const [searchQuery, setSearchQuery] = useState("")
  
  // Use role from auth context (Firebase custom claims)
  const userRole = (role || 'user') as UserRole

  useEffect(() => {
    if (user && role) {
      fetchApplications()
    }
  }, [user, role])

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

  // Calculate stats
  const stats = {
    pending: applications.filter(app => 
      app.status === "submitted" || 
      app.status === "junior_review" || 
      app.status === "compliance_review"
    ).length,
    approved: applications.filter(app => app.status === "approved").length,
    rejected: applications.filter(app => app.status === "rejected").length,
    total: applications.length
  }

  // Filter applications based on current filter and search
  const filteredApplications = (() => {
    let filtered = applications
    
    // Apply status filter
    switch (filter) {
      case "pending":
        filtered = filtered.filter(app => 
          app.status === "submitted" || 
          app.status === "junior_review" || 
          app.status === "compliance_review"
        )
        break
      case "approved":
        filtered = filtered.filter(app => app.status === "approved")
        break
      case "rejected":
        filtered = filtered.filter(app => app.status === "rejected")
        break
    }
    
    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(app =>
        app.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.documentType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.fileName?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    
    return filtered
  })()

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return "Today"
    if (diffDays === 1) return "Yesterday"
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
  }

  const getStatusInfo = (status: string) => {
    const info: Record<string, { bg: string; text: string; label: string; priority?: boolean }> = {
      submitted: { bg: "bg-blue-50 dark:bg-blue-900/20", text: "text-blue-600 dark:text-blue-400", label: "New", priority: true },
      junior_review: { bg: "bg-amber-50 dark:bg-amber-900/20", text: "text-amber-600 dark:text-amber-400", label: "Jr. Review", priority: true },
      compliance_review: { bg: "bg-indigo-50 dark:bg-indigo-900/20", text: "text-indigo-600 dark:text-indigo-400", label: "Compliance", priority: true },
      approved: { bg: "bg-emerald-50 dark:bg-emerald-900/20", text: "text-emerald-600 dark:text-emerald-400", label: "Approved" },
      rejected: { bg: "bg-rose-50 dark:bg-rose-900/20", text: "text-rose-600 dark:text-rose-400", label: "Rejected" },
    }
    return info[status] || info.submitted
  }

  const getRoleLabel = () => {
    const labels: Record<string, string> = {
      'junior_reviewer': 'Junior Reviewer',
      'compliance_officer': 'Compliance Officer',
      'admin': 'Administrator',
    }
    return labels[userRole || ''] || 'Reviewer'
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    )
  }

  if (!user) {
    router.push("/auth/signin?callbackUrl=/review")
    return null
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-background">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
              Review Queue
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {getRoleLabel()} • {stats.pending} pending review{stats.pending !== 1 ? 's' : ''}
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchApplications}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-12 gap-5">
          
          {/* Left Column - Stats */}
          <div className="col-span-12 lg:col-span-3 space-y-4">
            
            {/* Stats Cards */}
            <div className="bg-white dark:bg-card rounded-lg border border-slate-200 dark:border-border p-4">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Filter</span>
              
              <div className="mt-3 space-y-1">
                <button 
                  onClick={() => setFilter("pending")}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition ${
                    filter === 'pending' 
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>Pending</span>
                  <span className={`font-medium ${filter === 'pending' ? '' : 'text-amber-600'}`}>{stats.pending}</span>
                </button>
                
                <button 
                  onClick={() => setFilter("approved")}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition ${
                    filter === 'approved' 
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>Approved</span>
                  <span className={`font-medium ${filter === 'approved' ? '' : 'text-emerald-600'}`}>{stats.approved}</span>
                </button>
                
                <button 
                  onClick={() => setFilter("rejected")}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition ${
                    filter === 'rejected' 
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>Rejected</span>
                  <span className={`font-medium ${filter === 'rejected' ? '' : 'text-rose-600'}`}>{stats.rejected}</span>
                </button>
                
                <div className="border-t border-slate-100 dark:border-border my-2"></div>
                
                <button 
                  onClick={() => setFilter("all")}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition ${
                    filter === 'all' 
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>All</span>
                  <span className="font-medium">{stats.total}</span>
                </button>
              </div>
            </div>

            {/* Performance */}
            {stats.total > 0 && (
              <div className="bg-white dark:bg-card rounded-lg border border-slate-200 dark:border-border p-4">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Performance</span>
                <div className="mt-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm text-slate-600 dark:text-slate-300">
                    {Math.round((stats.approved / stats.total) * 100)}% approval rate
                  </span>
                </div>
                <div className="mt-2 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${(stats.approved / stats.total) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Applications List */}
          <div className="col-span-12 lg:col-span-9">
            <div className="bg-white dark:bg-card rounded-lg border border-slate-200 dark:border-border">
              
              {/* Search Header */}
              <div className="p-4 border-b border-slate-100 dark:border-border">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search by name, document type..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-9 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>

              {/* Content */}
              {loading ? (
                <div className="p-12 text-center">
                  <Loader2 className="w-6 h-6 animate-spin text-slate-400 mx-auto mb-3" />
                  <p className="text-sm text-slate-500">Loading applications...</p>
                </div>
              ) : filteredApplications.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 mx-auto mb-4 flex items-center justify-center">
                    <ClipboardCheck className="w-5 h-5 text-slate-400" />
                  </div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {filter === "pending" ? "All caught up!" : "No applications"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {filter === "pending" 
                      ? "No pending applications to review" 
                      : searchQuery 
                        ? "Try a different search"
                        : "No applications in this category"}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-border">
                  {filteredApplications.map((app) => {
                    const statusInfo = getStatusInfo(app.status)
                    return (
                      <div 
                        key={app.id} 
                        className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-slate-900 dark:text-white truncate">
                                {app.documentType}
                              </span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${statusInfo.bg} ${statusInfo.text}`}>
                                {statusInfo.label}
                              </span>
                              {statusInfo.priority && (
                                <span className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-600 text-[10px] font-medium">
                                  Action Required
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {app.fullName}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {formatDate(app.createdAt)}
                              </span>
                              <span className="text-slate-400">•</span>
                              <span className="truncate max-w-[150px]">{app.fileName}</span>
                            </div>
                          </div>
                          
                          <Link href={`/applications/${app.id}`}>
                            <Button 
                              size="sm" 
                              variant={statusInfo.priority ? "default" : "outline"}
                              className="gap-1.5"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              {statusInfo.priority ? 'Review' : 'View'}
                            </Button>
                          </Link>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Footer */}
              {filteredApplications.length > 0 && (
                <div className="p-3 border-t border-slate-100 dark:border-border text-center">
                  <span className="text-xs text-slate-500">
                    Showing {filteredApplications.length} of {applications.length} applications
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
