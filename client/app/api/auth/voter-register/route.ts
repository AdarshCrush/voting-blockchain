import { type NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function POST(req: NextRequest) {
  try {
    const { email, aadharNumber, voterId, walletAddress, electionId } = await req.json()

    if (!email || !aadharNumber || !voterId || !walletAddress || !electionId) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    // Check if voter already exists with same email, aadhar, voterId, or wallet
    const existingVoter = await prisma.voter.findFirst({
      where: {
        OR: [
          { email },
          { aadharNumber },
          { voterId },
          { walletAddress }
        ]
      }
    })

    if (existingVoter) {
      return NextResponse.json({ 
        error: "Voter with these details already exists" 
      }, { status: 409 })
    }

    // Check if election exists
    const election = await prisma.election.findUnique({
      where: { id: electionId }
    })

    if (!election) {
      return NextResponse.json({ 
        error: "Election not found" 
      }, { status: 404 })
    }

    // Create voter in database
    const voter = await prisma.voter.create({
      data: {
        email,
        aadharNumber,
        voterId,
        walletAddress,
        electionId,
        hasVoted: false
      },
      include: {
        election: {
          select: {
            id: true,
            name: true,
            year: true
          }
        }
      }
    })

    const response = NextResponse.json({ 
      message: "Voter registered successfully", 
      voter 
    }, { status: 201 })

    // Set session cookie
    response.cookies.set('voterSession', JSON.stringify(voter), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7 // 1 week
    })

    return response

  } catch (error) {
    console.error("Voter registration error:", error)
    return NextResponse.json({ 
      error: "Registration failed. Please try again." 
    }, { status: 500 })
  }
}