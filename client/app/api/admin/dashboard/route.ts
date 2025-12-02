import { type NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
  try {
    // Get admin session from cookies
    const adminSession = req.cookies.get('adminSession')?.value
    
    if (!adminSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const adminData = JSON.parse(adminSession)
    
    // Verify admin exists
    const admin = await prisma.admin.findUnique({
      where: { id: adminData.id }
    })

    if (!admin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 })
    }

    // Get all elections for this admin
    const elections = await prisma.election.findMany({
      where: { adminId: adminData.id },
      include: {
        voters: true,
        parties: {
          include: {
            candidates: true
          }
        },
        votes: true
      }
    })

    // Calculate statistics
    const activeElections = elections.filter(election => 
      election.status === 'ACTIVE' && 
      election.startTime && 
      election.endTime &&
      new Date() >= election.startTime && 
      new Date() <= election.endTime
    ).length

    const totalVoters = elections.reduce((sum, election) => sum + election.voters.length, 0)
    
    const registeredCandidates = elections.reduce((sum, election) => 
      sum + election.parties.reduce((partySum, party) => partySum + party.candidates.length, 0), 0
    )

    const totalVotesCast = elections.reduce((sum, election) => sum + election.votes.length, 0)

    // Get recent elections (last 5)
    const recentElections = elections
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
      .map(election => ({
        id: election.id,
        name: election.name,
        status: getElectionStatus(election),
        created: formatDate(election.createdAt)
      }))

    const stats = {
      activeElections,
      totalVoters,
      registeredCandidates,
      totalVotesCast,
      recentElections
    }

    return NextResponse.json(stats, { status: 200 })

  } catch (error) {
    console.error("Dashboard stats error:", error)
    return NextResponse.json({ error: "Failed to fetch dashboard stats" }, { status: 500 })
  }
}

// Helper function to determine election status
function getElectionStatus(election: any): string {
  const now = new Date()
  
  if (election.status === 'CANCELLED') return 'Cancelled'
  if (election.status === 'COMPLETED') return 'Completed'
  
  if (election.startTime && election.endTime) {
    const startTime = new Date(election.startTime)
    const endTime = new Date(election.endTime)
    
    if (now < startTime) return 'Upcoming'
    if (now >= startTime && now <= endTime) return 'Active'
    if (now > endTime) return 'Completed'
  }
  
  return election.status || 'Pending'
}

// Helper function to format date
function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}