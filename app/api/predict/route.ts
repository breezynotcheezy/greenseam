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

    // Prepare recent performance data with specific details
    const recentPA = plateAppearances.slice(-10)
    const performanceData = recentPA
      .map(
        (pa, i) => `${i + 1}. ${pa.result}${pa.bbType ? ` (${pa.ballType})` : ""}${pa.count ? ` [${pa.count}]` : ""}`,
      )
      .join("\n")

    const predictionPrompt = `
PLAYER: ${player.name}
SEASON STATS: ${stats.avg.toFixed(3)} AVG, ${stats.kRate.toFixed(1)}% K-Rate, ${stats.gbPercent.toFixed(1)}% GB, ${stats.ldPercent.toFixed(1)}% LD, ${stats.fbPercent.toFixed(1)}% FB

LAST 10 PLATE APPEARANCES:
${performanceData}

Based on this specific data, predict the 3 most likely outcomes for the next plate appearance.`

    const response = await openai.chat.completions.create({
      model: "ft:gpt-3.5-turbo-1106:greenchanger:greenseam3:BqjZCdoJ",
      messages: [
        {
          role: "system",
          content: `You are a baseball analytics expert. Based on the specific recent performance and season statistics, predict the most likely outcomes.

Return ONLY valid JSON:
{
  "outcomes": [
    {"outcome": "Ground Out", "probability": 35},
    {"outcome": "Strikeout", "probability": 25}, 
    {"outcome": "Single", "probability": 20}
  ],
  "analysis": "Brief explanation using specific data from the player's tendencies."
}`,
        },
        {
          role: "user",
          content: predictionPrompt,
        },
      ],
      temperature: 0.2,
      max_tokens: 300,
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      return NextResponse.json({ error: "No prediction generated" }, { status: 500 })
    }

    try {
      const prediction = JSON.parse(content)
      return NextResponse.json(prediction)
    } catch (parseError) {
      console.error("Failed to parse prediction:", content)
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 })
    }
  } catch (error) {
    console.error("Predict API error:", error)
    return NextResponse.json({ error: "Failed to generate prediction" }, { status: 500 })
  }
}
