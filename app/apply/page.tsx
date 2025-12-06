"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/providers/auth-provider"
import Navbar from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { 
  FileText, 
  Upload, 
  CheckCircle, 
  ArrowRight, 
  ArrowLeft,
  Loader2 
} from "lucide-react"

const DOCUMENT_TYPES = [
  "Birth Certificate",
  "Death Certificate",
  "Marriage Certificate",
  "Domicile Certificate",
  "Income Certificate",
  "Caste Certificate",
  "Character Certificate",
  "Employment Certificate",
  "Property Documents",
  "Educational Certificate",
  "Other",
]

const GOVERNMENT_DEPARTMENTS = [
  "Revenue Department",
  "Education Department",
  "Health Department",
  "Social Welfare Department",
  "Home Department",
  "Transport Department",
  "Agriculture Department",
  "Municipal Corporation",
  "District Collector Office",
  "Other",
]

interface FormData {
  fullName: string
  fatherHusbandName: string
  age: string
  phone: string
  email: string
  address: string
  aadharNumber: string
  documentType: string
  requiredByDate: string
  governmentDepartment: string
  digitalSignature: string
}

export default function ApplyPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  
  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    fatherHusbandName: "",
    age: "",
    phone: "",
    email: "",
    address: "",
    aadharNumber: "",
    documentType: "",
    requiredByDate: "",
    governmentDepartment: "",
    digitalSignature: "",
  })
  
  const [file, setFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)

  const updateField = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const validateStep1 = () => {
    if (!formData.fullName || !formData.fatherHusbandName || !formData.age || 
        !formData.phone || !formData.email || !formData.address) {
      setError("Please fill all required fields")
      return false
    }
    if (!/^\d{10}$/.test(formData.phone)) {
      setError("Phone number must be 10 digits")
      return false
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError("Please enter a valid email")
      return false
    }
    setError("")
    return true
  }

  const validateStep2 = () => {
    if (!formData.aadharNumber || !formData.documentType || !formData.requiredByDate) {
      setError("Please fill all required fields")
      return false
    }
    if (!/^\d{12}$/.test(formData.aadharNumber)) {
      setError("Aadhar number must be 12 digits")
      return false
    }
    setError("")
    return true
  }

  const validateStep3 = () => {
    if (!file) {
      setError("Please select a document to upload")
      return false
    }
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!allowedTypes.includes(file.type)) {
      setError("Only PDF and DOCX files are allowed")
      return false
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("File size must be less than 10MB")
      return false
    }
    if (!formData.digitalSignature) {
      setError("Please enter your digital signature (full name)")
      return false
    }
    if (formData.digitalSignature.toLowerCase() !== formData.fullName.toLowerCase()) {
      setError("Digital signature must match your full name")
      return false
    }
    setError("")
    return true
  }

  const nextStep = () => {
    if (step === 1 && validateStep1()) setStep(2)
    else if (step === 2 && validateStep2()) setStep(3)
  }

  const prevStep = () => {
    setError("")
    if (step > 1) setStep(step - 1)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
    }
  }

  const handleSubmit = async () => {
    if (!validateStep3() || !file || !user) return

    setIsSubmitting(true)
    setError("")

    try {
      // Step 1: Get presigned upload URL
      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
          fileSize: file.size,
        }),
      })

      if (!uploadResponse.ok) {
        throw new Error("Failed to get upload URL")
      }

      const { uploadUrl, s3Key } = await uploadResponse.json()

      // Step 2: Upload file to S3
      setUploadProgress(30)
      const s3Response = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      })

      if (!s3Response.ok) {
        throw new Error("Failed to upload file")
      }

      setUploadProgress(60)

      // Step 3: Create application record
      const applicationResponse = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          age: parseInt(formData.age),
          s3Key,
          fileName: file.name,
          fileSize: file.size,
        }),
      })

      if (!applicationResponse.ok) {
        throw new Error("Failed to create application")
      }

      setUploadProgress(100)

      const { applicationId } = await applicationResponse.json()
      
      // Redirect to application detail page
      router.push(`/applications/${applicationId}?success=true`)
    } catch (err: any) {
      setError(err.message || "An error occurred. Please try again.")
      setUploadProgress(0)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    router.push("/auth/signin?callbackUrl=/apply")
    return null
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      
      <main className="max-w-3xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <FileText className="w-12 h-12 mx-auto mb-4 text-primary" />
          <h1 className="text-3xl font-bold mb-2">Apply for Document</h1>
          <p className="text-muted-foreground">
            Fill in your details and upload your document for verification
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                step >= s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}>
                {step > s ? <CheckCircle className="w-5 h-5" /> : s}
              </div>
              {s < 3 && (
                <div className={`w-16 h-1 mx-2 ${
                  step > s ? "bg-primary" : "bg-muted"
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Form Card */}
        <div className="bg-card border border-border rounded-xl p-8 shadow-sm">
          {error && (
            <div className="bg-destructive/10 border border-destructive/30 text-destructive p-3 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}

          {/* Step 1: Personal Information */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground block mb-2">
                    Full Name *
                  </label>
                  <Input
                    placeholder="Enter your full name"
                    value={formData.fullName}
                    onChange={(e) => updateField("fullName", e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground block mb-2">
                    Father/Husband Name *
                  </label>
                  <Input
                    placeholder="Enter father's or husband's name"
                    value={formData.fatherHusbandName}
                    onChange={(e) => updateField("fatherHusbandName", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground block mb-2">
                    Age *
                  </label>
                  <Input
                    type="number"
                    placeholder="Enter your age"
                    value={formData.age}
                    onChange={(e) => updateField("age", e.target.value)}
                    min="18"
                    max="120"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground block mb-2">
                    Phone Number *
                  </label>
                  <Input
                    type="tel"
                    placeholder="10 digit phone number"
                    value={formData.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    maxLength={10}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground block mb-2">
                  Email Address *
                </label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => updateField("email", e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground block mb-2">
                  Address *
                </label>
                <Textarea
                  placeholder="Enter your full address"
                  value={formData.address}
                  onChange={(e) => updateField("address", e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Step 2: Document Details */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold mb-4">Document Details</h2>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground block mb-2">
                  Aadhar Number *
                </label>
                <Input
                  placeholder="12 digit Aadhar number"
                  value={formData.aadharNumber}
                  onChange={(e) => updateField("aadharNumber", e.target.value)}
                  maxLength={12}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground block mb-2">
                  Document Type *
                </label>
                <Select value={formData.documentType} onValueChange={(v) => updateField("documentType", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select document type" />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground block mb-2">
                  Required By Date *
                </label>
                <Input
                  type="date"
                  value={formData.requiredByDate}
                  onChange={(e) => updateField("requiredByDate", e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground block mb-2">
                  Government Department (Optional)
                </label>
                <Select value={formData.governmentDepartment} onValueChange={(v) => updateField("governmentDepartment", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {GOVERNMENT_DEPARTMENTS.map((dept) => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Step 3: Upload & Signature */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold mb-4">Upload Document & Sign</h2>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground block mb-2">
                  Upload Document (PDF or DOCX, max 10MB) *
                </label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                  <input
                    type="file"
                    accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                    {file ? (
                      <p className="text-primary font-medium">{file.name}</p>
                    ) : (
                      <p className="text-muted-foreground">
                        Click to upload or drag and drop
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      PDF or DOCX up to 10MB
                    </p>
                  </label>
                </div>
              </div>

              {uploadProgress > 0 && (
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-muted-foreground block mb-2">
                  Digital Signature (Type your full name) *
                </label>
                <Input
                  placeholder="Type your full name as signature"
                  value={formData.digitalSignature}
                  onChange={(e) => updateField("digitalSignature", e.target.value)}
                  className="font-semibold"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  By signing, I confirm that all the information provided is true and correct.
                </p>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            {step > 1 ? (
              <Button variant="outline" onClick={prevStep} disabled={isSubmitting}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
            ) : (
              <div />
            )}
            
            {step < 3 ? (
              <Button onClick={nextStep}>
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit Application
                    <CheckCircle className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
