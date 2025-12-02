import { type NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function POST(req: NextRequest) {
  try {
    const { email, voterId } = await req.json()

    if (!email || !voterId) {
      return NextResponse.json({ error: "Email and Voter ID are required" }, { status: 400 })
    }

    // Find voter in database
    const voter = await prisma.voter.findFirst({
      where: {
        email,
        voterId
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

    if (!voter) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const response = NextResponse.json({ 
      message: "Login successful", 
      voter 
    }, { status: 200 })

    // Set session cookie
    response.cookies.set('voterSession', JSON.stringify(voter), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7 // 1 week
    })

    return response

  } catch (error) {
    console.error("Voter login error:", error)
    return NextResponse.json({ 
      error: "Login failed. Please try again." 
    }, { status: 500 })
  }
}