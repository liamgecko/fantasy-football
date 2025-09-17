import { espnCoreV3Fetch } from "./client"

export type ESPNAthlete = {
  id: string
  uid: string
  guid: string
  firstName?: string
  lastName?: string
  fullName: string
  displayName: string
  shortName?: string
  jersey?: string
  active?: boolean
  age?: number
  height?: number
  displayHeight?: string
  weight?: number
  displayWeight?: string
  dateOfBirth?: string
  birthPlace?: {
    city?: string
    state?: string
    country?: string
  }
  experience?: {
    years?: number
  }
}

type AthletesResponse = {
  count: number
  pageIndex: number
  pageSize: number
  pageCount: number
  items: ESPNAthlete[]
}

export async function getAthletes({
  page = 1,
  limit = 20000,
  activeOnly = true,
}: {
  page?: number
  limit?: number
  activeOnly?: boolean
} = {}) {
  const data = await espnCoreV3Fetch<AthletesResponse>("/athletes", {
    searchParams: {
      page,
      limit,
    },
    revalidate: 60 * 60 * 6,
    cacheTags: ["espn", "athletes"],
  })

  let items = data.items ?? []

  if (activeOnly) {
    items = items.filter((athlete) => athlete.active && athlete.firstName && athlete.lastName)
  }

  const sorted = items.sort((a, b) => {
    const aLast = a.lastName ?? a.displayName
    const bLast = b.lastName ?? b.displayName
    return aLast.localeCompare(bLast, "en", { sensitivity: "base" })
  })

  return {
    meta: {
      count: data.count,
      pageIndex: data.pageIndex,
      pageSize: data.pageSize,
      pageCount: data.pageCount,
      filteredCount: sorted.length,
    },
    athletes: sorted,
  }
}
