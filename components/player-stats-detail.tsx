"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { STAT_DISPLAY_CONFIG, formatStat } from "@/lib/stats-utils"

interface PlayerStatsDetailProps {
  stats: {
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
    
    // Advanced stats
    woba: number;
    wraa: number;
    wrcPlus: number;
    
    // Contact quality
    hardContact: number;
    mediumContact: number;
    softContact: number;
    
    // Situational stats
    clutchPerformance: number;
  }
}

export function PlayerStatsDetail({ stats }: PlayerStatsDetailProps) {
  // Group stats by category
  const statsByCategory = Object.entries(STAT_DISPLAY_CONFIG).reduce((acc, [key, config]) => {
    if (key in stats) {
      if (!acc[config.category]) {
        acc[config.category] = [];
      }
      acc[config.category].push({
        key,
        value: stats[key as keyof typeof stats],
        ...config,
      });
    }
    return acc;
  }, {} as Record<string, Array<typeof STAT_DISPLAY_CONFIG[keyof typeof STAT_DISPLAY_CONFIG] & { key: string; value: number }>>);

  // Sort stats within each category
  Object.values(statsByCategory).forEach(categoryStats => {
    categoryStats.sort((a, b) => a.sortOrder - b.sortOrder);
  });

  return (
    <Tabs defaultValue="basic" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="basic">Basic</TabsTrigger>
        <TabsTrigger value="advanced">Advanced</TabsTrigger>
        <TabsTrigger value="contact">Contact</TabsTrigger>
        <TabsTrigger value="situational">Situational</TabsTrigger>
      </TabsList>

      {/* Basic Stats */}
      <TabsContent value="basic">
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 gap-4">
              {statsByCategory.basic?.map(stat => (
                <div key={stat.key} className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{stat.label}</span>
                    <span className="text-xs text-muted-foreground">{stat.description}</span>
                  </div>
                  <span className="text-sm font-medium">{formatStat(stat.value, stat.format)}</span>
                </div>
              ))}
              <div className="flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-sm font-medium">PA</span>
                  <span className="text-xs text-muted-foreground">Plate Appearances</span>
                </div>
                <span className="text-sm font-medium">{stats.plateAppearances}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-sm font-medium">AB</span>
                  <span className="text-xs text-muted-foreground">At Bats</span>
                </div>
                <span className="text-sm font-medium">{stats.atBats}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Advanced Stats */}
      <TabsContent value="advanced">
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 gap-4">
              {statsByCategory.advanced?.map(stat => (
                <div key={stat.key} className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{stat.label}</span>
                    <span className="text-xs text-muted-foreground">{stat.description}</span>
                  </div>
                  <span className="text-sm font-medium">{formatStat(stat.value, stat.format)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Contact Quality */}
      <TabsContent value="contact">
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 gap-4">
              {statsByCategory.contact?.map(stat => (
                <div key={stat.key} className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{stat.label}</span>
                    <span className="text-xs text-muted-foreground">{stat.description}</span>
                  </div>
                  <span className="text-sm font-medium">{formatStat(stat.value, stat.format)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Situational Stats */}
      <TabsContent value="situational">
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 gap-4">
              {statsByCategory.situational?.map(stat => (
                <div key={stat.key} className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{stat.label}</span>
                    <span className="text-xs text-muted-foreground">{stat.description}</span>
                  </div>
                  <span className="text-sm font-medium">{formatStat(stat.value, stat.format)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
} 