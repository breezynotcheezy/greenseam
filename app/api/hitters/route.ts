import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"

// Format stat with leading zero and 3 decimal places
function formatStat(value: number): string {
  const formatted = value.toFixed(3)
  return value < 1 ? formatted.substring(1) : formatted
}

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
      avg: formatStat(stat.avg),
      kRate: Math.round(stat.kRate),
      gbPercent: Math.round(stat.gbPercent),
      ldPercent: Math.round(stat.ldPercent),
      fbPercent: Math.round(stat.fbPercent),
      obp: formatStat(stat.obp),
      slg: formatStat(stat.slg),
      ops: formatStat(stat.ops),
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
