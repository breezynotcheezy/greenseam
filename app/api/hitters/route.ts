import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateWOBA, calculateWRAA, calculateWRCPlus, calculateContactQuality, calculateSituationalStats, calculatePlayerZScores } from "@/lib/stats-utils";
import type { BaseballStats, Player, PlateAppearance } from "@/lib/types";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');
    const minPA = parseInt(searchParams.get('minPA') || '1');

    // Build the where clause for filtering
    const whereClause: any = {};
    
    if (teamId && teamId !== 'all') {
      whereClause.teamId = parseInt(teamId);
    }

    const players = await prisma.player.findMany({
      where: whereClause,
      include: {
        team: true,
        plateAppearances: true,
      },
    });

    const hitters = players
      .map((player: Player) => {
        const { plateAppearances } = player;
        
        // Skip players with fewer than minPA plate appearances
        if (plateAppearances.length < minPA) {
          return null;
        }
        
        // Basic counting stats
        const doubles = plateAppearances.filter((pa: PlateAppearance) => pa.result === "Double").length;
        const triples = plateAppearances.filter((pa: PlateAppearance) => pa.result === "Triple").length;
        const homeRuns = plateAppearances.filter((pa: PlateAppearance) => pa.isHomeRun).length;
        const singles = plateAppearances.filter((pa: PlateAppearance) => pa.result === "Single").length;
        const hits = singles + doubles + triples + homeRuns;
        const walks = plateAppearances.filter((pa: PlateAppearance) => pa.isWalk).length;
        const strikeouts = plateAppearances.filter((pa: PlateAppearance) => pa.isStrikeout).length;
        const hbp = plateAppearances.filter((pa: PlateAppearance) => pa.isHBP).length;
        const sacrificeFlies = plateAppearances.filter((pa: PlateAppearance) => pa.isSacFly).length;
        const atBats = plateAppearances.length - walks - hbp - sacrificeFlies;

        // Calculate percentages
        const avg = atBats > 0 ? hits / atBats : 0;
        const obp = (plateAppearances.length - sacrificeFlies) > 0 
          ? (hits + walks + hbp) / (atBats + walks + hbp) 
          : 0;
        const slg = atBats > 0 
          ? (singles + 2 * doubles + 3 * triples + 4 * homeRuns) / atBats 
          : 0;
        const ops = obp + slg;
        const kRate = plateAppearances.length > 0 ? (strikeouts / plateAppearances.length) * 100 : 0;
        const bbRate = plateAppearances.length > 0 ? (walks / plateAppearances.length) * 100 : 0;

        // Calculate batted ball distribution
        const inPlayPAs = plateAppearances.filter((pa: PlateAppearance) => pa.inPlay);
        const groundBalls = inPlayPAs.filter((pa: PlateAppearance) => pa.bbType?.toLowerCase().includes("ground")).length;
        const lineDrives = inPlayPAs.filter((pa: PlateAppearance) => pa.bbType?.toLowerCase().includes("line")).length;
        const flyBalls = inPlayPAs.filter((pa: PlateAppearance) => pa.bbType?.toLowerCase().includes("fly")).length;
        const totalBBs = groundBalls + lineDrives + flyBalls;

        const gbPercent = totalBBs > 0 ? (groundBalls / totalBBs) * 100 : 0;
        const ldPercent = totalBBs > 0 ? (lineDrives / totalBBs) * 100 : 0;
        const fbPercent = totalBBs > 0 ? (flyBalls / totalBBs) * 100 : 0;

        // Calculate advanced metrics
        const woba = calculateWOBA({
          walks,
          hbp,
          singles,
          doubles,
          triples,
          homeRuns,
          atBats,
          sacrificeFlies,
        });

        const wraa = calculateWRAA(woba, plateAppearances.length);
        const wrcPlus = calculateWRCPlus(wraa, plateAppearances.length);

        // Calculate contact quality metrics
        const contactQuality = calculateContactQuality(plateAppearances);

        // Calculate situational stats
        const situationalStats = calculateSituationalStats(plateAppearances);

        const stats: BaseballStats = {
          // Basic stats
          avg,
          obp,
          slg,
          ops,
          hits,
          walks,
          strikeouts,
          doubles,
          triples,
          homeRuns,
          atBats,
          plateAppearances: plateAppearances.length,
          kRate,
          bbRate,

          // Advanced stats
          woba,
          wraa,
          wrcPlus,

          // Contact quality
          hardContact: contactQuality.hardContact || 0,
          mediumContact: contactQuality.mediumContact || 0,
          softContact: contactQuality.softContact || 0,
          gbPercent,
          ldPercent,
          fbPercent,

          // Situational stats
          clutchPerformance: situationalStats.clutchPerformance || 0,
          leverageIndex: plateAppearances.reduce((sum, pa) => sum + (pa.leverageIndex || 0), 0) / plateAppearances.length,
          zScore: 0, // Will be updated after all players are processed
        };

        return {
          id: player.id.toString(),
          name: player.name,
          team: {
            ...player.team,
            id: player.team?.id?.toString() || "1"
          },
          stats,
        };
      })
      .filter(Boolean); // Remove null entries

    // Calculate z-scores across all players
    const zScores = calculatePlayerZScores(hitters);
    
    // Update player stats with z-scores
    const hittersWithZScores = hitters.map((hitter: { id: string; name: string; team: any; stats: BaseballStats }, index: number) => ({
      ...hitter,
      stats: {
        ...hitter.stats,
        zScore: zScores[index]?.zScore || 0,
      },
    }));

    // FLATTEN stats into the root object for frontend compatibility
    const flattenedHitters = hittersWithZScores.map((hitter: { id: string; name: string; team: any; stats: BaseballStats }) => ({
      id: hitter.id,
      name: hitter.name,
      team: hitter.team,
      paCount: hitter.stats.plateAppearances,
      avg: hitter.stats.avg.toFixed(3),
      kRate: Number(hitter.stats.kRate.toFixed(1)),
      gbPercent: Number(hitter.stats.gbPercent.toFixed(1)),
      ldPercent: Number(hitter.stats.ldPercent.toFixed(1)),
      fbPercent: Number(hitter.stats.fbPercent.toFixed(1)),
      obp: hitter.stats.obp.toFixed(3),
      slg: hitter.stats.slg.toFixed(3),
      ops: hitter.stats.ops.toFixed(3),
      bbRate: Number(hitter.stats.bbRate.toFixed(1)),
      hits: hitter.stats.hits,
      walks: hitter.stats.walks,
      strikeouts: hitter.stats.strikeouts,
      doubles: hitter.stats.doubles,
      triples: hitter.stats.triples,
      homeRuns: hitter.stats.homeRuns,
      // Optionally include zScore or other stats if needed
    }));

    return NextResponse.json(flattenedHitters);
  } catch (error) {
    console.error("Error fetching hitters:", error);
    return NextResponse.json({ error: "Failed to fetch hitters" }, { status: 500 });
  }
}
