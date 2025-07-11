import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { db } from '@/lib/database'
import { prisma } from '@/lib/prisma'

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Maximum chunk size for OpenAI API
const MAX_CHUNK_SIZE = 2000

interface ParsedPlay {
  playerName: string
  result: string
  bbType?: string
  gameDate?: string
  inning?: number
  count?: string
  situation?: string
  pitchCount?: number
  inPlay: boolean
  exitVelocity?: number
  launchAngle?: number
  distance?: number
  location?: string
  contactType?: string
  pitchType?: string
  rbi: number
  runs: number
  isHomeRun: boolean
  isStrikeout: boolean
  isWalk: boolean
  isHBP: boolean
  isSacFly: boolean
  stolenBases: number
  caughtStealing: number
  leverageIndex?: number
  clutchSituation?: string
}

export async function POST(request: Request) {
  try {
    // Check for API key
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    let text: string;
    let teamName: string;

    // Check if the request is multipart form data
    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File;
      if (!file) {
        return NextResponse.json(
          { error: 'No file provided' },
          { status: 400 }
        );
      }
      text = await file.text();
      teamName = (formData.get('teamOverride') as string) || 'Unknown Team';
    } else {
      // Handle JSON request
      const body = await request.json();
      text = body.text || body.rawText;
      teamName = body.teamName || body.teamOverride || 'Unknown Team';
    }

    if (!text) {
      return NextResponse.json(
        { error: 'Missing required text data' },
        { status: 400 }
      );
    }

    // Clean up text
    const cleanText = text
      .replace(/\r\n/g, '\n')
      .replace(/\n+/g, '\n')
      .trim();

    // Split text into chunks
    const chunks = splitIntoChunks(cleanText, MAX_CHUNK_SIZE);
    const allPlays: ParsedPlay[] = [];

    // Process each chunk
    for (const chunk of chunks) {
      const plays = await parseChunk(chunk);
      allPlays.push(...plays);
    }

    // Remove duplicates
    const uniquePlays = removeDuplicates(allPlays);

    // Store plays in database
    const result = await storePlays(uniquePlays, teamName);

    return NextResponse.json({
      ...result,
      plays: uniquePlays,
      success: true
    });
  } catch (error: any) {
    console.error('Parse API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to parse text', success: false },
      { status: 500 }
    );
  }
}

async function parseChunk(text: string): Promise<ParsedPlay[]> {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `You are a baseball statistician that extracts play-by-play data. For each plate appearance, extract:
- Player name
- Result (Hit, Out, K, Walk, HBP)
- Ball type (Ground, Line, Fly, 2B, 3B, HR)
- Game situation (inning, count, runners on base)
- Advanced metrics (exit velocity, launch angle, contact quality)
- Base running (stolen bases, caught stealing)
- Run production (RBI, runs scored)

Format each play as a JSON object with these fields:
{
  playerName: string,
  result: string,
  bbType?: string,
  gameDate?: string,
  inning?: number,
  count?: string,
  situation?: string,
  pitchCount?: number,
  inPlay: boolean,
  exitVelocity?: number,
  launchAngle?: number,
  distance?: number,
  location?: string,
  contactType?: string,
  pitchType?: string,
  rbi: number,
  runs: number,
  isHomeRun: boolean,
  isStrikeout: boolean,
  isWalk: boolean,
  isHBP: boolean,
  isSacFly: boolean,
  stolenBases: number,
  caughtStealing: number,
  leverageIndex?: number,
  clutchSituation?: string
}

Return an array of these objects, one for each plate appearance.

Example input:
"Frank F strikes out. The player on first advances to second on a stolen base. John K is up next. John K hits a pop fly to center field and gets out."

Example output:
[
  {
    "playerName": "Frank F",
    "result": "K",
    "isStrikeout": true,
    "inPlay": false,
    "rbi": 0,
    "runs": 0,
    "isHomeRun": false,
    "isWalk": false,
    "isHBP": false,
    "isSacFly": false,
    "stolenBases": 0,
    "caughtStealing": 0
  },
  {
    "playerName": "John K",
    "result": "Out",
    "bbType": "Fly",
    "location": "CF",
    "inPlay": true,
    "contactType": "Medium",
    "rbi": 0,
    "runs": 0,
    "isHomeRun": false,
    "isStrikeout": false,
    "isWalk": false,
    "isHBP": false,
    "isSacFly": false,
    "stolenBases": 0,
    "caughtStealing": 0
  }
]`
        },
        {
          role: 'user',
          content: text
        }
      ],
      temperature: 0,
    })

    const result = completion.choices[0]?.message?.content
    if (!result) {
      throw new Error('No response from OpenAI')
    }

    try {
      return JSON.parse(result)
    } catch (error) {
      console.error('Failed to parse OpenAI response:', result)
      throw new Error('Invalid response format from OpenAI')
    }
  } catch (error: any) {
    console.error('OpenAI API error:', error)
    throw new Error(error.message || 'Failed to parse chunk')
  }
}

function splitIntoChunks(text: string, maxSize: number): string[] {
  const chunks: string[] = []
  const sentences = text.split(/[.!?]+\s+/)
  let currentChunk = ''

  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length > maxSize) {
      if (currentChunk) chunks.push(currentChunk.trim())
      currentChunk = sentence
    } else {
      currentChunk += (currentChunk ? ' ' : '') + sentence
    }
  }

  if (currentChunk) chunks.push(currentChunk.trim())
  return chunks
}

function removeDuplicates(plays: ParsedPlay[]): ParsedPlay[] {
  const seen = new Set<string>()
  return plays.filter(play => {
    const key = `${play.playerName}-${play.result}-${play.bbType || ''}-${play.inning || ''}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

async function storePlays(plays: ParsedPlay[], teamName: string): Promise<any> {
  let totalInserted = 0
  let newPlayers = 0
  let updatedPlayers = 0

  // Create or get team
  const team = await prisma.team.upsert({
    where: { name: teamName },
    update: {},
    create: {
      name: teamName,
      color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
      emoji: ["⚾", "🏟️", "🥎", "🏆"][Math.floor(Math.random() * 4)],
    }
  })

  for (const play of plays) {
    try {
      // Normalize player name
      const canonical = normalizePlayerName(play.playerName)

      // Create or update player
      const player = await prisma.player.upsert({
        where: { canonical },
        update: { teamId: team.id },
        create: {
          name: play.playerName,
          canonical,
          teamId: team.id,
        }
      })

      if (player.teamId !== team.id) {
        updatedPlayers++
      } else {
        newPlayers++
      }

      // Add plate appearance
      await prisma.plateAppearance.create({
        data: {
          playerId: player.id,
          result: play.result,
          bbType: play.bbType,
          gameDate: play.gameDate || new Date().toISOString().split('T')[0],
          inning: play.inning,
          count: play.count,
          pitchCount: play.pitchCount,
          inPlay: play.inPlay,
          exitVelocity: play.exitVelocity,
          launchAngle: play.launchAngle,
          distance: play.distance,
          location: play.location,
          contactType: play.contactType,
          pitchType: play.pitchType,
          rbi: play.rbi,
          runs: play.runs,
          isHomeRun: play.isHomeRun,
          isStrikeout: play.isStrikeout,
          isWalk: play.isWalk,
          isHBP: play.isHBP,
          isSacFly: play.isSacFly,
          stolenBases: play.stolenBases,
          caughtStealing: play.caughtStealing,
          leverageIndex: play.leverageIndex,
          clutchSituation: play.clutchSituation,
        }
      })

      totalInserted++
    } catch (error) {
      console.error('Error processing play:', error, play)
    }
  }

  return {
    inserted: totalInserted,
    newPlayers,
    updatedPlayers,
    teamName: team.name,
  }
}

function normalizePlayerName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}
