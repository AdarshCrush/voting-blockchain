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
    
    // Get voter information
    const voter = await prisma.voter.findUnique({
      where: { id: voterData.id },
      select: {
        id: true,
        hasVoted: true,
        electionId: true
      }
    })

    if (!voter) {
      return NextResponse.json({ error: "Voter not found" }, { status: 404 })
    }

    // Get election data with candidates
    const election = await prisma.election.findUnique({
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

    if (!election) {
      return NextResponse.json({ error: "Election not found" }, { status: 404 })
    }

    // Flatten candidates for easier access
    const candidates = election.parties.flatMap(party => 
      party.candidates.map(candidate => ({
        ...candidate,
        party: {
          id: party.id,
          name: party.name,
          symbol: party.symbol
        }
      }))
    )

    const responseData = {
      voter: {
        id: voter.id,
        hasVoted: voter.hasVoted,
        electionId: voter.electionId
      },
      election: {
        id: election.id,
        name: election.name,
        year: election.year,
        description: election.description,
        startTime: election.startTime,
        endTime: election.endTime,
        status: election.status,
        candidates
      }
    }

    return NextResponse.json(responseData, { status: 200 })

  } catch (error) {
    console.error("Voting data error:", error)
    return NextResponse.json({ error: "Failed to load voting data" }, { status: 500 })
  }
}