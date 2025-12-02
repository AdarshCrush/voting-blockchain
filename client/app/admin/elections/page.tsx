"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Landmark, Plus, Calendar, Users, Vote } from "lucide-react"

interface Election {
  id: string
  name: string
  year: number
  description: string
  status: string
  startTime: string
  endTime: string
  createdAt: string
  _count: {
    voters: number
    parties: number
    votes: number
  }
}

export default function ElectionsPage() {
  const [elections, setElections] = useState<Election[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const router = useRouter()

  useEffect(() => {
    fetchElections()
  }, [])

  const fetchElections = async () => {
    try {
      const response = await fetch("/api/admin/elections")
      if (!response.ok) throw new Error("Failed to fetch elections")
      const data = await response.json()
      setElections(data.elections)
    } catch (error) {
      setError("Failed to load elections")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800'
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'COMPLETED': return 'bg-blue-100 text-blue-800'
      case 'CANCELLED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getElectionStatus = (election: Election) => {
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

  if (loading) return <div className="p-6">Loading elections...</div>

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Landmark className="w-6 h-6 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">Elections</h1>
            </div>
            <p className="text-muted-foreground">Manage all your elections</p>
          </div>
          <Button 
            onClick={() => router.push("/admin/create-election")}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Election
          </Button>
        </div>
      </div>

      {error && (
        <Alert className="bg-destructive/10 border-destructive/20 mb-6">
          <AlertDescription className="text-destructive">{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {elections.map((election) => (
          <Card key={election.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{election.name}</CardTitle>
                  <CardDescription className="flex items-center gap-1 mt-1">
                    <Calendar className="w-4 h-4" />
                    {election.year}
                  </CardDescription>
                </div>
                <Badge className={getStatusColor(getElectionStatus(election))}>
                  {getElectionStatus(election)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground line-clamp-2">
                {election.description || "No description provided"}
              </p>
              
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <Users className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                  <div className="text-sm font-medium">{election._count.voters}</div>
                  <div className="text-xs text-muted-foreground">Voters</div>
                </div>
                <div>
                  <Landmark className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                  <div className="text-sm font-medium">{election._count.parties}</div>
                  <div className="text-xs text-muted-foreground">Parties</div>
                </div>
                <div>
                  <Vote className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                  <div className="text-sm font-medium">{election._count.votes}</div>
                  <div className="text-xs text-muted-foreground">Votes</div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => router.push(`/admin/elections/${election.id}`)}
                >
                  View Details
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => router.push(`/admin/elections/${election.id}/results`)}
                >
                  Results
                </Button>
              </div>

              <div className="text-xs text-muted-foreground">
                Created: {new Date(election.createdAt).toLocaleDateString()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {elections.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Landmark className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-2">No elections created yet</h3>
            <p className="text-muted-foreground mb-4">
              Get started by creating your first election
            </p>
            <Button 
              onClick={() => router.push("/admin/create-election")}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Election
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}