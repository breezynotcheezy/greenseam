import { type NextRequest, NextResponse } from "next/server"
import * as XLSX from "xlsx"
import OpenAI from "openai"
import { db } from "@/lib/database"
import {
  chunkText,
  normalizeOutcome,
  normalizeBallType,
  normalizePlayerName,
  extractGameInfo,
  type ParsedPlay,
} from "@/lib/parse-utils"

export const runtime = "edge"

console.log("Parse API: Checking environment variables...")
console.log("OPENAI_API_KEY exists:", !!process.env.OPENAI_API_KEY)
console.log("OPENAI_API_KEY length:", process.env.OPENAI_API_KEY?.length || 0)

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  : null

console.log("OpenAI client created:", !!openai)

interface ProcessResult {
  inserted: number
  newPlayers: number
  teamName: string
}

async function processWithAI(chunk: string, gameInfo: any): Promise<ParsedPlay[]> {
  console.log("processWithAI called, openai client exists:", !!openai)

  // Require API key - no fallback
  if (!openai) {
    console.error("No OpenAI client available")
    throw new Error("OpenAI API key is required for data processing")
  }

  try {
    console.log("Making OpenAI API call...")
    const response = await openai.chat.completions.create({
      model: "ft:gpt-3.5-turbo-1106:greenchanger:greenseam3:BqjZCdoJ",
      messages: [
        {
          role: "system",
          content: `You are a GameChanger data parser. Extract baseball plate appearance data from the text and return ONLY a JSON array. Each object should have:
- playerName: string (player's full name)
- result: string (Hit, Out, K, Walk, HBP)
- bbType: string (Ground, Line, Fly) - optional
- gameDate: string (YYYY-MM-DD format) - optional
- inning: number - optional
- count: string (balls-strikes) - optional
- situation: string (runners on base, outs) - optional

Focus on extracting actual plate appearance outcomes, not just roster info or game setup.`,
        },
        {
          role: "user",
          content: `Parse this GameChanger data:

Game Info: ${JSON.stringify(gameInfo)}

Data:
${chunk}`,
        },
      ],
      temperature: 0.1,
      max_tokens: 1500,
    })

    console.log("OpenAI API call successful")
    const content = response.choices[0]?.message?.content
    if (!content) {
      console.log("No content in OpenAI response")
      return []
    }

    try {
      const plays = JSON.parse(content)
      console.log("Parsed plays:", plays.length)
      return Array.isArray(plays) ? plays : []
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", content)
      return []
    }
  } catch (error) {
    console.error("AI processing error:", error)
    throw error
  }
}

async function processTextData(text: string, teamName: string, chunkSize = 1500): Promise<ProcessResult> {
  console.log("processTextData called with teamName:", teamName)

  // Extract game information
  const gameInfo = extractGameInfo(text)
  console.log("Extracted game info:", gameInfo)

  // Use extracted team name if available
  if (gameInfo.teams && gameInfo.teams.length > 0 && !teamName) {
    teamName = gameInfo.teams[0]
  }

  // Upsert team
  const team = db.upsertTeam({
    name: teamName,
    color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
    emoji: ["⚾", "🏟️", "🥎", "🏆"][Math.floor(Math.random() * 4)],
  })

  console.log("Team created/updated:", team)

  // Split into chunks
  const chunks = chunkText(text, chunkSize)
  console.log("Text split into chunks:", chunks.length)

  let totalInserted = 0
  let newPlayersCount = 0
  const processedPlayers = new Set<string>()

  for (let i = 0; i < chunks.length; i++) {
    console.log(`Processing chunk ${i + 1}/${chunks.length}`)
    const chunk = chunks[i]
    const plays = await processWithAI(chunk, gameInfo)

    for (const play of plays) {
      if (!play.playerName || !play.result) continue

      try {
        // Upsert player
        const canonical = normalizePlayerName(play.playerName)
        const isNewPlayer = !processedPlayers.has(canonical)

        const player = db.upsertPlayer({
          name: play.playerName,
          canonical,
          teamId: team.id,
        })

        if (isNewPlayer) {
          processedPlayers.add(canonical)
          newPlayersCount++
        }

        // Insert plate appearance with enhanced data
        db.addPlateAppearance({
          playerId: player.id,
          result: normalizeOutcome(play.result),
          bbType: play.bbType ? normalizeBallType(play.bbType) : undefined,
          gameDate: play.gameDate || gameInfo.gameDate || new Date().toISOString().split("T")[0],
          inning: play.inning,
          count: play.count,
          situation: play.situation,
        })

        totalInserted++
      } catch (error) {
        console.error("Error processing play:", error, play)
      }
    }
  }

  console.log("Processing complete:", { totalInserted, newPlayersCount })

  return {
    inserted: totalInserted,
    newPlayers: newPlayersCount,
    teamName: team.name,
  }
}

async function parseExcelFile(buffer: ArrayBuffer, teamOverride?: string, chunkSize?: number) {
  const workbook = XLSX.read(buffer, { type: "array" })
  const results: ProcessResult[] = []

  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName]
    const text = XLSX.utils.sheet_to_csv(worksheet)

    if (text.trim()) {
      const teamName = teamOverride || sheetName
      const result = await processTextData(text, teamName, chunkSize)
      results.push(result)
    }
  }

  return results
}

async function parseTextFile(buffer: ArrayBuffer, teamName: string, chunkSize?: number) {
  const text = new TextDecoder().decode(buffer)
  return await processTextData(text, teamName, chunkSize)
}

export async function POST(request: NextRequest) {
  try {
    console.log("Parse API POST called")

    // Check for API key first
    if (!openai) {
      console.error("No OpenAI client - API key missing")
      return NextResponse.json({ error: "OpenAI API key is required" }, { status: 400 })
    }

    const contentType = request.headers.get("content-type") || ""
    console.log("Content type:", contentType)

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData()
      const file = formData.get("file") as File
      const teamOverride = formData.get("teamOverride") as string | null
      const chunkSize = Number.parseInt((formData.get("chunkSize") as string) || "1500")

      console.log("File upload:", file?.name, "Team:", teamOverride, "Chunk size:", chunkSize)

      if (!file) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 })
      }

      const buffer = await file.arrayBuffer()
      const fileName = file.name.toLowerCase()

      if (fileName.endsWith(".xlsx")) {
        const results = await parseExcelFile(buffer, teamOverride || undefined, chunkSize)
        return NextResponse.json({ results })
      } else if (fileName.endsWith(".txt") || fileName.endsWith(".csv")) {
        const teamName = teamOverride || file.name.replace(/\.[^/.]+$/, "")
        const result = await parseTextFile(buffer, teamName, chunkSize)
        return NextResponse.json(result)
      } else {
        return NextResponse.json({ error: "Unsupported file type" }, { status: 400 })
      }
    } else {
      const body = await request.json()
      const { rawText, teamOverride, chunkSize = 1500 } = body

      console.log("Raw text submission:", "Text length:", rawText?.length, "Team:", teamOverride)

      if (!rawText) {
        return NextResponse.json({ error: "No rawText provided" }, { status: 400 })
      }

      const teamName = teamOverride || "Unknown Team"
      const result = await processTextData(rawText, teamName, chunkSize)
      return NextResponse.json(result)
    }
  } catch (error) {
    console.error("Parse API error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
