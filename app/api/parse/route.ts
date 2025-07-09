import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"
import { db } from "@/lib/database"
import { importFormSchema } from "@/lib/validations"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

async function processWithAI(chunk: string, gameInfo: any): Promise<any[]> {
  console.log("processWithAI called, openai client exists:", !!openai)

  // Require API key - no fallback
  if (!openai) {
    console.error("No OpenAI client available")
    throw new Error("OpenAI API key is required for data processing")
  }

  try {
    console.log("Making OpenAI API call...")
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a GameChanger data parser. Extract EVERY baseball HITTING play from the text and return ONLY a JSON array within a JSON object with a "plays" key. Each object in the array should have:
- playerName: string (player's full name, as close as possible to the original)
- result: string (Hit, Out, K, Walk, HBP)
- bbType: string (Ground, Line, Fly, 1B, 2B, 3B, HR) - optional
- gameDate: string (YYYY-MM-DD format) - optional
- inning: number - optional
- count: string (balls-strikes) - optional
- situation: string (runners on base, outs) - optional

CRITICAL INSTRUCTIONS:
1. You MUST extract EVERY SINGLE PLAY from the text. Do not skip any plays.
2. Focus ONLY on the batter/hitter outcomes - ignore fielding information
3. Do NOT include fielder names or defensive players
4. When you see text like "H W singles on a ground ball to first baseman M L", extract ONLY data for the hitter H W
5. Process ONLY hitting/batting data
6. ALWAYS return your response in this exact JSON format: {"plays": [...array of play objects...]}
7. If you can't extract any valid plays, return {"plays": []}
8. GameChanger data often has player names in formats like "Last F" or "First L" - extract the full name
9. Pay special attention to lines that contain words like "singles", "doubles", "flies out", "grounds out", "walks", "hit by pitch", "reaches on"
10. If you see a line that looks like a play, extract it as a play. Do not skip any play lines.
11. If in doubt, extract the play as a hitting event.
12. NEVER skip a play just because it's in a format you haven't seen before.
13. NEVER skip a play just because you're unsure about some details - extract what you can.
14. PROCESS EVERY SINGLE LINE THAT LOOKS LIKE A PLAY.`,
        },
        {
          role: "user",
          content: chunk,
        },
      ],
      temperature: 0,
      response_format: { type: "json_object" },
    })

    console.log("OpenAI API response received")
    const content = response.choices[0].message.content
    if (!content) {
      throw new Error("No content returned from OpenAI")
    }

    try {
      // Parse the content as JSON
      const parsedContent = JSON.parse(content)
      
      console.log("Parsed OpenAI response (first 500 chars):", JSON.stringify(parsedContent).substring(0, 500))
      
      // Check if the parsed content has a 'plays' property that is an array
      if (parsedContent.plays && Array.isArray(parsedContent.plays)) {
        console.log(`Found ${parsedContent.plays.length} plays in the response`)
        return parsedContent.plays
      } else if (Array.isArray(parsedContent)) {
        console.log(`Found ${parsedContent.length} plays in the response (array format)`)
        return parsedContent
      } else {  
        console.error("Unexpected response format:", parsedContent)
        return [] // Return empty array instead of throwing
      }
    } catch (parseError) {
      console.error("Error parsing OpenAI response:", parseError)
      return [] // Return empty array instead of throwing
    }
  } catch (error) {
    console.error("Error in processWithAI:", error)
    // Don't throw, return empty array
    return []
  }
}

// Improved chunking: split on line boundaries and preserve context
function chunkTextByLines(text: string, chunkSize: number): string[] {
  const lines = text.split(/\r?\n/)
  const chunks: string[] = []
  let currentChunk: string[] = []
  let currentLength = 0
  let gameContext = ""
  
  // Extract game context from the first few lines (usually contains date, teams, etc.)
  const contextLines = lines.slice(0, 20).join("\n")
  if (contextLines.length > 0) {
    gameContext = contextLines + "\n\n--- Game Data ---\n\n"
  }
  
  for (const line of lines) {
    // If this line contains inning information, include it in every chunk
    if (line.match(/(top|bottom)\s+(\d+)|inning\s+(\d+)/i)) {
      if (currentChunk.length > 0) {
        chunks.push(gameContext + currentChunk.join("\n"))
        currentChunk = []
        currentLength = 0
      }
      gameContext = contextLines + "\n\n" + line + "\n\n--- Plays ---\n\n"
      continue
    }
    
    // If adding this line would exceed chunk size, save current chunk and start new one
    if (currentLength + line.length > chunkSize && currentChunk.length > 0) {
      chunks.push(gameContext + currentChunk.join("\n"))
      currentChunk = []
      currentLength = 0
    }
    
    currentChunk.push(line)
    currentLength += line.length
  }
  
  // Add the last chunk if there's anything left
  if (currentChunk.length > 0) {
    chunks.push(gameContext + currentChunk.join("\n"))
  }
  
  return chunks
}

async function parseExcelFile(buffer: ArrayBuffer, teamName?: string, chunkSize?: number) {
  // This function is no longer used as the API now handles text directly.
  // Keeping it for now in case it's called from elsewhere or for future use.
  // For now, it will return an empty array as it's not directly integrated into the POST handler.
  console.warn("parseExcelFile is deprecated and will return empty array.")
  return { results: [] }
}

async function processTextData(text: string, gameInfo: any, teamName: string, chunkSize = 4000) {
  try {
    console.log(`Processing text data for team: ${teamName}, text length: ${text.length} chars`)
    
    // Split text into chunks for processing
    const chunks = chunkTextByLines(text, chunkSize)
    console.log(`Split text into ${chunks.length} chunks`)
    
    // Process each chunk with AI
    const allPlays: any[] = []
    let processedChunks = 0
    
    for (const chunk of chunks) {
      const plays = await processWithAI(chunk, gameInfo)
      if (plays && Array.isArray(plays)) {
        allPlays.push(...plays)
      }
      processedChunks++
      console.log(`Processed chunk ${processedChunks}/${chunks.length}, found ${plays?.length || 0} plays`)
    }
    
    console.log(`Total plays found: ${allPlays.length}`)
    
    if (allPlays.length === 0) {
      console.log("No plays extracted from the text")
      return {
        success: true,
        message: "No plays were found in the imported data. Please check the format and try again.",
        plays: [],
        inserted: 0,
        newPlayers: 0,
        updatedPlayers: 0,
        teamName
      };
    }
    
    // Log some example plays
    if (allPlays.length > 0) {
      console.log("Example plays:", allPlays.slice(0, 3))
    }
    
    // Process the parsed plays to update the database
    const result = await db.processImportedData(allPlays, teamName)
    
    // Log database stats after import
    const dbStats = db.getStats()
    console.log("Database stats after import:", dbStats)
    
    // Check if players were actually added
    const players = db.getPlayers()
    console.log(`Total players in database: ${players.length}`)
    
    // Check if stats are being generated
    const stats = db.getPlayerStats(0)
    console.log(`Total player stats generated: ${stats.length}`)
    
    return {
      success: true,
      message: `Successfully processed ${allPlays.length} plays`,
      plays: allPlays,
      ...result
    }
  } catch (error) {
    console.error("Error processing text data:", error)
    throw error
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("Received parse request")
    
    // Check if it's a multipart form data (file upload) or JSON (raw text)
    const contentType = request.headers.get("content-type") || ""
    console.log("Content-Type:", contentType)
    
    let text: string
    let teamName: string | undefined
    let chunkSize: number = 4000

    if (contentType.includes("multipart/form-data")) {
      console.log("Processing multipart form data")
      const formData = await request.formData()
      const file = formData.get("file") as File
      
      if (!file) {
        console.error("No file provided in form data")
        return NextResponse.json({ error: "No file provided" }, { status: 400 })
      }

      text = await file.text()
      teamName = formData.get("teamOverride") as string || undefined
      chunkSize = Number(formData.get("chunkSize")) || 4000
      
      console.log("File processed, text length:", text.length)
    } else {
      console.log("Processing JSON request")
      const body = await request.json()
      console.log("Request body:", body)
      
      if (!body.rawText || typeof body.rawText !== 'string') {
        console.error("No valid text provided in JSON body")
        return NextResponse.json({ error: "No valid text provided" }, { status: 400 })
      }

      text = body.rawText
      teamName = body.teamOverride
      chunkSize = body.chunkSize || 4000
      
      console.log("JSON processed, text length:", text.length)
    }

    // Clean up the text
    text = text.replace(/<[^>]*>/g, '') // Remove HTML tags
             .replace(/\r\n/g, '\n')     // Normalize line endings
             .trim()

    if (!text) {
      console.error("No valid text content after cleaning")
      return NextResponse.json({ error: "No valid text content found after cleaning" }, { status: 400 })
    }

    console.log("Processing text with AI, length:", text.length)

    // Process the text data
    const result = await processTextData(text, {
      gameDate: new Date().toISOString().split('T')[0],
      teams: [teamName || "Unknown Team"]
    }, teamName || "Unknown Team", chunkSize)

    console.log("Processing complete, plays found:", result.plays?.length || 0)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error in parse route:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process data" },
      { status: 500 }
    )
  }
}
