import { type NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function POST(req: NextRequest) {
  try {
    const adminSession = req.cookies.get('adminSession')?.value
    
    if (!adminSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const adminData = JSON.parse(adminSession)
    
    const { name, symbol, electionId, iconUrl } = await req.json()

    if (!name || !electionId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Verify election exists and belongs to admin
    const election = await prisma.election.findFirst({
      where: {
        id: electionId,
        adminId: adminData.id
      }
    })

    if (!election) {
      return NextResponse.json({ error: "Election not found" }, { status: 404 })
    }

    // Check if party with same name already exists in this election
    const existingParty = await prisma.party.findFirst({
      where: {
        name,
        electionId
      }
    })

    if (existingParty) {
      return NextResponse.json({ 
        error: "A party with this name already exists in the selected election" 
      }, { status: 409 })
    }

    // Create party with iconUrl
    const party = await prisma.party.create({
      data: {
        name,
        symbol,
        iconUrl,  // Include iconUrl from request body
        electionId
      },
      include: {
        election: {
          select: {
            name: true
          }
        },
        candidates: true,
        _count: {
          select: {
            candidates: true
          }
        }
      }
    })

    return NextResponse.json({ 
      message: "Party created successfully", 
      party 
    }, { status: 201 })

  } catch (error) {
    console.error("Create party error:", error)
    return NextResponse.json({ error: "Failed to create party" }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const adminSession = req.cookies.get('adminSession')?.value
    
    if (!adminSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const adminData = JSON.parse(adminSession)
    
    const parties = await prisma.party.findMany({
      where: {
        election: {
          adminId: adminData.id
        }
      },
      include: {
        election: {
          select: {
            name: true
          }
        },
        candidates: {
          select: {
            id: true,
            name: true,
            position: true
          }
        },
        _count: {
          select: {
            candidates: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ parties }, { status: 200 })

  } catch (error) {
    console.error("Get parties error:", error)
    return NextResponse.json({ error: "Failed to fetch parties" }, { status: 500 })
  }
}