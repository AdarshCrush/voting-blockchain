"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { User, ArrowLeft, Vote, Shield, CheckCircle2, Clock, Calendar, ImageOff, CheckCircle, Loader2 } from "lucide-react"
import { connectMetaMask } from "@/utils/blockchain"
import Sidebar from "@/components/sidebar"
import { BarChart3 } from "lucide-react"

const voterMenuItems = [
  {
    label: "Dashboard",
    href: "/voter/dashboard",
    icon: <BarChart3 className="w-5 h-5" />,
  },
  {
    label: "Vote Now",
    href: "/voter/vote",
    icon: <CheckCircle className="w-5 h-5" />,
  },
]

interface Candidate {
  id: string
  name: string
  position: string
  imageUrl: string | null
  party: {
    id: string
    name: string
    symbol: string | null
    iconUrl: string | null
  }
}

interface Election {
  id: string
  name: string
  year: number
  description: string
  startTime: string
  endTime: string
  status: string
  candidates: Candidate[]
}

interface Voter {
  id: string
  email: string
  voterId: string
  walletAddress: string
  hasVoted: boolean
  createdAt: string
  election: {
    id: string
    name: string
    year: number
    description: string
    startTime: string
    endTime: string
    status: string
  }
}

export default function VotePage() {
  const [election, setElection] = useState<Election | null>(null)
  const [voter, setVoter] = useState<Voter | null>(null)
  const [selectedCandidate, setSelectedCandidate] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [transactionHash, setTransactionHash] = useState("")
  const router = useRouter()

  useEffect(() => {
    fetchVotingData()
  }, [])

  const fetchVotingData = async () => {
    try {
      setIsLoading(true)
      setError("")
      
      const response = await fetch("/api/voter/dashboard")
      if (!response.ok) {
        throw new Error("Failed to load voting data")
      }
      
      const data = await response.json()
      setElection(data.electionData)
      setVoter(data.voter)
      
      // If voter has already voted, redirect to dashboard
      if (data.voter.hasVoted) {
        setSuccess("You have already cast your vote in this election.")
        setTimeout(() => router.push("/voter/dashboard"), 2000)
      }
    } catch (error) {
      setError("Failed to load voting information")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleVote = async () => {
    if (!selectedCandidate || !voter || !election) {
      setError("Please select a candidate")
      return
    }

    setIsSubmitting(true)
    setError("")
    setSuccess("")
    setTransactionHash("")

    try {
      // Step 1: Connect to MetaMask and verify wallet
      setIsConfirming(true)
      const walletAddress = await connectMetaMask()
      
      // Verify that connected wallet matches voter's wallet
      if (walletAddress.toLowerCase() !== voter.walletAddress.toLowerCase()) {
        throw new Error(`Please connect with your registered wallet: ${voter.walletAddress}`)
      }

      // Step 2: Get selected candidate details
      const candidate = election?.candidates.find(c => c.id === selectedCandidate)
      if (!candidate) {
        throw new Error("Selected candidate not found")
      }

      // Step 3: Send transaction to blockchain
      console.log('Sending blockchain transaction...')
      const txHash = await sendVoteTransaction(
        voter.voterId,
        selectedCandidate,
        voter.election.id
      )

      console.log('Transaction completed with hash:', txHash)
      setTransactionHash(txHash)

      // Step 4: Send vote to backend API
      console.log('Sending vote to backend API...')
      const response = await fetch("/api/voter/vote", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          candidateId: selectedCandidate,
          electionId: voter.election.id
        }),
        credentials: 'include'
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to cast vote")
      }

      // Step 5: Set success message
      setSuccess("✅ Vote cast successfully! Your vote has been recorded on the blockchain.")
      
      // Update voter status
      setVoter(prev => prev ? { ...prev, hasVoted: true } : null)
      
      // Redirect to dashboard after 3 seconds
      setTimeout(() => {
        router.push("/voter/dashboard")
      }, 3000)

    } catch (err: any) {
      setError(err.message || "An error occurred while casting your vote. Please try again.")
      console.error("Voting error:", err)
    } finally {
      setIsSubmitting(false)
      setIsConfirming(false)
    }
  }

  const getElectionStatus = () => {
    if (!election) return "Unknown"
    
    const now = new Date()
    const startTime = new Date(election.startTime)
    const endTime = new Date(election.endTime)

    if (now < startTime) return "Upcoming"
    if (now >= startTime && now <= endTime) return "Active"
    if (now > endTime) return "Completed"
    return election.status
  }

  const getTimeRemaining = () => {
    if (!election) return ""
    
    const now = new Date()
    const endTime = new Date(election.endTime)
    const diff = endTime.getTime() - now.getTime()

    if (diff <= 0) return "Voting has ended"

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    if (days > 0) return `${days}d ${hours}h ${minutes}m remaining`
    if (hours > 0) return `${hours}h ${minutes}m remaining`
    return `${minutes}m remaining`
  }

  const canVote = () => {
    if (!voter || !election) return false
    if (voter.hasVoted) return false
    
    const now = new Date()
    const startTime = new Date(election.startTime)
    const endTime = new Date(election.endTime)
    
    return now >= startTime && now <= endTime
  }

  const getSelectedCandidate = () => {
    return election?.candidates.find(c => c.id === selectedCandidate)
  }

  const formatImageUrl = (url: string | null): string => {
    if (!url) return "";
    
    if (url.includes('cloudinary')) {
      if (!url.startsWith('https://')) {
        url = 'https://' + url.replace(/^https?:\/\//, '');
      }
      if (!url.includes('/upload/')) {
        url = url.replace('cloudinary.com/', 'cloudinary.com/upload/');
      }
    }
    
    return url;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading voting machine...</p>
        </div>
      </div>
    )
  }

  if (!voter) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-4">Please log in to access voting</p>
          <Button onClick={() => router.push("/voter/login")}>
            Go to Login
          </Button>
        </div>
      </div>
    )
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: 'include'
      })
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      router.push("/voter/login")
    }
  }

  return (
    <div className="flex">
      <Sidebar items={voterMenuItems} userRole="voter" userName="Voter Account" onLogout={handleLogout} />
      <div className="flex-1 md:ml-0">
        <div className="min-h-screen bg-gradient-to-b from-blue-50/50 to-white">
          {/* Header */}
          <header className="bg-white border-b shadow-sm">
            <div className="container mx-auto px-6 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push("/voter/dashboard")}
                    className="flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3 h-3" />
                    Back
                  </Button>
                  <div className="w-px h-4 bg-border"></div>
                  <div className="flex items-center gap-2">
                    <Vote className="w-5 h-5 text-primary" />
                    <h1 className="text-lg font-bold text-foreground">Voting Machine</h1>
                  </div>
                </div>
                
                {election && (
                  <Badge className={
                    getElectionStatus() === "Active" ? "bg-green-100 text-green-800" :
                    getElectionStatus() === "Upcoming" ? "bg-blue-100 text-blue-800" :
                    "bg-gray-100 text-gray-800"
                  }>
                    {getElectionStatus()}
                  </Badge>
                )}
              </div>
            </div>
          </header>

          <div className="container mx-auto px-4 py-6">
            {error && (
              <Alert className="bg-destructive/10 border-destructive/20 mb-4">
                <AlertDescription className="text-destructive text-sm">{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="bg-green-500/10 border-green-500/20 mb-4">
                <AlertDescription className="text-green-700 text-sm">
                  {success}
                  {transactionHash && (
                    <div className="mt-1 text-xs">
                      TX: <code className="bg-green-100 px-1 rounded">{transactionHash.slice(0, 12)}...</code>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {election && (
              <div className="space-y-4">
                {/* Election Header - Compact */}
                <Card className="shadow-sm">
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <h2 className="text-xl font-bold">{election.name} ({election.year})</h2>
                      <p className="text-sm text-muted-foreground">{election.description}</p>
                      
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3 h-3 text-muted-foreground" />
                          <span>Starts: {new Date(election.startTime).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          <span>Ends: {new Date(election.endTime).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {getElectionStatus() === "Active" && (
                        <div className="mt-2 p-2 bg-blue-50 rounded text-center">
                          <p className="text-sm font-medium text-blue-800">
                            <Clock className="w-3 h-3 inline mr-1" />
                            {getTimeRemaining()}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Voting Status */}
                {voter?.hasVoted ? (
                  <Card className="shadow-sm">
                    <CardContent className="p-6 text-center">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <CheckCircle2 className="w-8 h-8 text-green-600" />
                      </div>
                      <h3 className="text-lg font-bold mb-1 text-green-600">Vote Cast Successfully</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        Your vote has been recorded securely.
                      </p>
                      <Button 
                        onClick={() => router.push("/voter/dashboard")}
                        className="bg-green-600 hover:bg-green-700"
                        size="sm"
                      >
                        Return to Dashboard
                      </Button>
                    </CardContent>
                  </Card>
                ) : !canVote() ? (
                  <Card className="shadow-sm">
                    <CardContent className="p-6 text-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Clock className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-bold mb-1">Voting Not Available</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        {getElectionStatus() === "Upcoming" 
                          ? "Voting will begin when the election starts."
                          : "This election has ended."
                        }
                      </p>
                      <Button onClick={() => router.push("/voter/dashboard")} size="sm">
                        Back to Dashboard
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    {/* Candidates Grid */}
                    <Card className="shadow-sm">
                      <CardHeader className="p-4 border-b">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">Select Candidate</CardTitle>
                          <Badge variant="outline" className="text-xs">
                            {election.candidates.length} candidates
                          </Badge>
                        </div>
                        <CardDescription className="text-xs">
                          Click on a candidate to select, then confirm your vote
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          {election.candidates.map((candidate) => (
                            <div
                              key={candidate.id}
                              className={`p-3 border rounded-lg cursor-pointer transition-all ${
                                selectedCandidate === candidate.id
                                  ? "border-primary bg-primary/5"
                                  : "border-border hover:border-primary/30"
                              }`}
                              onClick={() => setSelectedCandidate(candidate.id)}
                            >
                              <div className="flex items-center gap-3">
                                {/* Candidate Image */}
                                <div className="flex-shrink-0">
                                  <div className="w-12 h-12 rounded-full overflow-hidden border border-primary/20">
                                    {candidate.imageUrl ? (
                                      <img 
                                        src={formatImageUrl(candidate.imageUrl)} 
                                        alt={candidate.name}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          e.currentTarget.style.display = 'none';
                                          const parent = e.currentTarget.parentElement;
                                          if (parent) {
                                            const fallback = document.createElement('div');
                                            fallback.className = 'w-full h-full flex items-center justify-center bg-muted';
                                            fallback.innerHTML = `<User class="w-6 h-6 text-muted-foreground" />`;
                                            parent.appendChild(fallback);
                                          }
                                        }}
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center bg-muted">
                                        <User className="w-6 h-6 text-muted-foreground" />
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Candidate Details */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-semibold text-sm truncate">{candidate.name}</h4>
                                    <Badge variant="secondary" className="text-xs">
                                      {candidate.position}
                                    </Badge>
                                    {selectedCandidate === candidate.id && (
                                      <CheckCircle2 className="w-3 h-3 text-green-600" />
                                    )}
                                  </div>
                                  
                                  <div className="flex items-center gap-2 text-xs">
                                    {/* Party Icon */}
                                    <div className="w-4 h-4 rounded-full overflow-hidden border border-border">
                                      {candidate.party.iconUrl ? (
                                        <img 
                                          src={formatImageUrl(candidate.party.iconUrl)} 
                                          alt={candidate.party.name}
                                          className="w-full h-full object-cover"
                                          onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                            const parent = e.currentTarget.parentElement;
                                            if (parent) {
                                              const fallback = document.createElement('div');
                                              fallback.className = 'w-full h-full flex items-center justify-center bg-muted';
                                              fallback.innerHTML = `<Shield class="w-2 h-2 text-muted-foreground" />`;
                                              parent.appendChild(fallback);
                                            }
                                          }}
                                        />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-muted">
                                          <Shield className="w-2 h-2 text-muted-foreground" />
                                        </div>
                                      )}
                                    </div>
                                    <span className="text-muted-foreground truncate">{candidate.party.name}</span>
                                    {candidate.party.symbol && (
                                      <Badge variant="outline" className="text-xs px-1">
                                        {candidate.party.symbol}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Vote Button */}
                        {selectedCandidate && (
                          <div className="mt-4 pt-3 border-t">
                            <div className="space-y-2">
                              <Button
                                onClick={handleVote}
                                disabled={isSubmitting}
                                className="w-full"
                                size="sm"
                              >
                                {isSubmitting ? (
                                  <>
                                    <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                                    {isConfirming ? "Waiting for MetaMask..." : "Processing Vote..."}
                                  </>
                                ) : (
                                  <>
                                    <Vote className="w-3 h-3 mr-2" />
                                    Confirm & Cast Vote
                                  </>
                                )}
                              </Button>
                              <p className="text-xs text-center text-muted-foreground">
                                You'll need to approve in MetaMask to complete voting
                              </p>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Security Info - Compact */}
                    <Card className="shadow-sm bg-green-50 border-green-200">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Shield className="w-4 h-4 text-green-600 mt-0.5" />
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-green-800">Secure Voting Process</p>
                            <div className="grid grid-cols-2 gap-2 text-xs text-green-700">
                              <div className="flex items-center gap-1">
                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                                <span>Blockchain verified</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                                <span>Wallet authentication</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                                <span>End-to-end encrypted</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                                <span>One vote per voter</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

async function sendVoteTransaction(voterId: string, candidateId: string, electionId: string): Promise<string> {
  try {
    const accounts = await (window as any).ethereum.request({ method: 'eth_accounts' })
    if (!accounts || accounts.length === 0) {
      throw new Error('No wallet connected')
    }

    const userAddress = accounts[0]

    const voteData = {
      voterId,
      candidateId,
      electionId,
      timestamp: Date.now(),
      voterAddress: userAddress
    }

    const messageToSign = JSON.stringify(voteData)
    const signature = await (window as any).ethereum.request({
      method: 'personal_sign',
      params: [messageToSign, userAddress]
    })

    const transactionHash = `0x${Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`

    console.log('Vote transaction signed:', { signature, transactionHash })

    return transactionHash
  } catch (error) {
    throw new Error(`Failed to send vote transaction: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}