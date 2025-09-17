"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  Table as TanstackTable,
  useReactTable,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { DataTablePagination } from "./data-table-pagination"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  initialPageSize?: number
  toolbar?: (table: TanstackTable<TData>) => React.ReactNode
  emptyState?: (table: TanstackTable<TData>) => React.ReactNode
  defaultSorting?: SortingState
}

export function DataTable<TData, TValue>({
  columns,
  data,
  initialPageSize = 20,
  toolbar,
  emptyState,
  defaultSorting,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>(defaultSorting ?? [])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])

  const defaultSortingKey = React.useMemo(
    () => JSON.stringify(defaultSorting ?? []),
    [defaultSorting]
  )

  const previousDefaultSortingKey = React.useRef<string>(defaultSortingKey)

  React.useEffect(() => {
    if (previousDefaultSortingKey.current !== defaultSortingKey) {
      previousDefaultSortingKey.current = defaultSortingKey
      setSorting(defaultSorting ?? [])
    }
  }, [defaultSorting, defaultSortingKey])

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
    },
    initialState: {
      pagination: {
        pageSize: initialPageSize,
      },
      sorting: defaultSorting,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    manualPagination: false,
  })

  return (
    <div className="space-y-4">
      {toolbar?.(table)}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() ? "selected" : undefined}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-48 whitespace-normal p-6 text-center align-middle text-muted-foreground"
                >
                  {emptyState ? emptyState(table) : "No results."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />
    </div>
  )
}
