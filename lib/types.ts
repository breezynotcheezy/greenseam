export interface BaseballStats {
  // Basic stats
  avg: number;
  obp: number;
  slg: number;
  ops: number;
  hits: number;
  walks: number;
  strikeouts: number;
  doubles: number;
  triples: number;
  homeRuns: number;
  atBats: number;
  plateAppearances: number;
  kRate: number;
  bbRate: number;
  
  // Advanced stats
  woba: number;
  wraa: number;
  wrcPlus: number;
  
  // Contact quality
  hardContact: number;
  mediumContact: number;
  softContact: number;
  gbPercent: number;
  ldPercent: number;
  fbPercent: number;
  
  // Situational stats
  clutchPerformance: number;
  leverageIndex: number;
  zScore: number;
}

export interface Player {
  id: number;
  name: string;
  canonical: string;
  teamId: number | null;
  team: Team | null;
  plateAppearances: PlateAppearance[];
  stats?: BaseballStats;
}

export interface Team {
  id: number;
  name: string;
  color: string | null;
  emoji: string | null;
  players: Player[];
}

export interface PlateAppearance {
  id: number;
  playerId: number;
  result: string;
  bbType: string | null;
  gameDate: string;
  inning: number | null;
  count: string | null;
  pitchCount: number | null;
  inPlay: boolean;
  exitVelocity: number | null;
  launchAngle: number | null;
  distance: number | null;
  location: string | null;
  contactType: string | null;
  pitchType: string | null;
  rbi: number;
  runs: number;
  isHomeRun: boolean;
  isStrikeout: boolean;
  isWalk: boolean;
  isHBP: boolean;
  isSacFly: boolean;
  stolenBases: number;
  caughtStealing: number;
  leverageIndex: number | null;
  clutchSituation: string | null;
  createdAt: Date;
}

export interface ParsedPlay {
  // Old properties (keep for backward compatibility)
  playerName?: string;
  result?: string;
  bbType?: string;
  gameDate?: string;
  inning?: number;
  count?: string;
  situation?: string;
  
  // New properties for our parsing system
  isHit: boolean;
  isError: boolean;
  bases: number;
  type: 'single' | 'double' | 'triple' | 'homer' | 'out' | 'error';
}

export interface GameInfo {
  gameDate: string;
  opponent: string;
  location: string;
  isHome: boolean;
}

// Utility type for stat display configuration
export interface StatDisplayConfig {
  label: string
  description: string
  format: (value: number | string) => string
  category: string
  sortable: boolean
  primaryStat?: boolean
}

export const statDisplayConfig: Record<keyof BaseballStats, StatDisplayConfig> = {
  // Games and Plate Appearances
  games: {
    label: 'G',
    description: 'Games played',
    format: (value) => value.toString(),
    category: 'basic',
    sortable: true,
  },
  pa: {
    label: 'PA',
    description: 'Plate appearances',
    format: (value) => value.toString(),
    category: 'basic',
    sortable: true,
    primaryStat: true,
  },
  ab: {
    label: 'AB',
    description: 'At bats',
    format: (value) => value.toString(),
    category: 'basic',
    sortable: true,
  },
  
  // Basic Stats
  hits: {
    label: 'H',
    description: 'Hits',
    format: (value) => value.toString(),
    category: 'basic',
    sortable: true,
  },
  doubles: {
    label: '2B',
    description: 'Doubles',
    format: (value) => value.toString(),
    category: 'basic',
    sortable: true,
  },
  triples: {
    label: '3B',
    description: 'Triples',
    format: (value) => value.toString(),
    category: 'basic',
    sortable: true,
  },
  homeRuns: {
    label: 'HR',
    description: 'Home runs',
    format: (value) => value.toString(),
    category: 'basic',
    sortable: true,
  },
  runs: {
    label: 'R',
    description: 'Runs scored',
    format: (value) => value.toString(),
    category: 'basic',
    sortable: true,
  },
  rbi: {
    label: 'RBI',
    description: 'Runs batted in',
    format: (value) => value.toString(),
    category: 'basic',
    sortable: true,
  },
  walks: {
    label: 'BB',
    description: 'Walks',
    format: (value) => value.toString(),
    category: 'basic',
    sortable: true,
  },
  strikeouts: {
    label: 'K',
    description: 'Strikeouts',
    format: (value) => value.toString(),
    category: 'basic',
    sortable: true,
  },
  hbp: {
    label: 'HBP',
    description: 'Hit by pitch',
    format: (value) => value.toString(),
    category: 'basic',
    sortable: true,
  },
  sf: {
    label: 'SF',
    description: 'Sacrifice flies',
    format: (value) => value.toString(),
    category: 'basic',
    sortable: true,
  },
  sb: {
    label: 'SB',
    description: 'Stolen bases',
    format: (value) => value.toString(),
    category: 'basic',
    sortable: true,
  },
  cs: {
    label: 'CS',
    description: 'Caught stealing',
    format: (value) => value.toString(),
    category: 'basic',
    sortable: true,
  },
  
  // Advanced Stats
  avg: {
    label: 'AVG',
    description: 'Batting average',
    format: (value) => value.toString().replace(/^0/, ''),
    category: 'advanced',
    sortable: true,
    primaryStat: true,
  },
  obp: {
    label: 'OBP',
    description: 'On-base percentage',
    format: (value) => value.toString().replace(/^0/, ''),
    category: 'advanced',
    sortable: true,
    primaryStat: true,
  },
  slg: {
    label: 'SLG',
    description: 'Slugging percentage',
    format: (value) => value.toString().replace(/^0/, ''),
    category: 'advanced',
    sortable: true,
    primaryStat: true,
  },
  ops: {
    label: 'OPS',
    description: 'On-base plus slugging',
    format: (value) => value.toString().replace(/^0/, ''),
    category: 'advanced',
    sortable: true,
    primaryStat: true,
  },
  iso: {
    label: 'ISO',
    description: 'Isolated power',
    format: (value) => value.toString().replace(/^0/, ''),
    category: 'advanced',
    sortable: true,
  },
  babip: {
    label: 'BABIP',
    description: 'Batting average on balls in play',
    format: (value) => value.toString().replace(/^0/, ''),
    category: 'advanced',
    sortable: true,
  },
  wOBA: {
    label: 'wOBA',
    description: 'Weighted on-base average',
    format: (value) => typeof value === 'number' ? value.toFixed(3) : value,
    category: 'advanced',
    sortable: true,
  },
  wRAA: {
    label: 'wRAA',
    description: 'Weighted runs above average',
    format: (value) => typeof value === 'number' ? value.toFixed(1) : value,
    category: 'advanced',
    sortable: true,
  },
  wRC: {
    label: 'wRC+',
    description: 'Weighted runs created plus',
    format: (value) => typeof value === 'number' ? value.toFixed(0) : value,
    category: 'advanced',
    sortable: true,
  },
  
  // Percentages
  kRate: {
    label: 'K%',
    description: 'Strikeout rate',
    format: (value) => typeof value === 'number' ? value.toFixed(1) + '%' : value,
    category: 'percentages',
    sortable: true,
  },
  bbRate: {
    label: 'BB%',
    description: 'Walk rate',
    format: (value) => typeof value === 'number' ? value.toFixed(1) + '%' : value,
    category: 'percentages',
    sortable: true,
  },
  gbPercent: {
    label: 'GB%',
    description: 'Ground ball percentage',
    format: (value) => typeof value === 'number' ? value.toFixed(1) + '%' : value,
    category: 'percentages',
    sortable: true,
  },
  ldPercent: {
    label: 'LD%',
    description: 'Line drive percentage',
    format: (value) => typeof value === 'number' ? value.toFixed(1) + '%' : value,
    category: 'percentages',
    sortable: true,
  },
  fbPercent: {
    label: 'FB%',
    description: 'Fly ball percentage',
    format: (value) => typeof value === 'number' ? value.toFixed(1) + '%' : value,
    category: 'percentages',
    sortable: true,
  },
  
  // Contact Quality
  hardContact: {
    label: 'Hard%',
    description: 'Hard contact percentage',
    format: (value) => typeof value === 'number' ? value.toFixed(1) + '%' : value,
    category: 'contact',
    sortable: true,
  },
  medContact: {
    label: 'Med%',
    description: 'Medium contact percentage',
    format: (value) => typeof value === 'number' ? value.toFixed(1) + '%' : value,
    category: 'contact',
    sortable: true,
  },
  softContact: {
    label: 'Soft%',
    description: 'Soft contact percentage',
    format: (value) => typeof value === 'number' ? value.toFixed(1) + '%' : value,
    category: 'contact',
    sortable: true,
  },
  
  // Situational
  clutch: {
    label: 'Clutch',
    description: 'Performance in high leverage situations',
    format: (value) => typeof value === 'number' ? value.toFixed(3) : value,
    category: 'situational',
    sortable: true,
  },
  zscore: {
    label: 'Z-Score',
    description: 'Standard deviations from mean',
    format: (value) => typeof value === 'number' ? value.toFixed(2) : value,
    category: 'situational',
    sortable: true,
  },
} 