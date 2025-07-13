import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { db } from '@/lib/database'
import { prisma } from '@/lib/prisma'
import { normalizePlayerName } from '@/lib/parse-utils'
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

    // Split into lines and filter out empty lines
    const lines = cleanText.split('\n').map(l => l.trim()).filter(Boolean);

    // Use OpenAI to extract player name and result for each play line
    const plays: ParsedPlay[] = [];
    console.log(`[DEBUG] Processing ${lines.length} lines`);
    
    for (const line of lines) {
      // Only skip obvious non-play lines
      if (/^(Top|Bottom) \d+(st|nd|rd|th)/i.test(line) || 
          /^\d+ Outs?$/i.test(line) || 
          /^WDST|^FRNT$/i.test(line) ||
          /^Ball \d+/i.test(line) ||
          /^Strike \d+/i.test(line) ||
          /^Foul$/i.test(line) ||
          /^In play\.?$/i.test(line) ||
          /^Lineup changed:/i.test(line)) {
        console.log(`[DEBUG] Skipping non-play line: "${line}"`);
        continue;
      }
      
      // Skip lines that are just result types without player context
      if (/^(Single|Double|Triple|Home\s+Run|Walk|Strikeout|Strike\s+Out|Fly\s+Out|Ground\s+Out|Pop\s+Out|Fielder'?s?\s+Choice|Infield\s+Fly|Error|Hit\s+by\s+Pitch|HBP)$/i.test(line)) {
        console.log(`[DEBUG] Skipping result-only line: "${line}"`);
        continue;
      }
      
      console.log(`[DEBUG] Processing line: "${line}"`);
      
      // Prompt OpenAI for structured extraction
      const prompt = `Extract the player name and categorize the play result from the following baseball play description. 

For the result, use these standardized categories:
- "Single" for any single hit
- "Double" for any double hit  
- "Triple" for any triple hit
- "Home Run" for any home run
- "Walk" for any walk or base on balls
- "Strikeout" for any strikeout (K)
- "Out" for any out (fly out, ground out, pop out, etc.)
- "Hit by Pitch" for HBP
- "Error" for reaching on error

Respond ONLY as JSON in the format: { "playerName": "...", "result": "..." }

Play: "${line}"`;
      try {
        const completion = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: 'You are a baseball play parser. Extract the player name and play result from the play description.' },
            { role: 'user', content: prompt }
          ],
          max_tokens: 100,
          temperature: 0,
        });
        const aiResponse = completion.choices[0]?.message?.content || '';
        console.log(`[DEBUG] OpenAI response: "${aiResponse}"`);
        
        let parsed;
        try {
          parsed = JSON.parse(aiResponse);
        } catch (e) {
          // Try to extract JSON from the response if it contains extra text
          const match = aiResponse.match(/\{[\s\S]*\}/);
          if (match) {
            parsed = JSON.parse(match[0]);
          } else {
            console.error(`[ERROR] Failed to parse OpenAI response: "${aiResponse}"`);
            throw new Error('AI did not return valid JSON');
          }
        }
        
        if (parsed && parsed.playerName && parsed.result) {
          console.log(`[DEBUG] Successfully parsed: Player="${parsed.playerName}", Result="${parsed.result}"`);
          
          // Calculate hit-related fields based on the AI's standardized result
          const result = parsed.result.toLowerCase();
          const isHit = result.includes('single') || result.includes('double') || result.includes('triple') || result.includes('home run');
          const isHomeRun = result.includes('home run');
          const isStrikeout = result.includes('strikeout') || result.includes('k');
          const isWalk = result.includes('walk');
          const isHBP = result.includes('hit by pitch') || result.includes('hbp');
          const isOut = result.includes('out');
          
          // Calculate bases for hits
          let bases = 0;
          if (result.includes('single')) bases = 1;
          else if (result.includes('double')) bases = 2;
          else if (result.includes('triple')) bases = 3;
          else if (result.includes('home run')) bases = 4;
          
          console.log(`[DEBUG] Calculated: isHit=${isHit}, bases=${bases}, result="${parsed.result}"`);
          
          plays.push({
            playerName: parsed.playerName,
            result: parsed.result,
            isHit,
            isError: false,
            bases,
            type: isHit ? (bases === 1 ? 'single' : bases === 2 ? 'double' : bases === 3 ? 'triple' : 'homer') : 'out',
            isHomeRun,
            isStrikeout,
            isWalk,
            isHBP,
          });
        } else {
          console.warn(`[WARN] Invalid parsed data:`, parsed);
        }
      } catch (err) {
        console.error('[ERROR] OpenAI extraction error for line:', line, err);
      }
    }
    
    console.log(`[DEBUG] Total plays extracted: ${plays.length}`);

    // Remove duplicates
    const uniquePlays = removeDuplicates(plays);
    console.log(`[DEBUG] Unique plays after deduplication:`, uniquePlays.length);
    console.log('[DEBUG] Plays to store:', JSON.stringify(uniquePlays, null, 2));

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
    const key = `${play.playerName}-${play.result}`
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
      if (!play.playerName || !play.result) {
        console.warn('[WARN] Skipping play with missing playerName or result:', play);
        continue;
      }
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

      // Always add plate appearance, even if only playerName and result are present
      await prisma.plateAppearance.create({
        data: {
          playerId: player.id,
          result: play.result || '',
          gameDate: new Date().toISOString().split('T')[0], // Today's date as default
          inPlay: play.isHit || play.result.toLowerCase().includes('out'),
          rbi: 0,
          runs: 0,
          isHomeRun: play.isHomeRun || false,
          isStrikeout: play.isStrikeout || false,
          isWalk: play.isWalk || false,
          isHBP: play.isHBP || false,
          isSacFly: false,
          stolenBases: 0,
          caughtStealing: 0,
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
