"use client"

import { useParams } from "next/navigation"
import { ArrowLeft, Download, Share2, MoreVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import Navbar from "@/components/navbar"
import ApprovalWorkflow from "@/components/approval-workflow"
import Link from "next/link"

export default function DocumentDetailPage() {
  const params = useParams()
  const documentId = params.id

  // Mock document data
  const document = {
    id: documentId,
    name: "Q4 Budget Proposal.pdf",
    sender: "John Smith",
    senderEmail: "john.smith@company.com",
    status: "pending",
    date: "2025-12-05",
    size: "2.4 MB",
    description: "Quarterly budget proposal for Q4 2025 with departmental breakdowns and forecast analysis.",
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl opacity-20"></div>
        <div className="absolute bottom-1/3 left-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl opacity-20"></div>
      </div>

      <div className="relative z-10">
        <main className="max-w-6xl mx-auto px-6 py-8">
          {/* Back Button */}
          <Link href="/dashboard">
            <button className="flex items-center gap-2 text-accent hover:text-accent/80 transition mb-6">
              <ArrowLeft size={18} />
              Back to Dashboard
            </button>
          </Link>

          <div className="grid grid-cols-3 gap-8">
            {/* Document Info */}
            <div className="col-span-2">
              <div className="glass-card p-8 mb-8">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h1 className="text-2xl font-bold mb-2">{document.name}</h1>
                    <p className="text-muted-foreground">{document.description}</p>
                  </div>
                  <button className="text-muted-foreground hover:text-foreground">
                    <MoreVertical size={20} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 py-4 border-t border-b border-border my-6">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">From</p>
                    <p className="font-medium">{document.sender}</p>
                    <p className="text-sm text-muted-foreground">{document.senderEmail}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Submitted</p>
                    <p className="font-medium">{document.date}</p>
                    <p className="text-sm text-muted-foreground">{document.size}</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground gap-2"
                    onClick={() => alert("Downloading document...")}
                  >
                    <Download size={18} />
                    Download
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 border-border text-foreground hover:bg-secondary gap-2 bg-transparent"
                    onClick={() => alert("Sharing document...")}
                  >
                    <Share2 size={18} />
                    Share
                  </Button>
                </div>
              </div>

              {/* Document Preview */}
              <div className="glass-card p-8 h-96 flex items-center justify-center border-2 border-dashed border-accent/30">
                <div className="text-center">
                  <div className="w-16 h-16 bg-secondary rounded-lg flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-accent">PDF</span>
                  </div>
                  <p className="text-muted-foreground">Document preview coming soon</p>
                </div>
              </div>
            </div>

            {/* Approval Workflow */}
            <div>
              <ApprovalWorkflow documentId={documentId as string} />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
