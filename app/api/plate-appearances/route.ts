import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const playerId = searchParams.get("id")
  const format = searchParams.get("format") || "json"

  if (!playerId) {
    return NextResponse.json({ error: "Player ID required" }, { status: 400 })
  }

  const player = db.getPlayer(playerId)
  if (!player) {
    return NextResponse.json({ error: "Player not found" }, { status: 404 })
  }

  const plateAppearances = db.getPlateAppearances(playerId)

  if (format === "csv") {
    const header = [
      "Player",
      "Result",
      "BBType",
      "GameDate",
      "Inning",
      "Count",
      "Situation",
    ]
    const rows = plateAppearances.map((pa) => [
      player.name,
      pa.result,
      pa.bbType ?? "",
      pa.gameDate,
      pa.inning ?? "",
      pa.count ?? "",
      pa.situation ?? "",
    ])
    const csv = [header, ...rows]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n")

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${player.name
          .replace(/\s+/g, "_")
          .toLowerCase()}_data.csv"`,
      },
    })
  }

  return NextResponse.json(plateAppearances)
}
