"use client"

import * as React from "react"
import { type Table } from "@tanstack/react-table"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import type { ActiveRosterAthlete } from "@/lib/services/athlete-data"

type FilterValue = {
  search?: string
  position?: string
}

interface AthletesToolbarProps {
  table: Table<ActiveRosterAthlete>
  positions: { label: string; value: string; members?: readonly string[] }[]
  selectedPosition?: string
  onPositionChange?: (value: string) => void
}

export function AthletesToolbar({ table, positions, selectedPosition, onPositionChange }: AthletesToolbarProps) {
  const column = table.getColumn("player")
  const filterValue = React.useMemo(
    () => (column?.getFilterValue() as FilterValue | undefined) ?? {},
    [column]
  )
  const searchValue = filterValue.search ?? ""
  const defaultGroup = positions.find((option) => option.value === "group:offense")
  const activePosition = selectedPosition ?? filterValue.position ?? defaultGroup?.value ?? positions[0]?.value ?? ""

  React.useEffect(() => {
    if (!column || !selectedPosition) return
    const currentFilter = (column.getFilterValue() as FilterValue | undefined) ?? {}
    if (currentFilter.position !== selectedPosition) {
      column.setFilterValue({
        ...currentFilter,
        position: selectedPosition,
      })
    }
  }, [column, selectedPosition])

  const updateFilter = React.useCallback(
    (next: FilterValue | undefined) => {
      column?.setFilterValue(next && (next.search || next.position) ? next : undefined)
    },
    [column]
  )

  const handleSearchChange = (value: string) => {
    const currentFilter = (column?.getFilterValue() as FilterValue | undefined) ?? {}
    const next: FilterValue = {
      ...currentFilter,
      search: value || undefined,
      position: currentFilter.position,
    }
    updateFilter(next)
  }

  const handlePositionChange = (value: string) => {
    const currentFilter = (column?.getFilterValue() as FilterValue | undefined) ?? {}
    const next: FilterValue = {
      search: currentFilter.search,
      position: value,
    }
    updateFilter(next)
    onPositionChange?.(value)
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative w-full sm:w-72">
        <Input
          placeholder="Search players..."
          className="h-9 w-full pr-9"
          value={searchValue}
          onChange={(event) => handleSearchChange(event.target.value)}
        />
        {searchValue && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground"
            onClick={() => handleSearchChange("")}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Clear search</span>
          </Button>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Select value={activePosition} onValueChange={handlePositionChange}>
          <SelectTrigger className="h-9 w-48">
            <SelectValue placeholder="Filter by position" />
          </SelectTrigger>
          <SelectContent align="end">
            {positions.map((position) => (
              <SelectItem key={position.value} value={position.value}>
                {position.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
