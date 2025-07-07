import { NextResponse } from "next/server"
import { db } from "@/lib/database"

export const runtime = "edge"

export async function GET() {
  try {
    const teams = db.getTeams().map((team) => ({
      ...team,
      _count: {
        players: db.getPlayers().filter((p) => p.teamId === team.id).length,
      },
    }))

    return NextResponse.json(teams)
  } catch (error) {
    console.error("Teams API error:", error)
    return NextResponse.json({ error: "Failed to fetch teams" }, { status: 500 })
  }
}
