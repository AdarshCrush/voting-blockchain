import { type NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
  try {
    const voterSession = req.cookies.get('voterSession')?.value
    
    if (!voterSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const voterData = JSON.parse(voterSession)
    
    // Get voter with election details
    const voter = await prisma.voter.findUnique({
      where: { id: voterData.id },
      include: {
        election: {
          select: {
            id: true,
            name: true,
            year: true,
            description: true,
            startTime: true,
            endTime: true,
            status: true
          }
        }
      }
    })

    if (!voter) {
      return NextResponse.json({ error: "Voter not found" }, { status: 404 })
    }

    // Get election data with candidates and parties
    const electionData = await prisma.election.findUnique({
      where: { id: voter.electionId },
      include: {
        parties: {
          include: {
            candidates: {
              select: {
                id: true,
                name: true,
                position: true,
                party: {
                  select: {
                    id: true,
                    name: true,
                    symbol: true
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!electionData) {
      return NextResponse.json({ error: "Election not found" }, { status: 404 })
    }

    // Flatten candidates for easier access
    const candidates = electionData.parties.flatMap(party => 
      party.candidates.map(candidate => ({
        ...candidate,
        party: {
          id: party.id,
          name: party.name,
          symbol: party.symbol
        }
      }))
    )

    return NextResponse.json({
      voter: {
        id: voter.id,
        email: voter.email,
        voterId: voter.voterId,
        walletAddress: voter.walletAddress,
        hasVoted: voter.hasVoted,
        createdAt: voter.createdAt,
        election: voter.election
      },
      electionData: {
        id: electionData.id,
        name: electionData.name,
        description: electionData.description,
        status: electionData.status,
        startTime: electionData.startTime,
        endTime: electionData.endTime,
        candidates
      }
    }, { status: 200 })

  } catch (error) {
    console.error("Voter dashboard error:", error)
    return NextResponse.json({ error: "Failed to load dashboard data" }, { status: 500 })
  }
}