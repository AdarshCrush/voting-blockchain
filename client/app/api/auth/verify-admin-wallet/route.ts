import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function POST(req: NextRequest) {
  try {
    const { walletAddress } = await req.json()

    if (!walletAddress) {
      return NextResponse.json({ error: "Wallet address is required" }, { status: 400 })
    }

    // Check if wallet address exists in admin table
    const admin = await prisma.admin.findUnique({
      where: { walletAddress: walletAddress.toLowerCase() }
    })

    return NextResponse.json({ 
      isAuthorized: !!admin,
      admin: admin ? { email: admin.email } : null
    })

  } catch (error) {
    console.error("Wallet verification error:", error)
    return NextResponse.json({ error: "Wallet verification failed" }, { status: 500 })
  }
}