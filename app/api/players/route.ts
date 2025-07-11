import { NextResponse } from 'next/server'
import { db } from '@/lib/database'
import { calculateStats } from '@/lib/stats'
import { BaseballStats } from '@/lib/types'
import { prisma } from "@/lib/prisma";

interface Player {
  id: number
  name: string
  team: {
    id: number
    name: string
    color: string | null
    emoji: string | null
  } | null
  plateAppearances: Array<{
    id: number
    playerId: number
    result: string
    bbType: string | null
    gameDate: string
    inning: number | null
    count: string | null
    pitchCount: number | null
    inPlay: boolean
    exitVelocity: number | null
    launchAngle: number | null
    distance: number | null
    location: string | null
    contactType: string | null
    pitchType: string | null
    rbi: number
    runs: number
    isHomeRun: boolean
    isStrikeout: boolean
    isWalk: boolean
    isHBP: boolean
    isSacFly: boolean
    stolenBases: number
    caughtStealing: number
    leverageIndex: number | null
    clutchSituation: string | null
    createdAt: Date
  }>
}

interface PlayerWithStats {
  id: string
  name: string
  team: {
    id: string
    name: string
    color: string | null
    emoji: string | null
  }
  stats: BaseballStats
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const teamId = searchParams.get('teamId')
    const minPA = parseInt(searchParams.get('minPA') || '0')

    // Get all players and their plate appearances
    const players = await db.getPlayers()

    // Calculate stats for each player
    const playersWithStats = players.map((player: Player): PlayerWithStats => {
      const stats = calculateStats(player.plateAppearances)
      
      return {
        id: player.id.toString(),
        name: player.name,
        team: {
          id: player.team?.id.toString() || '',
          name: player.team?.name || 'Unknown Team',
          color: player.team?.color || null,
          emoji: player.team?.emoji || null,
        },
        stats,
      }
    })

    // Filter by team and minimum plate appearances
    const filteredPlayers = playersWithStats
      .filter((player: PlayerWithStats) => !teamId || teamId === 'all' || player.team.id === teamId)
      .filter((player: PlayerWithStats) => player.stats.pa >= minPA)

    return NextResponse.json(filteredPlayers)
  } catch (error) {
    console.error('Error fetching players:', error)
    return NextResponse.json(
      { error: 'Failed to fetch players' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const { name, teamId } = await request.json()
    const player = await db.addPlayer(name, teamId)
    return NextResponse.json(player)
  } catch (error) {
    console.error('Error creating player:', error)
    return NextResponse.json(
      { error: 'Failed to create player' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const playerId = searchParams.get("id");

    if (!playerId) {
      return NextResponse.json({ error: "Player ID required" }, { status: 400 });
    }

    // First delete all plate appearances for this player
    await prisma.plateAppearance.deleteMany({
      where: { playerId: parseInt(playerId) },
    });

    // Then delete the player
    await prisma.player.delete({
      where: { id: parseInt(playerId) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete player:", error);
    return NextResponse.json(
      { error: "Failed to delete player" },
      { status: 500 }
    );
  }
} 