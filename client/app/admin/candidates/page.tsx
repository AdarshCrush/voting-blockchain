"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { User, Search, Plus, Shield, ImageOff } from "lucide-react"

interface Candidate {
  id: string
  name: string
  position: string
  imageUrl: string
  party: {
    id: string
    name: string
    symbol: string
    election: {
      name: string
    }
  }
}

export default function ManageCandidatesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()

  useEffect(() => {
    fetchCandidates()
  }, [])

  const fetchCandidates = async () => {
    try {
      const response = await fetch("/api/admin/candidates")
      if (!response.ok) throw new Error("Failed to fetch candidates")
      const data = await response.json()
      setCandidates(data.candidates)
    } catch (error) {
      setError("Failed to load candidates")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const filteredCandidates = candidates.filter(candidate =>
    candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    candidate.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
    candidate.party.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) return <div className="p-6">Loading candidates...</div>

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <User className="w-6 h-6 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">Candidates</h1>
            </div>
            <p className="text-muted-foreground">Manage all election candidates</p>
          </div>
          <Button 
            onClick={() => router.push("/admin/candidates/create")}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Candidate
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle>All Candidates</CardTitle>
              <CardDescription>
                Total {candidates.length} candidates registered
              </CardDescription>
            </div>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search candidates..."
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
            {filteredCandidates.map((candidate) => (
              <Card key={candidate.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  {/* Candidate Image */}
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-primary/20 bg-muted">
                      {candidate.imageUrl ? (
                        <img 
                          src={candidate.imageUrl} 
                          alt={`${candidate.name} portrait`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const parent = e.currentTarget.parentElement;
                            if (parent) {
                              const fallback = document.createElement('div');
                              fallback.className = 'w-full h-full flex items-center justify-center bg-muted';
                              fallback.innerHTML = `
                                <div class="text-center">
                                  <ImageOff class="w-6 h-6 mx-auto text-muted-foreground" />
                                </div>
                              `;
                              parent.appendChild(fallback);
                            }
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Candidate Details */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-lg">{candidate.name}</h3>
                      <Badge variant="secondary">{candidate.position}</Badge>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Shield className="w-4 h-4" />
                      <span className="font-medium">{candidate.party.name}</span>
                      {candidate.party.symbol && (
                        <span className="text-xs px-1.5 py-0.5 bg-muted rounded">
                          {candidate.party.symbol}
                        </span>
                      )}
                    </div>
                    
                    <p className="text-xs text-muted-foreground">
                      Election: {candidate.party.election.name}
                    </p>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => router.push(`/admin/candidates/${candidate.id}`)}
                    >
                      View
                    </Button>
                    <Button 
                      variant="default" 
                      size="sm"
                      onClick={() => router.push(`/admin/candidates/edit/${candidate.id}`)}
                    >
                      Edit
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {filteredCandidates.length === 0 && (
            <div className="text-center py-12">
              <User className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">
                {searchTerm ? "No candidates found" : "No candidates registered yet"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? "Try adjusting your search terms" : "Get started by adding your first candidate"}
              </p>
              {!searchTerm && (
                <Button 
                  onClick={() => router.push("/admin/candidates/create")}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Candidate
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}