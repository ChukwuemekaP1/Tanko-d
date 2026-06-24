"use client"

import { useState } from "react"
import { Loader2, FileText, CheckCircle2, AlertCircle, Camera } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://127.0.0.1:3001"

interface DriverKYCFormProps {
  userId: string
  onSuccess: () => void
}

export default function DriverKYCForm({ userId, onSuccess }: DriverKYCFormProps) {
  const [licenseNumber, setLicenseNumber] = useState("")
  const [licenseExpiry, setLicenseExpiry] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!licenseNumber || !licenseExpiry) {
      toast.error("Please fill in all fields")
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch(`${BACKEND}/api/v1/kyc/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          licenseNumber,
          licenseExpiry: new Date(licenseExpiry).toISOString(),
          // In a real app, we would upload files to S3/Cloudinary and send URLs here
          idCardFrontUrl: "https://via.placeholder.com/400x250?text=ID+Front",
          idCardBackUrl: "https://via.placeholder.com/400x250?text=ID+Back",
          selfieUrl: "https://via.placeholder.com/250x250?text=Selfie",
        }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        toast.success("KYC submitted successfully", {
          description: "Your verification is now pending review.",
          icon: <CheckCircle2 className="h-4 w-4" />,
        })
        onSuccess()
      } else {
        throw new Error(data.error || "Failed to submit KYC")
      }
    } catch (error) {
      toast.error("Submission failed", {
        description: error instanceof Error ? error.message : "Something went wrong",
        icon: <AlertCircle className="h-4 w-4" />,
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="licenseNumber">Driver's License Number</Label>
          <div className="relative">
            <FileText className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="licenseNumber"
              placeholder="ABC-123456"
              className="pl-10"
              value={licenseNumber}
              onChange={(e) => setLicenseNumber(e.target.value)}
              disabled={submitting}
            />
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="licenseExpiry">License Expiry Date</Label>
          <Input
            id="licenseExpiry"
            type="date"
            value={licenseExpiry}
            onChange={(e) => setLicenseExpiry(e.target.value)}
            disabled={submitting}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-4 bg-muted/50">
            <Camera className="h-8 w-8 text-muted-foreground mb-2" />
            <span className="text-xs text-center text-muted-foreground">ID Card Front</span>
          </div>
          <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-4 bg-muted/50">
            <Camera className="h-8 w-8 text-muted-foreground mb-2" />
            <span className="text-xs text-center text-muted-foreground">ID Card Back</span>
          </div>
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Submitting...
          </>
        ) : (
          "Submit for Verification"
        )}
      </Button>
    </form>
  )
}
