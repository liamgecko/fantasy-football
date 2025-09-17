"use client"

import { type ColumnDef } from "@tanstack/react-table"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header"
import type { ActiveRosterAthlete } from "@/lib/services/athlete-data"

const numberFormatter = Intl.NumberFormat("en-US")
const decimalFormatter = Intl.NumberFormat("en-US", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

export const POSITION_GROUPS = {
  "group:offense": ["RB", "WR", "TE"],
  "group:defense": ["CB", "S", "DE", "DT", "LB", "D/ST"],
} as const

export const POSITION_FILTER_DEFINITIONS = [
  { label: "QB", value: "QB", members: ["QB"] as const },
  { label: "RB", value: "RB", members: ["RB"] as const },
  { label: "WR", value: "WR", members: ["WR"] as const },
  { label: "TE", value: "TE", members: ["TE"] as const },
  { label: "RB / WR / TE", value: "group:offense", members: POSITION_GROUPS["group:offense"] },
  { label: "K", value: "K", members: ["K"] as const },
  { label: "CB", value: "CB", members: ["CB"] as const },
  { label: "S", value: "S", members: ["S"] as const },
  { label: "DL", value: "DL", members: ["DE"] as const },
  { label: "DT", value: "DT", members: ["DT"] as const },
  { label: "LB", value: "LB", members: ["LB"] as const },
  { label: "DB / DL / LB", value: "group:defense", members: POSITION_GROUPS["group:defense"] },
] as const

export const ALWAYS_VISIBLE_COLUMNS = ["player", "opponent"] as const

const POSITION_FILTER_MAP = POSITION_FILTER_DEFINITIONS.reduce<Record<string, readonly string[]>>(
  (acc, def) => {
    acc[def.value] = def.members
    return acc
  },
  {}
)

function normalizePositionAbbreviation(value?: string) {
  if (!value) return undefined
  if (value.toUpperCase() === "DST") {
    return "D/ST"
  }
  return value
}

function getInitials(athlete: ActiveRosterAthlete) {
  const letters = [athlete.firstName?.[0], athlete.lastName?.[0]]
    .filter(Boolean)
    .join("")
    .toUpperCase()

  return letters || athlete.displayName.slice(0, 2).toUpperCase()
}

function getSecondaryLine(athlete: ActiveRosterAthlete) {
  const normalizedPosition = normalizePositionAbbreviation(athlete.position?.abbreviation)
  const positionText = normalizedPosition ?? athlete.position?.displayName ?? "—"
  const teamText = athlete.team.abbreviation ?? athlete.team.displayName
  const byeText = athlete.byeWeek ? `(${athlete.byeWeek})` : "(—)"
  return `${positionText} ${teamText} ${byeText}`
}

function getDisplayName(athlete: ActiveRosterAthlete) {
  if (athlete.id.startsWith("dst-")) {
    if (athlete.team.displayName) {
      return athlete.team.displayName
    }
    return athlete.displayName.replace(/\s+D\/ST$/i, "")
  }
  return athlete.displayName
}

type FilterValue = {
  search?: string
  position?: string
}

const baseColumns: ColumnDef<ActiveRosterAthlete>[] = [
  {
    id: "player",
    accessorKey: "displayName",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Player" />, 
    cell: ({ row }) => {
      const athlete = row.original
      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12 bg-gray-50 border border-white">
            <AvatarImage src={athlete.headshot} alt={athlete.displayName} className="object-cover" />
            <AvatarFallback>{getInitials(athlete)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-semibold text-foreground">{getDisplayName(athlete)}</span>
            <span className="text-xs text-muted-foreground">{getSecondaryLine(athlete)}</span>
          </div>
        </div>
      )
    },
    sortingFn: (rowA, rowB) => {
      const a = rowA.original.lastName ?? rowA.original.displayName
      const b = rowB.original.lastName ?? rowB.original.displayName
      return a.localeCompare(b, "en", { sensitivity: "base" })
    },
    filterFn: (row, id, value) => {
      if (!value) return true
      const { search, position } = value as FilterValue
      const athlete = row.original
      if (search) {
        const term = search.toLowerCase()
        const fullName = `${athlete.displayName} ${athlete.firstName ?? ""} ${athlete.lastName ?? ""}`
          .toLowerCase()
        if (!fullName.includes(term)) {
          return false
        }
      }
      if (position) {
        const normalized = normalizePositionAbbreviation(athlete.position?.abbreviation)
        if (!normalized) {
          return false
        }
        const members = POSITION_FILTER_MAP[position]
        if (members) {
          if (!members.includes(normalized)) {
            return false
          }
        } else if (normalized !== position) {
          return false
        }
      }
      return true
    },
  },
  {
    id: "opponent",
    accessorKey: "upcomingOpponent",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Opponent" />, 
    cell: ({ row }) => {
      const opponent = row.original.upcomingOpponent ?? "TBD"
      const kickoff = row.original.kickoff
      return (
        <div className="flex flex-col">
          <span>{opponent}</span>
          {kickoff && <span className="text-xs text-muted-foreground">{kickoff}</span>}
        </div>
      )
    },
    enableSorting: false,
    enableColumnFilter: false,
  },
  {
    id: "fantasyPoints",
    accessorFn: () => 0,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Fantasy Pts" className="justify-end" />, 
    cell: () => <div className="text-right">0</div>,
    sortingFn: "basic",
  },
]

const passingColumns: ColumnDef<ActiveRosterAthlete>[] = [
  {
    id: "passingYards",
    accessorFn: (athlete) => athlete.passingYards ?? 0,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Pass Yds" className="justify-end" />, 
    cell: ({ row }) => {
      const value = row.getValue<number>("passingYards")
      return <div className="text-right">{formatNumber(value)}</div>
    },
    sortingFn: "basic",
  },
  {
    id: "passingAttempts",
    accessorFn: (athlete) => athlete.passingAttempts ?? 0,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Pass Att" className="justify-end" />, 
    cell: ({ row }) => {
      const value = row.getValue<number>("passingAttempts")
      return <div className="text-right">{formatNumber(value)}</div>
    },
    sortingFn: "basic",
  },
  {
    id: "passingCompletions",
    accessorFn: (athlete) => athlete.passingCompletions ?? 0,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Completions" className="justify-end" />, 
    cell: ({ row }) => {
      const value = row.getValue<number>("passingCompletions")
      return <div className="text-right">{formatNumber(value)}</div>
    },
    sortingFn: "basic",
  },
  {
    id: "passingCompletionPct",
    accessorFn: (athlete) => athlete.passingCompletionPct ?? 0,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Comp %" className="justify-end" />, 
    cell: ({ row }) => {
      const value = row.getValue<number>("passingCompletionPct")
      return <div className="text-right">{formatPercentage(value)}</div>
    },
    sortingFn: "basic",
  },
  {
    id: "passingYardsPerAttempt",
    accessorFn: (athlete) => athlete.passingYardsPerAttempt ?? 0,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Y/A" className="justify-end" />, 
    cell: ({ row }) => {
      const value = row.getValue<number>("passingYardsPerAttempt")
      return <div className="text-right">{formatDecimal(value)}</div>
    },
    sortingFn: "basic",
  },
  {
    id: "passingTouchdowns",
    accessorFn: (athlete) => athlete.passingTouchdowns ?? 0,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Pass TD" className="justify-end" />, 
    cell: ({ row }) => {
      const value = row.getValue<number>("passingTouchdowns")
      return <div className="text-right">{formatNumber(value)}</div>
    },
    sortingFn: "basic",
  },
  {
    id: "passingInterceptions",
    accessorFn: (athlete) => athlete.passingInterceptions ?? 0,
    header: ({ column }) => <DataTableColumnHeader column={column} title="INT Thrown" className="justify-end" />, 
    cell: ({ row }) => {
      const value = row.getValue<number>("passingInterceptions")
      return <div className="text-right">{formatNumber(value)}</div>
    },
    sortingFn: "basic",
  },
  {
    id: "timesSacked",
    accessorFn: (athlete) => athlete.timesSacked ?? 0,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Sacked" className="justify-end" />, 
    cell: ({ row }) => {
      const value = row.getValue<number>("timesSacked")
      return <div className="text-right">{formatNumber(value)}</div>
    },
    sortingFn: "basic",
  },
  {
    id: "passerRating",
    accessorFn: (athlete) => athlete.passerRating ?? 0,
    header: ({ column }) => <DataTableColumnHeader column={column} title="QB Rating" className="justify-end" />, 
    cell: ({ row }) => {
      const value = row.getValue<number>("passerRating")
      return <div className="text-right">{formatDecimal(value)}</div>
    },
    sortingFn: "basic",
  },
]

const fumblesColumn: ColumnDef<ActiveRosterAthlete> = {
  id: "fumbles",
  accessorFn: (athlete) => athlete.fumbles ?? 0,
  header: ({ column }) => <DataTableColumnHeader column={column} title="FUM" className="justify-end" />, 
  cell: ({ row }) => {
    const value = row.getValue<number>("fumbles")
    return <div className="text-right">{formatNumber(value)}</div>
  },
  sortingFn: "basic",
}

const fumblesLostColumn: ColumnDef<ActiveRosterAthlete> = {
  id: "fumblesLost",
  accessorFn: (athlete) => athlete.fumblesLost ?? 0,
  header: ({ column }) => <DataTableColumnHeader column={column} title="FUM Lost" className="justify-end" />, 
  cell: ({ row }) => {
    const value = row.getValue<number>("fumblesLost")
    return <div className="text-right">{formatNumber(value)}</div>
  },
  sortingFn: "basic",
}

const fumblesRecoveredColumn: ColumnDef<ActiveRosterAthlete> = {
  id: "fumblesRecovered",
  accessorFn: (athlete) => athlete.fumblesRecovered ?? 0,
  header: ({ column }) => <DataTableColumnHeader column={column} title="FUM Rec" className="justify-end" />, 
  cell: ({ row }) => {
    const value = row.getValue<number>("fumblesRecovered")
    return <div className="text-right">{formatNumber(value)}</div>
  },
  sortingFn: "basic",
}

const rushingColumns: ColumnDef<ActiveRosterAthlete>[] = [
  {
    id: "rushingAttempts",
    accessorFn: (athlete) => athlete.rushingAttempts ?? 0,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Rush Att" className="justify-end" />, 
    cell: ({ row }) => {
      const value = row.getValue<number>("rushingAttempts")
      return <div className="text-right">{formatNumber(value)}</div>
    },
    sortingFn: "basic",
  },
  {
    id: "rushingYards",
    accessorFn: (athlete) => athlete.rushingYards ?? 0,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Rush Yds" className="justify-end" />, 
    cell: ({ row }) => {
      const value = row.getValue<number>("rushingYards")
      return <div className="text-right">{formatNumber(value)}</div>
    },
    sortingFn: "basic",
  },
  {
    id: "rushingTouchdowns",
    accessorFn: (athlete) => athlete.rushingTouchdowns ?? 0,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Rush TD" className="justify-end" />, 
    cell: ({ row }) => {
      const value = row.getValue<number>("rushingTouchdowns")
      return <div className="text-right">{formatNumber(value)}</div>
    },
    sortingFn: "basic",
  },
]

const receivingColumns: ColumnDef<ActiveRosterAthlete>[] = [
  {
    id: "receptions",
    accessorFn: (athlete) => athlete.receptions ?? 0,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Rec" className="justify-end" />, 
    cell: ({ row }) => {
      const value = row.getValue<number>("receptions")
      return <div className="text-right">{formatNumber(value)}</div>
    },
    sortingFn: "basic",
  },
  {
    id: "receivingTargets",
    accessorFn: (athlete) => athlete.receivingTargets ?? 0,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Targets" className="justify-end" />, 
    cell: ({ row }) => {
      const value = row.getValue<number>("receivingTargets")
      return <div className="text-right">{formatNumber(value)}</div>
    },
    sortingFn: "basic",
  },
  {
    id: "receivingYards",
    accessorFn: (athlete) => athlete.receivingYards ?? 0,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Rec Yds" className="justify-end" />, 
    cell: ({ row }) => {
      const value = row.getValue<number>("receivingYards")
      return <div className="text-right">{formatNumber(value)}</div>
    },
    sortingFn: "basic",
  },
  {
    id: "receivingTouchdowns",
    accessorFn: (athlete) => athlete.receivingTouchdowns ?? 0,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Rec TD" className="justify-end" />, 
    cell: ({ row }) => {
      const value = row.getValue<number>("receivingTouchdowns")
      return <div className="text-right">{formatNumber(value)}</div>
    },
    sortingFn: "basic",
  },
]

const defensiveColumns: ColumnDef<ActiveRosterAthlete>[] = [
  {
    id: "soloTackles",
    accessorFn: (athlete) => athlete.soloTackles ?? 0,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Solo" className="justify-end" />, 
    cell: ({ row }) => {
      const value = row.getValue<number>("soloTackles")
      return <div className="text-right">{formatNumber(value)}</div>
    },
    sortingFn: "basic",
  },
  {
    id: "assistedTackles",
    accessorFn: (athlete) => athlete.assistedTackles ?? 0,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Ast" className="justify-end" />, 
    cell: ({ row }) => {
      const value = row.getValue<number>("assistedTackles")
      return <div className="text-right">{formatNumber(value)}</div>
    },
    sortingFn: "basic",
  },
  {
    id: "totalTackles",
    accessorFn: (athlete) => athlete.totalTackles ?? 0,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Tot" className="justify-end" />, 
    cell: ({ row }) => {
      const value = row.getValue<number>("totalTackles")
      return <div className="text-right">{formatNumber(value)}</div>
    },
    sortingFn: "basic",
  },
  {
    id: "tacklesForLoss",
    accessorFn: (athlete) => athlete.tacklesForLoss ?? 0,
    header: ({ column }) => <DataTableColumnHeader column={column} title="TFL" className="justify-end" />, 
    cell: ({ row }) => {
      const value = row.getValue<number>("tacklesForLoss")
      return <div className="text-right">{formatNumber(value)}</div>
    },
    sortingFn: "basic",
  },
  {
    id: "sacks",
    accessorFn: (athlete) => athlete.sacks ?? 0,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Sacks" className="justify-end" />, 
    cell: ({ row }) => {
      const value = row.getValue<number>("sacks")
      return <div className="text-right">{formatNumber(value)}</div>
    },
    sortingFn: "basic",
  },
  {
    id: "forcedFumbles",
    accessorFn: (athlete) => athlete.forcedFumbles ?? 0,
    header: ({ column }) => <DataTableColumnHeader column={column} title="FF" className="justify-end" />, 
    cell: ({ row }) => {
      const value = row.getValue<number>("forcedFumbles")
      return <div className="text-right">{formatNumber(value)}</div>
    },
    sortingFn: "basic",
  },
  {
    id: "interceptions",
    accessorFn: (athlete) => athlete.interceptions ?? 0,
    header: ({ column }) => <DataTableColumnHeader column={column} title="INT" className="justify-end" />, 
    cell: ({ row }) => {
      const value = row.getValue<number>("interceptions")
      return <div className="text-right">{formatNumber(value)}</div>
    },
    sortingFn: "basic",
  },
  {
    id: "defensiveTouchdowns",
    accessorFn: (athlete) => athlete.defensiveTouchdowns ?? 0,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Def TD" className="justify-end" />, 
    cell: ({ row }) => {
      const value = row.getValue<number>("defensiveTouchdowns")
      return <div className="text-right">{formatNumber(value)}</div>
    },
    sortingFn: "basic",
  },
  {
    id: "safeties",
    accessorFn: (athlete) => athlete.safeties ?? 0,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Safeties" className="justify-end" />, 
    cell: ({ row }) => {
      const value = row.getValue<number>("safeties")
      return <div className="text-right">{formatNumber(value)}</div>
    },
    sortingFn: "basic",
  },
  {
    id: "returnTouchdowns",
    accessorFn: (athlete) => athlete.returnTouchdowns ?? 0,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Return TD" className="justify-end" />, 
    cell: ({ row }) => {
      const value = row.getValue<number>("returnTouchdowns")
      return <div className="text-right">{formatNumber(value)}</div>
    },
    sortingFn: "basic",
  },
  {
    id: "kicksBlocked",
    accessorFn: (athlete) => athlete.kicksBlocked ?? 0,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Blk Kicks" className="justify-end" />, 
    cell: ({ row }) => {
      const value = row.getValue<number>("kicksBlocked")
      return <div className="text-right">{formatNumber(value)}</div>
    },
    sortingFn: "basic",
  },
]

const fumbleColumns: ColumnDef<ActiveRosterAthlete>[] = [
  fumblesColumn,
  fumblesLostColumn,
  fumblesRecoveredColumn,
]

const kickingColumns: ColumnDef<ActiveRosterAthlete>[] = [
  {
    id: "fieldGoals",
    accessorFn: (athlete) => athlete.fieldGoals?.made ?? 0,
    header: ({ column }) => <DataTableColumnHeader column={column} title="FG" className="justify-end" />, 
    cell: ({ row }) => (
      <div className="text-right">{formatMadeAttempt(row.original.fieldGoals)}</div>
    ),
    sortingFn: "basic",
  },
  {
    id: "fieldGoalPct",
    accessorFn: (athlete) => athlete.fieldGoalPct ?? 0,
    header: ({ column }) => <DataTableColumnHeader column={column} title="FG %" className="justify-end" />, 
    cell: ({ row }) => <div className="text-right">{formatPercentage(row.getValue<number>("fieldGoalPct"))}</div>,
    sortingFn: "basic",
  },
  {
    id: "fieldGoals_1_19",
    accessorFn: (athlete) => athlete.fieldGoals_1_19?.made ?? 0,
    header: ({ column }) => <DataTableColumnHeader column={column} title="FG 1-19" className="justify-end" />, 
    cell: ({ row }) => (
      <div className="text-right">{formatMadeAttempt(row.original.fieldGoals_1_19)}</div>
    ),
    sortingFn: "basic",
  },
  {
    id: "fieldGoals_20_29",
    accessorFn: (athlete) => athlete.fieldGoals_20_29?.made ?? 0,
    header: ({ column }) => <DataTableColumnHeader column={column} title="FG 20-29" className="justify-end" />, 
    cell: ({ row }) => (
      <div className="text-right">{formatMadeAttempt(row.original.fieldGoals_20_29)}</div>
    ),
    sortingFn: "basic",
  },
  {
    id: "fieldGoals_30_39",
    accessorFn: (athlete) => athlete.fieldGoals_30_39?.made ?? 0,
    header: ({ column }) => <DataTableColumnHeader column={column} title="FG 30-39" className="justify-end" />, 
    cell: ({ row }) => (
      <div className="text-right">{formatMadeAttempt(row.original.fieldGoals_30_39)}</div>
    ),
    sortingFn: "basic",
  },
  {
    id: "fieldGoals_40_49",
    accessorFn: (athlete) => athlete.fieldGoals_40_49?.made ?? 0,
    header: ({ column }) => <DataTableColumnHeader column={column} title="FG 40-49" className="justify-end" />, 
    cell: ({ row }) => (
      <div className="text-right">{formatMadeAttempt(row.original.fieldGoals_40_49)}</div>
    ),
    sortingFn: "basic",
  },
  {
    id: "fieldGoals_50",
    accessorFn: (athlete) => athlete.fieldGoals_50?.made ?? 0,
    header: ({ column }) => <DataTableColumnHeader column={column} title="FG 50+" className="justify-end" />, 
    cell: ({ row }) => (
      <div className="text-right">{formatMadeAttempt(row.original.fieldGoals_50)}</div>
    ),
    sortingFn: "basic",
  },
  {
    id: "extraPoints",
    accessorFn: (athlete) => athlete.extraPoints?.made ?? 0,
    header: ({ column }) => <DataTableColumnHeader column={column} title="XP" className="justify-end" />, 
    cell: ({ row }) => (
      <div className="text-right">{formatMadeAttempt(row.original.extraPoints)}</div>
    ),
    sortingFn: "basic",
  },
  {
    id: "extraPointPct",
    accessorFn: (athlete) => athlete.extraPointPct ?? 0,
    header: ({ column }) => <DataTableColumnHeader column={column} title="XP %" className="justify-end" />, 
    cell: ({ row }) => <div className="text-right">{formatPercentage(row.getValue<number>("extraPointPct"))}</div>,
    sortingFn: "basic",
  },
]

const DEFENSIVE_COLUMN_IDS: readonly string[] = [
  "soloTackles",
  "assistedTackles",
  "totalTackles",
  "tacklesForLoss",
  "sacks",
  "forcedFumbles",
  "fumblesRecovered",
  "interceptions",
  "defensiveTouchdowns",
  "safeties",
  "returnTouchdowns",
  "kicksBlocked",
]

export const COLUMN_PRESETS: Record<string, readonly string[]> = {
  QB: [
    "passingYards",
    "passingAttempts",
    "passingCompletions",
    "passingCompletionPct",
    "passingYardsPerAttempt",
    "passingTouchdowns",
    "passingInterceptions",
    "timesSacked",
    "passerRating",
    "rushingAttempts",
    "rushingYards",
    "rushingTouchdowns",
    "fumbles",
    "fumblesLost",
  ],
  RB: [
    "rushingAttempts",
    "rushingYards",
    "rushingTouchdowns",
    "receptions",
    "receivingTargets",
    "receivingYards",
    "receivingTouchdowns",
    "fumbles",
    "fumblesLost",
    "fumblesRecovered",
  ],
  WR: [
    "receptions",
    "receivingTargets",
    "receivingYards",
    "receivingTouchdowns",
    "rushingAttempts",
    "rushingYards",
    "rushingTouchdowns",
    "fumbles",
    "fumblesLost",
    "fumblesRecovered",
  ],
  TE: [
    "receptions",
    "receivingTargets",
    "receivingYards",
    "receivingTouchdowns",
    "rushingAttempts",
    "rushingYards",
    "rushingTouchdowns",
    "fumbles",
    "fumblesLost",
    "fumblesRecovered",
  ],
  "group:offense": [
    "rushingAttempts",
    "rushingYards",
    "rushingTouchdowns",
    "receptions",
    "receivingTargets",
    "receivingYards",
    "receivingTouchdowns",
    "fumbles",
    "fumblesLost",
    "fumblesRecovered",
  ],
  K: [
    "fieldGoals",
    "fieldGoalPct",
    "fieldGoals_1_19",
    "fieldGoals_20_29",
    "fieldGoals_30_39",
    "fieldGoals_40_49",
    "fieldGoals_50",
    "extraPoints",
    "extraPointPct",
  ],
  CB: DEFENSIVE_COLUMN_IDS,
  S: DEFENSIVE_COLUMN_IDS,
  DL: DEFENSIVE_COLUMN_IDS,
  DT: DEFENSIVE_COLUMN_IDS,
  LB: DEFENSIVE_COLUMN_IDS,
  "group:defense": DEFENSIVE_COLUMN_IDS,
  "D/ST": DEFENSIVE_COLUMN_IDS,
}

export const columns: ColumnDef<ActiveRosterAthlete>[] = [
  ...baseColumns,
  ...passingColumns,
  ...rushingColumns,
  ...receivingColumns,
  ...defensiveColumns,
  ...fumbleColumns,
  ...kickingColumns,
]

function formatNumber(value?: number) {
  if (value === undefined) return "0"
  return numberFormatter.format(value)
}

function formatDecimal(value?: number) {
  const normalized = Number.isFinite(value ?? NaN) ? value ?? 0 : 0
  return decimalFormatter.format(normalized)
}

function formatMadeAttempt(value?: { made: number; attempts: number }) {
  if (!value) return "0-0"
  return `${value.made ?? 0}-${value.attempts ?? 0}`
}

function formatPercentage(value?: number) {
  const pct = Number.isFinite(value ?? 0) ? (value ?? 0) : 0
  return `${pct.toFixed(1)}%`
}
