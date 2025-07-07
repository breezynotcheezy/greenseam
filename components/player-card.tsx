"use client"

import { useState } from "react"
import { BarChart, Bar, ResponsiveContainer } from "recharts"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Button } from "@/components/ui/button"
import { ChevronDown, BarChart3, Brain } from "lucide-react"
import { PlayerStats } from "./player-stats"
import { PlayerInsights } from "./player-insights"

interface PlayerCardProps {
  player: {
    id: string
    name: string
    team: {
      id: string
      name: string
      color?: string
      emoji?: string
    } | null
    paCount: number
    avg: string
    kRate: number
    gbPercent: number
    ldPercent: number
    fbPercent: number
    obp: string
    slg: string
    ops: string
    bbRate: number
    hits: number
    walks: number
    strikeouts: number
    doubles: number
    triples: number
    homeRuns: number
  }
}

export function PlayerCard({ player }: PlayerCardProps) {
  const [statsOpen, setStatsOpen] = useState(false)
  const [insightsOpen, setInsightsOpen] = useState(false)

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const ballTypeData = [
    {
      name: "Ball Types",
      GB: player.gbPercent,
      LD: player.ldPercent,
      FB: player.fbPercent,
    },
  ]

  const teamColor = player.team?.color || "#22c55e"

  return (
    <Card className="bg-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <Avatar className="h-14 w-14" style={{ backgroundColor: `${teamColor}15` }}>
            <AvatarFallback style={{ color: teamColor }} className="font-bold text-lg">
              {getInitials(player.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-xl text-gray-900 truncate">{player.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              {player.team?.emoji && <span className="text-lg">{player.team.emoji}</span>}
              <span className="text-gray-600 font-medium">{player.team?.name}</span>
            </div>
            <Badge variant="secondary" className="bg-forest-50 text-forest-700 border-forest-200 mt-2">
              {player.paCount} Plate Appearances
            </Badge>
          </div>
        </div>

        {/* Ball Type Chart */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Ball Type Distribution</span>
          </div>
          <div className="h-8 rounded-full overflow-hidden bg-gray-100">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ballTypeData} layout="horizontal">
                <Bar dataKey="GB" stackId="a" fill="#ef4444" radius={0} />
                <Bar dataKey="LD" stackId="a" fill="#f59e0b" radius={0} />
                <Bar dataKey="FB" stackId="a" fill="#3b82f6" radius={0} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-2">
            <div className="text-center">
              <div className="text-sm font-semibold text-red-600">{player.gbPercent}%</div>
              <div className="text-xs text-gray-500">Ground</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-semibold text-yellow-600">{player.ldPercent}%</div>
              <div className="text-xs text-gray-500">Line</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-semibold text-blue-600">{player.fbPercent}%</div>
              <div className="text-xs text-gray-500">Fly</div>
            </div>
          </div>
        </div>

        {/* Key Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">{player.avg}</div>
            <div className="text-sm text-gray-600">Batting Average</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{player.kRate}%</div>
            <div className="text-sm text-gray-600">Strikeout Rate</div>
          </div>
        </div>

        {/* Dropdown Sections */}
        <div className="space-y-3">
          {/* Hitter Stats Dropdown */}
          <Collapsible open={statsOpen} onOpenChange={setStatsOpen}>
            <CollapsibleTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-between h-12 bg-blue-50 border-blue-200 hover:bg-blue-100"
              >
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-700">Hitter Stats</span>
                </div>
                <ChevronDown
                  className={`h-4 w-4 text-blue-600 transition-transform ${statsOpen ? "rotate-180" : ""}`}
                />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3">
              <PlayerStats player={player} />
            </CollapsibleContent>
          </Collapsible>

          {/* AI Insights Dropdown */}
          <Collapsible open={insightsOpen} onOpenChange={setInsightsOpen}>
            <CollapsibleTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-between h-12 bg-purple-50 border-purple-200 hover:bg-purple-100"
              >
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-purple-600" />
                  <span className="font-medium text-purple-700">AI Insights</span>
                </div>
                <ChevronDown
                  className={`h-4 w-4 text-purple-600 transition-transform ${insightsOpen ? "rotate-180" : ""}`}
                />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3">
              <PlayerInsights playerId={player.id} />
            </CollapsibleContent>
          </Collapsible>
        </div>
      </CardContent>
    </Card>
  )
}
