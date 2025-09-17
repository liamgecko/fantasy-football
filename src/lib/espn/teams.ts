import { espnCoreFetch, espnSiteFetch } from "./client"

export type ESPNImage = {
  href: string
  width: number
  height: number
  alt?: string
  rel?: string[]
  lastUpdated?: string
}

export type ESPNLink = {
  rel: string[]
  href: string
  text?: string
  shortText?: string
  isExternal?: boolean
  isPremium?: boolean
  isHidden?: boolean
  language?: string
}

export type ESPNTeam = {
  id: string
  uid: string
  slug: string
  abbreviation: string
  displayName: string
  shortDisplayName: string
  name: string
  nickname: string
  location: string
  color?: string
  alternateColor?: string
  isActive: boolean
  isAllStar?: boolean
  logos: ESPNImage[]
  links?: ESPNLink[]
}

type TeamListResponse = {
  sports: {
    leagues: {
      teams: {
        team: ESPNTeam
      }[]
    }[]
  }[]
}

export async function getTeams(options: { limit?: number; page?: number } = {}) {
  const data = await espnSiteFetch<TeamListResponse>("/teams", {
    searchParams: options,
    revalidate: 60 * 60 * 24,
    cacheTags: ["espn", "teams"],
  })

  const league = data.sports?.[0]?.leagues?.[0]
  return league?.teams?.map((entry) => entry.team) ?? []
}

type TeamProfileResponse = {
  team: ESPNTeam & {
    nextEvent?: Array<{
      id: string
      date: string
      name: string
      shortName: string
    }>
    standingSummary?: string
    record?: {
      items: Array<{
        type: string
        description?: string
        summary: string
        stats: Array<{
          name: string
          value: number
          displayValue?: string
        }>
      }>
    }
    groups?: {
      id: string
      parent?: {
        id: string
      }
      isConference?: boolean
    }
    franchise?: {
      id: string
      uid: string
      displayName: string
      slug: string
      venue?: {
        fullName: string
        address?: {
          city?: string
          state?: string
          country?: string
        }
      }
    }
  }
}

export async function getTeamProfile(teamId: string) {
  const data = await espnSiteFetch<TeamProfileResponse>(`/teams/${teamId}`, {
    revalidate: 60 * 15,
    cacheTags: ["espn", "teams", `team:${teamId}`],
  })

  return data.team
}

type TeamRosterResponse = {
  team: {
    id: string
    displayName: string
    abbreviation?: string
    location?: string
    name?: string
  }
  season: {
    year: number
  }
  athletes: Array<{
    position: string
    items: Array<{
      id: string
      uid: string
      fullName: string
      displayName: string
      shortName: string
      firstName: string
      lastName: string
      jersey?: string
      position?: {
        id: string
        name: string
        displayName: string
        abbreviation: string
      }
      status?: {
        type: string
        name?: string
      }
      experience?: {
        years?: number
      }
      college?: {
        name?: string
        shortName?: string
      }
      headshot?: ESPNImage
      links?: ESPNLink[]
    }>
  }>
}

export async function getTeamRoster(teamId: string, season?: number) {
  const data = await espnSiteFetch<TeamRosterResponse>(`/teams/${teamId}/roster`, {
    searchParams: season ? { season } : undefined,
    revalidate: 60 * 30,
    cacheTags: ["espn", "teams", `team:${teamId}`, "roster"],
  })

  return data
}

type TeamScheduleResponse = {
  team: {
    id: string
    displayName: string
  }
  season: {
    year: number
  }
  requestedSeason: {
    year: number
    type?: {
      id: string
      name: string
    }
  }
  byeWeek?: number
  events: Array<{
    id: string
    date: string
    name: string
    shortName: string
    week?: {
      number: number
      text?: string
    }
    competitions: Array<{
      id: string
      date: string
      venue?: {
        fullName?: string
      }
      status: {
        type: {
          name: string
        }
      }
      competitors: Array<{
        id: string
        homeAway: "home" | "away"
        team: {
          id: string
          displayName: string
          abbreviation?: string
        }
        score?: {
          displayValue?: string
        }
        record?: Array<{
          type: string
          displayValue?: string
        }>
        winner?: boolean
      }>
      attendance?: number
      notes?: Array<{ text?: string }>
      broadcasts?: Array<{ name?: string; type?: string }>
    }>
  }>
}

export async function getTeamSchedule(
  teamId: string,
  { season, seasonType }: { season?: number; seasonType?: number } = {}
) {
  const searchParams: Record<string, number> = {}
  if (season) searchParams.season = season
  if (seasonType) searchParams.seasontype = seasonType

  const data = await espnSiteFetch<TeamScheduleResponse>(`/teams/${teamId}/schedule`, {
    searchParams: Object.keys(searchParams).length ? searchParams : undefined,
    revalidate: 60 * 5,
    cacheTags: ["espn", "teams", `team:${teamId}`, "schedule"],
  })

  return data
}

type TeamStatisticsResponse = {
  season: {
    year: number
  }
  seasonType: {
    id: number
    name: string
  }
  splits: {
    id: string
    name: string
    abbreviation: string
    categories: Array<{
      name: string
      displayName: string
      shortDisplayName?: string
      stats: Array<{
        name: string
        displayName: string
        shortDisplayName?: string
        description?: string
        abbreviation?: string
        value: number
        displayValue?: string
        perGameValue?: number
        perGameDisplayValue?: string
        rank?: number
        rankDisplayValue?: string
      }>
    }>
  }
}

export async function getTeamStatistics(
  teamId: string,
  { season, seasonType = 2 }: { season: number; seasonType?: number }
) {
  const path = `/seasons/${season}/types/${seasonType}/teams/${teamId}/statistics`
  return espnCoreFetch<TeamStatisticsResponse>(path, {
    revalidate: 60 * 2,
    cacheTags: ["espn", "teams", `team:${teamId}`, "statistics"],
  })
}

type TeamRecordResponse = {
  items: Array<{
    id: string
    name: string
    abbreviation: string
    type: string
    summary: string
    displayValue: string
    value?: number
    stats: Array<{
      name: string
      displayName?: string
      shortDisplayName?: string
      abbreviation?: string
      type?: string
      value?: number
      displayValue?: string
    }>
  }>
}

export async function getTeamRecord(
  teamId: string,
  { season, seasonType = 2 }: { season: number; seasonType?: number }
) {
  const path = `/seasons/${season}/types/${seasonType}/teams/${teamId}/record`
  return espnCoreFetch<TeamRecordResponse>(path, {
    revalidate: 60 * 10,
    cacheTags: ["espn", "teams", `team:${teamId}`, "record"],
  })
}
