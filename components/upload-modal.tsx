"use client"

import type React from "react"

import { useState, useRef } from "react"
import { X, Upload, FileText, AlertCircle, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface UploadModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function UploadModal({ isOpen, onClose }: UploadModalProps) {
  const [files, setFiles] = useState<File[]>([])
  const [description, setDescription] = useState("")
  const [uploading, setUploading] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; size: string }[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      setFiles((prev) => [...prev, ...newFiles])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer.files) {
      const newFiles = Array.from(e.dataTransfer.files)
      setFiles((prev) => [...prev, ...newFiles])
    }
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
  }

  const handleUpload = async () => {
    setUploading(true)
    // Simulate upload
    setTimeout(() => {
      const uploaded = files.map((f) => ({
        name: f.name,
        size: formatFileSize(f.size),
      }))
      setUploadedFiles(uploaded)
      setFiles([])
      setDescription("")
      setUploading(false)
      // Auto close after 2 seconds
      setTimeout(() => {
        onClose()
        setUploadedFiles([])
      }, 2000)
    }, 1500)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="glass-card w-full max-w-2xl max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-card/50 backdrop-blur-md">
          <h2 className="text-xl font-bold">Upload Document</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {uploadedFiles.length === 0 ? (
            <>
              {/* File Upload Area */}
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className="border-2 border-dashed border-accent/30 rounded-lg p-8 text-center hover:border-accent/60 transition cursor-pointer bg-secondary/20"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-12 h-12 text-accent mx-auto mb-3 opacity-60" />
                <p className="text-foreground font-medium mb-1">Drag and drop your files here</p>
                <p className="text-muted-foreground text-sm">or click to browse from your computer</p>
                <p className="text-xs text-muted-foreground mt-2">Supported formats: PDF, DOCX, XLSX, TXT</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  accept=".pdf,.docx,.xlsx,.txt"
                />
              </div>

              {/* Selected Files */}
              {files.length > 0 && (
                <div className="space-y-3">
                  <p className="font-medium text-sm">Selected Files ({files.length})</p>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-secondary/40 p-3 rounded-lg">
                        <div className="flex items-center gap-3 flex-1">
                          <FileText className="w-5 h-5 text-accent flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{file.name}</p>
                            <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => removeFile(index)}
                          className="text-muted-foreground hover:text-destructive transition flex-shrink-0"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              <div>
                <label className="text-sm font-medium text-muted-foreground block mb-2">Description (Optional)</label>
                <textarea
                  placeholder="Add notes about this document, approval requirements, or any relevant details..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-input border border-border rounded-lg p-3 text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                  rows={3}
                />
              </div>

              {/* Info Alert */}
              <div className="flex gap-3 p-4 bg-secondary/40 border border-border rounded-lg">
                <AlertCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium text-foreground mb-1">Before uploading:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Ensure document contains no sensitive personal information</li>
                    <li>File size limit: 50 MB per document</li>
                    <li>You can upload up to 10 files at once</li>
                  </ul>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-border">
                <Button
                  variant="outline"
                  className="flex-1 border-border text-foreground hover:bg-secondary bg-transparent"
                  onClick={onClose}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleUpload}
                  disabled={files.length === 0 || uploading}
                >
                  {uploading ? "Uploading..." : `Upload ${files.length} File${files.length !== 1 ? "s" : ""}`}
                </Button>
              </div>
            </>
          ) : (
            /* Success State */
            <div className="py-12 text-center">
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h3 className="text-lg font-bold mb-2">Upload Successful</h3>
              <p className="text-muted-foreground mb-6">
                {uploadedFiles.length} document{uploadedFiles.length !== 1 ? "s" : ""} uploaded successfully
              </p>
              <div className="space-y-2 mb-6 max-h-40 overflow-y-auto">
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground justify-center">
                    <CheckCircle size={16} className="text-green-400" />
                    <span>{file.name}</span>
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">Redirecting to dashboard...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
