"use client"

import { useState } from "react"
import { Search, Filter, Plus, Clock, CheckCircle, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import DocumentList from "@/components/document-list"
import Navbar from "@/components/navbar"
import UploadModal from "@/components/upload-modal"

type Status = "all" | "pending" | "approved" | "rejected"

const MOCK_DOCUMENTS = [
  {
    id: "1",
    name: "Q4 Budget Proposal.pdf",
    sender: "John Smith",
    status: "pending",
    date: "2025-12-05",
    size: "2.4 MB",
  },
  {
    id: "2",
    name: "Annual Report 2024.docx",
    sender: "Sarah Johnson",
    status: "approved",
    date: "2025-12-04",
    size: "5.1 MB",
  },
  {
    id: "3",
    name: "Contract Amendment.pdf",
    sender: "Mike Chen",
    status: "rejected",
    date: "2025-12-03",
    size: "1.8 MB",
  },
  {
    id: "4",
    name: "Board Meeting Minutes.pdf",
    sender: "Emily Davis",
    status: "pending",
    date: "2025-12-02",
    size: "3.2 MB",
  },
  {
    id: "5",
    name: "Expense Report Dec.xlsx",
    sender: "Robert Wilson",
    status: "approved",
    date: "2025-12-01",
    size: "890 KB",
  },
]

export default function Dashboard() {
  const [selectedStatus, setSelectedStatus] = useState<Status>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)

  const filteredDocuments = MOCK_DOCUMENTS.filter((doc) => {
    const statusMatch = selectedStatus === "all" || doc.status === selectedStatus
    const searchMatch =
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.sender.toLowerCase().includes(searchQuery.toLowerCase())
    return statusMatch && searchMatch
  })

  const stats = {
    pending: MOCK_DOCUMENTS.filter((d) => d.status === "pending").length,
    approved: MOCK_DOCUMENTS.filter((d) => d.status === "approved").length,
    rejected: MOCK_DOCUMENTS.filter((d) => d.status === "rejected").length,
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl opacity-20"></div>
        <div className="absolute bottom-1/3 left-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl opacity-20"></div>
      </div>

      <div className="relative z-10">
        <main className="max-w-7xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
              <p className="text-muted-foreground">Manage and review all your documents</p>
            </div>
            <Button
              className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2"
              onClick={() => setIsUploadModalOpen(true)}
            >
              <Plus size={18} />
              Upload Document
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="glass-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Pending</p>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                </div>
                <Clock className="w-8 h-8 text-accent opacity-60" />
              </div>
            </div>
            <div className="glass-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Approved</p>
                  <p className="text-2xl font-bold text-green-400">{stats.approved}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-400 opacity-60" />
              </div>
            </div>
            <div className="glass-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Rejected</p>
                  <p className="text-2xl font-bold text-red-400">{stats.rejected}</p>
                </div>
                <XCircle className="w-8 h-8 text-red-400 opacity-60" />
              </div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="glass-card p-6 mb-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search documents or sender..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-input border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <Filter className="w-5 h-5 text-muted-foreground" />
            </div>

            <div className="flex gap-3 flex-wrap">
              <button
                onClick={() => setSelectedStatus("all")}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                  selectedStatus === "all"
                    ? "bg-accent text-accent-foreground"
                    : "bg-secondary text-foreground hover:bg-secondary/80"
                }`}
              >
                All Documents
              </button>
              <button
                onClick={() => setSelectedStatus("pending")}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                  selectedStatus === "pending"
                    ? "bg-accent text-accent-foreground"
                    : "bg-secondary text-foreground hover:bg-secondary/80"
                }`}
              >
                Pending Review
              </button>
              <button
                onClick={() => setSelectedStatus("approved")}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                  selectedStatus === "approved"
                    ? "bg-accent text-accent-foreground"
                    : "bg-secondary text-foreground hover:bg-secondary/80"
                }`}
              >
                Approved
              </button>
              <button
                onClick={() => setSelectedStatus("rejected")}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                  selectedStatus === "rejected"
                    ? "bg-accent text-accent-foreground"
                    : "bg-secondary text-foreground hover:bg-secondary/80"
                }`}
              >
                Rejected
              </button>
            </div>
          </div>

          {/* Document List */}
          <DocumentList documents={filteredDocuments} />
        </main>
      </div>

      <UploadModal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} />
    </div>
  )
}
