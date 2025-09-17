import {
  getTeamProfile,
  getTeamRecord,
  getTeamRoster,
  getTeamSchedule,
  getTeamStatistics,
  getTeams,
} from "../espn/teams"

export async function listTeams() {
  return getTeams()
}

type TeamDetailOptions = {
  season: number
  seasonType?: number
}

export async function getTeamDetail(teamId: string, { season, seasonType = 2 }: TeamDetailOptions) {
  const [profile, roster, schedule, statistics, record] = await Promise.all([
    getTeamProfile(teamId),
    getTeamRoster(teamId, season),
    getTeamSchedule(teamId, { season, seasonType }),
    getTeamStatistics(teamId, { season, seasonType }),
    getTeamRecord(teamId, { season, seasonType }),
  ])

  return {
    profile,
    roster,
    schedule,
    statistics,
    record,
  }
}
