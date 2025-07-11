import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"
import { db } from "@/lib/database"
import { calculateStats } from "@/lib/stats";

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
    const player = await db.getPlayer(Number(playerId));
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
    const plateAppearances = await db.getPlateAppearances(Number(playerId));
    const stats = calculateStats(player.plateAppearances || []);

    if (!stats || !plateAppearances || plateAppearances.length === 0) {
      console.error(`Player stats not found for ID: ${playerId} (${player.name})`)
      return NextResponse.json({ 
        insight: "Insufficient data for this player",
        recommendation: "Import more plate appearances for meaningful analysis",
        strengths: ["Limited data"],
        weaknesses: ["Sample size"]
      })
    }

    // Prepare detailed scouting data with specific numbers
    const recentPA = plateAppearances.slice(-10);
    const recentResults = recentPA.map((pa: any) => pa.result);
    // Count recent outcomes
    const recentHits = recentResults.filter((r: string) => r === "Hit").length;
    const recentOuts = recentResults.filter((r: string) => r === "Out").length;
    const recentKs = recentResults.filter((r: string) => r === "K").length;
    const recentWalks = recentResults.filter((r: string) => r === "Walk").length;

    // Calculate confidence based on sample size
    let confidence = 0.3;
    if (stats.plateAppearances >= 30) confidence = 0.9;
    else if (stats.plateAppearances >= 10) confidence = 0.6;

    const safe = (val: any, digits = 3) => Number.isFinite(val) ? val.toFixed(digits) : (0).toFixed(digits);
    const scoutingReport = `
OPPONENT ANALYSIS: ${player.name} (${player.team?.name || 'Unknown Team'})

CURRENT STATISTICS (${stats.plateAppearances} PA):
- Batting Average: ${safe(stats.avg, 3)} (${stats.hits} hits in ${stats.plateAppearances} PA)
- On-base Percentage: ${safe(stats.obp, 3)}
- Slugging: ${safe(stats.slg, 3)}
- OPS: ${safe(stats.ops, 3)}
- Strikeout Rate: ${safe(stats.kRate, 1)}% (${stats.strikeouts} strikeouts)
- Walk Rate: ${safe(stats.bbRate, 1)}% (${stats.walks} walks)
- Ground Ball Rate: ${safe(stats.gbPercent, 1)}%
- Line Drive Rate: ${safe(stats.ldPercent, 1)}%
- Fly Ball Rate: ${safe(stats.fbPercent, 1)}%
- Extra Base Hits: ${stats.doubles} doubles, ${stats.triples} triples, ${stats.homeRuns} home runs

RECENT PERFORMANCE (Last 10 PA):
- Recent Hits: ${recentHits}
- Recent Outs: ${recentOuts}
- Recent Strikeouts: ${recentKs}
- Recent Walks: ${recentWalks}
- Confidence: ${confidence}
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
  "pitchingRecommendation": "ONE specific, actionable, real-life pitching recommendation (e.g., pitch type, location, count strategy, sequencing) to exploit this opponent's weakness (1 sentence)",
  "fieldingRecommendation": "ONE specific, actionable, real-life fielding/defensive alignment recommendation (e.g., infield/outfield shift, depth, positioning) to exploit this opponent's weakness (1 sentence)",
  "strengths": ["strength1", "strength2"],
  "weaknesses": ["weakness1", "weakness2"],
  "confidence": 0.0 // Confidence in your recommendations, 0 (low) to 1 (high)
}

The insight must focus on the opponent's vulnerabilities.
The pitchingRecommendation must be a specific, real-life tactical approach (pitch type, location, count, sequencing, etc.).
The fieldingRecommendation must be a specific, real-life defensive alignment or fielding tactic (shift, depth, etc.).
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
        max_tokens: 400,
        response_format: { type: "json_object" }
      })

      const content = response.choices[0]?.message?.content
      if (!content) {
        throw new Error("No insights generated")
      }

      // Parse the JSON response
      const insights = JSON.parse(content)
      // Ensure confidence is present and fallback to calculated if not
      if (typeof insights.confidence !== "number") insights.confidence = confidence;
      return NextResponse.json(insights)
    } catch (aiError) {
      console.error("AI insights error:", aiError)
      
      // Fallback response with basic insights based on stats
      let insight = "Opponent shows exploitable tendencies in their batting approach."
      let pitchingRecommendation = "Attack with pitches that counter their dominant ball contact pattern."
      let fieldingRecommendation = "Position fielders to match the opponent's most frequent contact type (e.g., shift infield for ground balls, play outfield deep for fly balls)."
      const strengths = ["Recent performance"]
      const weaknesses = ["Predictable approach"]
      
      // Try to generate basic insights from stats
      if (stats.kRate > 20) {
        insight = `${player.name} has a high strikeout rate of ${safe(stats.kRate, 1)}%.`
        pitchingRecommendation = "Use breaking balls and high fastballs, especially in two-strike counts, to induce swings and misses."
        fieldingRecommendation = "Play infielders back and outfielders at normal depth, as strikeouts reduce balls in play."
        weaknesses.push("High K-rate")
      } else if (stats.gbPercent > 50) {
        insight = `${player.name} hits ${safe(stats.gbPercent, 1)}% ground balls.`
        pitchingRecommendation = "Pitch low in the zone with sinkers or changeups to induce more ground balls."
        fieldingRecommendation = "Shift infielders toward the pull side and play infield at double-play depth."
        weaknesses.push("Ground ball heavy")
      }
      
      return NextResponse.json({
        insight,
        pitchingRecommendation,
        fieldingRecommendation,
        strengths,
        weaknesses,
        confidence
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
