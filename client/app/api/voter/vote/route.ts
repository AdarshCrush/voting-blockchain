import { type NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function POST(req: NextRequest) {
  try {
    const voterSession = req.cookies.get('voterSession')?.value
    
    if (!voterSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const voterData = JSON.parse(voterSession)
    
    const { candidateId, electionId } = await req.json()

    if (!candidateId || !electionId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Verify voter exists and hasn't voted
    const voter = await prisma.voter.findUnique({
      where: { id: voterData.id },
      include: {
        election: true
      }
    })

    if (!voter) {
      return NextResponse.json({ error: "Voter not found" }, { status: 404 })
    }

    if (voter.hasVoted) {
      return NextResponse.json({ error: "You have already voted in this election" }, { status: 400 })
    }

    // Verify election is active
    const now = new Date()
    const election = voter.election

    if (!election.startTime || !election.endTime) {
      return NextResponse.json({ error: "Election timing not configured" }, { status: 400 })
    }

    const startTime = new Date(election.startTime)
    const endTime = new Date(election.endTime)

    if (now < startTime) {
      return NextResponse.json({ error: "Voting has not started yet" }, { status: 400 })
    }

    if (now > endTime) {
      return NextResponse.json({ error: "Voting has ended" }, { status: 400 })
    }

    // Verify candidate exists and belongs to the election
    const candidate = await prisma.candidate.findFirst({
      where: {
        id: candidateId,
        party: {
          electionId: electionId
        }
      },
      include: {
        party: true
      }
    })

    if (!candidate) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 })
    }

    // Create vote record
    const vote = await prisma.vote.create({
      data: {
        voterId: voter.id,
        candidateId: candidate.id,
        partyId: candidate.partyId,
        electionId: electionId,
        txHash: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` // Simulate transaction hash
      }
    })

    // Update voter's hasVoted status
    await prisma.voter.update({
      where: { id: voter.id },
      data: { hasVoted: true }
    })

    return NextResponse.json({ 
      message: "Vote cast successfully",
      vote: {
        id: vote.id,
        candidateName: candidate.name,
        partyName: candidate.party.name,
        timestamp: vote.createdAt
      }
    }, { status: 200 })

  } catch (error) {
    console.error("Vote casting error:", error)
    return NextResponse.json({ error: "Failed to cast vote" }, { status: 500 })
  }
}