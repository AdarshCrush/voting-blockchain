import { type NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

// Create a single instance of Prisma Client
const prisma = new PrismaClient()

// Helper function to check database connection
async function checkDatabaseConnection() {
  try {
    await prisma.$queryRaw`SELECT 1`
    return true
  } catch (error) {
    console.error('Database connection error:', error)
    return false
  }
}

export async function POST(req: NextRequest) {
  try {
    // Check database connection first
    const isConnected = await checkDatabaseConnection()
    if (!isConnected) {
      return NextResponse.json({ 
        error: "Database connection failed. Please check your database configuration." 
      }, { status: 503 })
    }

    const adminSession = req.cookies.get('adminSession')?.value
    
    if (!adminSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let adminData
    try {
      adminData = JSON.parse(adminSession)
    } catch (parseError) {
      return NextResponse.json({ error: "Invalid session data" }, { status: 401 })
    }
    
    // Verify admin exists
    const admin = await prisma.admin.findUnique({
      where: { id: adminData.id }
    })

    if (!admin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 })
    }

    let body
    try {
      body = await req.json()
    } catch (parseError) {
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 })
    }

    const { name, year, description, startTime, endTime } = body

    if (!name || !year || !startTime || !endTime) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if election with same name and year already exists for this admin
    const existingElection = await prisma.election.findFirst({
      where: {
        name,
        year: parseInt(year),
        adminId: adminData.id
      }
    })

    if (existingElection) {
      return NextResponse.json({ 
        error: "An election with this name and year already exists" 
      }, { status: 409 })
    }

    // Create election
    const election = await prisma.election.create({
      data: {
        name,
        year: parseInt(year),
        description: description || "",
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        status: 'PENDING',
        adminId: adminData.id
      },
      include: {
        _count: {
          select: {
            voters: true,
            parties: true,
            votes: true
          }
        }
      }
    })

    return NextResponse.json({ 
      message: "Election created successfully", 
      election 
    }, { status: 201 })

  } catch (error: any) {
    console.error("Create election error:", error)
    
    // Handle specific Prisma errors
    if (error.code === 'P1001') {
      return NextResponse.json({ 
        error: "Cannot connect to database server. Please check your database connection." 
      }, { status: 503 })
    }
    
    if (error.code === 'P2025') {
      return NextResponse.json({ 
        error: "Record not found in database." 
      }, { status: 404 })
    }
    
    return NextResponse.json({ 
      error: "Failed to create election. Please try again." 
    }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    // Check database connection first
    const isConnected = await checkDatabaseConnection()
    if (!isConnected) {
      return NextResponse.json({ 
        error: "Database connection failed. Please check your database configuration." 
      }, { status: 503 })
    }

    const adminSession = req.cookies.get('adminSession')?.value
    
    if (!adminSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let adminData
    try {
      adminData = JSON.parse(adminSession)
    } catch (parseError) {
      return NextResponse.json({ error: "Invalid session data" }, { status: 401 })
    }
    
    const elections = await prisma.election.findMany({
      where: { adminId: adminData.id },
      include: {
        _count: {
          select: {
            voters: true,
            parties: true,
            votes: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ elections }, { status: 200 })

  } catch (error: any) {
    console.error("Get elections error:", error)
    
    if (error.code === 'P1001') {
      return NextResponse.json({ 
        error: "Cannot connect to database server." 
      }, { status: 503 })
    }
    
    return NextResponse.json({ error: "Failed to fetch elections" }, { status: 500 })
  }
}