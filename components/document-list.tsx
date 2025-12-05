"use client"

import { FileText, MoreVertical, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Document {
  id: string
  name: string
  sender: string
  status: "pending" | "approved" | "rejected"
  date: string
  size: string
}

interface DocumentListProps {
  documents: Document[]
}

const statusConfig = {
  pending: { bg: "bg-yellow-500/20", text: "text-yellow-300", label: "Pending" },
  approved: { bg: "bg-green-500/20", text: "text-green-300", label: "Approved" },
  rejected: { bg: "bg-red-500/20", text: "text-red-300", label: "Rejected" },
}

export default function DocumentList({ documents }: DocumentListProps) {
  if (documents.length === 0) {
    return (
      <div className="glass-card p-12 text-center">
        <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
        <p className="text-muted-foreground">No documents found</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {documents.map((doc) => {
        const config = statusConfig[doc.status]
        return (
          <div
            key={doc.id}
            className="glass-card p-4 flex items-center justify-between hover:bg-card/60 transition cursor-pointer"
          >
            <div className="flex items-center gap-4 flex-1">
              <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-accent" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">{doc.name}</p>
                <p className="text-sm text-muted-foreground">
                  From: {doc.sender} • {doc.date} • {doc.size}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
                {config.label}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => alert("View document: " + doc.name)}
              >
                <ExternalLink size={18} />
              </Button>
              <button className="text-muted-foreground hover:text-foreground transition">
                <MoreVertical size={18} />
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
