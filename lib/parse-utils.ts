import { getEncoding } from "js-tiktoken"

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

/**
 * Normalize player names for consistent comparison
 * @param name The player name to normalize
 * @returns Normalized player name
 */
export function normalizePlayerName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
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
    const encoding = getEncoding("cl100k_base")
    const tokens = encoding.encode(text)
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

// Extract play-by-play data without AI
export function extractPlaysFromText(text: string): ParsedPlay[] {
  const lines = text.split('\n');
  const plays: ParsedPlay[] = [];
  const gameInfo = extractGameInfo(text);
  
  // Common patterns in GameChanger data
  const playerActionPattern = /([A-Za-z\s\-.]+)\s+(singled|doubled|tripled|homered|grounded|flied|lined|popped|walked|struck out|hit by pitch)/i;
  const countPattern = /\((\d-\d)\)/;
  const inningPattern = /inning\s+(\d+)|(\d+)(st|nd|rd|th)\s+inning/i;
  const situationPattern = /(runner(s)? on|bases loaded|no outs|1 out|2 outs)/i;
  
  let currentInning: number | undefined;
  
  for (const line of lines) {
    // Try to extract inning information
    const inningMatch = line.match(inningPattern);
    if (inningMatch) {
      const inningNum = inningMatch[1] || inningMatch[2];
      if (inningNum) {
        currentInning = parseInt(inningNum, 10);
      }
      continue;
    }
    
    // Try to extract player and action
    const playerActionMatch = line.match(playerActionPattern);
    if (playerActionMatch) {
      const playerName = playerActionMatch[1].trim();
      const action = playerActionMatch[2].toLowerCase();
      
      // Determine result
      let result = "";
      let bbType: string | undefined;
      
      if (action.includes("singled")) {
        result = "Hit";
        bbType = "1B";
      } else if (action.includes("doubled")) {
        result = "Hit";
        bbType = "2B";
      } else if (action.includes("tripled")) {
        result = "Hit";
        bbType = "3B";
      } else if (action.includes("homered")) {
        result = "Hit";
        bbType = "HR";
      } else if (action.includes("walked")) {
        result = "Walk";
      } else if (action.includes("struck out")) {
        result = "K";
      } else if (action.includes("hit by pitch")) {
        result = "HBP";
      } else if (action.includes("ground")) {
        result = "Out";
        bbType = "Ground";
      } else if (action.includes("fl")) {
        result = "Out";
        bbType = "Fly";
      } else if (action.includes("lin")) {
        result = "Out";
        bbType = "Line";
      } else if (action.includes("pop")) {
        result = "Out";
        bbType = "Fly";
      }
      
      if (result) {
        const play: ParsedPlay = {
          playerName,
          result,
          gameDate: gameInfo.gameDate,
          inning: currentInning
        };
        
        if (bbType) {
          play.bbType = bbType;
        }
        
        // Extract count if available
        const countMatch = line.match(countPattern);
        if (countMatch) {
          play.count = countMatch[1];
        }
        
        // Extract situation if available
        const situationMatch = line.match(situationPattern);
        if (situationMatch) {
          play.situation = situationMatch[0];
        }
        
        plays.push(play);
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
