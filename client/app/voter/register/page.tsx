"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { User } from "lucide-react"
import Link from "next/link"

export default function VoterRegisterPage() {
  const [formData, setFormData] = useState({
    email: "",
    aadharNumber: "",
    voterId: "",
    walletAddress: "",
    electionId: ""
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    // Validation
    if (!formData.email || !formData.aadharNumber || !formData.voterId || !formData.walletAddress || !formData.electionId) {
      setError("Please fill in all fields")
      return
    }

    if (!formData.email.includes('@')) {
      setError("Please enter a valid email address")
      return
    }

    if (formData.aadharNumber.length !== 12) {
      setError("Aadhar number must be 12 digits")
      return
    }

    if (!formData.walletAddress.startsWith('0x') || formData.walletAddress.length !== 42) {
      setError("Please enter a valid wallet address")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/voter-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || "Registration failed")
        return
      }

      setSuccess("Registration successful! You can now vote in elections.")
      
      // Redirect to voter dashboard after 2 seconds
      setTimeout(() => {
        router.push("/voter/dashboard")
      }, 2000)
    } catch (err) {
      setError("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-border">
        <CardHeader className="space-y-2">
          <div className="flex items-center justify-center gap-2 mb-4">
            <User className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold text-primary">VoteChain</h1>
          </div>
          <CardTitle>Voter Registration</CardTitle>
          <CardDescription>Register to participate in elections</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Email</label>
              <Input
                type="email"
                name="email"
                placeholder="voter@example.com"
                value={formData.email}
                onChange={handleChange}
                className="bg-input border-border"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Aadhar Number</label>
              <Input
                type="text"
                name="aadharNumber"
                placeholder="12-digit Aadhar number"
                value={formData.aadharNumber}
                onChange={handleChange}
                maxLength={12}
                className="bg-input border-border"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Voter ID</label>
              <Input
                type="text"
                name="voterId"
                placeholder="Voter identification number"
                value={formData.voterId}
                onChange={handleChange}
                className="bg-input border-border"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Ganache Wallet Address</label>
              <Input
                type="text"
                name="walletAddress"
                placeholder="0x..."
                value={formData.walletAddress}
                onChange={handleChange}
                className="bg-input border-border"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Election ID</label>
              <Input
                type="text"
                name="electionId"
                placeholder="Election identifier"
                value={formData.electionId}
                onChange={handleChange}
                className="bg-input border-border"
              />
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
            <Button
              type="submit"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={isLoading}
            >
              {isLoading ? "Registering..." : "Register as Voter"}
            </Button>
          </form>
          <div className="mt-6 text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Already registered?{" "}
              <Link href="/voter/login" className="text-primary hover:underline">
                Login here
              </Link>
            </p>
            <Link href="/" className="text-sm text-muted-foreground hover:underline block">
              Back to Home
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}