"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Users, Search, Plus } from "lucide-react"

interface Voter {
  id: string
  email: string
  voterId: string
  walletAddress: string
  hasVoted: boolean
  createdAt: string
  election: {
    name: string
  }
}

export default function ManageVotersPage() {
  const [voters, setVoters] = useState<Voter[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    fetchVoters()
  }, [])

  const fetchVoters = async () => {
    try {
      const response = await fetch("/api/admin/voters")
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch voters")
      }
      
      setVoters(data.voters)
    } catch (error) {
      setError("Failed to load voters")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const filteredVoters = voters.filter(voter =>
    voter.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    voter.voterId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    voter.walletAddress.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) return <div className="p-6">Loading voters...</div>

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Users className="w-6 h-6 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Manage Voters</h1>
        </div>
        <p className="text-muted-foreground">View and manage registered voters</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle>Registered Voters</CardTitle>
              <CardDescription>
                Total {voters.length} voters registered
              </CardDescription>
            </div>
            <div className="flex gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search voters..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Add Voter
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert className="bg-destructive/10 border-destructive/20 mb-4">
              <AlertDescription className="text-destructive">{error}</AlertDescription>
            </Alert>
          )}

          <div className="rounded-md border">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-4 font-medium">Voter ID</th>
                  <th className="text-left p-4 font-medium">Email</th>
                  <th className="text-left p-4 font-medium">Wallet Address</th>
                  <th className="text-left p-4 font-medium">Election</th>
                  <th className="text-left p-4 font-medium">Status</th>
                  <th className="text-left p-4 font-medium">Registered</th>
                </tr>
              </thead>
              <tbody>
                {filteredVoters.map((voter) => (
                  <tr key={voter.id} className="border-b">
                    <td className="p-4 font-mono text-sm">{voter.voterId}</td>
                    <td className="p-4">{voter.email}</td>
                    <td className="p-4 font-mono text-sm">
                      {voter.walletAddress.slice(0, 8)}...{voter.walletAddress.slice(-6)}
                    </td>
                    <td className="p-4">{voter.election.name}</td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          voter.hasVoted
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {voter.hasVoted ? "Voted" : "Not Voted"}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {new Date(voter.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredVoters.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                {searchTerm ? "No voters found matching your search" : "No voters registered yet"}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}