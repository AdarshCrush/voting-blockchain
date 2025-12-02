import { type NextRequest, NextResponse } from "next/server"

export async function GET() {
  try {
    // In a real app, fetch from database using Prisma
    const voters = [{ id: "1", email: "voter1@example.com", aadhar: "XXXX-XXXX-1234", status: "Active" }]
    return NextResponse.json(voters)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch voters" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()
    // In a real app, create voter in database using Prisma
    return NextResponse.json({ id: "new", ...data }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to register voter" }, { status: 500 })
  }
}
