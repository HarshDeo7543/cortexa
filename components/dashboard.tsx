"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  Search, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  FileText, 
  Loader2, 
  ArrowUpRight,
  TrendingUp,
  Calendar,
  User,
  ChevronRight,
  AlertCircle,
  ClipboardCheck,
  Users,
  ScrollText
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Navbar from "@/components/navbar"
import { useAuth } from "@/components/providers/auth-provider"
import type { Application } from "@/lib/aws/dynamodb"
import Link from "next/link"

type Status = "all" | "submitted" | "junior_review" | "compliance_review" | "approved" | "rejected"
type UserRole = 'user' | 'junior_reviewer' | 'compliance_officer' | 'admin'

export default function Dashboard() {
  const router = useRouter()
  const { user, role, loading: authLoading } = useAuth()
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState<Status>("all")
  const [searchQuery, setSearchQuery] = useState("")
  
  // Use role from auth context (Firebase custom claims)
  const userRole = (role || 'user') as UserRole

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

  // Calculate stats
  const pendingCount = applications.filter((a) => 
    a.status === "submitted" || a.status === "junior_review" || a.status === "compliance_review"
  ).length
  const approvedCount = applications.filter((a) => a.status === "approved").length
  const rejectedCount = applications.filter((a) => a.status === "rejected").length
  const totalCount = applications.length
  const approvalRate = totalCount > 0 ? Math.round((approvedCount / totalCount) * 100) : 0

  // Get recent applications (last 5)
  const recentApps = [...applications]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  // Get urgent items (pending for more than 3 days)
  const urgentApps = applications.filter(app => {
    if (app.status === 'approved' || app.status === 'rejected') return false
    const daysSince = (Date.now() - new Date(app.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    return daysSince > 3
  })

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
    const info: Record<string, { bg: string; text: string; label: string }> = {
      submitted: { bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-600 dark:text-slate-300", label: "Submitted" },
      junior_review: { bg: "bg-amber-50 dark:bg-amber-900/20", text: "text-amber-600 dark:text-amber-400", label: "In Review" },
      compliance_review: { bg: "bg-indigo-50 dark:bg-indigo-900/20", text: "text-indigo-600 dark:text-indigo-400", label: "Compliance" },
      approved: { bg: "bg-emerald-50 dark:bg-emerald-900/20", text: "text-emerald-600 dark:text-emerald-400", label: "Approved" },
      rejected: { bg: "bg-rose-50 dark:bg-rose-900/20", text: "text-rose-600 dark:text-rose-400", label: "Rejected" },
    }
    return info[status] || info.submitted
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
    <div className="min-h-screen bg-slate-50 dark:bg-background">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Welcome Section */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
            Welcome back{user.displayName ? `, ${user.displayName.split(' ')[0]}` : ''}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            {userRole === 'user' 
              ? "Here's what's happening with your applications"
              : userRole === 'admin'
                ? "Overview of all system applications"
                : "Your review queue at a glance"}
          </p>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-12 gap-5">
          
          {/* Left Column - Stats & Quick Actions */}
          <div className="col-span-12 lg:col-span-4 space-y-5">
            
            {/* Summary Card */}
            <div className="bg-white dark:bg-card rounded-lg border border-slate-200 dark:border-border p-5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Overview</span>
                <span className="text-xs text-slate-400">{new Date().toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</span>
              </div>
              
              <div className="text-4xl font-bold text-slate-900 dark:text-white mb-1">
                {totalCount}
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">Total applications</p>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                    <span className="text-sm text-slate-600 dark:text-slate-300">Pending</span>
                  </div>
                  <span className="text-sm font-medium text-slate-900 dark:text-white">{pendingCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                    <span className="text-sm text-slate-600 dark:text-slate-300">Approved</span>
                  </div>
                  <span className="text-sm font-medium text-slate-900 dark:text-white">{approvedCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-rose-400"></div>
                    <span className="text-sm text-slate-600 dark:text-slate-300">Rejected</span>
                  </div>
                  <span className="text-sm font-medium text-slate-900 dark:text-white">{rejectedCount}</span>
                </div>
              </div>

              {totalCount > 0 && (
                <div className="mt-5 pt-4 border-t border-slate-100 dark:border-border">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm text-slate-600 dark:text-slate-300">
                      {approvalRate}% approval rate
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Urgent Items */}
            {urgentApps.length > 0 && (
              <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                      {urgentApps.length} application{urgentApps.length > 1 ? 's' : ''} pending for 3+ days
                    </p>
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                      Consider following up on these
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Links - Role Based */}
            <div className="bg-white dark:bg-card rounded-lg border border-slate-200 dark:border-border p-4">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Quick Actions</span>
              <div className="mt-3 space-y-1">
                {/* For regular users */}
                {userRole === 'user' && (
                  <>
                    <Link href="/apply" className="flex items-center justify-between p-2 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                      <span className="text-sm text-slate-700 dark:text-slate-300">New application</span>
                      <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-primary transition-colors" />
                    </Link>
                    <Link href="/applications" className="flex items-center justify-between p-2 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                      <span className="text-sm text-slate-700 dark:text-slate-300">My applications</span>
                      <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-primary transition-colors" />
                    </Link>
                  </>
                )}
                
                {/* For reviewers (junior/compliance) */}
                {(userRole === 'junior_reviewer' || userRole === 'compliance_officer' || userRole === 'admin') && (
                  <Link href="/review" className="flex items-center justify-between p-2 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                    <div className="flex items-center gap-2">
                      <ClipboardCheck className="w-4 h-4 text-slate-500" />
                      <span className="text-sm text-slate-700 dark:text-slate-300">Review Queue</span>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-primary transition-colors" />
                  </Link>
                )}
                
                {/* For admin and compliance officer */}
                {(userRole === 'admin' || userRole === 'compliance_officer') && (
                  <Link href="/admin" className="flex items-center justify-between p-2 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-slate-500" />
                      <span className="text-sm text-slate-700 dark:text-slate-300">Manage Users</span>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-primary transition-colors" />
                  </Link>
                )}
                
                {/* For admin only */}
                {userRole === 'admin' && (
                  <Link href="/logs" className="flex items-center justify-between p-2 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                    <div className="flex items-center gap-2">
                      <ScrollText className="w-4 h-4 text-slate-500" />
                      <span className="text-sm text-slate-700 dark:text-slate-300">Activity Logs</span>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-primary transition-colors" />
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Applications List */}
          <div className="col-span-12 lg:col-span-8">
            <div className="bg-white dark:bg-card rounded-lg border border-slate-200 dark:border-border">
              
              {/* Header */}
              <div className="p-4 border-b border-slate-100 dark:border-border">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      placeholder="Search applications..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 h-9 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                    />
                  </div>
                  <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                    {[
                      { value: "all", label: "All" },
                      { value: "submitted", label: "New" },
                      { value: "junior_review", label: "Review" },
                      { value: "approved", label: "Done" },
                    ].map((filter) => (
                      <button
                        key={filter.value}
                        onClick={() => setSelectedStatus(filter.value as Status)}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition whitespace-nowrap ${
                          selectedStatus === filter.value
                            ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900"
                            : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                        }`}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Content */}
              {loading ? (
                <div className="p-12 text-center">
                  <Loader2 className="w-6 h-6 animate-spin text-slate-400 mx-auto mb-3" />
                  <p className="text-sm text-slate-500">Loading...</p>
                </div>
              ) : filteredApplications.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 mx-auto mb-4 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-slate-400" />
                  </div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {userRole === 'user' ? 'No applications' : 'No items in queue'}
                  </p>
                  <p className="text-xs text-slate-500">
                    {searchQuery 
                      ? "Try a different search" 
                      : userRole === 'user' 
                        ? "Get started by submitting one"
                        : "All applications have been processed"}
                  </p>
                  {!searchQuery && userRole === 'user' && (
                    <Link href="/apply">
                      <Button size="sm" className="mt-4">
                        Submit Application
                      </Button>
                    </Link>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-border">
                  {filteredApplications.map((app) => {
                    const statusInfo = getStatusInfo(app.status)
                    return (
                      <Link key={app.id} href={`/applications/${app.id}`}>
                        <div className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-slate-900 dark:text-white truncate">
                                  {app.documentType}
                                </span>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${statusInfo.bg} ${statusInfo.text}`}>
                                  {statusInfo.label}
                                </span>
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
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0 mt-1" />
                          </div>
                        </div>
                      </Link>
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
