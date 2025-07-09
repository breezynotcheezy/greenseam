import { NextRequest, NextResponse } from "next/server"
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

    // Get player and check if exists
    const player = db.getPlayer(playerId)
    if (!player) {
      console.error(`Player not found with ID: ${playerId}`)
      return NextResponse.json({ 
        insight: "Player data not available",
        recommendation: "Check if this player has sufficient data or try reimporting",
        strengths: ["Unknown"],
        weaknesses: ["Unknown"]
      })
    }

    // Get plate appearances and stats
    const plateAppearances = db.getPlateAppearances(playerId)
    const stats = db.getPlayerStats(0).find((s) => s.playerId === playerId)

    if (!stats || plateAppearances.length === 0) {
      console.error(`Player stats not found for ID: ${playerId} (${player.name})`)
      return NextResponse.json({ 
        insight: "Insufficient data for this player",
        recommendation: "Import more plate appearances for meaningful analysis",
        strengths: ["Limited data"],
        weaknesses: ["Sample size"]
      })
    }

    // Prepare detailed scouting data with specific numbers
    const recentPA = plateAppearances.slice(-10)
    const recentResults = recentPA.map(pa => pa.result)
    
    // Count recent outcomes
    const recentHits = recentResults.filter(r => r === "Hit").length
    const recentOuts = recentResults.filter(r => r === "Out").length
    const recentKs = recentResults.filter(r => r === "K").length
    const recentWalks = recentResults.filter(r => r === "Walk").length
    
    const scoutingReport = `
OPPONENT ANALYSIS: ${player.name} (${stats.team.name})

CURRENT STATISTICS (${stats.paCount} PA):
- Batting Average: ${stats.avg.toFixed(3)} (${stats.hits} hits in ${stats.paCount} PA)
- On-base Percentage: ${stats.obp.toFixed(3)}
- Slugging: ${stats.slg.toFixed(3)}
- OPS: ${stats.ops.toFixed(3)}
- Strikeout Rate: ${stats.kRate.toFixed(1)}% (${stats.strikeouts} strikeouts)
- Walk Rate: ${stats.bbRate.toFixed(1)}% (${stats.walks} walks)
- Ground Ball Rate: ${stats.gbPercent.toFixed(1)}%
- Line Drive Rate: ${stats.ldPercent.toFixed(1)}%
- Fly Ball Rate: ${stats.fbPercent.toFixed(1)}%
- Extra Base Hits: ${stats.doubles} doubles, ${stats.triples} triples, ${stats.homeRuns} home runs

RECENT PERFORMANCE (Last 10 PA):
- Recent Hits: ${recentHits}
- Recent Outs: ${recentOuts}
- Recent Strikeouts: ${recentKs}
- Recent Walks: ${recentWalks}
`

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a professional baseball scout providing concise, high-confidence insights for coaches about OPPOSING players. 
            
Based on the opponent data provided, you must return ONLY valid JSON in the following format:
{
  "insight": "ONE specific, data-backed observation about this opponent's weakness using exact numbers from the stats (1 sentence)",
  "recommendation": "ONE specific, actionable coaching suggestion to EXPLOIT this opponent's weakness (1 sentence)", 
  "strengths": ["strength1", "strength2"],
  "weaknesses": ["weakness1", "weakness2"]
}

The insight must focus on the opponent's vulnerabilities.
The recommendation must be a specific tactical approach to exploit the opponent's weakness.
Strengths should be brief (2-3 words each) - what your team should be cautious about.
Weaknesses should be brief (2-3 words each) - what your team should target.
Use ONLY the statistics provided.`
          },
          {
            role: "user",
            content: scoutingReport,
          },
        ],
        temperature: 0.2,
        max_tokens: 300,
        response_format: { type: "json_object" }
      })

      const content = response.choices[0]?.message?.content
      if (!content) {
        throw new Error("No insights generated")
      }

      // Parse the JSON response
      const insights = JSON.parse(content)
      return NextResponse.json(insights)
    } catch (aiError) {
      console.error("AI insights error:", aiError)
      
      // Fallback response with basic insights based on stats
      let insight = "Opponent shows exploitable tendencies in their batting approach."
      let recommendation = "Attack with pitches that counter their dominant ball contact pattern."
      const strengths = ["Recent performance"]
      const weaknesses = ["Predictable approach"]
      
      // Try to generate basic insights from stats
      if (stats.kRate > 20) {
        insight = `${player.name} has a high strikeout rate of ${stats.kRate.toFixed(1)}%.`
        recommendation = "Attack with breaking balls and high fastballs to induce swings and misses."
        weaknesses.push("High K-rate")
      } else if (stats.gbPercent > 50) {
        insight = `${player.name} hits ${stats.gbPercent.toFixed(1)}% ground balls.`
        recommendation = "Position infielders strategically and induce ground balls with low pitches."
        weaknesses.push("Ground ball heavy")
      }
      
      return NextResponse.json({
        insight,
        recommendation,
        strengths,
        weaknesses
      })
    }
  } catch (error) {
    console.error("Insights API error:", error)
    return NextResponse.json({ 
      insight: "Analysis currently unavailable",
      recommendation: "Try again later or check player data",
      strengths: ["Unknown"],
      weaknesses: ["Unknown"]
    })
  }
}
