import { get_encoding } from "js-tiktoken"

// Enhanced outcome mapping for GameChanger data
export const OUTCOME_MAP = {
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
}

export const BALL_TYPE_MAP = {
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
}

export interface ParsedPlay {
  playerName: string
  result: string
  bbType?: string
  gameDate?: string
  inning?: number
  count?: string
  situation?: string
  pitchType?: string
  location?: string
}

export function normalizeOutcome(result: string): string {
  const normalized = result.toLowerCase().trim()
  return OUTCOME_MAP[normalized as keyof typeof OUTCOME_MAP] || result
}

export function normalizeBallType(bbType: string): string | undefined {
  if (!bbType) return undefined
  const normalized = bbType.toLowerCase().trim()
  return BALL_TYPE_MAP[normalized as keyof typeof BALL_TYPE_MAP] || bbType
}

export function countTokens(text: string): number {
  try {
    const encoding = get_encoding("cl100k_base")
    const tokens = encoding.encode(text)
    encoding.free()
    return tokens.length
  } catch (error) {
    return Math.ceil(text.length / 4)
  }
}

export function chunkText(text: string, maxTokens = 1500): string[] {
  const lines = text.split("\n")
  const chunks: string[] = []
  let currentChunk = ""

  for (const line of lines) {
    const testChunk = currentChunk + (currentChunk ? "\n" : "") + line

    if (countTokens(testChunk) > maxTokens && currentChunk) {
      chunks.push(currentChunk)
      currentChunk = line
    } else {
      currentChunk = testChunk
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk)
  }

  return chunks
}

export function normalizePlayerName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

// Enhanced GameChanger data extraction
export function extractGameInfo(text: string): {
  gameDate?: string
  teams?: string[]
  inning?: string
} {
  const lines = text.split("\n")
  let gameDate: string | undefined
  const teams: string[] = []
  let inning: string | undefined

  for (const line of lines) {
    // Extract date patterns
    const dateMatch = line.match(/(\d{1,2}\/\d{1,2}\/\d{2,4})|(\d{4}-\d{2}-\d{2})/)
    if (dateMatch && !gameDate) {
      gameDate = dateMatch[0]
    }

    // Extract team names
    const teamMatch = line.match(/vs\.?\s+([A-Za-z\s]+)|@\s+([A-Za-z\s]+)/)
    if (teamMatch) {
      const team = teamMatch[1] || teamMatch[2]
      if (team && !teams.includes(team.trim())) {
        teams.push(team.trim())
      }
    }

    // Extract inning info
    const inningMatch = line.match(/(top|bottom)\s+(\d+)|inning\s+(\d+)/i)
    if (inningMatch && !inning) {
      inning = inningMatch[0]
    }
  }

  return { gameDate, teams, inning }
}
