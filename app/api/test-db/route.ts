import { NextResponse } from "next/server"
import { db } from "@/lib/database"

export const runtime = "nodejs"

export async function GET() {
  try {
    // Test database operations
    const testTeam = db.upsertTeam({
      name: "Test Team",
      color: "#ff0000",
      emoji: "⚾"
    })
    
    const testPlayer = db.upsertPlayer({
      name: "Test Player",
      canonical: "testplayer",
      teamId: testTeam.id
    })
    
    const testPA = db.addPlateAppearance({
      playerId: testPlayer.id,
      result: "Hit",
      bbType: "1B",
      gameDate: "2024-01-01"
    })
    
    const stats = db.getStats()
    const players = db.getPlayers()
    const teams = db.getTeams()
    const playerStats = db.getPlayerStats(0)
    
    return NextResponse.json({
      success: true,
      stats,
      players: players.length,
      teams: teams.length,
      playerStats: playerStats.length,
      testTeam,
      testPlayer,
      testPA
    })
  } catch (error) {
    console.error("Test DB error:", error)
    return NextResponse.json({ error: "Failed to test database" }, { status: 500 })
  }
} 