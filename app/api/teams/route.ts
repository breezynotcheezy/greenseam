import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const teams = await prisma.team.findMany({
      include: {
        _count: {
          select: {
            players: true
          }
        }
      }
    })
    
    // Convert IDs to strings for frontend compatibility
    const teamsWithStringIds = teams.map((team: any) => ({
      ...team,
      id: team.id.toString()
    }))
    
    return NextResponse.json(teamsWithStringIds)
  } catch (error) {
    console.error('Error fetching teams:', error)
    return NextResponse.json(
      { error: 'Failed to fetch teams' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const { name, color, emoji } = await request.json()
    const team = await prisma.team.create({
      data: {
        name,
        color,
        emoji
      }
    })
    return NextResponse.json(team)
  } catch (error) {
    console.error('Error creating team:', error)
    return NextResponse.json(
      { error: 'Failed to create team' },
      { status: 500 }
    )
  }
}
