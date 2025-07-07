import { type NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"
import { db } from "@/lib/database"

export const runtime = "nodejs"

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  : null

export async function GET(request: NextRequest) {
  try {
    // Require API key - no fallback
    if (!openai) {
      return NextResponse.json({ error: "OpenAI API key required" }, { status: 400 })
    }

    const { searchParams } = new URL(request.url)
    const playerId = searchParams.get("id")

    if (!playerId) {
      return NextResponse.json({ error: "Player ID required" }, { status: 400 })
    }

    const player = db.getPlayer(playerId)
    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 })
    }

    const plateAppearances = db.getPlateAppearances(playerId)
    const stats = db.getPlayerStats().find((s) => s.playerId === playerId)

    if (!stats) {
      return NextResponse.json({ error: "Player stats not found" }, { status: 404 })
    }

    // Prepare detailed scouting data with specific numbers
    const recentPA = plateAppearances.slice(-15)
    const situationalData = recentPA.map((pa) => ({
      result: pa.result,
      ballType: pa.bbType,
      count: pa.count,
      situation: pa.situation,
      inning: pa.inning,
    }))

    const scoutingReport = `
PLAYER ANALYSIS: ${player.name} (${stats.team.name})

CURRENT STATISTICS (${stats.paCount} PA):
- Batting Average: ${stats.avg.toFixed(3)} (${stats.hits} hits in ${stats.paCount} PA)
- Strikeout Rate: ${stats.kRate.toFixed(1)}% (${stats.strikeouts} strikeouts)
- Walk Rate: ${stats.bbRate.toFixed(1)}% (${stats.walks} walks)
- Ground Ball Rate: ${stats.gbPercent.toFixed(1)}%
- Line Drive Rate: ${stats.ldPercent.toFixed(1)}%
- Fly Ball Rate: ${stats.fbPercent.toFixed(1)}%
- Extra Base Hits: ${stats.doubles} 2B, ${stats.triples} 3B, ${stats.homeRuns} HR

LAST 15 PLATE APPEARANCES:
${situationalData.map((pa, i) => `${i + 1}. ${pa.result}${pa.ballType ? ` (${pa.ballType})` : ""}${pa.count ? ` [${pa.count}]` : ""}`).join("\n")}
`

    const response = await openai.chat.completions.create({
      model: "ft:gpt-3.5-turbo-1106:greenchanger:greenseam3:BqjZCdoJ",
      messages: [
        {
          role: "system",
          content: `You are a professional baseball scout. Based on the specific data provided, give:

1. insight: ONE high-confidence observation using specific numbers from the data (1 sentence)
2. recommendation: ONE specific, actionable coaching suggestion based on the data (1 sentence)
3. strengths: Array of 2-4 key strengths (2-3 words each)
4. weaknesses: Array of 1-3 areas for improvement (2-3 words each)

Use ONLY the specific statistics provided. Be precise and reference actual numbers.

Return ONLY valid JSON:
{
  "insight": "Single specific insight with numbers",
  "recommendation": "Single specific coaching recommendation", 
  "strengths": ["strength1", "strength2"],
  "weaknesses": ["weakness1", "weakness2"]
}`,
        },
        {
          role: "user",
          content: scoutingReport,
        },
      ],
      temperature: 0.2,
      max_tokens: 400,
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      return NextResponse.json({ error: "No insights generated" }, { status: 500 })
    }

    try {
      const insights = JSON.parse(content)
      return NextResponse.json(insights)
    } catch (parseError) {
      console.error("Failed to parse AI insights:", content)
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 })
    }
  } catch (error) {
    console.error("Insights API error:", error)
    return NextResponse.json({ error: "Failed to generate insights" }, { status: 500 })
  }
}
