"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { User, ArrowLeft, Vote, Shield, CheckCircle2, Clock, Calendar } from "lucide-react"

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
  hasVoted: boolean
  electionId: string
}

export default function VotePage() {
  const [election, setElection] = useState<Election | null>(null)
  const [voter, setVoter] = useState<Voter | null>(null)
  const [selectedCandidate, setSelectedCandidate] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const router = useRouter()

  useEffect(() => {
    fetchVotingData()
  }, [])

  const fetchVotingData = async () => {
    try {
      setIsLoading(true)
      setError("")
      
      const response = await fetch("/api/voter/voting-data")
      if (!response.ok) {
        throw new Error("Failed to load voting data")
      }
      
      const data = await response.json()
      setElection(data.election)
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

  const handleVote = async (candidateId: string) => {
    if (!election) {
      setError("Election information not available")
      return
    }

    setIsSubmitting(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch("/api/voter/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateId: candidateId,
          electionId: election.id
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || "Failed to cast vote")
        return
      }

      setSuccess("✅ Your vote has been cast successfully!")
      setVoter(prev => prev ? { ...prev, hasVoted: true } : null)
      
      // Disable all vote buttons
      setSelectedCandidate(candidateId)
      
      // Redirect to dashboard after 3 seconds
      setTimeout(() => {
        router.push("/voter/dashboard")
      }, 3000)
    } catch (err) {
      setError("An error occurred while casting your vote. Please try again.")
    } finally {
      setIsSubmitting(false)
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

    if (days > 0) return `${days} days, ${hours} hours remaining`
    if (hours > 0) return `${hours} hours, ${minutes} minutes remaining`
    return `${minutes} minutes remaining`
  }

  const canVote = () => {
    if (!voter || !election) return false
    if (voter.hasVoted) return false
    
    const now = new Date()
    const startTime = new Date(election.startTime)
    const endTime = new Date(election.endTime)
    
    return now >= startTime && now <= endTime
  }

  // Group candidates by party
  const candidatesByParty = election?.candidates.reduce((acc, candidate) => {
    const partyName = candidate.party.name
    if (!acc[partyName]) {
      acc[partyName] = []
    }
    acc[partyName].push(candidate)
    return acc
  }, {} as Record<string, Candidate[]>) || {}

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg font-medium">Loading voting machine...</p>
          <p className="text-sm text-muted-foreground mt-2">Preparing your voting interface</p>
        </div>
      </div>
    )
  }

  if (error && !election) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Vote className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Unable to Load Voting</h1>
          <p className="text-muted-foreground mb-4">{error}</p>
          <div className="space-y-2">
            <Button onClick={fetchVotingData} className="w-full">
              Try Again
            </Button>
            <Button onClick={() => router.push("/voter/dashboard")} variant="outline" className="w-full">
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/voter/dashboard")}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </Button>
              <div className="w-px h-6 bg-border"></div>
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <Vote className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Voting Machine</h1>
                <p className="text-sm text-muted-foreground">Secure Electronic Voting System</p>
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

      <div className="container mx-auto px-6 py-8">
        {error && (
          <Alert className="bg-destructive/10 border-destructive/20 mb-6">
            <AlertDescription className="text-destructive">{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="bg-green-500/10 border-green-500/20 mb-6">
            <AlertDescription className="text-green-700">{success}</AlertDescription>
          </Alert>
        )}

        {election && (
          <div className="max-w-6xl mx-auto">
            {/* Election Header */}
            <Card className="mb-8 shadow-lg">
              <CardHeader className="text-center bg-gradient-to-r from-primary to-primary/90 text-primary-foreground rounded-t-lg">
                <CardTitle className="text-3xl">{election.name}</CardTitle>
                <CardDescription className="text-primary-foreground/90 text-lg">
                  {election.year} • {election.description}
                </CardDescription>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <div className="flex items-center justify-center gap-2">
                    <Calendar className="w-5 h-5" />
                    <div>
                      <p className="text-sm font-medium">Starts</p>
                      <p className="text-sm">
                        {new Date(election.startTime).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-center gap-2">
                    <Clock className="w-5 h-5" />
                    <div>
                      <p className="text-sm font-medium">Ends</p>
                      <p className="text-sm">
                        {new Date(election.endTime).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-center gap-2">
                    <Vote className="w-5 h-5" />
                    <div>
                      <p className="text-sm font-medium">Status</p>
                      <p className="text-sm font-medium capitalize">
                        {getElectionStatus()}
                      </p>
                    </div>
                  </div>
                </div>

                {getElectionStatus() === "Active" && (
                  <div className="mt-4 p-4 bg-white/20 rounded-lg">
                    <div className="flex items-center justify-center gap-2">
                      <Clock className="w-5 h-5" />
                      <p className="font-medium text-lg">
                        {getTimeRemaining()}
                      </p>
                    </div>
                  </div>
                )}
              </CardHeader>
            </Card>

            {/* Voting Section */}
            {voter?.hasVoted ? (
              <Card className="text-center shadow-lg">
                <CardContent className="py-16">
                  <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-12 h-12 text-green-600" />
                  </div>
                  <h2 className="text-3xl font-bold mb-4 text-green-600">Vote Successfully Cast!</h2>
                  <p className="text-muted-foreground mb-6 text-lg">
                    Thank you for participating in the democratic process. Your vote has been securely recorded.
                  </p>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 max-w-md mx-auto mb-6">
                    <p className="text-sm text-green-800">
                      <strong>Vote Confirmed:</strong> You have used your voting right for this election.
                    </p>
                  </div>
                  <Button 
                    onClick={() => router.push("/voter/dashboard")}
                    className="bg-green-600 hover:bg-green-700 px-8 py-3 text-lg"
                  >
                    Return to Dashboard
                  </Button>
                </CardContent>
              </Card>
            ) : !canVote() ? (
              <Card className="text-center shadow-lg">
                <CardContent className="py-16">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Clock className="w-12 h-12 text-gray-400" />
                  </div>
                  <h2 className="text-3xl font-bold mb-4">Voting Not Available</h2>
                  <p className="text-muted-foreground mb-6 text-lg">
                    {getElectionStatus() === "Upcoming" 
                      ? "Voting will begin when the election starts. Please check back later."
                      : getElectionStatus() === "Completed"
                      ? "This election has ended. Voting is no longer available."
                      : "Voting is not currently available for this election."
                    }
                  </p>
                  <Button onClick={() => router.push("/voter/dashboard")}>
                    Return to Dashboard
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="shadow-lg">
                <CardHeader className="border-b">
                  <CardTitle className="text-2xl flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                      <Vote className="w-4 h-4 text-white" />
                    </div>
                    Select Your Candidate
                  </CardTitle>
                  <CardDescription className="text-lg">
                    Click the "VOTE" button next to your preferred candidate. This action is final and cannot be changed.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {/* Voting Machine Interface */}
                  <div className="overflow-hidden">
                    {/* Table Header */}
                    <div className="grid grid-cols-12 gap-4 p-6 bg-muted/50 border-b font-semibold">
                      <div className="col-span-1"></div>
                      <div className="col-span-4">Candidate & Party</div>
                      <div className="col-span-3">Position</div>
                      <div className="col-span-2">Party Symbol</div>
                      <div className="col-span-2 text-center">Action</div>
                    </div>

                    {/* Candidates List - Grouped by Party */}
                    {Object.entries(candidatesByParty).map(([partyName, partyCandidates]) => (
                      <div key={partyName} className="border-b last:border-b-0">
                        {/* Party Header */}
                        <div className="bg-blue-50 px-6 py-3 border-b">
                          <div className="flex items-center gap-3">
                            <Shield className="w-5 h-5 text-blue-600" />
                            <h3 className="font-bold text-lg text-blue-900">{partyName}</h3>
                            <Badge variant="outline" className="ml-2">
                              {partyCandidates.length} candidate{partyCandidates.length > 1 ? 's' : ''}
                            </Badge>
                          </div>
                        </div>

                        {/* Candidates in this party */}
                        {partyCandidates.map((candidate, index) => (
                          <div
                            key={candidate.id}
                            className={`grid grid-cols-12 gap-4 p-6 items-center transition-all ${
                              selectedCandidate === candidate.id
                                ? "bg-primary/5 border-l-4 border-l-primary"
                                : "hover:bg-muted/30"
                            } ${index < partyCandidates.length - 1 ? 'border-b' : ''}`}
                          >
                            {/* Candidate Number */}
                            <div className="col-span-1 flex justify-center">
                              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center font-semibold">
                                {index + 1}
                              </div>
                            </div>

                            {/* Candidate Name & Party */}
                            <div className="col-span-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                  <User className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                  <h4 className="font-bold text-lg">{candidate.name}</h4>
                                  <p className="text-sm text-muted-foreground">{partyName}</p>
                                </div>
                              </div>
                            </div>

                            {/* Position */}
                            <div className="col-span-3">
                              <Badge variant="secondary" className="text-base py-1 px-3">
                                {candidate.position}
                              </Badge>
                            </div>

                            {/* Party Symbol */}
                            <div className="col-span-2">
                              {candidate.party.symbol && (
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-secondary text-secondary-foreground rounded-full font-medium">
                                  {candidate.party.symbol}
                                </div>
                              )}
                            </div>

                            {/* Vote Button */}
                            <div className="col-span-2 flex justify-center">
                              <Button
                                onClick={() => handleVote(candidate.id)}
                                disabled={isSubmitting || selectedCandidate !== ""}
                                className={`px-6 py-2 text-base font-semibold ${
                                  selectedCandidate === candidate.id
                                    ? "bg-green-600 hover:bg-green-700"
                                    : "bg-primary hover:bg-primary/90"
                                }`}
                              >
                                {isSubmitting && selectedCandidate === candidate.id ? (
                                  <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Voting...
                                  </>
                                ) : selectedCandidate === candidate.id ? (
                                  <>
                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                    Voted
                                  </>
                                ) : (
                                  <>
                                    <Vote className="w-4 h-4 mr-2" />
                                    VOTE
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>

                  {/* Voting Instructions */}
                  <div className="p-6 bg-yellow-50 border-t">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-white text-sm font-bold">!</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-yellow-800 mb-1">Important Voting Instructions</h4>
                        <ul className="text-sm text-yellow-700 space-y-1">
                          <li>• Click the "VOTE" button only for your preferred candidate</li>
                          <li>• Once cast, your vote cannot be changed or withdrawn</li>
                          <li>• Your vote is anonymous and securely encrypted</li>
                          <li>• You can only vote once in this election</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Security Footer */}
            <Card className="mt-8 bg-green-50 border-green-200 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Shield className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-green-800 text-lg mb-1">Your Vote is Secure</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-green-700">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>End-to-end encryption</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>Blockchain verified</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>Anonymous voting</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>One vote per voter</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}