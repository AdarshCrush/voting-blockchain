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
import { Shield } from "lucide-react"

interface Election {
  id: string
  name: string
  year: number
}

export default function CreatePartyPage() {
  const [formData, setFormData] = useState({
    name: "",
    symbol: "",
    electionId: ""
  })
  const [elections, setElections] = useState<Election[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [electionsLoading, setElectionsLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
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
      const response = await fetch("/api/admin/parties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
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
                disabled={isLoading || electionsLoading}
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