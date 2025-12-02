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
import { User, Upload, X } from "lucide-react"

interface Party {
  id: string
  name: string
  symbol: string
  election: {
    name: string
  }
}

export default function CreateCandidatePage() {
  const [formData, setFormData] = useState({
    name: "",
    position: "",
    partyId: "",
    imageUrl: ""
  })
  const [previewUrl, setPreviewUrl] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [parties, setParties] = useState<Party[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [partiesLoading, setPartiesLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    fetchParties()
  }, [])

  const fetchParties = async () => {
    try {
      const response = await fetch("/api/admin/parties")
      if (!response.ok) throw new Error("Failed to fetch parties")
      const data = await response.json()
      setParties(data.parties)
    } catch (error) {
      setError("Failed to load parties")
    } finally {
      setPartiesLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    if (!selectedFile.type.startsWith('image/')) {
      setError("Please select an image file")
      return
    }

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
    setFormData(prev => ({ ...prev, imageUrl: "" }))
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
      formData.append("type", "candidate")

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
      partyId: value
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (!formData.name || !formData.position || !formData.partyId) {
      setError("Please fill in all required fields")
      return
    }

    setIsLoading(true)

    try {
      // Upload image if exists
      let imageUrl = formData.imageUrl
      if (file) {
        const uploadedUrl = await uploadImage()
        if (uploadedUrl) {
          imageUrl = uploadedUrl
        }
      }

      const response = await fetch("/api/admin/candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, imageUrl }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || "Failed to create candidate")
        return
      }

      setSuccess("Candidate created successfully! Redirecting...")
      setTimeout(() => router.push("/admin/candidates"), 2000)
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
          <User className="w-6 h-6 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Register Candidate</h1>
        </div>
        <p className="text-muted-foreground">Add a new candidate to a political party</p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Candidate Details</CardTitle>
          <CardDescription>Enter the information for the new candidate</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Candidate Name *</Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="e.g., John Smith"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="position">Position *</Label>
              <Input
                id="position"
                name="position"
                type="text"
                placeholder="e.g., President, Council Member"
                value={formData.position}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Passport Photo</Label>
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
                        className="w-48 h-48 rounded-lg object-cover mx-auto"
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
                        Click to upload passport photo
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Recommended: 400x400px, max 5MB
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
              <Label htmlFor="party">Select Party *</Label>
              <Select value={formData.partyId} onValueChange={handleSelectChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a political party" />
                </SelectTrigger>
                <SelectContent>
                  {parties.map((party) => (
                    <SelectItem key={party.id} value={party.id}>
                      {party.name} ({party.election.name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {parties.length === 0 && !partiesLoading && (
                <p className="text-sm text-muted-foreground">
                  No parties available. <a href="/admin/parties/create" className="text-primary hover:underline">Create a party first</a>.
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
                disabled={isLoading || partiesLoading || uploading}
              >
                {isLoading ? "Creating..." : "Register Candidate"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/admin/candidates")}
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