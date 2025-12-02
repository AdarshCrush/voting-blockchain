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

export default function VoterLoginPage() {
  const [email, setEmail] = useState("")
  const [voterId, setVoterId] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    if (!email || !voterId) {
      setError("Please fill in all fields")
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch("/api/auth/voter-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, voterId }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || "Login failed")
        setIsLoading(false)
        return
      }

      router.push("/voter/dashboard")
    } catch (err) {
      setError("Login failed. Please try again.")
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
          <CardTitle>Voter Login</CardTitle>
          <CardDescription>Enter your credentials to access voting</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Email</label>
              <Input
                type="email"
                placeholder="voter@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-input border-border"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Voter ID</label>
              <Input
                type="text"
                placeholder="Your voter ID"
                value={voterId}
                onChange={(e) => setVoterId(e.target.value)}
                className="bg-input border-border"
              />
            </div>
            {error && (
              <Alert className="bg-destructive/10 border-destructive/20">
                <AlertDescription className="text-destructive">{error}</AlertDescription>
              </Alert>
            )}
            <Button
              type="submit"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={isLoading}
            >
              {isLoading ? "Logging in..." : "Login as Voter"}
            </Button>
          </form>
          <div className="mt-6 text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Not registered?{" "}
              <Link href="/voter/register" className="text-primary hover:underline">
                Register here
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