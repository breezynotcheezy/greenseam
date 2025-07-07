import { NextResponse } from "next/server"
import { db } from "@/lib/database"

export const runtime = "nodejs"

export async function GET() {
  try {
    const stats = db.getStats()
    const teams = db.getTeams()

    // Create mock upload records based on current data
    const uploads = teams
      .map((team, index) => {
        const teamPlayers = db.getPlayers().filter((p) => p.teamId === team.id)
        const teamPAs = teamPlayers.reduce((total, player) => {
          return total + db.getPlateAppearances(player.id).length
        }, 0)

        return {
          id: index + 1,
          filename: `${team.name} Import`,
          plateAppearances: teamPAs,
          teamName: team.name,
          createdAt: new Date(Date.now() - index * 24 * 60 * 60 * 1000).toISOString(),
        }
      })
      .filter((upload) => upload.plateAppearances > 0)

    return NextResponse.json(uploads.slice(0, 10))
  } catch (error) {
    console.error("Uploads API error:", error)
    return NextResponse.json({ error: "Failed to fetch uploads" }, { status: 500 })
  }
}
