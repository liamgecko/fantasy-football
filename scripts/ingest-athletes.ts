import { buildAthleteSnapshot, saveAthleteSnapshot } from "../src/lib/services/athlete-data"

async function main() {
  console.log("Building athlete snapshot…")
  const snapshot = await buildAthleteSnapshot()
  await saveAthleteSnapshot(snapshot)
  console.log(
    `Snapshot saved with ${snapshot.players.length} players for season ${snapshot.season} (generated ${snapshot.generatedAt}).`
  )
}

main().catch((error) => {
  console.error("Failed to build snapshot", error)
  process.exit(1)
})
