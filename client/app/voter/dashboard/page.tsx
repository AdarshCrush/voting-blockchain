"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { User, LogOut, Vote, Calendar, Clock, Users, Shield, ExternalLink, Loader2 } from "lucide-react"
import VoteConfirmationDialog from "@/components/VoteConfirmationDialog"
import { connectMetaMask } from "@/utils/blockchain"
 import Sidebar from "@/components/sidebar"
import { BarChart3, CheckCircle } from "lucide-react"

const voterMenuItems = [
  {
    label: "Dashboard",
    href: "/voter/dashboard",
    icon: <BarChart3 className="w-5 h-5" />,
  },
  {
    label: "Vote",
    href: "/voter/vote",
    icon: <CheckCircle className="w-5 h-5" />,
  },
]

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

interface Candidate {
  id: string
  name: string
  position: string
  party: {
    id: string
    name: string
    symbol: string
  }
}

interface ElectionData {
  id: string
  name: string
  description: string
  status: string
  startTime: string
  endTime: string
  candidates: Candidate[]
}

export default function VoterDashboard() {
  const [voter, setVoter] = useState<Voter | null>(null)
  const [electionData, setElectionData] = useState<ElectionData | null>(null)
  const [selectedCandidate, setSelectedCandidate] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [isVoting, setIsVoting] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [transactionHash, setTransactionHash] = useState("")
  const router = useRouter()

  useEffect(() => {
    fetchVoterData()
  }, [])

  const fetchVoterData = async () => {
    try {
      const response = await fetch("/api/voter/dashboard")
      if (!response.ok) throw new Error("Failed to fetch voter data")
      const data = await response.json()
      
      setVoter(data.voter)
      setElectionData(data.electionData)
    } catch (error) {
      setError("Failed to load dashboard data")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleVoteClick = () => {
    if (!selectedCandidate) {
      setError("Please select a candidate to vote for")
      return
    }
    setShowConfirmation(true)
  }

const handleConfirmVote = async () => {
  if (!selectedCandidate || !voter) return

  setShowConfirmation(false)
  setIsVoting(true)
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
    const candidate = electionData?.candidates.find(c => c.id === selectedCandidate)
    if (!candidate) {
      throw new Error("Selected candidate not found")
    }

    // Step 3: Send transaction to blockchain - THIS WILL TRIGGER METAMASK CONFIRMATION
    console.log('Sending blockchain transaction...')
    const txHash = await sendVoteTransaction(
      voter.voterId,
      selectedCandidate,
      voter.election.id
    )

    console.log('Transaction completed with hash:', txHash)
    setTransactionHash(txHash)

    // Step 4: Only after MetaMask confirmation, send vote to backend API
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
    setSuccess("Vote cast successfully! Your vote has been recorded on the blockchain.")
    
    // Refresh voter data to update voting status
    setTimeout(() => {
      fetchVoterData()
    }, 2000)

  } catch (err: any) {
    setError(err.message || "An error occurred while casting your vote. Please try again.")
    console.error("Voting error:", err)
  } finally {
    setIsVoting(false)
    setIsConfirming(false)
  }
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

  const getElectionStatus = () => {
    if (!electionData) return "Unknown"
    
    const now = new Date()
    const startTime = new Date(electionData.startTime)
    const endTime = new Date(electionData.endTime)

    if (now < startTime) return "Upcoming"
    if (now >= startTime && now <= endTime) return "Active"
    if (now > endTime) return "Completed"
    return electionData.status
  }

  const getTimeRemaining = () => {
    if (!electionData) return ""
    
    const now = new Date()
    const endTime = new Date(electionData.endTime)
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
    if (!voter || !electionData) return false
    if (voter.hasVoted) return false
    
    const now = new Date()
    const startTime = new Date(electionData.startTime)
    const endTime = new Date(electionData.endTime)
    
    return now >= startTime && now <= endTime
  }

  const getSelectedCandidate = () => {
    return electionData?.candidates.find(c => c.id === selectedCandidate)
  }

  const getEtherscanUrl = () => {
    if (!transactionHash) return "#"
    // For demo purposes, we'll use a placeholder URL
    // In production, you would use your actual blockchain explorer URL
    return `https://etherscan.io/tx/${transactionHash}`
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p>Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (!voter) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-4">Please log in to access your dashboard.</p>
          <Button onClick={() => router.push("/voter/login")}>
            Go to Login
          </Button>
        </div>
      </div>
    )
  }

  return (
      <div className="flex">
          <Sidebar items={voterMenuItems} userRole="voter" userName="Voter Account" onLogout={handleLogout} />
          <div className="flex-1 md:ml-0">
             <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="w-8 h-8 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">Voter Dashboard</h1>
            </div>
            <Button onClick={handleLogout} variant="outline" size="sm">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {error && (
          <Alert className="bg-destructive/10 border-destructive/20 mb-6">
            <AlertDescription className="text-destructive">{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="bg-green-500/10 border-green-500/20 mb-6">
            <AlertDescription className="text-green-700">
              <div className="flex flex-col gap-2">
                <span>{success}</span>
                {transactionHash && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Transaction ID:</span>
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {transactionHash.slice(0, 16)}...
                    </code>
                    <a 
                      href={getEtherscanUrl()} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
                    >
                      <ExternalLink className="w-3 h-3" />
                      View
                    </a>
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Voter Info and Election Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Voter Information */}
            <Card>
              <CardHeader>
                <CardTitle>Voter Information</CardTitle>
                <CardDescription>Your voter profile details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Email</p>
                    <p className="text-foreground">{voter.email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Voter ID</p>
                    <p className="text-foreground font-mono">{voter.voterId}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Wallet Address</p>
                    <p className="text-foreground font-mono text-sm">
                      {voter.walletAddress.slice(0, 8)}...{voter.walletAddress.slice(-6)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Voting Status</p>
                    <Badge 
                      className={voter.hasVoted ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}
                    >
                      {voter.hasVoted ? "Vote Cast" : "Not Voted"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Election Information */}
            {electionData && (
              <Card>
                <CardHeader>
                  <CardTitle>Election Information</CardTitle>
                  <CardDescription>Details about your assigned election</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-2">{electionData.name}</h3>
                    <p className="text-muted-foreground">{electionData.description}</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Start</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(electionData.startTime).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">End</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(electionData.endTime).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Status</p>
                        <Badge className={
                          getElectionStatus() === "Active" ? "bg-green-100 text-green-800" :
                          getElectionStatus() === "Upcoming" ? "bg-blue-100 text-blue-800" :
                          "bg-gray-100 text-gray-800"
                        }>
                          {getElectionStatus()}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {getElectionStatus() === "Active" && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-600" />
                        <p className="text-blue-800 font-medium">
                          {getTimeRemaining()}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Voting Section */}
            {electionData && electionData.candidates.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Cast Your Vote</CardTitle>
                  <CardDescription>
                    {voter.hasVoted 
                      ? "You have already cast your vote in this election."
                      : canVote()
                        ? "Select your preferred candidate and cast your vote."
                        : "Voting is not currently available."
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {voter.hasVoted ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Vote className="w-8 h-8 text-green-600" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">Vote Cast Successfully</h3>
                      <p className="text-muted-foreground">
                        Thank you for participating in the election. Your vote has been recorded securely.
                      </p>
                      {transactionHash && (
                        <div className="mt-4 p-3 bg-muted rounded-lg">
                          <p className="text-sm font-medium">Transaction ID:</p>
                          <code className="text-xs break-all">{transactionHash}</code>
                        </div>
                      )}
                    </div>
                  ) : canVote() ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {electionData.candidates.map((candidate) => (
                          <div
                            key={candidate.id}
                            className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                              selectedCandidate === candidate.id
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/50"
                            }`}
                            onClick={() => setSelectedCandidate(candidate.id)}
                          >
                            <div className="flex items-start gap-3">
                              <div className="p-2 bg-primary/10 rounded-lg">
                                <User className="w-5 h-5 text-primary" />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold">{candidate.name}</h4>
                                <p className="text-sm text-muted-foreground mb-2">
                                  {candidate.position}
                                </p>
                                <div className="flex items-center gap-2">
                                  <Shield className="w-4 h-4 text-muted-foreground" />
                                  <span className="text-sm font-medium">
                                    {candidate.party.name}
                                  </span>
                                  {candidate.party.symbol && (
                                    <Badge variant="secondary" className="text-xs">
                                      {candidate.party.symbol}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              {selectedCandidate === candidate.id && (
                                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                                  <div className="w-3 h-3 rounded-full bg-white"></div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      <Button
                        onClick={handleVoteClick}
                        disabled={!selectedCandidate || isVoting}
                        className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                        size="lg"
                      >
                        {isVoting ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            {isConfirming ? "Confirming..." : "Processing Vote..."}
                          </>
                        ) : (
                          <>
                            <Vote className="w-4 h-4 mr-2" />
                            Cast Vote
                          </>
                        )}
                      </Button>

                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-800 mb-2">Secure Voting Process</h4>
                        <p className="text-blue-700 text-sm">
                          When you click "Cast Vote", you'll be asked to:
                        </p>
                        <ol className="text-blue-700 text-sm list-decimal list-inside mt-2 space-y-1">
                          <li>Confirm your vote details in a secure popup</li>
                          <li>Connect your MetaMask wallet for verification</li>
                          <li>Your vote will be recorded securely</li>
                        </ol>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Clock className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">Voting Not Available</h3>
                      <p className="text-muted-foreground">
                        {getElectionStatus() === "Upcoming" 
                          ? "Voting will begin when the election starts."
                          : getElectionStatus() === "Completed"
                          ? "This election has ended."
                          : "Voting is not currently available for this election."
                        }
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Quick Stats and Help */}
          <div className="space-y-6">
            {/* Voting Status Card */}
            <Card>
              <CardHeader>
                <CardTitle>Voting Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Your Status</span>
                  <Badge className={
                    voter.hasVoted 
                      ? "bg-green-100 text-green-800" 
                      : "bg-yellow-100 text-yellow-800"
                  }>
                    {voter.hasVoted ? "Voted" : "Not Voted"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Election Status</span>
                  <Badge className={
                    getElectionStatus() === "Active" ? "bg-green-100 text-green-800" :
                    getElectionStatus() === "Upcoming" ? "bg-blue-100 text-blue-800" :
                    "bg-gray-100 text-gray-800"
                  }>
                    {getElectionStatus()}
                  </Badge>
                </div>
                {getTimeRemaining() && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Time Remaining</span>
                    <span className="text-sm text-muted-foreground">
                      {getTimeRemaining()}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Help Card */}
            <Card>
              <CardHeader>
                <CardTitle>Need Help?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  <p>If you encounter any issues while voting, please contact support:</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm">
                    <strong>Email:</strong> support@voting.com
                  </p>
                  <p className="text-sm">
                    <strong>Phone:</strong> 1-800-VOTE-NOW
                  </p>
                </div>
                <Button variant="outline" className="w-full" size="sm">
                  Contact Support
                </Button>
              </CardContent>
            </Card>

            {/* Security Info */}
            <Card>
              <CardHeader>
                <CardTitle>Security</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">End-to-end encrypted</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Wallet verification</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Secure voting</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Vote Confirmation Dialog */}
      <VoteConfirmationDialog
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        onConfirm={handleConfirmVote}
        voter={voter}
        candidate={getSelectedCandidate()}
        election={voter?.election}
        isLoading={isConfirming}
      />
    </div>
          </div>
        </div>
   
  )
}
async function sendVoteTransaction(voterId: string, candidateId: string, electionId: string): Promise<string> {
  try {
    // Get the user's wallet from MetaMask
    const accounts = await (window as any).ethereum.request({ method: 'eth_accounts' })
    if (!accounts || accounts.length === 0) {
      throw new Error('No wallet connected')
    }

    const userAddress = accounts[0]

    // Create a simple vote data hash (in production, you'd call a smart contract)
    const voteData = {
      voterId,
      candidateId,
      electionId,
      timestamp: Date.now(),
      voterAddress: userAddress
    }

    // Sign the vote data with the user's wallet
    const messageToSign = JSON.stringify(voteData)
    const signature = await (window as any).ethereum.request({
      method: 'personal_sign',
      params: [messageToSign, userAddress]
    })

    // In production, you would call your smart contract here
    // For now, we'll simulate a transaction by returning a mock transaction hash
    const transactionHash = `0x${Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`

    console.log('Vote transaction signed:', { signature, transactionHash })

    return transactionHash
  } catch (error) {
    throw new Error(`Failed to send vote transaction: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}
