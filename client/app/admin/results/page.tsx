"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, Download, Users, Vote, Award, Calendar, RefreshCw } from "lucide-react"

interface ElectionResult {
  id: string
  name: string
  year: number
  totalVotes: number
  totalVoters: number
  participationRate: number
  status: string
  startTime: string
  endTime: string
  candidates: CandidateResult[]
  parties: PartyResult[]
}

interface CandidateResult {
  id: string
  name: string
  position: string
  partyName: string
  partySymbol: string
  votes: number
  percentage: number
}

interface PartyResult {
  id: string
  name: string
  symbol: string
  totalVotes: number
  percentage: number
  candidates: CandidateResult[]
}

export default function ResultsPage() {
  const [results, setResults] = useState<ElectionResult[]>([])
  const [selectedElection, setSelectedElection] = useState<ElectionResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchResults()
  }, [])

  const fetchResults = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/results")
      if (!response.ok) throw new Error("Failed to fetch results")
      const data = await response.json()
      setResults(data.results)
      if (data.results.length > 0) {
        setSelectedElection(data.results[0])
      }
    } catch (error) {
      setError("Failed to load election results")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const refreshResults = async () => {
    setRefreshing(true)
    await fetchResults()
    setRefreshing(false)
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FF6B6B', '#4ECDC4']

  const exportToCSV = () => {
    if (!selectedElection) return

    const headers = ['Candidate', 'Party', 'Position', 'Votes', 'Percentage']
    const csvData = selectedElection.candidates.map(candidate => [
      candidate.name,
      candidate.partyName,
      candidate.position,
      candidate.votes.toString(),
      `${candidate.percentage}%`
    ])

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${selectedElection.name.replace(/\s+/g, '_')}_results.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const getElectionStatus = (election: ElectionResult) => {
    const now = new Date()
    const startTime = new Date(election.startTime)
    const endTime = new Date(election.endTime)

    if (election.status === 'CANCELLED') return 'Cancelled'
    if (election.status === 'COMPLETED') return 'Completed'
    if (now < startTime) return 'Upcoming'
    if (now >= startTime && now <= endTime) return 'Active'
    if (now > endTime) return 'Completed'
    return election.status
  }

  if (loading) return <div className="p-6">Loading election results...</div>

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-6 h-6 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">Election Results</h1>
            </div>
            <p className="text-muted-foreground">View and analyze election outcomes and vote counts</p>
          </div>
          <Button onClick={refreshResults} disabled={refreshing} variant="outline">
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <Alert className="bg-destructive/10 border-destructive/20 mb-6">
          <AlertDescription className="text-destructive">{error}</AlertDescription>
        </Alert>
      )}

      {results.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <TrendingUp className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-2">No election results available</h3>
            <p className="text-muted-foreground">
              Results will appear here once elections are completed and votes are cast
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Election Selector */}
          <Card>
            <CardHeader>
              <CardTitle>Select Election</CardTitle>
              <CardDescription>Choose an election to view detailed results</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {results.map((election) => (
                  <Button
                    key={election.id}
                    variant={selectedElection?.id === election.id ? "default" : "outline"}
                    onClick={() => setSelectedElection(election)}
                    className="flex items-center gap-2"
                  >
                    {election.name} ({election.year})
                    <Badge variant="secondary" className="ml-1">
                      {election.totalVotes} votes
                    </Badge>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {selectedElection && (
            <>
              {/* Election Overview */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Total Votes</CardTitle>
                    <Vote className="w-5 h-5 text-primary mt-2" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{selectedElection.totalVotes}</div>
                    <p className="text-xs text-muted-foreground mt-1">votes cast</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Total Voters</CardTitle>
                    <Users className="w-5 h-5 text-primary mt-2" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{selectedElection.totalVoters}</div>
                    <p className="text-xs text-muted-foreground mt-1">registered voters</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Participation</CardTitle>
                    <TrendingUp className="w-5 h-5 text-primary mt-2" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{selectedElection.participationRate}%</div>
                    <p className="text-xs text-muted-foreground mt-1">voter turnout</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Leading Candidate</CardTitle>
                    <Award className="w-5 h-5 text-primary mt-2" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-bold truncate" title={selectedElection.candidates[0]?.name}>
                      {selectedElection.candidates[0]?.name}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {selectedElection.candidates[0]?.partyName}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Election Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Election Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Status</p>
                      <Badge className={
                        getElectionStatus(selectedElection) === "Active" 
                          ? "bg-green-100 text-green-800" 
                          : getElectionStatus(selectedElection) === "Completed"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-800"
                      }>
                        {getElectionStatus(selectedElection)}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Start Time</p>
                      <p>{new Date(selectedElection.startTime).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">End Time</p>
                      <p>{new Date(selectedElection.endTime).toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Vote Distribution by Candidate</CardTitle>
                    <CardDescription>Percentage of votes received by each candidate</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={selectedElection.candidates}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percentage }) => `${name} (${percentage}%)`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="votes"
                        >
                          {selectedElection.candidates.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value, name) => [`${value} votes`, name]} />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Vote Count by Candidate</CardTitle>
                    <CardDescription>Number of votes received by each candidate</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={selectedElection.candidates}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="name" 
                          angle={-45} 
                          textAnchor="end" 
                          height={80}
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="votes" name="Votes" fill="#0088FE" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Party-wise Results */}
              <Card>
                <CardHeader>
                  <CardTitle>Party-wise Results</CardTitle>
                  <CardDescription>Vote distribution across political parties</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {selectedElection.parties.map((party, index) => (
                      <Card key={party.id} className="border-l-4" style={{ borderLeftColor: COLORS[index % COLORS.length] }}>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg flex items-center gap-2">
                            {party.name}
                            {party.symbol && (
                              <Badge variant="secondary">{party.symbol}</Badge>
                            )}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium">Total Votes:</span>
                              <span className="font-bold">{party.totalVotes}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium">Percentage:</span>
                              <span className="font-bold text-primary">{party.percentage}%</span>
                            </div>
                            <div className="mt-3">
                              <p className="text-sm font-medium mb-2">Candidates:</p>
                              <div className="space-y-1">
                                {party.candidates.map(candidate => (
                                  <div key={candidate.id} className="flex justify-between text-sm">
                                    <span>{candidate.name}</span>
                                    <span className="font-medium">{candidate.votes} votes</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Detailed Results Table */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Detailed Results</CardTitle>
                      <CardDescription>Complete breakdown of election results</CardDescription>
                    </div>
                    <Button onClick={exportToCSV} variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      Export CSV
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="text-left p-4 font-medium">Candidate</th>
                          <th className="text-left p-4 font-medium">Party</th>
                          <th className="text-left p-4 font-medium">Position</th>
                          <th className="text-left p-4 font-medium">Votes</th>
                          <th className="text-left p-4 font-medium">Percentage</th>
                          <th className="text-left p-4 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedElection.candidates.map((candidate, index) => (
                          <tr key={candidate.id} className="border-b hover:bg-muted/50">
                            <td className="p-4 font-medium">{candidate.name}</td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                {candidate.partyName}
                                {candidate.partySymbol && (
                                  <Badge variant="outline" className="text-xs">
                                    {candidate.partySymbol}
                                  </Badge>
                                )}
                              </div>
                            </td>
                            <td className="p-4">{candidate.position}</td>
                            <td className="p-4 font-mono">{candidate.votes}</td>
                            <td className="p-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                index === 0 ? 'bg-green-100 text-green-800' : 
                                index === 1 ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {candidate.percentage}%
                              </span>
                            </td>
                            <td className="p-4">
                              {index === 0 ? (
                                <Badge className="bg-green-100 text-green-800">Leading</Badge>
                              ) : index === 1 && selectedElection.candidates[0].votes === candidate.votes ? (
                                <Badge className="bg-orange-100 text-orange-800">Tie</Badge>
                              ) : (
                                <Badge variant="outline">Running</Badge>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}
    </div>
  )
}