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
    
    // Get all voters for elections created by this admin
    const voters = await prisma.voter.findMany({
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
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ voters }, { status: 200 })

  } catch (error) {
    console.error("Get voters error:", error)
    return NextResponse.json({ error: "Failed to fetch voters" }, { status: 500 })
  }
}