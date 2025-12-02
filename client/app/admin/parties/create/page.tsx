"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Shield, Upload, X } from "lucide-react"

interface Election {
  id: string
  name: string
  year: number
}

export default function CreatePartyPage() {
  const [formData, setFormData] = useState({
    name: "",
    symbol: "",
    electionId: "",
    iconUrl: ""
  })
  const [previewUrl, setPreviewUrl] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [elections, setElections] = useState<Election[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [electionsLoading, setElectionsLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    fetchElections()
  }, [])

  const fetchElections = async () => {
    try {
      const response = await fetch("/api/admin/elections")
      if (!response.ok) throw new Error("Failed to fetch elections")
      const data = await response.json()
      setElections(data.elections)
    } catch (error) {
      setError("Failed to load elections")
    } finally {
      setElectionsLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    // Check file type
    if (!selectedFile.type.startsWith('image/')) {
      setError("Please select an image file")
      return
    }

    // Check file size (max 5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError("File size should be less than 5MB")
      return
    }

    setFile(selectedFile)
    setPreviewUrl(URL.createObjectURL(selectedFile))
    setError("")
  }

  const removeImage = () => {
    setFile(null)
    setPreviewUrl("")
    setFormData(prev => ({ ...prev, iconUrl: "" }))
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const uploadImage = async () => {
    if (!file) return ""

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("type", "party")

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Upload failed")
      }

      return result.url
    } catch (err) {
      setError("Failed to upload image")
      return ""
    } finally {
      setUploading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSelectChange = (value: string) => {
    setFormData({
      ...formData,
      electionId: value
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (!formData.name || !formData.electionId) {
      setError("Please fill in all required fields")
      return
    }

    setIsLoading(true)

    try {
      // Upload image if exists
      let iconUrl = formData.iconUrl
      if (file) {
        const uploadedUrl = await uploadImage()
        if (uploadedUrl) {
          iconUrl = uploadedUrl
        }
      }

      const response = await fetch("/api/admin/parties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, iconUrl }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || "Failed to create party")
        return
      }

      setSuccess("Party created successfully! Redirecting...")
      setTimeout(() => router.push("/admin/parties"), 2000)
    } catch (err) {
      setError("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="w-6 h-6 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Create Political Party</h1>
        </div>
        <p className="text-muted-foreground">Register a new political party for an election</p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Party Details</CardTitle>
          <CardDescription>Enter the information for the new political party</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Party Name *</Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="e.g., Democratic Alliance"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="symbol">Party Symbol</Label>
              <Input
                id="symbol"
                name="symbol"
                type="text"
                placeholder="e.g., DA, ANC, EFF"
                value={formData.symbol}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label>Party Icon</Label>
              <div className="space-y-4">
                <div 
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${previewUrl ? 'border-primary/50' : 'border-muted-foreground/25 hover:border-primary/50'}`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  
                  {previewUrl ? (
                    <div className="relative inline-block">
                      <img 
                        src={previewUrl} 
                        alt="Preview" 
                        className="w-32 h-32 rounded-full object-cover mx-auto"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeImage()
                        }}
                        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">
                        Click to upload party icon
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Recommended: Square image, max 5MB
                      </p>
                    </>
                  )}
                </div>
                {uploading && (
                  <p className="text-sm text-muted-foreground">Uploading image...</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="election">Select Election *</Label>
              <Select value={formData.electionId} onValueChange={handleSelectChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an election" />
                </SelectTrigger>
                <SelectContent>
                  {elections.map((election) => (
                    <SelectItem key={election.id} value={election.id}>
                      {election.name} ({election.year})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {elections.length === 0 && !electionsLoading && (
                <p className="text-sm text-muted-foreground">
                  No elections available. <a href="/admin/create-election" className="text-primary hover:underline">Create an election first</a>.
                </p>
              )}
            </div>

            {error && (
              <Alert className="bg-destructive/10 border-destructive/20">
                <AlertDescription className="text-destructive">{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="bg-green-500/10 border-green-500/20">
                <AlertDescription className="text-green-700">{success}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={isLoading || electionsLoading || uploading}
              >
                {isLoading ? "Creating..." : "Create Party"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/admin/parties")}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}