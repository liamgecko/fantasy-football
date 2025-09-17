"use client"

import * as React from "react"

import { DataTable } from "@/components/data-table/data-table"
import type { SortingState } from "@tanstack/react-table"
import type { ActiveRosterAthlete } from "@/lib/services/athlete-data"
import { Button } from "@/components/ui/button"

import { columns, POSITION_FILTER_DEFINITIONS, COLUMN_PRESETS, ALWAYS_VISIBLE_COLUMNS } from "./columns"
import { AthletesToolbar } from "./toolbar"

const numberFormatter = Intl.NumberFormat("en-US")

type AthletesTableProps = {
  data: ActiveRosterAthlete[]
}

function normalizePositionAbbreviation(value?: string) {
  if (!value) return undefined
  if (value.toUpperCase() === "DST") {
    return "D/ST"
  }
  return value
}

export function AthletesTable({ data }: AthletesTableProps) {
  const positionOptions = React.useMemo(() => {
    const availablePositions = new Set(
      data.map((athlete) => normalizePositionAbbreviation(athlete.position?.abbreviation)).filter(Boolean)
    )

    return POSITION_FILTER_DEFINITIONS.filter((definition) =>
      definition.members.some((member) => availablePositions.has(member))
    ).map((definition) => ({
      label: definition.label,
      value: definition.value,
      members: [...definition.members],
    }))
  }, [data])

  const [activePosition, setActivePosition] = React.useState<string | undefined>(undefined)

  React.useEffect(() => {
    if (!positionOptions.length) return
    const currentExists = positionOptions.some((option) => option.value === activePosition)
    if (activePosition && currentExists) {
      return
    }
    const preferred = positionOptions.find((option) => option.value === "group:offense")
    setActivePosition(preferred?.value ?? positionOptions[0]?.value)
  }, [activePosition, positionOptions])

  const { visibleColumnIds, orderedColumnIds } = React.useMemo(() => {
    if (!activePosition) {
      return { visibleColumnIds: undefined, orderedColumnIds: undefined as string[] | undefined }
    }
    const preset = COLUMN_PRESETS[activePosition]
    if (!preset) {
      return { visibleColumnIds: undefined, orderedColumnIds: undefined as string[] | undefined }
    }
    const ids = [...ALWAYS_VISIBLE_COLUMNS, ...preset]
    return {
      visibleColumnIds: new Set<string>(ids),
      orderedColumnIds: ids,
    }
  }, [activePosition])

  const resolvedColumns = React.useMemo(() => {
    if (!visibleColumnIds || !orderedColumnIds) {
      return columns
    }

    const columnMap = new Map<string, (typeof columns)[number]>()
    columns.forEach((column) => {
      if (typeof column.id === "string") {
        columnMap.set(column.id, column)
      }
    })

    const ordered = orderedColumnIds
      .map((id) => columnMap.get(id))
      .filter((column): column is (typeof columns)[number] => Boolean(column))

    return ordered
  }, [orderedColumnIds, visibleColumnIds])

  const defaultSorting: SortingState = React.useMemo(() => {
    // Default to fantasy points for all positions
    return [
      {
        id: "fantasyPoints",
        desc: true,
      },
    ]
  }, [])

  return (
    <>
      <DataTable
        key={activePosition}
        columns={[...resolvedColumns]}
        data={data}
        initialPageSize={20}
        toolbar={(table) => (
          <AthletesToolbar
            table={table}
            positions={positionOptions}
            selectedPosition={activePosition}
            onPositionChange={(value) => {
              setActivePosition(value)
            }}
          />
        )}
        defaultSorting={defaultSorting}
        emptyState={(table) => (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-sm">
            <span className="font-medium text-foreground">No players match your filters.</span>
            <span className="text-muted-foreground">
              Try a different search term or position.
            </span>
            {table.getState().columnFilters.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  table.resetColumnFilters()
                  table.resetSorting()
                }}
              >
                Clear filters
              </Button>
            )}
          </div>
        )}
      />
      <p className="mt-4 text-xs text-muted-foreground">
        Showing {numberFormatter.format(data.length)} active players returned by ESPN.
      </p>
    </>
  )
}
