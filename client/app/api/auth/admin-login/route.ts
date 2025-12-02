import { type NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

export async function POST(req: NextRequest) {
  try {
    const { email, password, walletAddress } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ 
        error: "Email and password are required" 
      }, { status: 400 })
    }

    // Find admin by email
    const admin = await prisma.admin.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (!admin) {
      return NextResponse.json({ 
        error: "Invalid email or password" 
      }, { status: 401 })
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, admin.password)
    if (!isPasswordValid) {
      return NextResponse.json({ 
        error: "Invalid email or password" 
      }, { status: 401 })
    }

    // If walletAddress provided, verify it matches
    if (walletAddress && admin.walletAddress.toLowerCase() !== walletAddress.toLowerCase()) {
      return NextResponse.json({ 
        error: `Please connect the registered wallet: ${admin.walletAddress.substring(0, 10)}...` 
      }, { status: 401 })
    }

    // Create session data
    const sessionData = {
      id: admin.id,
      email: admin.email,
      walletAddress: admin.walletAddress,
      isAdmin: true,
      timestamp: Date.now()
    }

    const response = NextResponse.json({ 
      success: true,
      message: "Login successful",
      admin: {
        id: admin.id,
        email: admin.email,
        walletAddress: admin.walletAddress
      }
    })

    // Set adminSession cookie
    response.cookies.set('adminSession', JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 24 * 60 * 60 // 24 hours
    })

    return response

  } catch (error) {
    console.error("Admin login error:", error)
    return NextResponse.json({ 
      error: "Login failed. Please try again." 
    }, { status: 500 })
  }
}