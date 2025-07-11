import { BaseballStats } from './types'

export interface PlateAppearance {
  id: number
  playerId: number
  result: string
  bbType: string | null
  gameDate: string
  inning: number | null
  count: string | null
  pitchCount: number | null
  inPlay: boolean
  exitVelocity: number | null
  launchAngle: number | null
  distance: number | null
  location: string | null
  contactType: string | null
  pitchType: string | null
  rbi: number
  runs: number
  isHomeRun: boolean
  isStrikeout: boolean
  isWalk: boolean
  isHBP: boolean
  isSacFly: boolean
  stolenBases: number
  caughtStealing: number
  leverageIndex: number | null
  clutchSituation: string | null
  createdAt: Date
}

// Constants for advanced metrics
const wOBAWeights = {
  walk: 0.69,
  hbp: 0.722,
  single: 0.888,
  double: 1.271,
  triple: 1.616,
  homeRun: 2.101,
}

const lgwOBA = 0.320 // League average wOBA
const wOBAScale = 1.15 // wOBA scale factor
const runsPerWin = 10 // Runs per win

export function calculateStats(plateAppearances: PlateAppearance[]): BaseballStats {
  // Initialize counters
  const stats: Partial<BaseballStats> = {
    games: new Set(plateAppearances.map(pa => pa.gameDate)).size,
    pa: plateAppearances.length,
    ab: 0,
    hits: 0,
    doubles: 0,
    triples: 0,
    homeRuns: 0,
    runs: 0,
    rbi: 0,
    walks: 0,
    strikeouts: 0,
    hbp: 0,
    sf: 0,
    sb: 0,
    cs: 0,
  }

  // Count basic stats
  let totalPitches = 0
  let zoneSwings = 0
  let chaseSwings = 0
  let totalSwings = 0
  let totalContacts = 0
  let hardContacts = 0
  let mediumContacts = 0
  let softContacts = 0
  let groundBalls = 0
  let lineDrives = 0
  let flyBalls = 0
  let clutchPA = 0
  let clutchSuccess = 0
  let totalLeverageIndex = 0

  for (const pa of plateAppearances) {
    // Basic stats
    if (!pa.isWalk && !pa.isHBP && !pa.isSacFly) {
      stats.ab!++
    }

    if (pa.result === 'Hit') {
      stats.hits!++
      if (pa.bbType === '2B') stats.doubles!++
      if (pa.bbType === '3B') stats.triples!++
      if (pa.isHomeRun) stats.homeRuns!++
    }

    stats.runs! += pa.runs
    stats.rbi! += pa.rbi
    if (pa.isWalk) stats.walks!++
    if (pa.isStrikeout) stats.strikeouts!++
    if (pa.isHBP) stats.hbp!++
    if (pa.isSacFly) stats.sf!++
    stats.sb! += pa.stolenBases
    stats.cs! += pa.caughtStealing

    // Contact quality
    if (pa.inPlay) {
      totalContacts++
      if (pa.contactType === 'Hard') hardContacts++
      if (pa.contactType === 'Medium') mediumContacts++
      if (pa.contactType === 'Soft') softContacts++

      // Ball type
      if (pa.bbType === 'Ground') groundBalls++
      if (pa.bbType === 'Line') lineDrives++
      if (pa.bbType === 'Fly') flyBalls++
    }

    // Clutch stats
    if (pa.leverageIndex) {
      totalLeverageIndex += pa.leverageIndex
      if (pa.leverageIndex > 1.5) {
        clutchPA++
        if (pa.result === 'Hit' || pa.isWalk || pa.isHBP) {
          clutchSuccess++
        }
      }
    }
  }

  // Calculate percentages and rates
  const totalBalls = groundBalls + lineDrives + flyBalls
  stats.gbPercent = totalBalls > 0 ? (groundBalls / totalBalls) * 100 : 0
  stats.ldPercent = totalBalls > 0 ? (lineDrives / totalBalls) * 100 : 0
  stats.fbPercent = totalBalls > 0 ? (flyBalls / totalBalls) * 100 : 0

  // Contact quality percentages
  stats.hardContact = totalContacts > 0 ? (hardContacts / totalContacts) * 100 : 0
  stats.medContact = totalContacts > 0 ? (mediumContacts / totalContacts) * 100 : 0
  stats.softContact = totalContacts > 0 ? (softContacts / totalContacts) * 100 : 0

  // Calculate averages
  stats.avg = stats.ab! > 0 ? (stats.hits! / stats.ab!).toFixed(3) : '.000'
  stats.obp = (stats.ab! + stats.walks! + stats.hbp! + stats.sf!) > 0
    ? ((stats.hits! + stats.walks! + stats.hbp!) / (stats.ab! + stats.walks! + stats.hbp! + stats.sf!)).toFixed(3)
    : '.000'
  stats.slg = stats.ab! > 0
    ? ((stats.hits! - stats.doubles! - stats.triples! - stats.homeRuns! + 
        2 * stats.doubles! + 3 * stats.triples! + 4 * stats.homeRuns!) / stats.ab!).toFixed(3)
    : '.000'
  stats.ops = (parseFloat(stats.obp) + parseFloat(stats.slg)).toFixed(3)

  // Calculate advanced metrics
  stats.iso = stats.ab! > 0
    ? ((stats.doubles! + 2 * stats.triples! + 3 * stats.homeRuns!) / stats.ab!).toFixed(3)
    : '.000'
  stats.babip = (stats.ab! - stats.strikeouts! - stats.homeRuns! + stats.sf!) > 0
    ? ((stats.hits! - stats.homeRuns!) / (stats.ab! - stats.strikeouts! - stats.homeRuns! + stats.sf!)).toFixed(3)
    : '.000'

  // Calculate wOBA
  const wOBANumerator = (stats.walks! * wOBAWeights.walk) +
                       (stats.hbp! * wOBAWeights.hbp) +
                       ((stats.hits! - stats.doubles! - stats.triples! - stats.homeRuns!) * wOBAWeights.single) +
                       (stats.doubles! * wOBAWeights.double) +
                       (stats.triples! * wOBAWeights.triple) +
                       (stats.homeRuns! * wOBAWeights.homeRun)
  const wOBADenominator = stats.ab! + stats.walks! + stats.sf! + stats.hbp!
  stats.wOBA = wOBADenominator > 0 ? wOBANumerator / wOBADenominator : 0

  // Calculate wRAA and wRC
  stats.wRAA = ((stats.wOBA - lgwOBA) / wOBAScale) * stats.pa!
  stats.wRC = ((stats.wRAA / stats.pa!) + lgwOBA) * 100

  // Calculate rates
  stats.kRate = stats.pa! > 0 ? (stats.strikeouts! / stats.pa!) * 100 : 0
  stats.bbRate = stats.pa! > 0 ? (stats.walks! / stats.pa!) * 100 : 0

  // Calculate clutch score
  stats.clutch = clutchPA > 0 ? (clutchSuccess / clutchPA) - parseFloat(stats.obp) : 0
  stats.zscore = totalLeverageIndex / plateAppearances.length

  return stats as BaseballStats
}

export const formatters = {
  avg: (value: number) => value.toFixed(3).replace(/^0/, ''),
  obp: (value: number) => value.toFixed(3).replace(/^0/, ''),
  slg: (value: number) => value.toFixed(3).replace(/^0/, ''),
  ops: (value: number) => value.toFixed(3).replace(/^0/, ''),
  iso: (value: number) => value.toFixed(3).replace(/^0/, ''),
  babip: (value: number) => value.toFixed(3).replace(/^0/, ''),
  wOBA: (value: number) => value.toFixed(3),
  wRAA: (value: number) => value.toFixed(1),
  wRC: (value: number) => value.toFixed(0),
  kRate: (value: number) => value.toFixed(1) + '%',
  bbRate: (value: number) => value.toFixed(1) + '%',
  gbPercent: (value: number) => value.toFixed(1) + '%',
  ldPercent: (value: number) => value.toFixed(1) + '%',
  fbPercent: (value: number) => value.toFixed(1) + '%',
  hardContact: (value: number) => value.toFixed(1) + '%',
  medContact: (value: number) => value.toFixed(1) + '%',
  softContact: (value: number) => value.toFixed(1) + '%',
  clutch: (value: number) => value.toFixed(3),
  zscore: (value: number) => value.toFixed(2),
}

// Stat display configurations
export const statConfigs: Record<keyof BaseballStats, StatDisplayConfig> = {
  games: {
    label: 'G',
    description: 'Games Played',
    format: formatters.integer,
    category: 'basic',
    sortable: true,
  },
  pa: {
    label: 'PA',
    description: 'Plate Appearances',
    format: formatters.integer,
    category: 'basic',
    sortable: true,
    primaryStat: true,
  },
  // ... Add configurations for all other stats
} 