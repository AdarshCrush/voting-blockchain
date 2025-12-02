import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ 
        error: "Email and password are required" 
      }, { status: 400 })
    }

    // Find admin by email
    const admin = await prisma.admin.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        walletAddress: true,
        password: true
      }
    })

    if (!admin) {
      return NextResponse.json({ 
        success: false,
        error: "Invalid email or password" 
      }, { status: 401 })
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, admin.password)
    if (!isPasswordValid) {
      return NextResponse.json({ 
        success: false,
        error: "Invalid email or password" 
      }, { status: 401 })
    }

    // Return admin info (excluding password)
    return NextResponse.json({ 
      success: true,
      admin: {
        id: admin.id,
        email: admin.email,
        walletAddress: admin.walletAddress
      }
    })

  } catch (error) {
    console.error("Admin verification error:", error)
    return NextResponse.json({ 
      success: false,
      error: "Verification failed" 
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}