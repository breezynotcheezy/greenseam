// Constants for wOBA calculation
const WOBA_WEIGHTS = {
  BB: 0.69,
  HBP: 0.722,
  '1B': 0.888,
  '2B': 1.271,
  '3B': 1.616,
  HR: 2.101,
} as const;

// League average values for wRC+ calculation
const LEAGUE_CONSTANTS = {
  wOBA: 0.320,
  wOBAScale: 1.2,
  RPW: 10,
  leagueR: 4.5, // Runs per game
  parkFactor: 100, // Neutral park factor
} as const;

/**
 * Calculate weighted on-base average (wOBA)
 */
export function calculateWOBA(stats: {
  walks: number;
  hbp: number;
  singles: number;
  doubles: number;
  triples: number;
  homeRuns: number;
  atBats: number;
  sacrificeFlies: number;
}): number {
  const numerator =
    WOBA_WEIGHTS.BB * stats.walks +
    WOBA_WEIGHTS.HBP * stats.hbp +
    WOBA_WEIGHTS['1B'] * stats.singles +
    WOBA_WEIGHTS['2B'] * stats.doubles +
    WOBA_WEIGHTS['3B'] * stats.triples +
    WOBA_WEIGHTS.HR * stats.homeRuns;

  const denominator = stats.atBats + stats.walks + stats.sacrificeFlies + stats.hbp;

  return denominator === 0 ? 0 : numerator / denominator;
}

/**
 * Calculate weighted runs above average (wRAA)
 */
export function calculateWRAA(wOBA: number, plateAppearances: number): number {
  return ((wOBA - LEAGUE_CONSTANTS.wOBA) / LEAGUE_CONSTANTS.wOBAScale) * plateAppearances;
}

/**
 * Calculate weighted runs created plus (wRC+)
 */
export function calculateWRCPlus(wRAA: number, plateAppearances: number): number {
  const lgR = LEAGUE_CONSTANTS.leagueR;
  const pf = LEAGUE_CONSTANTS.parkFactor;
  
  // League runs per plate appearance
  const lgRPA = lgR / plateAppearances;
  
  // Calculate wRC
  const wRC = wRAA + (lgRPA * plateAppearances);
  
  // Calculate league wRC
  const lgwRC = lgRPA * plateAppearances;
  
  // Apply park factors and scale to 100
  return Math.round(((wRC / (pf / 100)) / lgwRC) * 100);
}

/**
 * Calculate contact quality metrics
 */
export function calculateContactQuality(plateAppearances: Array<{
  exitVelocity: number | null;
  launchAngle: number | null;
  result: string;
  inPlay: boolean;
}>) {
  const inPlayPAs = plateAppearances.filter(pa => pa.inPlay);
  if (inPlayPAs.length === 0) return { softContact: 0, mediumContact: 0, hardContact: 0 };

  const hardContact = inPlayPAs.filter(pa => pa.exitVelocity && pa.exitVelocity >= 95).length;
  const mediumContact = inPlayPAs.filter(pa => pa.exitVelocity && pa.exitVelocity >= 85 && pa.exitVelocity < 95).length;
  const softContact = inPlayPAs.filter(pa => pa.exitVelocity && pa.exitVelocity < 85).length;

  const total = hardContact + mediumContact + softContact;
  
  return {
    softContact: (softContact / total) * 100,
    mediumContact: (mediumContact / total) * 100,
    hardContact: (hardContact / total) * 100,
  };
}

/**
 * Calculate situational statistics
 */
export function calculateSituationalStats(plateAppearances: Array<{
  result: string;
  leverageIndex: number | null;
  clutchSituation: string | null;
}>) {
  // Filter PAs with leverage index
  const clutchPAs = plateAppearances.filter(pa => pa.leverageIndex !== null);
  if (clutchPAs.length === 0) return { clutchPerformance: 0 };

  // Calculate success rate in high leverage situations
  const highLeveragePAs = clutchPAs.filter(pa => pa.leverageIndex && pa.leverageIndex >= 1.5);
  const highLeverageSuccess = highLeveragePAs.filter(pa => 
    pa.result === 'Hit' || pa.result === 'Walk' || pa.result === 'HBP'
  ).length;

  return {
    clutchPerformance: highLeveragePAs.length > 0 
      ? (highLeverageSuccess / highLeveragePAs.length) * 100 
      : 0
  };
}

/**
 * Calculate z-score for a given statistic
 */
export function calculateZScore(value: number, mean: number, stdDev: number): number {
  return stdDev === 0 ? 0 : (value - mean) / stdDev;
}

/**
 * Format a statistic for display
 */
export function formatStat(value: number, type: 'percentage' | 'rate' | 'score' | 'raw'): string {
  switch (type) {
    case 'percentage':
      return `${value.toFixed(1)}%`;
    case 'rate':
      return value.toFixed(3).replace(/^0/, '');
    case 'score':
      return Math.round(value).toString();
    case 'raw':
      return value.toString();
    default:
      return value.toString();
  }
}

/**
 * Calculate mean and standard deviation for a set of values
 */
function calculateDistribution(values: number[]): { mean: number; stdDev: number } {
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
  const variance = squaredDiffs.reduce((sum, value) => sum + value, 0) / values.length;
  const stdDev = Math.sqrt(variance);
  return { mean, stdDev };
}

/**
 * Calculate z-scores for all players based on selected statistics
 */
export function calculatePlayerZScores(players: Array<{
  stats: {
    woba: number;
    wrcPlus: number;
    hardContact: number;
    clutchPerformance: number;
  };
}>): Array<{ zScore: number }> {
  // Only include players with enough plate appearances
  const qualifiedPlayers = players.filter(player => 
    player.stats.woba > 0 && 
    player.stats.wrcPlus > 0
  );

  if (qualifiedPlayers.length === 0) {
    return players.map(() => ({ zScore: 0 }));
  }

  // Calculate z-scores for key metrics
  const wobaValues = qualifiedPlayers.map(p => p.stats.woba);
  const wrcValues = qualifiedPlayers.map(p => p.stats.wrcPlus);
  const hardContactValues = qualifiedPlayers.map(p => p.stats.hardContact);
  const clutchValues = qualifiedPlayers.map(p => p.stats.clutchPerformance);

  const { mean: wobaMean, stdDev: wobaStdDev } = calculateDistribution(wobaValues);
  const { mean: wrcMean, stdDev: wrcStdDev } = calculateDistribution(wrcValues);
  const { mean: hardContactMean, stdDev: hardContactStdDev } = calculateDistribution(hardContactValues);
  const { mean: clutchMean, stdDev: clutchStdDev } = calculateDistribution(clutchValues);

  // Calculate composite z-scores
  return players.map(player => {
    if (player.stats.woba === 0 || player.stats.wrcPlus === 0) {
      return { zScore: 0 };
    }

    const wobaZ = calculateZScore(player.stats.woba, wobaMean, wobaStdDev);
    const wrcZ = calculateZScore(player.stats.wrcPlus, wrcMean, wrcStdDev);
    const hardContactZ = calculateZScore(player.stats.hardContact, hardContactMean, hardContactStdDev);
    const clutchZ = calculateZScore(player.stats.clutchPerformance, clutchMean, clutchStdDev);

    // Weight the components (can be adjusted based on importance)
    const weights = {
      woba: 0.35,
      wrc: 0.35,
      hardContact: 0.2,
      clutch: 0.1
    };

    const compositeZScore = 
      wobaZ * weights.woba +
      wrcZ * weights.wrc +
      hardContactZ * weights.hardContact +
      clutchZ * weights.clutch;

    return { zScore: compositeZScore };
  });
}

export interface StatDisplayConfig {
  label: string;
  description: string;
  format: 'percentage' | 'rate' | 'score' | 'raw';
  category: 'basic' | 'advanced' | 'contact' | 'situational';
  sortOrder: number;
}

export const STAT_DISPLAY_CONFIG: Record<string, StatDisplayConfig> = {
  avg: {
    label: 'AVG',
    description: 'Batting Average',
    format: 'rate',
    category: 'basic',
    sortOrder: 1
  },
  obp: {
    label: 'OBP',
    description: 'On-base Percentage',
    format: 'rate',
    category: 'basic',
    sortOrder: 2
  },
  slg: {
    label: 'SLG',
    description: 'Slugging Percentage',
    format: 'rate',
    category: 'basic',
    sortOrder: 3
  },
  ops: {
    label: 'OPS',
    description: 'On-base Plus Slugging',
    format: 'rate',
    category: 'basic',
    sortOrder: 4
  },
  woba: {
    label: 'wOBA',
    description: 'Weighted On-base Average',
    format: 'rate',
    category: 'advanced',
    sortOrder: 1
  },
  wraa: {
    label: 'wRAA',
    description: 'Weighted Runs Above Average',
    format: 'score',
    category: 'advanced',
    sortOrder: 2
  },
  wrcPlus: {
    label: 'wRC+',
    description: 'Weighted Runs Created Plus',
    format: 'score',
    category: 'advanced',
    sortOrder: 3
  },
  hardContact: {
    label: 'Hard%',
    description: 'Hard Contact Percentage',
    format: 'percentage',
    category: 'contact',
    sortOrder: 1
  },
  mediumContact: {
    label: 'Med%',
    description: 'Medium Contact Percentage',
    format: 'percentage',
    category: 'contact',
    sortOrder: 2
  },
  softContact: {
    label: 'Soft%',
    description: 'Soft Contact Percentage',
    format: 'percentage',
    category: 'contact',
    sortOrder: 3
  },
  clutchPerformance: {
    label: 'Clutch',
    description: 'Performance in High Leverage Situations',
    format: 'percentage',
    category: 'situational',
    sortOrder: 1
  }
}; 