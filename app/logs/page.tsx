"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  Search,
  Loader2,
  CheckCircle,
  XCircle,
  FileCheck,
  UserCog,
  ChevronDown,
  Clock,
  User,
  Calendar,
  Filter,
  RefreshCw,
  Download,
  Activity
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Navbar from "@/components/navbar"
import { useAuth } from "@/components/providers/auth-provider"
import type { ActivityLog } from "@/lib/aws/activity-logs"

type UserRole = 'user' | 'junior_reviewer' | 'compliance_officer' | 'admin'

export default function LogsPage() {
  const router = useRouter()
  const { user, role, loading: authLoading } = useAuth()
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [filterOpen, setFilterOpen] = useState(false)
  
  // Use role from auth context (Firebase custom claims)
  const userRole = (role || 'user') as UserRole

  useEffect(() => {
    if (userRole === 'admin') {
      fetchLogs()
    } else if (role && role !== 'admin') {
      router.push('/dashboard')
    }
  }, [userRole, role])

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/logs")
      if (response.ok) {
        const data = await response.json()
        setLogs(data.logs || [])
      }
    } catch (error) {
      console.error("Failed to fetch logs:", error)
    } finally {
      setLoading(false)
    }
  }

  const exportToExcel = () => {
    if (filteredLogs.length === 0) return

    const headers = ['Timestamp', 'Actor Name', 'Actor Email', 'Actor Role', 'Action', 'Details', 'Target']
    const rows = filteredLogs.map(log => [
      new Date(log.timestamp).toLocaleString('en-IN'),
      log.actorName || '',
      log.actorEmail || '',
      log.actorRole || '',
      getActionLabel(log.actionType),
      log.details || '',
      log.targetName || ''
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `cortexa-logs-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  const filteredLogs = logs.filter((log) => {
    const typeMatch = filterType === "all" || log.actionType === filterType
    const searchMatch =
      log.actorName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.actorEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.targetName?.toLowerCase().includes(searchQuery.toLowerCase())
    return typeMatch && searchMatch
  })

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'application_approved':
        return <CheckCircle className="w-4 h-4 text-emerald-500" />
      case 'application_rejected':
        return <XCircle className="w-4 h-4 text-rose-500" />
      case 'application_reviewed':
        return <FileCheck className="w-4 h-4 text-amber-500" />
      case 'user_role_changed':
        return <UserCog className="w-4 h-4 text-indigo-500" />
      default:
        return <Clock className="w-4 h-4 text-slate-400" />
    }
  }

  const getActionLabel = (type: string) => {
    const labels: Record<string, string> = {
      'application_approved': 'Approved',
      'application_rejected': 'Rejected',
      'application_reviewed': 'Reviewed',
      'user_role_changed': 'Role Changed',
      'document_signed': 'Signed',
    }
    return labels[type] || type
  }

  const getRoleBadge = (role: string) => {
    const styles: Record<string, string> = {
      'junior_reviewer': 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
      'compliance_officer': 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400',
      'admin': 'bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400',
    }
    const labels: Record<string, string> = {
      'junior_reviewer': 'Jr. Reviewer',
      'compliance_officer': 'Compliance',
      'admin': 'Admin',
    }
    return (
      <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${styles[role] || 'bg-slate-100 text-slate-600'}`}>
        {labels[role] || role}
      </span>
    )
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    
    return date.toLocaleDateString('en-IN', { 
      day: 'numeric', 
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    )
  }

  if (!user || userRole !== 'admin') {
    return null
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-background">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Activity Logs</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Monitor reviewer actions across the system
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={exportToExcel}
              disabled={filteredLogs.length === 0}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchLogs}
              disabled={loading}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="bg-white dark:bg-card rounded-xl border border-slate-200 dark:border-border p-6 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            <div className="relative pl-4 border-l-2 border-slate-300 dark:border-slate-600">
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Total Actions</p>
              <p className="text-3xl font-semibold text-slate-900 dark:text-white tracking-tight">{logs.length}</p>
            </div>
            <div className="relative pl-4 border-l-2 border-emerald-500">
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Approved</p>
              <p className="text-3xl font-semibold text-slate-900 dark:text-white tracking-tight">{logs.filter(l => l.actionType === 'application_approved').length}</p>
            </div>
            <div className="relative pl-4 border-l-2 border-rose-500">
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Rejected</p>
              <p className="text-3xl font-semibold text-slate-900 dark:text-white tracking-tight">{logs.filter(l => l.actionType === 'application_rejected').length}</p>
            </div>
            <div className="relative pl-4 border-l-2 border-amber-500">
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">In Review</p>
              <p className="text-3xl font-semibold text-slate-900 dark:text-white tracking-tight">{logs.filter(l => l.actionType === 'application_reviewed').length}</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white dark:bg-card rounded-lg border border-slate-200 dark:border-border">
          {/* Filters */}
          <div className="p-4 border-b border-slate-100 dark:border-border">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search by name, email, or action..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                />
              </div>
              <div className="relative">
                <button
                  onClick={() => setFilterOpen(!filterOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <Filter className="w-4 h-4" />
                  {filterType === 'all' ? 'All Types' : getActionLabel(filterType)}
                  <ChevronDown className="w-4 h-4" />
                </button>
                {filterOpen && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-card border border-slate-200 dark:border-border rounded-lg shadow-lg z-10">
                    {[
                      { value: 'all', label: 'All Types' },
                      { value: 'application_approved', label: 'Approved' },
                      { value: 'application_rejected', label: 'Rejected' },
                      { value: 'application_reviewed', label: 'Reviewed' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => { setFilterType(option.value); setFilterOpen(false) }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 first:rounded-t-lg last:rounded-b-lg ${
                          filterType === option.value ? 'text-primary font-medium' : 'text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Logs List */}
          {loading ? (
            <div className="p-12 text-center">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400 mx-auto mb-3" />
              <p className="text-sm text-slate-500">Loading activity logs...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-12 text-center">
              <Clock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">No activity yet</p>
              <p className="text-xs text-slate-500 mt-1">
                {searchQuery ? "Try a different search" : "Reviewer actions will appear here"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-border">
              {filteredLogs.map((log) => (
                <div key={log.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {getActionIcon(log.actionType)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-slate-900 dark:text-white text-sm">
                          {log.actorName}
                        </span>
                        {getRoleBadge(log.actorRole)}
                        <span className="text-slate-400 text-sm">•</span>
                        <span className="text-xs text-slate-500">{log.actorEmail}</span>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                        {log.details}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatTime(log.timestamp)}
                        </span>
                        {log.targetName && (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {log.targetName}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className={`px-2 py-1 rounded text-[10px] font-medium ${
                      log.actionType === 'application_approved' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' :
                      log.actionType === 'application_rejected' ? 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400' :
                      'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400'
                    }`}>
                      {getActionLabel(log.actionType)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Footer */}
          {filteredLogs.length > 0 && (
            <div className="p-3 border-t border-slate-100 dark:border-border text-center">
              <span className="text-xs text-slate-500">
                Showing {filteredLogs.length} of {logs.length} activities
              </span>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
