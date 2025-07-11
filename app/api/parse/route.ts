import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"
import { db } from "@/lib/database"
import { importFormSchema } from "@/lib/validations"

// Check for OpenAI API key
const OPENAI_API_KEY = process.env.OPENAI_API_KEY
if (!OPENAI_API_KEY) {
  console.warn("OpenAI API key is not configured")
}

const openai = OPENAI_API_KEY ? new OpenAI({
  apiKey: OPENAI_API_KEY,
}) : null

async function processWithAI(chunk: string, gameInfo: any): Promise<any[]> {
  console.log("processWithAI called with chunk:", chunk)

  // Require API key - return proper error
  if (!openai) {
    console.error("No OpenAI client available")
    throw new Error("OPENAI_API_KEY_MISSING")
  }

  try {
    console.log("Making OpenAI API call...")
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a baseball play-by-play parser. Extract all hitting plays from the text. You MUST return a JSON object with a "plays" array containing each play. Return EXACTLY ONE play per at-bat.

Example input: "Frank F strikes out. The player on first advances. John K flies out."
Expected output: {
  "plays": [
    {"playerName": "Frank F", "result": "K"},
    {"playerName": "John K", "result": "Out", "bbType": "Fly"}
  ]
}

Rules:
1. Return EXACTLY ONE play per at-bat - never duplicate plays
2. Use these exact values for "result":
   - "K" for strikeouts
   - "Out" for any kind of out (fly out, ground out, etc)
   - "Hit" for hits
   - "Walk" for walks
   - "HBP" for hit by pitch
3. Use these exact values for "bbType" (optional):
   - "Ground" for ground balls
   - "Line" for line drives
   - "Fly" for fly balls/pop ups
   - "1B" for singles
   - "2B" for doubles
   - "3B" for triples
   - "HR" for home runs

IMPORTANT: Each batter should appear EXACTLY ONCE per at-bat in the output.`
        },
        {
          role: "user",
          content: `Here is the play-by-play text to parse. Extract all hitting plays, with exactly one play per at-bat:

${chunk}`
        }
      ],
      temperature: 0,
      response_format: { type: "json_object" },
    })

    console.log("OpenAI API response received:", response)
    const content = response.choices[0].message.content
    if (!content) {
      console.error("No content in OpenAI response")
      throw new Error("No content returned from OpenAI")
    }

    console.log("Raw OpenAI response content:", content)

    try {
      // Parse the content as JSON
      const parsedContent = JSON.parse(content)
      console.log("Parsed OpenAI response:", JSON.stringify(parsedContent, null, 2))
      
      // Check if the parsed content has a 'plays' property that is an array
      if (parsedContent.plays && Array.isArray(parsedContent.plays)) {
        const plays = parsedContent.plays
        
        // Deduplicate plays by player name and result
        const uniquePlays = plays.reduce((acc: any[], play: any) => {
          const key = `${play.playerName}-${play.result}`
          if (!acc.some(p => `${p.playerName}-${p.result}` === key)) {
            acc.push(play)
          } else {
            console.log(`Skipping duplicate play for ${play.playerName}`)
          }
          return acc
        }, [])
        
        console.log(`Found ${uniquePlays.length} unique plays in the response:`, uniquePlays)
        return uniquePlays
      } else if (Array.isArray(parsedContent)) {
        console.log(`Found ${parsedContent.length} plays in array format:`, parsedContent)
        return parsedContent
      } else {
        console.error("Unexpected response format:", parsedContent)
        return []
      }
    } catch (parseError) {
      console.error("Error parsing OpenAI response:", parseError)
      console.error("Failed content:", content)
      return []
    }
  } catch (error) {
    console.error("Error in processWithAI:", error)
    if (error && typeof error === 'object' && 'response' in error) {
      console.error("OpenAI API error response:", (error as any).response.data)
    }
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

async function processTextData(text: string, gameInfo: any, teamName: string, chunkSize = 2000) {
  try {
    console.log(`Processing text data for team: ${teamName}, text length: ${text.length} chars`)
    console.log("Full text being processed:", text)
    
    // Clean up the text - remove extra whitespace and normalize line endings
    text = text.replace(/\r\n/g, '\n').replace(/\n+/g, '\n').trim()
    
    // Split text into chunks for processing
    const chunks = chunkTextByLines(text, chunkSize)
    console.log(`Split text into ${chunks.length} chunks`)
    
    // Process each chunk with AI
    const allPlays: any[] = []
    let processedChunks = 0
    
    for (const chunk of chunks) {
      console.log(`\nProcessing chunk ${processedChunks + 1}/${chunks.length}:`)
      console.log("Chunk content:", chunk)
      
      const plays = await processWithAI(chunk, gameInfo)
      if (plays && Array.isArray(plays)) {
        console.log(`Found ${plays.length} plays in chunk:`, JSON.stringify(plays, null, 2))
        allPlays.push(...plays)
      } else {
        console.log("No plays found in chunk or invalid response")
      }
      processedChunks++
      console.log(`Processed chunk ${processedChunks}/${chunks.length}, found ${plays?.length || 0} plays`)
    }
    
    console.log(`\nTotal plays found: ${allPlays.length}`)
    
    if (allPlays.length === 0) {
      console.log("No plays extracted from the text. Original text:", text)
      return {
        success: false,
        message: "No plays were found in the imported data. The text was processed but no valid baseball plays were detected. Please check that the text contains play-by-play data in a readable format.",
        plays: [],
        inserted: 0,
        newPlayers: 0,
        updatedPlayers: 0,
        teamName,
        debug: {
          textSample: text,
          chunkCount: chunks.length,
          chunks: chunks.map(chunk => ({ content: chunk }))
        }
      };
    }
    
    // Log some example plays
    if (allPlays.length > 0) {
      console.log("Example plays:", JSON.stringify(allPlays.slice(0, 3), null, 2))
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
    
    // Check for OpenAI API key first
    if (!OPENAI_API_KEY) {
      return NextResponse.json({ 
        error: "OpenAI API key is required for data processing. Please set the OPENAI_API_KEY environment variable.",
        code: "OPENAI_API_KEY_MISSING"
      }, { status: 400 })
    }
    
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
