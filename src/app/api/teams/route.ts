import { NextResponse } from "next/server"

import { ESPNApiError } from "@/lib/espn/client"
import { listTeams } from "@/lib/services/team-data"

export const revalidate = 3600 // 1 hour cache at the route level

export async function GET() {
  try {
    const teams = await listTeams()
    return NextResponse.json({ data: teams })
  } catch (error) {
    if (error instanceof ESPNApiError) {
      return NextResponse.json(
        { error: "Failed to load teams from ESPN", details: error.message },
        { status: error.status }
      )
    }

    console.error("/api/teams error", error)
    return NextResponse.json({ error: "Unexpected server error" }, { status: 500 })
  }
}
