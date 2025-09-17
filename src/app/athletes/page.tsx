import Link from "next/link"

import { listActiveAthletes } from "@/lib/services/athlete-data"

import { AthletesTable } from "./athletes-table"

export const revalidate = 21600

export default async function AthletesPage() {
  const athletes = await listActiveAthletes()

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">NFL Players</h1>
        <p className="text-muted-foreground text-sm">
          Listing all active players returned from the ESPN core athletes endpoint. Data is cached for six hours and
          refreshed automatically in the background.
        </p>
        <p className="text-sm text-muted-foreground">
          <Link className="underline underline-offset-4" href="/">
            ← Back to home
          </Link>
        </p>
      </header>
      <AthletesTable data={athletes} />
    </div>
  )
}
