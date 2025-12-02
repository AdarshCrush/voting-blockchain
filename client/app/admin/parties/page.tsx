"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Users, Search, Plus, User, Shield } from "lucide-react"

interface Party {
  id: string
  name: string
  symbol: string
  election: {
    name: string
  }
  _count: {
    candidates: number
  }
  candidates: Candidate[]
}

interface Candidate {
  id: string
  name: string
  position: string
}

export default function ManagePartiesPage() {
  const [parties, setParties] = useState<Party[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()

  useEffect(() => {
    fetchParties()
  }, [])

  const fetchParties = async () => {
    try {
      const response = await fetch("/api/admin/parties")
      if (!response.ok) throw new Error("Failed to fetch parties")
      const data = await response.json()
      setParties(data.parties)
    } catch (error) {
      setError("Failed to load parties")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const filteredParties = parties.filter(party =>
    party.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    party.election.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) return <div className="p-6">Loading parties...</div>

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-6 h-6 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">Political Parties</h1>
            </div>
            <p className="text-muted-foreground">Manage parties and their candidates</p>
          </div>
          <Button 
            onClick={() => router.push("/admin/parties/create")}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Party
          </Button>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle>All Parties</CardTitle>
              <CardDescription>
                Total {parties.length} parties registered
              </CardDescription>
            </div>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search parties..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert className="bg-destructive/10 border-destructive/20 mb-4">
              <AlertDescription className="text-destructive">{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            {filteredParties.map((party) => (
              <Card key={party.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <Shield className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{party.name}</h3>
                        {party.symbol && (
                          <span className="px-2 py-1 bg-muted rounded text-sm">
                            {party.symbol}
                          </span>
                        )}
                      </div>
                      <p className="text-muted-foreground mb-3">
                        Election: {party.election.name}
                      </p>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{party._count.candidates} Candidates</span>
                        </div>
                        
                        {party.candidates.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {party.candidates.map((candidate) => (
                              <span
                                key={candidate.id}
                                className="px-2 py-1 bg-secondary text-secondary-foreground rounded text-xs"
                              >
                                {candidate.name} ({candidate.position})
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => router.push(`/admin/parties/${party.id}/candidates`)}
                    >
                      Manage Candidates
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {filteredParties.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">
                {searchTerm ? "No parties found" : "No parties registered yet"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? "Try adjusting your search terms" : "Get started by adding your first party"}
              </p>
              {!searchTerm && (
                <Button 
                  onClick={() => router.push("/admin/parties/create")}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Party
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}