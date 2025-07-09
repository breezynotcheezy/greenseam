"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PlayerDetails } from "@/components/player-details"
import { PlayerStats } from "@/components/player-stats"
import { PlayerInsights } from "@/components/player-insights"

interface PlayerCardProps {
  player: {
    id: string
    name: string
    team: {
      id: string
      name: string
      color?: string
      emoji?: string
    }
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
  const [activeTab, setActiveTab] = useState("stats")

  // Format numeric values
  const formatStat = (value: number | string, decimals = 3): string => {
    if (typeof value === 'string') return value;
    return value.toFixed(decimals);
  }

  // Custom tab styles
  const tabClass = (tab: string) => {
    if (tab === "insights") {
      return activeTab === "insights"
        ? "bg-purple-600 text-white font-bold shadow rounded-full px-4 py-1"
        : "bg-purple-100 text-purple-800 rounded-full px-4 py-1 hover:bg-purple-200"
    }
    if (tab === "details") {
      return activeTab === "details"
        ? "bg-yellow-400 text-gray-900 font-bold shadow rounded-full px-4 py-1"
        : "bg-yellow-100 text-yellow-900 rounded-full px-4 py-1 hover:bg-yellow-200"
    }
    return activeTab === tab
      ? "bg-gray-900 text-white font-bold shadow rounded-full px-4 py-1"
      : "bg-gray-100 text-gray-700 rounded-full px-4 py-1 hover:bg-gray-200"
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-4 border-b flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {player.name}
          </h3>
          <p className="text-sm text-gray-500">
            {player.team.emoji} {player.team.name}
          </p>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold">{formatStat(player.avg)}</div>
          <div className="text-xs text-gray-500">{player.paCount} PA</div>
        </div>
      </div>

      <Tabs defaultValue="stats" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 w-full gap-1 bg-gray-50 p-1 rounded-b-none rounded-t-lg">
          <TabsTrigger value="details" className={tabClass("details") + " rounded-l-md transition-all duration-150"}>
            Details
          </TabsTrigger>
          <TabsTrigger value="stats" className={tabClass("stats") + " transition-all duration-150"}>
            Stats
          </TabsTrigger>
          <TabsTrigger value="insights" className={tabClass("insights") + " rounded-r-md transition-all duration-150"}>
            AI Insights
          </TabsTrigger>
        </TabsList>
        <TabsContent value="details" className="p-4">
          <PlayerDetails player={player} />
        </TabsContent>
        <TabsContent value="stats" className="p-4">
          <PlayerStats player={player} />
        </TabsContent>
        <TabsContent value="insights" className="p-4">
          <PlayerInsights playerId={player.id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
