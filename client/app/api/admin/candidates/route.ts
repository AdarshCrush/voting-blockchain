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
    
    const { name, position, partyId, imageUrl } = await req.json()

    if (!name || !position || !partyId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Verify party exists and belongs to admin
    const party = await prisma.party.findFirst({
      where: {
        id: partyId,
        election: {
          adminId: adminData.id
        }
      }
    })

    if (!party) {
      return NextResponse.json({ error: "Party not found" }, { status: 404 })
    }

    // Create candidate with imageUrl
    const candidate = await prisma.candidate.create({
      data: {
        name,
        position,
        imageUrl,  // Include imageUrl from request body
        partyId
      },
      include: {
        party: {
          select: {
            name: true,
            election: {
              select: {
                name: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json({ 
      message: "Candidate created successfully", 
      candidate 
    }, { status: 201 })

  } catch (error) {
    console.error("Create candidate error:", error)
    return NextResponse.json({ error: "Failed to create candidate" }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const adminSession = req.cookies.get('adminSession')?.value
    
    if (!adminSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const adminData = JSON.parse(adminSession)
    
    const candidates = await prisma.candidate.findMany({
      where: {
        party: {
          election: {
            adminId: adminData.id
          }
        }
      },
      include: {
        party: {
          select: {
            name: true,
            election: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ candidates }, { status: 200 })

  } catch (error) {
    console.error("Get candidates error:", error)
    return NextResponse.json({ error: "Failed to fetch candidates" }, { status: 500 })
  }
}