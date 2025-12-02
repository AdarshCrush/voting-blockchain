"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield, Wallet } from "lucide-react"
import Link from "next/link"

declare global {
  interface Window {
    ethereum?: any;
  }
}

export default function AdminRegisterPage() {
  const [walletAddress, setWalletAddress] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const router = useRouter()

  // Connect to MetaMask and get wallet address
  const connectMetaMask = async () => {
    if (typeof window.ethereum === 'undefined') {
      throw new Error("MetaMask is not installed. Please install MetaMask to continue.")
    }

    if (!window.ethereum.isMetaMask) {
      throw new Error("Please use MetaMask wallet")
    }

    setIsConnecting(true)
    try {
      // Request account access - This will trigger MetaMask popup
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      })

      if (accounts && accounts.length > 0) {
        const address = accounts[0]
        setWalletAddress(address)
        return address
      }
      throw new Error("No accounts found. Please unlock MetaMask.")
    } catch (error: any) {
      if (error.code === 4001) {
        throw new Error("Please connect your MetaMask wallet to continue.")
      }
      throw new Error("Failed to connect wallet: " + error.message)
    } finally {
      setIsConnecting(false)
    }
  }

  // Sign a confirmation message with MetaMask
  const signRegistrationConfirmation = async (walletAddress: string) => {
    if (typeof window.ethereum === 'undefined') {
      throw new Error("MetaMask is not installed")
    }

    try {
      const message = `Admin Registration Confirmation - ${email} - ${Date.now()}`
      // This will trigger MetaMask signature popup
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [message, walletAddress]
      })
      return { signature, message }
    } catch (error: any) {
      if (error.code === 4001) {
        throw new Error("Registration confirmation rejected by user")
      }
      throw new Error("Failed to sign confirmation: " + error.message)
    }
  }

  const handleConnectWallet = async () => {
    setError("")
    try {
      const address = await connectMetaMask()
      setSuccess(`Wallet connected: ${address.substring(0, 6)}...${address.substring(address.length - 4)}`)
    } catch (err: any) {
      setError(err.message || "Failed to connect wallet")
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (!walletAddress || !email || !password || !confirmPassword) {
      setError("Please fill in all fields")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    if (!walletAddress.startsWith('0x') || walletAddress.length !== 42) {
      setError("Please enter a valid wallet address")
      return
    }

    // Ask for user confirmation before proceeding
    const userConfirmed = window.confirm(
      `You are registering as admin with:\n\nEmail: ${email}\nWallet: ${walletAddress.substring(0, 10)}...\n\nMake sure this is correct. Click OK to proceed with MetaMask confirmation.`
    )

    if (!userConfirmed) {
      return
    }

    setIsLoading(true)

    try {
      // Step 1: Get signature confirmation from MetaMask
      const { signature, message } = await signRegistrationConfirmation(walletAddress)

      // Step 2: Send registration request with signature
      const response = await fetch("/api/auth/admin-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress,
          email,
          password,
          signature,
          message
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || "Registration failed")
        return
      }

      // Store session in localStorage
      localStorage.setItem("adminSession", JSON.stringify({
        id: result.admin?.id,
        email: result.admin?.email,
        walletAddress: result.admin?.walletAddress || walletAddress,
        isAdmin: true,
        timestamp: Date.now()
      }))

      localStorage.setItem("adminWallet", walletAddress)

      setSuccess("Registration successful! Redirecting to dashboard...")
      setTimeout(() => router.push("/admin/dashboard"), 2000)
    } catch (err: any) {
      setError(err.message || "An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-border">
        <CardHeader className="space-y-2">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Shield className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold text-primary">VoteChain</h1>
          </div>
          <CardTitle>Admin Registration</CardTitle>
          <CardDescription>Create your admin account to manage elections</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            {/* Wallet Connection Section */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">Connect Your MetaMask Wallet</label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="0x..."
                  value={walletAddress}
                  readOnly
                  className="bg-input border-border flex-1 font-mono text-sm"
                />
                <Button
                  type="button"
                  onClick={handleConnectWallet}
                  disabled={isConnecting}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Wallet className="w-4 h-4 mr-2" />
                  {isConnecting ? "Connecting..." : "Connect"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Connect your MetaMask wallet to automatically fill your address
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Email</label>
              <Input
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-input border-border"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Password</label>
              <Input
                type="password"
                placeholder="Enter password (min. 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-input border-border"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Confirm Password</label>
              <Input
                type="password"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-input border-border"
                required
              />
            </div>

            {/* MetaMask Confirmation Notice */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Wallet className="w-4 h-4 text-yellow-600" />
                <span className="font-semibold text-yellow-800">MetaMask Confirmation Required</span>
              </div>
              <p className="text-yellow-700 text-sm">
                After clicking "Register", you will need to:
                <ol className="list-decimal ml-4 mt-1 space-y-1">
                  <li>Confirm the registration details</li>
                  <li>Sign a confirmation message in MetaMask</li>
                  <li>Wait for registration to complete</li>
                </ol>
              </p>
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
              disabled={isLoading || isConnecting || !walletAddress}
            >
              {isLoading ? (
                <>
                  <Wallet className="w-4 h-4 mr-2 animate-pulse" />
                  Confirming with MetaMask...
                </>
              ) : (
                "Register with MetaMask"
              )}
            </Button>
          </form>
          <div className="mt-6 text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/auth-common/login" className="text-primary hover:underline">
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