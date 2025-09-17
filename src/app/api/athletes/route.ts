import { NextResponse } from "next/server"

import { ESPNApiError } from "@/lib/espn/client"
import { getAthletes } from "@/lib/espn/athletes"

export const revalidate = 60 * 60 * 6

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const limitParam = searchParams.get("limit")
  const pageParam = searchParams.get("page")
  const activeParam = searchParams.get("activeOnly")

  const limit = limitParam ? Number(limitParam) : undefined
  const page = pageParam ? Number(pageParam) : undefined
  const activeOnly = activeParam ? activeParam !== "false" : true

  try {
    const data = await getAthletes({ page, limit, activeOnly })
    return NextResponse.json({ data })
  } catch (error) {
    if (error instanceof ESPNApiError) {
      return NextResponse.json(
        { error: "Failed to load athletes from ESPN", details: error.message },
        { status: error.status }
      )
    }

    console.error("/api/athletes error", error)
    return NextResponse.json({ error: "Unexpected server error" }, { status: 500 })
  }
}
