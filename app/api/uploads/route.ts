import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"

export async function GET() {
  try {
    const teams = await prisma.team.findMany({
      include: {
        players: {
          include: {
            plateAppearances: true
          }
        }
      }
    })

    // Create mock upload records based on current data
    const uploads = teams
      .map((team: any, index: number) => {
        const teamPAs = team.players.reduce((total: number, player: any) => {
          return total + player.plateAppearances.length
        }, 0)

        return {
          id: index + 1,
          filename: `${team.name} Import`,
          plateAppearances: teamPAs,
          teamName: team.name,
          createdAt: new Date(Date.now() - index * 24 * 60 * 60 * 1000).toISOString(),
        }
      })
      .filter((upload: any) => upload.plateAppearances > 0)

    return NextResponse.json(uploads.slice(0, 10))
  } catch (error) {
    console.error("Uploads API error:", error)
    return NextResponse.json({ error: "Failed to fetch uploads" }, { status: 500 })
  }
}
