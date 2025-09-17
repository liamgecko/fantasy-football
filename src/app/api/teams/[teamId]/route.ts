import { NextRequest, NextResponse } from "next/server"

import { ESPNApiError } from "@/lib/espn/client"
import { getTeamDetail } from "@/lib/services/team-data"

export const revalidate = 300 // refresh detailed team data every 5 minutes by default

function parseInteger(value: string | null) {
  if (!value) return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

function inferCurrentSeason() {
  const now = new Date()
  const month = now.getUTCMonth() // 0-11
  const year = now.getUTCFullYear()
  // NFL regular season begins in September (month 8). Carry previous year until June to catch playoff months.
  return month >= 6 ? year : year - 1
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = await params
  const searchParams = request.nextUrl.searchParams

  const seasonParam = parseInteger(searchParams.get("season"))
  const seasonTypeParam = parseInteger(searchParams.get("seasonType"))

  const season = seasonParam ?? inferCurrentSeason()
  const seasonType = seasonTypeParam ?? 2

  if (!teamId) {
    return NextResponse.json({ error: "Missing teamId" }, { status: 400 })
  }

  try {
    const data = await getTeamDetail(teamId, { season, seasonType })

    return NextResponse.json({
      data,
      meta: {
        season,
        seasonType,
      },
    })
  } catch (error) {
    if (error instanceof ESPNApiError) {
      return NextResponse.json(
        { error: "Failed to load team detail from ESPN", details: error.message },
        { status: error.status }
      )
    }

    console.error(`/api/teams/${teamId} error`, error)
    return NextResponse.json({ error: "Unexpected server error" }, { status: 500 })
  }
}
