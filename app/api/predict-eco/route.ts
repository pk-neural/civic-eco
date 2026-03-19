import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const resp = await fetch(`${BACKEND_URL}/predict/eco-score`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    if (!resp.ok) {
      return NextResponse.json({ error: "Backend error" }, { status: resp.status })
    }

    const data = await resp.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: "Backend unreachable" }, { status: 503 })
  }
}
