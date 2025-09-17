import fs from "fs/promises"
import path from "path"

import { buildAthleteSnapshot } from "../src/lib/services/athlete-data"

const OUTPUT_PATH =
  process.env.ATHLETE_SNAPSHOT_PATH ?? path.join(process.cwd(), ".next", "cache", "athletes.json")

async function main() {
  console.log("Building athlete snapshot…")
  const start = process.hrtime.bigint()
  const snapshot = await buildAthleteSnapshot()
  const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000

  await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true })
  await fs.writeFile(OUTPUT_PATH, JSON.stringify(snapshot, null, 2), "utf-8")

  console.log(
    `Snapshot saved to ${OUTPUT_PATH} with ${snapshot.players.length} players for season ${snapshot.season} (generated ${snapshot.generatedAt}) in ${durationMs.toFixed(0)}ms.`
  )
}

main().catch((error) => {
  console.error("Failed to build snapshot", error)
  process.exit(1)
})
