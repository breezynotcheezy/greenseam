"use client"

import { Card, CardContent, CardHeader } from './ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { PlayerStatsDetail } from './player-stats-detail'
import { BaseballStats, statDisplayConfig } from '@/lib/types'

interface HitterCardProps {
  id: string
  name: string
  team: {
    name: string
    color?: string
    emoji?: string
  }
  stats: BaseballStats
}

export function HitterCard({ id, name, team, stats }: HitterCardProps) {
  // Get primary stats with property name mapping
  const primaryStats = Object.entries(statDisplayConfig)
    .filter(([_, config]) => config.primaryStat)
    .map(([key, config]) => {
      // Handle property name mapping
      let value;
      if (key === 'pa') {
        value = stats.plateAppearances;
      } else if (key === 'ab') {
        value = stats.atBats;
      } else {
        value = stats[key as keyof BaseballStats];
      }
      
      return {
        key,
        label: config.label,
        value: config.format(value || 0),
        description: config.description,
      };
    });

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-semibold">{name}</span>
            <span className="text-sm text-muted-foreground">{team.name}</span>
          </div>
          <div className="flex items-center gap-2">
            {team.emoji && (
              <span className="text-xl">{team.emoji}</span>
            )}
            {team.color && (
              <div 
                className="w-4 h-4 rounded-full" 
                style={{ backgroundColor: team.color }}
              />
            )}
          </div>
        </div>
        <div className="flex items-center gap-4 mt-2">
          {primaryStats.map(stat => (
            <div key={stat.key} className="text-sm" title={stat.description}>
              <span className="text-muted-foreground">{stat.label}: </span>
              <span className="font-medium">{stat.value}</span>
            </div>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <PlayerStatsDetail stats={stats} />
      </CardContent>
    </Card>
  )
}
