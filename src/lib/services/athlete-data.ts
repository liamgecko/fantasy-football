import fs from "fs/promises"
import path from "path"

import { espnSiteWebFetch } from "../espn/client"
import { ALLOWED_POSITIONS } from "../constants/positions"
import { getTeamRoster, getTeamSchedule, getTeamStatistics, getTeams } from "../espn/teams"

export type ActiveRosterAthlete = {
  id: string
  displayName: string
  firstName?: string
  lastName?: string
  jersey?: string
  headshot?: string
  team: {
    id: string
    displayName: string
    abbreviation?: string
    location?: string
    name?: string
  }
  position?: {
    name?: string
    displayName?: string
    abbreviation?: string
  }
  byeWeek?: number
  upcomingOpponent?: string
  kickoff?: string
  rushingAttempts: number
  rushingYards: number
  rushingTouchdowns: number
  receptions: number
  receivingYards: number
  receivingTargets: number
  receivingTouchdowns: number
  fumbles: number
  fumblesLost: number
  fumblesRecovered: number
  soloTackles: number
  assistedTackles: number
  totalTackles: number
  tacklesForLoss: number
  sacks: number
  forcedFumbles: number
  interceptions: number
  defensiveTouchdowns: number
  safeties: number
  returnTouchdowns: number
  kicksBlocked: number
  passingYards: number
  passingAttempts: number
  passingCompletions: number
  passingCompletionPct: number
  passingYardsPerAttempt: number
  passingTouchdowns: number
  passingInterceptions: number
  timesSacked: number
  passerRating: number
  fieldGoals: MadeAttempt
  fieldGoalPct: number
  fieldGoals_1_19: MadeAttempt
  fieldGoals_20_29: MadeAttempt
  fieldGoals_30_39: MadeAttempt
  fieldGoals_40_49: MadeAttempt
  fieldGoals_50: MadeAttempt
  extraPoints: MadeAttempt
  extraPointPct: number
  fantasyPoints: number
}

export type AthletesSnapshot = {
  schemaVersion: number
  generatedAt: string
  season: number
  players: ActiveRosterAthlete[]
}

const ATHLETES_CACHE_PATH = path.join(process.cwd(), "data", "cache", "athletes.json")
const ATHLETE_SNAPSHOT_VERSION = 4

export async function listActiveAthletes() {
  const snapshot = await loadAthleteSnapshot()
  return snapshot.players
}

export async function buildAthleteSnapshot(): Promise<AthletesSnapshot> {
  const teams = await getTeams()
  const season = getCurrentSeason()

  const players = new Map<string, ActiveRosterAthlete>()

  teams.forEach((team) => {
    const dstId = `dst-${team.id}`
    players.set(dstId, {
      id: dstId,
      displayName: team.displayName,
      jersey: undefined,
      headshot: team.logos?.[0]?.href,
      team: {
        id: team.id,
        displayName: team.displayName,
        abbreviation: team.abbreviation,
        location: team.location,
        name: team.name,
      },
      position: {
        name: "Defense/Special Teams",
        displayName: "Defense/Special Teams",
        abbreviation: "D/ST",
      },
      firstName: undefined,
      lastName: undefined,
      byeWeek: undefined,
      upcomingOpponent: undefined,
      kickoff: undefined,
      rushingAttempts: 0,
      rushingYards: 0,
      rushingTouchdowns: 0,
      receptions: 0,
      receivingTargets: 0,
      receivingYards: 0,
      receivingTouchdowns: 0,
      fumbles: 0,
      fumblesLost: 0,
      fumblesRecovered: 0,
      soloTackles: 0,
      assistedTackles: 0,
      totalTackles: 0,
      tacklesForLoss: 0,
      sacks: 0,
      forcedFumbles: 0,
      interceptions: 0,
      defensiveTouchdowns: 0,
      safeties: 0,
      returnTouchdowns: 0,
      kicksBlocked: 0,
      passingYards: 0,
      passingAttempts: 0,
      passingCompletions: 0,
      passingCompletionPct: 0,
      passingYardsPerAttempt: 0,
      passingTouchdowns: 0,
      passingInterceptions: 0,
      timesSacked: 0,
      passerRating: 0,
      fieldGoals: { made: 0, attempts: 0 },
      fieldGoalPct: 0,
      fieldGoals_1_19: { made: 0, attempts: 0 },
      fieldGoals_20_29: { made: 0, attempts: 0 },
      fieldGoals_30_39: { made: 0, attempts: 0 },
      fieldGoals_40_49: { made: 0, attempts: 0 },
      fieldGoals_50: { made: 0, attempts: 0 },
      extraPoints: { made: 0, attempts: 0 },
      extraPointPct: 0,
      fantasyPoints: 0,
    })
  })

  await Promise.all(
    teams.map(async (team) => {
      try {
        const [roster, schedule, statistics] = await Promise.all([
          getTeamRoster(team.id, season),
          getTeamSchedule(team.id, { season, seasonType: 2 }),
          getTeamStatistics(team.id, { season, seasonType: 2 }),
        ])
        const byeWeek = schedule.byeWeek
        const upcoming = getUpcomingMatchup(schedule, roster.team.id)

        const dstId = `dst-${team.id}`
        const dstEntry = players.get(dstId)
        if (dstEntry) {
          dstEntry.byeWeek = byeWeek
          dstEntry.upcomingOpponent = upcoming?.label
          dstEntry.kickoff = upcoming?.kickoff

          const soloTackles = getTeamStat(statistics, "defensive", "soloTackles")
          const assistedTackles = getTeamStat(statistics, "defensive", "assistTackles")
          const totalTackles = getTeamStat(statistics, "defensive", "totalTackles")
          const sacks = getTeamStat(statistics, "defensive", "sacks")
          const interceptions = getTeamStat(statistics, "defensiveInterceptions", "interceptions")
          const safeties = getTeamStat(statistics, "defensive", "safeties")
          const forcedFumbles = getTeamStat(statistics, "general", "fumblesForced")
          const fumblesRecovered = getTeamStat(statistics, "general", "fumblesRecovered")
          const defensiveTouchdowns = getTeamStat(statistics, "defensive", "defensiveTouchdowns")
          const kickReturnTouchdowns = getTeamStat(statistics, "returning", "kickReturnTouchdowns")
          const puntReturnTouchdowns = getTeamStat(statistics, "returning", "puntReturnTouchdowns")
          const kicksBlocked = getTeamStat(statistics, "defensive", "kicksBlocked")

          if (soloTackles !== undefined) dstEntry.soloTackles = soloTackles
          if (assistedTackles !== undefined) dstEntry.assistedTackles = assistedTackles
          if (totalTackles !== undefined) dstEntry.totalTackles = totalTackles
          if (sacks !== undefined) dstEntry.sacks = sacks
          if (interceptions !== undefined) dstEntry.interceptions = interceptions
          if (safeties !== undefined) dstEntry.safeties = safeties
          if (forcedFumbles !== undefined) dstEntry.forcedFumbles = forcedFumbles
          if (fumblesRecovered !== undefined) dstEntry.fumblesRecovered = fumblesRecovered
          if (defensiveTouchdowns !== undefined) dstEntry.defensiveTouchdowns = defensiveTouchdowns
          const returnTouchdowns =
            (kickReturnTouchdowns ?? 0) + (puntReturnTouchdowns ?? 0)
          dstEntry.returnTouchdowns = returnTouchdowns
          if (kicksBlocked !== undefined) dstEntry.kicksBlocked = kicksBlocked
        }

        roster.athletes?.forEach((group) => {
          group.items.forEach((athlete) => {
            if (athlete.status?.type && athlete.status.type !== "active") {
              return
            }
            if (players.has(athlete.id)) {
              return
            }

            const normalizedPosition = normalizePosition(
              athlete.position?.abbreviation?.toUpperCase(),
              athlete.position?.displayName
            )

            if (!normalizedPosition) {
              return
            }

            players.set(athlete.id, {
              id: athlete.id,
              displayName: athlete.displayName,
              firstName: athlete.firstName,
              lastName: athlete.lastName,
              jersey: athlete.jersey ?? undefined,
              headshot: athlete.headshot?.href,
              team: {
                id: roster.team.id,
                displayName: roster.team.displayName,
                abbreviation: roster.team.abbreviation,
                location: roster.team.location,
                name: roster.team.name,
              },
              position: athlete.position
                ? {
                    name: athlete.position.name,
                    displayName: athlete.position.displayName,
                    abbreviation: normalizedPosition,
                  }
                : undefined,
              byeWeek,
              upcomingOpponent: upcoming?.label,
              kickoff: upcoming?.kickoff,
              rushingAttempts: 0,
              rushingYards: 0,
              rushingTouchdowns: 0,
              receptions: 0,
              receivingTargets: 0,
              receivingYards: 0,
              receivingTouchdowns: 0,
              fumbles: 0,
              fumblesLost: 0,
              fumblesRecovered: 0,
              soloTackles: 0,
              assistedTackles: 0,
              totalTackles: 0,
              tacklesForLoss: 0,
              sacks: 0,
              forcedFumbles: 0,
              interceptions: 0,
              defensiveTouchdowns: 0,
              safeties: 0,
              returnTouchdowns: 0,
              kicksBlocked: 0,
              passingYards: 0,
              passingAttempts: 0,
              passingCompletions: 0,
              passingCompletionPct: 0,
              passingYardsPerAttempt: 0,
              passingTouchdowns: 0,
              passingInterceptions: 0,
              timesSacked: 0,
              passerRating: 0,
              fieldGoals: { made: 0, attempts: 0 },
              fieldGoalPct: 0,
              fieldGoals_1_19: { made: 0, attempts: 0 },
              fieldGoals_20_29: { made: 0, attempts: 0 },
              fieldGoals_30_39: { made: 0, attempts: 0 },
              fieldGoals_40_49: { made: 0, attempts: 0 },
              fieldGoals_50: { made: 0, attempts: 0 },
              extraPoints: { made: 0, attempts: 0 },
              extraPointPct: 0,
              fantasyPoints: 0,
            })
          })
        })
      } catch (error) {
        console.error(`Failed to load data for team ${team.id}`, error)
      }
    })
  )

  const result = Array.from(players.values()).filter((player) => player.displayName)

  result.sort((a, b) => {
    const aKey = (a.lastName ?? a.displayName).toLowerCase()
    const bKey = (b.lastName ?? b.displayName).toLowerCase()
    return aKey.localeCompare(bKey, "en", { sensitivity: "base" })
  })

  const statsCache = new Map<string, Promise<SkillStats | undefined>>()
  await enrichSkillStats(result, season, statsCache)

  return {
    schemaVersion: ATHLETE_SNAPSHOT_VERSION,
    generatedAt: new Date().toISOString(),
    season,
    players: result,
  }
}

export async function saveAthleteSnapshot(snapshot: AthletesSnapshot) {
  await fs.mkdir(path.dirname(ATHLETES_CACHE_PATH), { recursive: true })
  await fs.writeFile(ATHLETES_CACHE_PATH, JSON.stringify(snapshot, null, 2), "utf-8")
}

async function loadAthleteSnapshot(): Promise<AthletesSnapshot> {
  try {
    const raw = await fs.readFile(ATHLETES_CACHE_PATH, "utf-8")
    const snapshot = JSON.parse(raw) as AthletesSnapshot

    if (
      !snapshot.players ||
      snapshot.season !== getCurrentSeason() ||
      snapshot.schemaVersion !== ATHLETE_SNAPSHOT_VERSION
    ) {
      throw new Error("Snapshot is stale")
    }

    return snapshot
  } catch (error) {
    console.warn("Athlete snapshot missing or stale. Rebuilding cache…", error)
    const snapshot = await buildAthleteSnapshot()
    await saveAthleteSnapshot(snapshot)
    return snapshot
  }
}

function getCurrentSeason() {
  const now = new Date()
  const month = now.getUTCMonth()
  const year = now.getUTCFullYear()
  return month >= 6 ? year : year - 1
}

function normalizePosition(abbreviation?: string, displayName?: string) {
  if (abbreviation) {
    const upper = abbreviation.toUpperCase()
    const normalized = upper === "PK" ? "K" : upper === "DST" ? "D/ST" : upper
    if (ALLOWED_POSITIONS.includes(normalized as (typeof ALLOWED_POSITIONS)[number])) {
      return normalized
    }
  }

  if (displayName) {
    const upper = displayName.toUpperCase()
    if (upper.includes("DEFENSE/SPECIAL TEAMS") &&
        ALLOWED_POSITIONS.includes("D/ST")) {
      return "D/ST"
    }
    const matched = ALLOWED_POSITIONS.find((pos) => upper.startsWith(pos))
    if (matched) {
      return matched
    }
  }

  return undefined
}

function getUpcomingMatchup(schedule: Awaited<ReturnType<typeof getTeamSchedule>>, teamId: string) {
  const events = schedule.events ?? []
  const now = Date.now()

  const upcoming = events
    .map((event) => ({ event, date: new Date(event.date).getTime() }))
    .filter(({ date }) => Number.isFinite(date))
    .sort((a, b) => a.date - b.date)
    .find(({ event, date }) => {
      if (date < now) {
        return false
      }
      const competition = event.competitions?.[0]
      return competition?.competitors?.some((comp) => comp.team?.id === teamId)
    })?.event

  if (!upcoming) {
    return undefined
  }

  const competition = upcoming.competitions?.[0]
  if (!competition) {
    return undefined
  }

  const teamEntry = competition.competitors?.find((comp) => comp.team?.id === teamId)
  const opponentEntry = competition.competitors?.find((comp) => comp.team?.id !== teamId)

  if (!teamEntry || !opponentEntry) {
    return undefined
  }

  const isHome = teamEntry.homeAway === "home"
  const prefix = isHome ? "vs" : "@"
  const opponentAbbreviation = opponentEntry.team?.abbreviation ?? opponentEntry.team?.displayName

  if (!opponentAbbreviation) {
    return undefined
  }

  const kickoff = upcoming.date ? formatKickoff(upcoming.date) : undefined

  return {
    label: `${prefix} ${opponentAbbreviation}`,
    kickoff,
  }
}

function formatKickoff(dateString: string) {
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) {
    return undefined
  }

  const formatter = new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })

  return formatter.format(date)
}

async function enrichSkillStats(
  players: ActiveRosterAthlete[],
  season: number,
  statsCache: Map<string, Promise<SkillStats | undefined>>
) {
  const chunkSize = 12
  for (let i = 0; i < players.length; i += chunkSize) {
    const chunk = players.slice(i, i + chunkSize)
    const stats = await Promise.all(
      chunk.map((player) => fetchSkillStats(statsCache, player.id, player.team.id, season))
    )
    stats.forEach((stat, index) => {
      if (!stat) return
      Object.assign(chunk[index], stat)
    })
  }
}

type AthleteStatsResponse = {
  categories?: Array<{
    name: string
    statistics?: Array<{
      teamId?: string
      teamSlug?: string
      season?: {
        year?: number
      }
      stats: string[]
    }>
  }>
}

type SkillStats = {
  rushingAttempts: number
  rushingYards: number
  rushingTouchdowns: number
  receptions: number
  receivingTargets: number
  receivingYards: number
  receivingTouchdowns: number
  fumbles: number
  fumblesLost: number
  fumblesRecovered: number
  soloTackles: number
  assistedTackles: number
  totalTackles: number
  tacklesForLoss: number
  sacks: number
  forcedFumbles: number
  interceptions: number
  defensiveTouchdowns: number
  safeties: number
  returnTouchdowns: number
  kicksBlocked: number
  passingYards: number
  passingAttempts: number
  passingCompletions: number
  passingCompletionPct: number
  passingYardsPerAttempt: number
  passingTouchdowns: number
  passingInterceptions: number
  timesSacked: number
  passerRating: number
  fieldGoals: MadeAttempt
  fieldGoalPct: number
  fieldGoals_1_19: MadeAttempt
  fieldGoals_20_29: MadeAttempt
  fieldGoals_30_39: MadeAttempt
  fieldGoals_40_49: MadeAttempt
  fieldGoals_50: MadeAttempt
  extraPoints: MadeAttempt
  extraPointPct: number
}

type MadeAttempt = {
  made: number
  attempts: number
}

function fetchSkillStats(
  cacheMap: Map<string, Promise<SkillStats | undefined>>,
  athleteId: string,
  teamId: string,
  season: number
) {
  const key = `${athleteId}:${teamId}:${season}`
  let existing = cacheMap.get(key)
  if (!existing) {
    existing = fetchSkillStatsUncached(athleteId, teamId, season)
    cacheMap.set(key, existing)
  }
  return existing
}

async function fetchSkillStatsUncached(
  athleteId: string,
  teamId: string,
  season: number
): Promise<SkillStats | undefined> {
  try {
    const data = await espnSiteWebFetch<AthleteStatsResponse>(`/athletes/${athleteId}/stats`, {
      searchParams: { season },
      revalidate: 60 * 60 * 6,
      cacheTags: ["espn", "athletes", `athlete:${athleteId}`, "stats"],
    })

    const rushing = data.categories?.find((cat) => cat.name === "rushing")
    const receiving = data.categories?.find((cat) => cat.name === "receiving")
    const defensive = data.categories?.find((cat) => cat.name === "defensive")
    const passing = data.categories?.find((cat) => cat.name === "passing")

    const rushingEntry = findSeasonStat(rushing, season, teamId)
    const receivingEntry = findSeasonStat(receiving, season, teamId)
    const defensiveEntry = findSeasonStat(defensive, season, teamId)
    const passingEntry = findSeasonStat(passing, season, teamId)
    const kickingEntry = findSeasonStat(
      data.categories?.find((cat) => cat.name === "kicking"),
      season,
      teamId
    )

    const passingCompletions = parseStatNumber(passingEntry?.stats?.[1]) ?? 0
    const passingAttempts = parseStatNumber(passingEntry?.stats?.[2]) ?? 0
    const passingCompletionPct = parseStatNumber(passingEntry?.stats?.[3]) ?? 0
    const passingYards = parseStatNumber(passingEntry?.stats?.[4]) ?? 0
    const passingYardsPerAttempt = parseStatNumber(passingEntry?.stats?.[5]) ?? 0
    const passingTouchdowns = parseStatNumber(passingEntry?.stats?.[6]) ?? 0
    const passingInterceptions = parseStatNumber(passingEntry?.stats?.[7]) ?? 0
    const timesSacked = parseStatNumber(passingEntry?.stats?.[9]) ?? 0
    const passerRating = parseStatNumber(passingEntry?.stats?.[10]) ?? 0

    const rushingFumbles = parseStatNumber(rushingEntry?.stats?.[7]) ?? 0
    const rushingFumblesLost = parseStatNumber(rushingEntry?.stats?.[8]) ?? 0
    const receivingFumbles = parseStatNumber(receivingEntry?.stats?.[8]) ?? 0
    const receivingFumblesLost = parseStatNumber(receivingEntry?.stats?.[9]) ?? 0

    const solo = parseStatNumber(defensiveEntry?.stats?.[2]) ?? 0
    const assisted = parseStatNumber(defensiveEntry?.stats?.[3]) ?? 0
    const tacklesForLoss = parseStatNumber(defensiveEntry?.stats?.[14]) ?? 0
    const sacks = parseStatNumber(defensiveEntry?.stats?.[4]) ?? 0
    const forcedFumbles = parseStatNumber(defensiveEntry?.stats?.[5]) ?? 0
    const interceptions = parseStatNumber(defensiveEntry?.stats?.[8]) ?? 0
    const defensiveTouchdowns = parseStatNumber(defensiveEntry?.stats?.[11]) ?? 0

    const fieldGoals = parseMadeAttempt(kickingEntry?.stats?.[1])
    const fieldGoalPct = parseFloat(kickingEntry?.stats?.[2] ?? "0")
    const fieldGoals_1_19 = parseMadeAttempt(kickingEntry?.stats?.[3])
    const fieldGoals_20_29 = parseMadeAttempt(kickingEntry?.stats?.[4])
    const fieldGoals_30_39 = parseMadeAttempt(kickingEntry?.stats?.[5])
    const fieldGoals_40_49 = parseMadeAttempt(kickingEntry?.stats?.[6])
    const fieldGoals_50 = parseMadeAttempt(kickingEntry?.stats?.[7])
    const extraPoints = {
      made: parseStatNumber(kickingEntry?.stats?.[9]) ?? 0,
      attempts: parseStatNumber(kickingEntry?.stats?.[10]) ?? 0,
    }
    const extraPointPct = extraPoints.attempts
      ? (extraPoints.made / extraPoints.attempts) * 100
      : 0

    return {
      rushingAttempts: parseStatNumber(rushingEntry?.stats?.[1]) ?? 0,
      rushingYards: parseStatNumber(rushingEntry?.stats?.[2]) ?? 0,
      rushingTouchdowns: parseStatNumber(rushingEntry?.stats?.[4]) ?? 0,
      receptions: parseStatNumber(receivingEntry?.stats?.[1]) ?? 0,
      receivingTargets: parseStatNumber(receivingEntry?.stats?.[2]) ?? 0,
      receivingYards: parseStatNumber(receivingEntry?.stats?.[3]) ?? 0,
      receivingTouchdowns: parseStatNumber(receivingEntry?.stats?.[5]) ?? 0,
      fumbles: rushingFumbles + receivingFumbles,
      fumblesLost: rushingFumblesLost + receivingFumblesLost,
      fumblesRecovered: parseStatNumber(defensiveEntry?.stats?.[6]) ?? 0,
      soloTackles: solo,
      assistedTackles: assisted,
      totalTackles: solo + assisted,
      tacklesForLoss,
      sacks,
      forcedFumbles,
      interceptions,
      defensiveTouchdowns,
      safeties: 0,
      returnTouchdowns: 0,
      kicksBlocked: 0,
      passingYards,
      passingAttempts,
      passingCompletions,
      passingCompletionPct,
      passingYardsPerAttempt,
      passingTouchdowns,
      passingInterceptions,
      timesSacked,
      passerRating,
      fieldGoals,
      fieldGoalPct,
      fieldGoals_1_19,
      fieldGoals_20_29,
      fieldGoals_30_39,
      fieldGoals_40_49,
      fieldGoals_50,
      extraPoints,
      extraPointPct,
    }
  } catch (error) {
    console.error(`Failed to load stats for athlete ${athleteId}`, error)
    return undefined
  }
}

function parseStatNumber(value?: string) {
  if (!value) return undefined
  const cleaned = value.replace(/,/g, "")
  const parsed = Number(cleaned)
  return Number.isFinite(parsed) ? parsed : undefined
}

function findSeasonStat(
  category: NonNullable<AthleteStatsResponse["categories"]>[0] | undefined,
  season: number,
  teamId: string
) {
  if (!category) {
    return undefined
  }
  
  const stats = category.statistics
  if (!stats) {
    return undefined
  }

  return (
    stats.find((entry) => entry.season?.year === season && entry.teamId === teamId) ??
    stats.find((entry) => entry.season?.year === season && entry.teamSlug?.toLowerCase().includes("totals")) ??
    stats.find((entry) => entry.season?.year === season)
  )
}

function parseMadeAttempt(value?: string): MadeAttempt {
  if (!value) {
    return { made: 0, attempts: 0 }
  }
  const [madeStr, attemptStr] = value.split("-")
  const made = parseStatNumber(madeStr) ?? 0
  const attempts = parseStatNumber(attemptStr) ?? 0
  return { made, attempts }
}

type TeamStatistics = Awaited<ReturnType<typeof getTeamStatistics>>

function getTeamStat(
  statistics: TeamStatistics | undefined,
  categoryName: string,
  statName: string
) {
  const categories = statistics?.splits?.categories
  if (!categories) return undefined
  const category = categories.find((entry) => entry.name === categoryName)
  if (!category) return undefined
  const stat = category.stats?.find((item) => item.name === statName)
  const value = stat?.value
  return typeof value === "number" ? value : undefined
}
