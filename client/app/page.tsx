"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Users, CheckCircle } from "lucide-react"

export default function LandingPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-20">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Shield className="w-10 h-10 text-primary" />
            <h1 className="text-5xl font-bold text-foreground">Blockchain Voting</h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Secure, transparent, and tamper-proof election system powered by Ethereum blockchain
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="border-border hover:shadow-lg transition-shadow">
            <CardHeader>
              <Shield className="w-8 h-8 text-primary mb-4" />
              <CardTitle>Secure & Transparent</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Every vote is permanently recorded on the blockchain and cannot be modified or deleted.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border hover:shadow-lg transition-shadow">
            <CardHeader>
              <Users className="w-8 h-8 text-primary mb-4" />
              <CardTitle>Single Vote per Voter</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Advanced verification ensures each voter votes only once for one candidate.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border hover:shadow-lg transition-shadow">
            <CardHeader>
              <CheckCircle className="w-8 h-8 text-primary mb-4" />
              <CardTitle>Automated Counting</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Smart contracts automatically count votes and determine winners with complete transparency.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Login Buttons */}
        <div className="flex justify-center gap-6 mb-16">
          <Button
            onClick={() => router.push("/auth-common/login")}
            size="lg"
            className="bg-primary text-primary-foreground hover:bg-primary/90 px-8"
          >
            Admin Login
          </Button>
          <Button onClick={() => router.push("/voter/login")} size="lg" variant="outline" className="px-8">
            Voter Login
          </Button>
        </div>

        {/* How it Works */}
        <div className="bg-card border border-border rounded-lg p-8 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold mb-6 text-center">How It Works</h2>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold flex-shrink-0">
                1
              </div>
              <div>
                <h3 className="font-semibold mb-1">Admin Registration</h3>
                <p className="text-muted-foreground">Admin uses Ganache address to register and manage elections</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold flex-shrink-0">
                2
              </div>
              <div>
                <h3 className="font-semibold mb-1">Setup Election</h3>
                <p className="text-muted-foreground">Create elections, register parties and candidates</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold flex-shrink-0">
                3
              </div>
              <div>
                <h3 className="font-semibold mb-1">Register Voters</h3>
                <p className="text-muted-foreground">Add voters with their Aadhar, Voter ID, and wallet address</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold flex-shrink-0">
                4
              </div>
              <div>
                <h3 className="font-semibold mb-1">Voter Voting</h3>
                <p className="text-muted-foreground">Voters login and cast their votes securely on blockchain</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold flex-shrink-0">
                5
              </div>
              <div>
                <h3 className="font-semibold mb-1">Count Results</h3>
                <p className="text-muted-foreground">Admin can view final vote counts and winning candidates</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
