// In-memory database for storing game data
export interface Team {
  id: string
  name: string
  color?: string
  emoji?: string
}

export interface Player {
  id: string
  name: string
  teamId: string
  canonical: string
}

export interface PlateAppearance {
  id: string
  playerId: string
  result: string
  bbType?: string
  gameDate: string
  inning?: number
  count?: string
  situation?: string
}

export interface PlayerStats {
  playerId: string
  name: string
  team: Team
  paCount: number
  avg: number
  obp: number
  slg: number
  ops: number
  kRate: number
  bbRate: number
  gbPercent: number
  ldPercent: number
  fbPercent: number
  hits: number
  walks: number
  strikeouts: number
  doubles: number
  triples: number
  homeRuns: number
}

// In-memory storage
class Database {
  private teams: Map<string, Team> = new Map()
  private players: Map<string, Player> = new Map()
  private plateAppearances: Map<string, PlateAppearance> = new Map()

  // Team operations
  upsertTeam(team: Omit<Team, "id"> & { id?: string }): Team {
    const id = team.id || this.generateId()
    const existingTeam = Array.from(this.teams.values()).find((t) => t.name === team.name)

    if (existingTeam) {
      const updatedTeam = { ...existingTeam, ...team, id: existingTeam.id }
      this.teams.set(existingTeam.id, updatedTeam)
      return updatedTeam
    }

    const newTeam = { ...team, id }
    this.teams.set(id, newTeam)
    return newTeam
  }

  getTeams(): Team[] {
    return Array.from(this.teams.values())
  }

  getTeam(id: string): Team | undefined {
    return this.teams.get(id)
  }

  // Player operations
  upsertPlayer(player: Omit<Player, "id"> & { id?: string }): Player {
    const id = player.id || this.generateId()
    const existingPlayer = Array.from(this.players.values()).find((p) => p.canonical === player.canonical)

    if (existingPlayer) {
      const updatedPlayer = { ...existingPlayer, ...player, id: existingPlayer.id }
      this.players.set(existingPlayer.id, updatedPlayer)
      return updatedPlayer
    }

    const newPlayer = { ...player, id }
    this.players.set(id, newPlayer)
    return newPlayer
  }

  getPlayers(): Player[] {
    return Array.from(this.players.values())
  }

  getPlayer(id: string): Player | undefined {
    return this.players.get(id)
  }

  // Plate appearance operations
  addPlateAppearance(pa: Omit<PlateAppearance, "id">): PlateAppearance {
    const id = this.generateId()
    const plateAppearance = { ...pa, id }
    this.plateAppearances.set(id, plateAppearance)
    return plateAppearance
  }

  getPlateAppearances(playerId?: string): PlateAppearance[] {
    const pas = Array.from(this.plateAppearances.values())
    return playerId ? pas.filter((pa) => pa.playerId === playerId) : pas
  }

  // Calculate player stats
  getPlayerStats(minPA = 0): PlayerStats[] {
    const players = this.getPlayers()
    const stats: PlayerStats[] = []

    for (const player of players) {
      const pas = this.getPlateAppearances(player.id)
      const team = this.getTeam(player.teamId)

      if (pas.length < minPA || !team) continue

      const hits = pas.filter((pa) => pa.result === "Hit").length
      const walks = pas.filter((pa) => pa.result === "Walk").length
      const strikeouts = pas.filter((pa) => pa.result === "K").length
      const doubles = pas.filter((pa) => pa.result === "Hit" && pa.bbType === "2B").length
      const triples = pas.filter((pa) => pa.result === "Hit" && pa.bbType === "3B").length
      const homeRuns = pas.filter((pa) => pa.result === "Hit" && pa.bbType === "HR").length

      const ballTypes = pas.filter((pa) => pa.bbType && ["Ground", "Line", "Fly"].includes(pa.bbType))
      const groundBalls = ballTypes.filter((pa) => pa.bbType === "Ground").length
      const lineDrives = ballTypes.filter((pa) => pa.bbType === "Line").length
      const flyBalls = ballTypes.filter((pa) => pa.bbType === "Fly").length
      const totalBallTypes = groundBalls + lineDrives + flyBalls

      const avg = pas.length > 0 ? hits / pas.length : 0
      const obp = pas.length > 0 ? (hits + walks) / pas.length : 0
      const totalBases = hits + doubles + triples * 2 + homeRuns * 3
      const slg = pas.length > 0 ? totalBases / pas.length : 0

      stats.push({
        playerId: player.id,
        name: player.name,
        team,
        paCount: pas.length,
        avg,
        obp,
        slg,
        ops: obp + slg,
        kRate: pas.length > 0 ? (strikeouts / pas.length) * 100 : 0,
        bbRate: pas.length > 0 ? (walks / pas.length) * 100 : 0,
        gbPercent: totalBallTypes > 0 ? (groundBalls / totalBallTypes) * 100 : 0,
        ldPercent: totalBallTypes > 0 ? (lineDrives / totalBallTypes) * 100 : 0,
        fbPercent: totalBallTypes > 0 ? (flyBalls / totalBallTypes) * 100 : 0,
        hits,
        walks,
        strikeouts,
        doubles,
        triples,
        homeRuns,
      })
    }

    return stats
  }

  // Clear all data
  clear(): void {
    this.teams.clear()
    this.players.clear()
    this.plateAppearances.clear()
  }

  // Get database stats
  getStats() {
    return {
      teams: this.teams.size,
      players: this.players.size,
      plateAppearances: this.plateAppearances.size,
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9)
  }
}

// Singleton database instance
export const db = new Database()
