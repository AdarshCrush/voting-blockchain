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

export default function AdminLoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isWalletConnecting, setIsWalletConnecting] = useState(false)
  const [error, setError] = useState("")
  const [walletInfo, setWalletInfo] = useState("")
  const router = useRouter()

  // Connect to MetaMask
  const connectMetaMask = async (): Promise<string> => {
    if (typeof window.ethereum === 'undefined') {
      throw new Error("MetaMask is not installed. Please install MetaMask to continue.")
    }

    try {
      // Request account access - This will trigger MetaMask popup
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      })

      if (accounts && accounts.length > 0) {
        return accounts[0]
      }
      throw new Error("No accounts found. Please unlock MetaMask.")
    } catch (error: any) {
      if (error.code === 4001) {
        throw new Error("Please connect your MetaMask wallet to continue.")
      }
      throw new Error("Failed to connect wallet: " + error.message)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setWalletInfo("")

    if (!email || !password) {
      setError("Please fill in all fields")
      return
    }

    setIsLoading(true)

    try {
      // Step 1: First verify admin credentials and get registered wallet
      const verifyResponse = await fetch("/api/auth/verify-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const verifyResult = await verifyResponse.json()

      if (!verifyResponse.ok || !verifyResult.success) {
        throw new Error(verifyResult.error || "Invalid email or password")
      }

      const registeredWallet = verifyResult.admin.walletAddress
      const shortWallet = `${registeredWallet.substring(0, 6)}...${registeredWallet.substring(registeredWallet.length - 4)}`
      
      setWalletInfo(`Please connect wallet: ${shortWallet}`)

      // Step 2: Connect to MetaMask
      setIsWalletConnecting(true)
      const connectedWallet = await connectMetaMask()

      // Step 3: Verify connected wallet matches registered wallet
      if (connectedWallet.toLowerCase() !== registeredWallet.toLowerCase()) {
        throw new Error(`Wallet mismatch. Please connect: ${shortWallet}`)
      }

      // Step 4: Complete login with wallet verification (NO SIGNATURE NEEDED)
      const loginResponse = await fetch("/api/auth/admin-login", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          email, 
          password,
          walletAddress: connectedWallet // Just send the wallet address for verification
        }),
      })

      const loginResult = await loginResponse.json()

      if (!loginResponse.ok) {
        throw new Error(loginResult.error || "Login failed")
      }

      // Store session in localStorage
      localStorage.setItem("adminSession", JSON.stringify({
        id: loginResult.admin.id,
        email: loginResult.admin.email,
        walletAddress: loginResult.admin.walletAddress,
        isAdmin: true,
        timestamp: Date.now()
      }))

      // Store wallet for auto-connect
      localStorage.setItem("adminWallet", loginResult.admin.walletAddress)

      // Login successful
      router.push("/admin/dashboard")

    } catch (err: any) {
      setError(err.message || "Login failed. Please try again.")
    } finally {
      setIsLoading(false)
      setIsWalletConnecting(false)
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
          <CardTitle>Admin Login</CardTitle>
          <CardDescription>
            Enter your credentials and connect your registered wallet
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Email</label>
              <Input
                type="email"
                placeholder="admin@gmail.com"
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
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-input border-border"
                required
              />
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Wallet className="w-4 h-4 text-blue-600" />
                <span className="font-semibold text-blue-800">Wallet Verification</span>
              </div>
              <p className="text-blue-700 text-sm">
                You need to connect your registered MetaMask wallet to login.
                {walletInfo && (
                  <span className="block mt-2 font-medium bg-blue-100 p-2 rounded">
                    {walletInfo}
                  </span>
                )}
              </p>
              <p className="text-xs text-blue-600 mt-2">
                MetaMask will ask for connection permission
              </p>
            </div>

            {error && (
              <Alert className="bg-destructive/10 border-destructive/20">
                <AlertDescription className="text-destructive">{error}</AlertDescription>
              </Alert>
            )}
            
            <Button
              type="submit"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={isLoading || isWalletConnecting}
            >
              {isWalletConnecting ? (
                <>
                  <Wallet className="w-4 h-4 mr-2 animate-pulse" />
                  Connecting Wallet...
                </>
              ) : isLoading ? (
                "Verifying..."
              ) : (
                <>
                  <Shield className="w-4 h-4 mr-2" />
                  Login
                </>
              )}
            </Button>
          </form>
          <div className="mt-6 text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link href="/auth-common/register" className="text-primary hover:underline">
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