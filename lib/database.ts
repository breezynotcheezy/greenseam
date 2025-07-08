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

export interface ImportResult {
  inserted: number
  newPlayers: number
  updatedPlayers: number
  teamName: string
}

// In-memory storage
class Database {
  private teams: Map<string, Team> = new Map()
  private players: Map<string, Player> = new Map()
  private plateAppearances: Map<string, PlateAppearance> = new Map()
  private lastImport: ImportResult | null = null

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

  getPlayerByCanonical(canonical: string): Player | undefined {
    return Array.from(this.players.values()).find((p) => p.canonical === canonical)
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

  // Process imported data and merge with existing records
  processImportedData(
    plays: Array<{
      playerName: string;
      result: string;
      bbType?: string;
      gameDate?: string;
      inning?: number;
      count?: string;
      situation?: string;
    }>,
    teamName: string
  ): ImportResult {
    // Create or get team
    const team = this.upsertTeam({
      name: teamName,
      color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
      emoji: ["⚾", "🏟️", "🥎", "🏆"][Math.floor(Math.random() * 4)],
    });

    let totalInserted = 0;
    let newPlayersCount = 0;
    let updatedPlayersCount = 0;
    const processedPlayers = new Set<string>();

    for (const play of plays) {
      if (!play.playerName || !play.result) continue;

      try {
        // Normalize player name
        const canonical = this.normalizePlayerName(play.playerName);
        
        // Check if player exists
        let player = this.getPlayerByCanonical(canonical);
        const isNewPlayer = !player;
        
        // Create or update player
        player = this.upsertPlayer({
          name: play.playerName,
          canonical,
          teamId: team.id,
        });

        if (isNewPlayer) {
          newPlayersCount++;
        } else if (!processedPlayers.has(canonical)) {
          updatedPlayersCount++;
        }
        
        processedPlayers.add(canonical);

        // Add plate appearance
        this.addPlateAppearance({
          playerId: player.id,
          result: this.normalizeOutcome(play.result),
          bbType: play.bbType ? this.normalizeBallType(play.bbType) : undefined,
          gameDate: play.gameDate || new Date().toISOString().split("T")[0],
          inning: play.inning,
          count: play.count,
          situation: play.situation,
        });

        totalInserted++;
      } catch (error) {
        console.error("Error processing play:", error, play);
      }
    }

    const result = {
      inserted: totalInserted,
      newPlayers: newPlayersCount,
      updatedPlayers: updatedPlayersCount,
      teamName: team.name,
    };

    this.lastImport = result;
    return result;
  }

  // Helper methods for data normalization
  private normalizePlayerName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  private normalizeOutcome(result: string): string {
    const OUTCOME_MAP: Record<string, string> = {
      // Hits
      single: "Hit",
      double: "Hit",
      triple: "Hit",
      "home run": "Hit",
      homerun: "Hit",
      hr: "Hit",
      "1b": "Hit",
      "2b": "Hit",
      "3b": "Hit",
      hit: "Hit",
    
      // Outs
      out: "Out",
      groundout: "Out",
      flyout: "Out",
      lineout: "Out",
      "pop out": "Out",
      "ground out": "Out",
      "fly out": "Out",
      "line out": "Out",
      "foul out": "Out",
    
      // Strikeouts
      strikeout: "K",
      "strike out": "K",
      k: "K",
      so: "K",
      "struck out": "K",
    
      // Walks
      walk: "Walk",
      bb: "Walk",
      "base on balls": "Walk",
      walked: "Walk",
    
      // Hit by pitch
      hbp: "HBP",
      "hit by pitch": "HBP",
    
      // Fielder's choice
      "fielders choice": "Out",
      "fielder's choice": "Out",
      fc: "Out",
    
      // Sacrifice
      "sac fly": "Out",
      "sacrifice fly": "Out",
      "sac bunt": "Out",
      "sacrifice bunt": "Out",
    };

    const normalized = result.toLowerCase().trim();
    return OUTCOME_MAP[normalized] || result;
  }

  private normalizeBallType(bbType: string): string | undefined {
    if (!bbType) return undefined;
    
    const BALL_TYPE_MAP: Record<string, string> = {
      ground: "Ground",
      fly: "Fly",
      line: "Line",
      popup: "Fly",
      "pop up": "Fly",
      grounder: "Ground",
      "ground ball": "Ground",
      "fly ball": "Fly",
      "line drive": "Line",
      liner: "Line",
      "2b": "2B",
      "3b": "3B",
      hr: "HR",
      "home run": "HR",
      double: "2B",
      triple: "3B",
      homerun: "HR",
    };
    
    const normalized = bbType.toLowerCase().trim();
    return BALL_TYPE_MAP[normalized] || bbType;
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

  // Get last import result
  getLastImport(): ImportResult | null {
    return this.lastImport;
  }

  // Clear all data
  clear(): void {
    this.teams.clear()
    this.players.clear()
    this.plateAppearances.clear()
    this.lastImport = null
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
