import { ParsedPlay } from "./types";

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
  singles: "Hit",
  doubles: "Hit",
  triples: "Hit",
  "home runs": "Hit",

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
  popout: "Out",
  "grounded out": "Out",
  "flied out": "Out",
  "lined out": "Out",
  "popped out": "Out",
  "grounded into double play": "Out",
  "gidp": "Out",
  "double play": "Out",

  // Strikeouts
  strikeout: "K",
  "strike out": "K",
  k: "K",
  so: "K",
  "struck out": "K",
  "struck out looking": "K",
  "struck out swinging": "K",

  // Walks
  walk: "Walk",
  bb: "Walk",
  "base on balls": "Walk",
  walked: "Walk",
  "intentional walk": "Walk",
  "ibb": "Walk",

  // Hit by pitch
  hbp: "HBP",
  "hit by pitch": "HBP",
  "hit by the pitch": "HBP",

  // Fielder's choice
  "fielders choice": "Out",
  "fielder's choice": "Out",
  fc: "Out",
  "reached on fielder's choice": "Out",

  // Sacrifice
  "sac fly": "Out",
  "sacrifice fly": "Out",
  "sac bunt": "Out",
  "sacrifice bunt": "Out",
  sf: "Out",
  sb: "Out",
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
  "2b": "2B",
  "3b": "3B",
  hr: "HR",
  "home run": "HR",
  double: "2B",
  triple: "3B",
  homerun: "HR",
  "double to left": "2B",
  "double to right": "2B",
  "double to center": "2B",
  "triple to left": "3B",
  "triple to right": "3B",
  "triple to center": "3B",
  "home run to left": "HR",
  "home run to right": "HR",
  "home run to center": "HR",
}

// ParsedPlay interface is now defined in types.ts

// Utility functions for parsing GameChanger data

/**
 * Extracts player names from the top of the input text
 * @param text The input text to parse
 * @returns Array of player names found at the top
 */
export function extractPlayerNamesFromHeader(text: string): string[] {
  // Look for player names at the top of the text, often in format "Name X, Number"
  const lines = text.split('\n').slice(0, 30); // Look at first 30 lines
  const playerNames: string[] = [];
  
  // Multiple patterns to match player listings at the top
  const playerPatterns = [
    /^([A-Za-z]+\s+[A-Za-z])[,\s]+(\d+)(?:\s*Remove filter)?$/,  // "Name X, 99"
    /^([A-Za-z]+\s+[A-Za-z])[,\s]+#(\d+)(?:\s*Remove filter)?$/, // "Name X, #99"
    /^(\d+)[,\s]+([A-Za-z]+\s+[A-Za-z])(?:\s*Remove filter)?$/,  // "99, Name X"
    /^#(\d+)[,\s]+([A-Za-z]+\s+[A-Za-z])(?:\s*Remove filter)?$/, // "#99, Name X"
    /^([A-Za-z]+\s+[A-Za-z])$/,                                  // Just "Name X"
    /^Player:\s+([A-Za-z]+\s+[A-Za-z])$/,                        // "Player: Name X"
    /^([A-Za-z]+\s+[A-Za-z]+\s+[A-Za-z])$/                       // "First Middle Last"
  ];
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Skip empty lines
    if (!trimmedLine) continue;
    
    // Check for section headers that indicate we're past the player list
    if (trimmedLine.includes("Clear filter") || 
        trimmedLine.includes("Chronological") ||
        trimmedLine.includes("Date Range") ||
        trimmedLine.includes("Game Log")) {
      break;
    }
    
    // Try each pattern
    let matched = false;
    for (const pattern of playerPatterns) {
      const match = trimmedLine.match(pattern);
      if (match) {
        // Different patterns have the name in different capture groups
        const name = match[1].includes(' ') ? match[1] : (match[2] || match[1]);
        if (name && name.includes(' ')) { // Ensure it's a full name with space
          playerNames.push(name.trim());
          matched = true;
          break;
        }
      }
    }
    
    // If no pattern matched but the line has 2-3 words, it might be a name
    if (!matched && /^[A-Za-z]+\s+[A-Za-z]+(\s+[A-Za-z]+)?$/.test(trimmedLine)) {
      playerNames.push(trimmedLine);
    }
  }
  
  // Remove duplicates
  return [...new Set(playerNames)];
}

/**
 * Filter plays to only include those for specific players
 * @param plays Array of parsed plays
 * @param playerNames Array of player names to include
 * @returns Filtered array of plays
 */
export function filterPlaysByPlayerNames(plays: ParsedPlay[], playerNames: string[]): ParsedPlay[] {
  if (!playerNames || playerNames.length === 0) {
    return plays;
  }
  
  // Normalize all player names for better matching
  const normalizedTargetNames = playerNames.map(name => normalizePlayerName(name));
  
  return plays.filter(play => {
    if (!play.playerName) return false;
    
    const normalizedPlayName = normalizePlayerName(play.playerName);
    
    // Check if any of the normalized player names match
    return normalizedTargetNames.some(targetName => {
      // Check for exact match
      if (normalizedPlayName === targetName) return true;
      
      // Check for partial matches (first name, last name, etc.)
      const playNameParts = normalizedPlayName.split(' ');
      const targetNameParts = targetName.split(' ');
      
      // If first and last names match
      if (playNameParts[0] === targetNameParts[0] && 
          playNameParts[playNameParts.length-1] === targetNameParts[targetNameParts.length-1]) {
        return true;
      }
      
      // If the play name contains the target name or vice versa
      if (normalizedPlayName.includes(targetName) || targetName.includes(normalizedPlayName)) {
        return true;
      }
      
      return false;
    });
  });
}

// Classify hits and errors
export function parsePlayResult(text: string): ParsedPlay {
  // Check if the text is just a result type, not a player action
  const resultOnlyPatterns = [
    /^(Single|Double|Triple|Home\s+Run|Walk|Strikeout|Strike\s+Out|Fly\s+Out|Ground\s+Out|Pop\s+Out|Fielder'?s?\s+Choice|Infield\s+Fly|Error|Hit\s+by\s+Pitch|HBP|Hit|Out|K)$/i,
    /^\d+\s+Outs?$/i,
    /^In\s+play\.$/i
  ];
  
  for (const pattern of resultOnlyPatterns) {
    if (pattern.test(text)) {
      console.log(`[DEBUG] parsePlayResult: Text "${text}" is just a result, not a player action`);
      return {
        playerName: "Unknown Player",
        result: text,
        isHit: false,
        isError: false,
        bases: 0,
        type: "out"
      };
    }
  }

  const result: ParsedPlay = {
    playerName: text.split(" ")[0],
    result: text,
    isHit: false,
    isError: false,
    bases: 0,
    type: "out"
  };

  // Detect hits (e.g., "hits a single", "hits a ground ball")
  if (
    text.includes("hits a single") ||
    text.includes("hits a ground ball") ||
    text.includes("hits a line drive") ||
    text.includes("singled") ||
    text.includes("hit a single")
  ) {
    result.isHit = true;
    result.bases = 1;
    result.type = "single";
  } else if (text.includes("hits a double") || text.includes("doubled") || text.includes("hit a double")) {
    result.isHit = true;
    result.bases = 2;
    result.type = "double";
  } else if (text.includes("hits a triple") || text.includes("tripled") || text.includes("hit a triple")) {
    result.isHit = true;
    result.bases = 3;
    result.type = "triple";
  } else if (text.includes("hits a home run") || text.includes("homered") || text.includes("hit a home run")) {
    result.isHit = true;
    result.bases = 4;
    result.type = "homer";
  } 
  // Classify errors (without overriding hits)
  else if (text.includes("reaches on an error")) {
    result.isError = true;
    result.type = "error";
  }

  return result;
}

// Preserve initials (e.g., "A L" -> "A L")
export function normalizePlayerName(name: string): string {
  return name
    .replace(/[^a-zA-Z\s]/g, "")
    .trim()
    .toUpperCase();
}

/**
 * Normalize outcome strings to consistent values
 * @param result The outcome string to normalize
 * @returns Normalized outcome
 */
export function normalizeOutcome(result: string): string {
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

/**
 * Normalize ball type strings to consistent values
 * @param bbType The ball type string to normalize
 * @returns Normalized ball type
 */
export function normalizeBallType(bbType: string | undefined): string | undefined {
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

export function countTokens(text: string): number {
  try {
    // Fallback to character-based estimation
    return Math.ceil(text.length / 4)
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

// Enhanced GameChanger data extraction
export function extractGameInfo(text: string): {
  gameDate?: string
  teams?: string[]
  inning?: string
  location?: string
  gameId?: string
} {
  const lines = text.split("\n")
  let gameDate: string | undefined
  const teams: string[] = []
  let inning: string | undefined
  let location: string | undefined
  let gameId: string | undefined

  // Regular expressions for extracting game information
  const datePatterns = [
    /(\d{1,2}\/\d{1,2}\/\d{2,4})/,                 // MM/DD/YYYY or M/D/YY
    /(\d{4}-\d{2}-\d{2})/,                         // YYYY-MM-DD
    /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2},? \d{4}/i  // Month DD, YYYY
  ];
  
  const teamPatterns = [
    /vs\.?\s+([A-Za-z0-9\s&'-]+)/i,                // vs Team
    /@\s+([A-Za-z0-9\s&'-]+)/i,                    // @ Team
    /([A-Za-z0-9\s&'-]+)\s+vs\.?\s+([A-Za-z0-9\s&'-]+)/i,  // Team1 vs Team2
    /([A-Za-z0-9\s&'-]+)\s+@\s+([A-Za-z0-9\s&'-]+)/i       // Team1 @ Team2
  ];
  
  const inningPatterns = [
    /(top|bottom)\s+(\d+)/i,                       // top/bottom N
    /inning\s+(\d+)/i,                             // inning N
    /(\d+)(st|nd|rd|th)\s+inning/i                 // Nth inning
  ];
  
  const locationPatterns = [
    /location:\s+([A-Za-z0-9\s,&'-]+)/i,           // Location: Place
    /field:\s+([A-Za-z0-9\s,&'-]+)/i,              // Field: Place
    /at\s+([A-Za-z0-9\s,&'-]+)\s+field/i           // at Place Field
  ];
  
  const gameIdPatterns = [
    /game\s+id:?\s+([A-Za-z0-9-]+)/i,              // Game ID: XXX
    /game\s+number:?\s+([A-Za-z0-9-]+)/i,          // Game Number: XXX
    /game:?\s+([A-Za-z0-9-]+)/i                    // Game: XXX
  ];

  // Process each line to extract information
  for (const line of lines) {
    // Extract date
    if (!gameDate) {
      for (const pattern of datePatterns) {
        const match = line.match(pattern);
        if (match) {
          gameDate = match[0];
          // Normalize date format to YYYY-MM-DD if possible
          try {
            const date = new Date(gameDate);
            if (!isNaN(date.getTime())) {
              gameDate = date.toISOString().split('T')[0];
            }
          } catch (e) {
            // Keep original format if parsing fails
          }
          break;
        }
      }
    }

    // Extract teams
    for (const pattern of teamPatterns) {
      const match = line.match(pattern);
      if (match) {
        // Add all captured team names
        for (let i = 1; i < match.length; i++) {
          if (match[i] && !teams.includes(match[i].trim())) {
            teams.push(match[i].trim());
          }
        }
      }
    }

    // Extract inning
    if (!inning) {
      for (const pattern of inningPatterns) {
        const match = line.match(pattern);
        if (match) {
          inning = match[0];
          break;
        }
      }
    }

    // Extract location
    if (!location) {
      for (const pattern of locationPatterns) {
        const match = line.match(pattern);
        if (match && match[1]) {
          location = match[1].trim();
          break;
        }
      }
    }

    // Extract game ID
    if (!gameId) {
      for (const pattern of gameIdPatterns) {
        const match = line.match(pattern);
        if (match && match[1]) {
          gameId = match[1].trim();
          break;
        }
      }
    }
  }

  return { gameDate, teams, inning, location, gameId };
}

// Extract play-by-play data with extremely precise parsing for GameChanger format
export function extractPlaysFromText(text: string): ParsedPlay[] {
  const lines = text.split('\n');
  const plays: ParsedPlay[] = [];
  const gameInfo = extractGameInfo(text);
  
  let currentInning: number | undefined;
  let currentCount: string | undefined;
  let currentPlayer: string | undefined;
  let currentResult: string | undefined;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Skip lines that are just result indicators without player context
    const resultOnlyPatterns = [
      /^(Single|Double|Triple|Home\s+Run|Walk|Strikeout|Strike\s+Out|Fly\s+Out|Ground\s+Out|Pop\s+Out|Fielder'?s?\s+Choice|Infield\s+Fly|Error|Hit\s+by\s+Pitch|HBP)$/i,
      /^\d+\s+Outs?$/i,
      /^In\s+play\.$/i,
      /^Ball\s+\d+/i,
      /^Strike\s+\d+/i,
      /^Foul/i,
      /^WDST\s+\d+\s*-\s*FRNT\s+\d+/i
    ];
    
    // Check if this line is just a result indicator
    let isResultOnly = false;
    for (const pattern of resultOnlyPatterns) {
      if (pattern.test(line)) {
        isResultOnly = true;
        break;
      }
    }
    
    if (isResultOnly) {
      console.log(`[DEBUG] Skipping result-only line: "${line}"`);
      continue;
    }
    
    // Extract inning information
    const inningMatch = line.match(/(?:Bottom|Top)\s+(\d+)(?:st|nd|rd|th)\s*[-–]\s*(.+)/i);
    if (inningMatch) {
      currentInning = parseInt(inningMatch[1], 10);
      continue;
    }
    
    // Extract count information
    const countMatch = line.match(/\((\d-\d)\)/);
    if (countMatch) {
      currentCount = countMatch[1];
    }
    
    // Look for player at bat
    const atBatMatch = line.match(/^([A-Za-z\s\-\.]+)\s+at\s+bat/i);
    if (atBatMatch) {
      currentPlayer = atBatMatch[1].trim();
      continue;
    }
    
    // Look for result types that come before the detailed description
    const resultMatch = line.match(/^(Single|Double|Triple|Home\s+Run|Walk|Strikeout|Strike\s+Out|Fly\s+Out|Ground\s+Out|Pop\s+Out|Fielder'?s?\s+Choice|Infield\s+Fly|Error|Hit\s+by\s+Pitch|HBP)/i);
    if (resultMatch) {
      currentResult = resultMatch[1];
      continue;
    }
    
    // Now look for the detailed play descriptions with CORRECT player name extraction
    const playPatterns = [
      // Singles - Player name is ALWAYS the first group
      /^([A-Za-z\s\-\.]+)\s+singles?\s+on\s+(?:a\s+)?(ground\s+ball|fly\s+ball|line\s+drive|pop\s+fly)\s+(?:to\s+)?([A-Za-z\s]+)/i,
      /^([A-Za-z\s\-\.]+)\s+singles?\s+(?:on\s+)?(?:a\s+)?(ground\s+ball|fly\s+ball|line\s+drive|pop\s+fly)/i,
      
      // Doubles
      /^([A-Za-z\s\-\.]+)\s+doubles?\s+on\s+(?:a\s+)?(ground\s+ball|fly\s+ball|line\s+drive)\s+(?:to\s+)?([A-Za-z\s]+)/i,
      /^([A-Za-z\s\-\.]+)\s+doubles?\s+(?:on\s+)?(?:a\s+)?(ground\s+ball|fly\s+ball|line\s+drive)/i,
      
      // Triples
      /^([A-Za-z\s\-\.]+)\s+triples?\s+on\s+(?:a\s+)?(ground\s+ball|fly\s+ball|line\s+drive)\s+(?:to\s+)?([A-Za-z\s]+)/i,
      /^([A-Za-z\s\-\.]+)\s+triples?\s+(?:on\s+)?(?:a\s+)?(ground\s+ball|fly\s+ball|line\s+drive)/i,
      
      // Home runs
      /^([A-Za-z\s\-\.]+)\s+(?:hits?\s+a\s+)?home\s+runs?\s+(?:to\s+)?([A-Za-z\s]+)/i,
      /^([A-Za-z\s\-\.]+)\s+(?:hits?\s+a\s+)?home\s+runs?/i,
      
      // Walks
      /^([A-Za-z\s\-\.]+)\s+walks?\s+(?:,?\s+[A-Za-z\s]+)?(?:pitching)?/i,
      
      // Strikeouts
      /^([A-Za-z\s\-\.]+)\s+strikes?\s+out\s+(?:swinging|looking)?(?:,?\s+[A-Za-z\s]+)?(?:pitching)?/i,
      /^([A-Za-z\s\-\.]+)\s+struck\s+out\s+(?:swinging|looking)?(?:,?\s+[A-Za-z\s]+)?(?:pitching)?/i,
      
      // Fly outs
      /^([A-Za-z\s\-\.]+)\s+flies?\s+out\s+(?:to\s+)?([A-Za-z\s]+)/i,
      /^([A-Za-z\s\-\.]+)\s+flied\s+out\s+(?:to\s+)?([A-Za-z\s]+)/i,
      
      // Ground outs
      /^([A-Za-z\s\-\.]+)\s+grounds?\s+out\s+(?:to\s+)?([A-Za-z\s]+)/i,
      /^([A-Za-z\s\-\.]+)\s+grounded\s+out\s+(?:to\s+)?([A-Za-z\s]+)/i,
      
      // Pop outs
      /^([A-Za-z\s\-\.]+)\s+pops?\s+out\s+(?:to\s+)?([A-Za-z\s]+)/i,
      /^([A-Za-z\s\-\.]+)\s+popped\s+out\s+(?:to\s+)?([A-Za-z\s]+)/i,
      
      // Fielder's choice
      /^([A-Za-z\s\-\.]+)\s+grounds?\s+into\s+fielder'?s?\s+choice\s+(?:to\s+)?([A-Za-z\s]+)/i,
      /^([A-Za-z\s\-\.]+)\s+grounded\s+into\s+fielder'?s?\s+choice\s+(?:to\s+)?([A-Za-z\s]+)/i,
      
      // Infield fly
      /^([A-Za-z\s\-\.]+)\s+out\s+on\s+infield\s+fly\s+(?:to\s+)?([A-Za-z\s]+)/i,
      
      // Hit by pitch
      /^([A-Za-z\s\-\.]+)\s+hit\s+by\s+pitch/i,
      /^([A-Za-z\s\-\.]+)\s+hbp/i,
      
      // Errors
      /^([A-Za-z\s\-\.]+)\s+reaches?\s+on\s+(?:an?\s+)?error\s+(?:by\s+)?([A-Za-z\s]+)/i
    ];
    
    let matched = false;
    for (const pattern of playPatterns) {
      const match = line.match(pattern);
      if (match) {
        const playerName = match[1].trim();
        const action = match[2] || '';
        const location = match[3] || '';
        
        console.log(`[DEBUG] Pattern match: Line="${line}" | Player="${playerName}" | Action="${action}" | Location="${location}"`);
        
        // CRITICAL: Validate that we have a proper player name (not a result)
        const invalidNames = ['hit', 'k', 'out', 'walk', 'single', 'double', 'triple', 'home run', 'strikeout', 'fly out', 'ground out', 'pop out', 'fielder\'s choice', 'infield fly', 'error', 'h', 'o'];
        const isValidPlayerName = playerName && 
          playerName.length > 0 && 
          !invalidNames.includes(playerName.toLowerCase()) &&
          /^[A-Za-z\s\-\.]+$/.test(playerName) &&
          playerName.split(' ').length >= 1;
        
        if (isValidPlayerName) {
          // Determine result and type
          let result = "";
          let bbType: string | undefined;
          let isHit = false;
          let bases = 0;
          let type: 'single' | 'double' | 'triple' | 'homer' | 'out' | 'error' = 'out';
          let isError = false;
          
          const actionLower = action.toLowerCase();
          const lineLower = line.toLowerCase();
          
          // Hit detection
          if (lineLower.includes('singles') || lineLower.includes('single') || 
              (actionLower.includes('ground ball') && !lineLower.includes('out'))) {
            result = "Hit";
            bbType = "1B";
            isHit = true;
            bases = 1;
            type = "single";
          } else if (lineLower.includes('doubles') || lineLower.includes('double')) {
            result = "Hit";
            bbType = "2B";
            isHit = true;
            bases = 2;
            type = "double";
          } else if (lineLower.includes('triples') || lineLower.includes('triple')) {
            result = "Hit";
            bbType = "3B";
            isHit = true;
            bases = 3;
            type = "triple";
          } else if (lineLower.includes('home run') || lineLower.includes('homer')) {
            result = "Hit";
            bbType = "HR";
            isHit = true;
            bases = 4;
            type = "homer";
          }
          // Walk detection
          else if (lineLower.includes('walks') || lineLower.includes('walk')) {
            result = "Walk";
            bbType = "BB";
          }
          // Strikeout detection
          else if (lineLower.includes('strikes out') || lineLower.includes('struck out') || lineLower.includes('strikeout')) {
            result = "K";
            bbType = "K";
          }
          // Hit by pitch
          else if (lineLower.includes('hit by pitch') || lineLower.includes('hbp')) {
            result = "HBP";
            bbType = "HBP";
          }
          // Error detection
          else if (lineLower.includes('error')) {
            result = "Error";
            bbType = "E";
            isError = true;
            type = "error";
          }
          // Out detection
          else if (lineLower.includes('flies out') || lineLower.includes('flied out') || lineLower.includes('fly out')) {
            result = "Out";
            bbType = "Fly";
          } else if (lineLower.includes('grounds out') || lineLower.includes('grounded out') || lineLower.includes('ground out')) {
            result = "Out";
            bbType = "Ground";
          } else if (lineLower.includes('pops out') || lineLower.includes('popped out') || lineLower.includes('pop out')) {
            result = "Out";
            bbType = "Fly";
          } else if (lineLower.includes('fielder\'s choice') || lineLower.includes('fielders choice')) {
            result = "Out";
            bbType = "FC";
          } else if (lineLower.includes('infield fly')) {
            result = "Out";
            bbType = "IF";
          }
          
          if (result) {
            console.log(`[DEBUG] Creating play: Player="${playerName}" | Result="${result}" | Type="${type}"`);
            
            const play: ParsedPlay = {
              playerName,
              result,
              bbType,
              gameDate: gameInfo.gameDate,
              inning: currentInning,
              count: currentCount,
              isHit,
              isError,
              bases,
              type,
              inPlay: isHit || result === "Out",
              rbi: 0, // Will be calculated later
              runs: 0, // Will be calculated later
              isHomeRun: type === 'homer',
              isStrikeout: result === 'K',
              isWalk: result === 'Walk',
              isHBP: result === 'HBP',
              isSacFly: false,
              stolenBases: 0,
              caughtStealing: 0
            };
            
            // Add location if available
            if (location) {
              play.location = location.trim();
            }
            
            plays.push(play);
            matched = true;
            
            // Reset context after successful match
            currentPlayer = undefined;
            currentResult = undefined;
            break;
          }
        } else {
          console.log(`[DEBUG] Skipping invalid player name: "${playerName}"`);
        }
      }
    }
    
    // If no pattern matched but we have context, try to create a basic play
    // BUT ONLY if we have a valid player name (not a result)
    if (!matched && currentPlayer && currentResult) {
      // Additional validation for the fallback
      const invalidNames = ['hit', 'k', 'out', 'walk', 'single', 'double', 'triple', 'home run', 'strikeout', 'fly out', 'ground out', 'pop out', 'fielder\'s choice', 'infield fly', 'error', 'h', 'o'];
      const isValidPlayerName = currentPlayer && 
        currentPlayer.length > 0 && 
        !invalidNames.includes(currentPlayer.toLowerCase()) &&
        /^[A-Za-z\s\-\.]+$/.test(currentPlayer) &&
        currentPlayer.split(' ').length >= 1;
      
      if (isValidPlayerName) {
        console.log(`[DEBUG] Using context fallback: Player="${currentPlayer}" | Result="${currentResult}"`);
        
        let result = "";
        let isHit = false;
        let bases = 0;
        let type: 'single' | 'double' | 'triple' | 'homer' | 'out' | 'error' = 'out';
        
        const resultLower = currentResult.toLowerCase();
        
        if (resultLower.includes('single')) {
          result = "Hit";
          isHit = true;
          bases = 1;
          type = "single";
        } else if (resultLower.includes('double')) {
          result = "Hit";
          isHit = true;
          bases = 2;
          type = "double";
        } else if (resultLower.includes('triple')) {
          result = "Hit";
          isHit = true;
          bases = 3;
          type = "triple";
        } else if (resultLower.includes('home run')) {
          result = "Hit";
          isHit = true;
          bases = 4;
          type = "homer";
        } else if (resultLower.includes('walk')) {
          result = "Walk";
        } else if (resultLower.includes('strikeout') || resultLower.includes('strike out')) {
          result = "K";
        } else if (resultLower.includes('fly out') || resultLower.includes('ground out') || resultLower.includes('pop out')) {
          result = "Out";
        }
        
        if (result) {
          console.log(`[DEBUG] Creating fallback play: Player="${currentPlayer}" | Result="${result}" | Type="${type}"`);
          
          const play: ParsedPlay = {
            playerName: currentPlayer,
            result,
            gameDate: gameInfo.gameDate,
            inning: currentInning,
            count: currentCount,
            isHit,
            isError: false,
            bases,
            type,
            inPlay: isHit || result === "Out",
            rbi: 0,
            runs: 0,
            isHomeRun: type === 'homer',
            isStrikeout: result === 'K',
            isWalk: result === 'Walk',
            isHBP: false,
            isSacFly: false,
            stolenBases: 0,
            caughtStealing: 0
          };
          
          plays.push(play);
          currentPlayer = undefined;
          currentResult = undefined;
        }
      } else {
        console.log(`[DEBUG] Skipping fallback - invalid player name: "${currentPlayer}"`);
        currentPlayer = undefined;
        currentResult = undefined;
      }
    }
  }
  
  return plays;
}

// Function to detect if text is likely GameChanger data
export function isLikelyGameChangerData(text: string): boolean {
  // Common GameChanger indicators
  const indicators = [
    /inning/i,
    /plate appearance/i,
    /at bat/i,
    /pitch count/i,
    /singles?|doubles?|triples?|home runs?/i,
    /struck out|walked|grounded|flied|lined/i,
    /gamechanger/i,
    /box score/i
  ];
  
  let score = 0;
  for (const pattern of indicators) {
    if (pattern.test(text)) {
      score++;
    }
  }
  
  // If at least 3 indicators are found, it's likely GameChanger data
  return score >= 3;
}

// Test function to verify pattern matching
export function testPatternMatching() {
  const testLines = [
    "M L singles on a ground ball to center fielder R F, M M scores, L S advances to 3rd.",
    "L S singles on a ground ball to second baseman K H, M M advances to 2nd.",
    "J N strikes out swinging, S F pitching.",
    "S R doubles on a fly ball to left fielder N A, E A scores.",
    "L M walks, S F pitching, M L remains at 3rd, A L advances to 2nd."
  ];
  
  console.log("[TEST] Testing pattern matching:");
  
  for (const line of testLines) {
    console.log(`[TEST] Line: "${line}"`);
    
    // Test singles pattern
    const singleMatch = line.match(/^([A-Za-z\s\-\.]+)\s+singles?\s+on\s+(?:a\s+)?(ground\s+ball|fly\s+ball|line\s+drive|pop\s+fly)\s+(?:to\s+)?([A-Za-z\s]+)/i);
    if (singleMatch) {
      console.log(`[TEST] Single match: Player="${singleMatch[1]}" | Action="${singleMatch[2]}" | Location="${singleMatch[3]}"`);
    }
    
    // Test strikeout pattern
    const strikeoutMatch = line.match(/^([A-Za-z\s\-\.]+)\s+strikes?\s+out\s+(?:swinging|looking)?(?:,?\s+[A-Za-z\s]+)?(?:pitching)?/i);
    if (strikeoutMatch) {
      console.log(`[TEST] Strikeout match: Player="${strikeoutMatch[1]}"`);
    }
    
    // Test walk pattern
    const walkMatch = line.match(/^([A-Za-z\s\-\.]+)\s+walks?\s+(?:,?\s+[A-Za-z\s]+)?(?:pitching)?/i);
    if (walkMatch) {
      console.log(`[TEST] Walk match: Player="${walkMatch[1]}"`);
    }
    
    // Test double pattern
    const doubleMatch = line.match(/^([A-Za-z\s\-\.]+)\s+doubles?\s+on\s+(?:a\s+)?(ground\s+ball|fly\s+ball|line\s+drive)\s+(?:to\s+)?([A-Za-z\s]+)/i);
    if (doubleMatch) {
      console.log(`[TEST] Double match: Player="${doubleMatch[1]}" | Action="${doubleMatch[2]}" | Location="${doubleMatch[3]}"`);
    }
  }
}
