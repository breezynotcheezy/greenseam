import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const teamId = searchParams.get("teamId")
    const minPA = Number.parseInt(searchParams.get("minPA") || "0")

    let stats = db.getPlayerStats(minPA)

    // Filter by team if specified
    if (teamId && teamId !== "all") {
      stats = stats.filter((stat) => stat.team.id === teamId)
    }

    // Format for frontend
    const hitters = stats.map((stat) => ({
      id: stat.playerId,
      name: stat.name,
      team: stat.team,
      paCount: stat.paCount,
      avg: stat.avg.toFixed(3),
      kRate: Math.round(stat.kRate),
      gbPercent: Math.round(stat.gbPercent),
      ldPercent: Math.round(stat.ldPercent),
      fbPercent: Math.round(stat.fbPercent),
      obp: stat.obp.toFixed(3),
      slg: stat.slg.toFixed(3),
      ops: stat.ops.toFixed(3),
      bbRate: Math.round(stat.bbRate),
      hits: stat.hits,
      walks: stat.walks,
      strikeouts: stat.strikeouts,
      doubles: stat.doubles,
      triples: stat.triples,
      homeRuns: stat.homeRuns,
    }))

    return NextResponse.json(hitters)
  } catch (error) {
    console.error("Hitters API error:", error)
    return NextResponse.json({ error: "Failed to fetch hitters" }, { status: 500 })
  }
}
