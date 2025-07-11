import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { db } from '@/lib/database'
import { prisma } from '@/lib/prisma'
import { parsePlayResult, normalizePlayerName, extractPlaysFromText } from '@/lib/parse-utils'
import { ParsedPlay } from '@/lib/types'

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Maximum chunk size for OpenAI API
const MAX_CHUNK_SIZE = 2000

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

    // Use our improved parsing logic instead of OpenAI
    const plays = extractPlaysFromText(cleanText);
    
    // Apply our enhanced parsing to each play
    const enhancedPlays = plays.map(play => {
      const enhanced = parsePlayResult(play.result || '');
      return {
        ...play,
        ...enhanced
      };
    });

    // Remove duplicates
    const uniquePlays = removeDuplicates(enhancedPlays);

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
      const canonical = normalizePlayerName(play.playerName || '')

      // Create or update player
      const player = await prisma.player.upsert({
        where: { canonical },
        update: { teamId: team.id },
        create: {
          name: play.playerName || '',
          canonical,
          teamId: team.id,
        }
      })

      if (player.teamId !== team.id) {
        updatedPlayers++
      } else {
        newPlayers++
      }

      // Add plate appearance with enhanced data
      await prisma.plateAppearance.create({
        data: {
          playerId: player.id,
          result: play.result || '',
          bbType: play.bbType,
          gameDate: play.gameDate || new Date().toISOString().split('T')[0],
          inning: play.inning,
          count: play.count,
          pitchCount: play.pitchCount,
          inPlay: play.inPlay || false,
          exitVelocity: play.exitVelocity,
          launchAngle: play.launchAngle,
          distance: play.distance,
          location: play.location,
          contactType: play.contactType,
          pitchType: play.pitchType,
          rbi: play.rbi || 0,
          runs: play.runs || 0,
          isHomeRun: play.isHomeRun || play.type === 'homer',
          isStrikeout: play.isStrikeout || play.result === 'K',
          isWalk: play.isWalk || play.result === 'Walk',
          isHBP: play.isHBP || play.result === 'HBP',
          isSacFly: play.isSacFly || false,
          stolenBases: play.stolenBases || 0,
          caughtStealing: play.caughtStealing || 0,
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
