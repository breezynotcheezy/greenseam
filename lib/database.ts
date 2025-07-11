import { prisma } from './prisma'
import { PlateAppearance } from './stats'

export const db = {
  // Team methods
  async addTeam(name: string, color?: string, emoji?: string) {
    return prisma.team.create({
      data: {
        name,
        color,
        emoji,
      }
    })
  },

  async getTeam(id: number) {
    return prisma.team.findUnique({
      where: { id }
    })
  },

  async getTeams() {
    return prisma.team.findMany()
  },

  // Player methods
  async addPlayer(name: string, teamId?: number) {
    const canonical = name.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim()
    return prisma.player.create({
      data: {
        name,
        canonical,
        teamId,
      }
    })
  },

  async getPlayer(id: number) {
    return prisma.player.findUnique({
      where: { id },
      include: {
        team: true,
        plateAppearances: true,
      }
    })
  },

  async getPlayers() {
    return prisma.player.findMany({
      include: {
        team: true,
        plateAppearances: true,
      }
    })
  },

  // Plate Appearance methods
  async addPlateAppearance(playerId: number, data: Omit<PlateAppearance, 'id' | 'playerId' | 'createdAt'>) {
    return prisma.plateAppearance.create({
      data: {
        playerId,
        ...data,
      }
    })
  },

  async getPlateAppearances(playerId: number) {
    return prisma.plateAppearance.findMany({
      where: { playerId }
    })
  },
}
