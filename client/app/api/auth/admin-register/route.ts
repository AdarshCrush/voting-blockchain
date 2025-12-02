import { type NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

export async function POST(req: NextRequest) {
  try {
    const { walletAddress, email, password, signature, message } = await req.json()

    if (!walletAddress || !email || !password) {
      return NextResponse.json({ 
        error: "All fields are required" 
      }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ 
        error: "Password must be at least 6 characters" 
      }, { status: 400 })
    }

    if (!walletAddress.startsWith('0x') || walletAddress.length !== 42) {
      return NextResponse.json({ 
        error: "Invalid wallet address format" 
      }, { status: 400 })
    }

    // Check if admin already exists with this email or wallet
    const existingAdmin = await prisma.admin.findFirst({
      where: {
        OR: [
          { email: email.toLowerCase() },
          { walletAddress: walletAddress.toLowerCase() }
        ]
      }
    })

    if (existingAdmin) {
      if (existingAdmin.email.toLowerCase() === email.toLowerCase()) {
        return NextResponse.json({ 
          error: "Admin with this email already exists" 
        }, { status: 409 })
      }
      if (existingAdmin.walletAddress.toLowerCase() === walletAddress.toLowerCase()) {
        return NextResponse.json({ 
          error: "This wallet address is already registered" 
        }, { status: 409 })
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create admin
    const admin = await prisma.admin.create({
      data: {
        email: email.toLowerCase(),
        walletAddress: walletAddress.toLowerCase(),
        password: hashedPassword,
        // You could verify the signature here if needed
        // For now, we trust the frontend verification
      },
      select: {
        id: true,
        email: true,
        walletAddress: true,
        createdAt: true
      }
    })

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
      message: "Registration successful",
      admin
    })

    // Set session cookie
    response.cookies.set('adminSession', JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 24 * 60 * 60 // 24 hours
    })

    return response

  } catch (error) {
    console.error("Admin registration error:", error)
    return NextResponse.json({ 
      error: "Registration failed. Please try again." 
    }, { status: 500 })
  }
}