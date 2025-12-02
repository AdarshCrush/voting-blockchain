"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { User } from "lucide-react"

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
    partyId: ""
  })
  const [parties, setParties] = useState<Party[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [partiesLoading, setPartiesLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
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
      const response = await fetch("/api/admin/candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
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
                disabled={isLoading || partiesLoading}
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