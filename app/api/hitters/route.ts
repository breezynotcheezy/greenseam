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
        const hits = plateAppearances.filter((pa: PlateAppearance) => pa.result === "Hit").length;
        const walks = plateAppearances.filter((pa: PlateAppearance) => pa.isWalk).length;
        const strikeouts = plateAppearances.filter((pa: PlateAppearance) => pa.isStrikeout).length;
        const hbp = plateAppearances.filter((pa: PlateAppearance) => pa.isHBP).length;
        const sacrificeFlies = plateAppearances.filter((pa: PlateAppearance) => pa.isSacFly).length;
        const doubles = plateAppearances.filter((pa: PlateAppearance) => pa.bbType === "2B").length;
        const triples = plateAppearances.filter((pa: PlateAppearance) => pa.bbType === "3B").length;
        const homeRuns = plateAppearances.filter((pa: PlateAppearance) => pa.isHomeRun).length;
        const singles = hits - (doubles + triples + homeRuns);
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

    return NextResponse.json(hittersWithZScores);
  } catch (error) {
    console.error("Error fetching hitters:", error);
    return NextResponse.json({ error: "Failed to fetch hitters" }, { status: 500 });
  }
}
