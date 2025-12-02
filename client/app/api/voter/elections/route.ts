import { NextResponse } from "next/server"

export async function GET() {
  try {
    const elections = [
      {
        id: "1",
        name: "Parliamentary Elections",
        year: 2024,
        status: "Active",
        parties: 8,
        candidates: 45,
      },
      {
        id: "2",
        name: "Presidential Elections",
        year: 2024,
        status: "Active",
        parties: 5,
        candidates: 15,
      },
    ]

    return NextResponse.json(elections, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch elections" }, { status: 500 })
  }
}
