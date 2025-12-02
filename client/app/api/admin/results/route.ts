import { type NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
  try {
    const adminSession = req.cookies.get('adminSession')?.value
    
    if (!adminSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const adminData = JSON.parse(adminSession)
    
    // Get all elections for this admin with votes data
    const elections = await prisma.election.findMany({
      where: {
        adminId: adminData.id
      },
      include: {
        voters: true,
        parties: {
          include: {
            candidates: {
              include: {
                votes: true
              }
            }
          }
        },
        votes: {
          include: {
            candidate: {
              include: {
                party: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    const results = elections.map(election => {
      const totalVoters = election.voters.length
      const totalVotes = election.votes.length
      const participationRate = totalVoters > 0 ? Math.round((totalVotes / totalVoters) * 100) : 0

      // Calculate candidate results
      const candidateResults = election.parties.flatMap(party => 
        party.candidates.map(candidate => {
          const votes = candidate.votes.length
          const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0
          
          return {
            id: candidate.id,
            name: candidate.name,
            position: candidate.position || 'Candidate',
            partyName: party.name,
            partySymbol: party.symbol,
            votes,
            percentage
          }
        })
      ).sort((a, b) => b.votes - a.votes)

      // Calculate party results
      const partyResults = election.parties.map(party => {
        const partyVotes = party.candidates.reduce((sum, candidate) => sum + candidate.votes.length, 0)
        const partyPercentage = totalVotes > 0 ? Math.round((partyVotes / totalVotes) * 100) : 0
        
        return {
          id: party.id,
          name: party.name,
          symbol: party.symbol,
          totalVotes: partyVotes,
          percentage: partyPercentage,
          candidates: party.candidates.map(candidate => ({
            id: candidate.id,
            name: candidate.name,
            position: candidate.position || 'Candidate',
            votes: candidate.votes.length,
            percentage: totalVotes > 0 ? Math.round((candidate.votes.length / totalVotes) * 100) : 0
          })).sort((a, b) => b.votes - a.votes)
        }
      }).sort((a, b) => b.totalVotes - a.totalVotes)

      return {
        id: election.id,
        name: election.name,
        year: election.year,
        totalVotes,
        totalVoters,
        participationRate,
        status: election.status,
        startTime: election.startTime,
        endTime: election.endTime,
        candidates: candidateResults,
        parties: partyResults
      }
    })

    return NextResponse.json({ results }, { status: 200 })

  } catch (error) {
    console.error("Get results error:", error)
    return NextResponse.json({ error: "Failed to fetch results" }, { status: 500 })
  }
}