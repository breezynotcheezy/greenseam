"use client"

import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"

interface PlayerStatsProps {
  player: {
    avg: string
    obp: string
    slg: string
    ops: string
    kRate: number
    bbRate: number
    hits: number
    walks: number
    strikeouts: number
    doubles: number
    triples: number
    homeRuns: number
    paCount: number
  }
}

export function PlayerStats({ player }: PlayerStatsProps) {
  const stats = [
    { label: "Batting Average", value: player.avg, color: "bg-green-500" },
    { label: "On-Base Percentage", value: player.obp, color: "bg-blue-500" },
    { label: "Slugging Percentage", value: player.slg, color: "bg-purple-500" },
    { label: "OPS", value: player.ops, color: "bg-orange-500" },
  ]

  const rates = [
    { label: "Strikeout Rate", value: player.kRate, max: 40, color: "bg-red-500" },
    { label: "Walk Rate", value: player.bbRate, max: 20, color: "bg-green-500" },
  ]

  return (
    <div className="bg-blue-50 rounded-lg p-4 space-y-4">
      {/* Slash Line */}
      <div>
        <h4 className="font-semibold text-gray-900 mb-3">Slash Line</h4>
        <div className="grid grid-cols-2 gap-3">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-white rounded-lg p-3">
              <div className="text-lg font-bold text-gray-900">{stat.value}</div>
              <div className="text-xs text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Rates */}
      <div>
        <h4 className="font-semibold text-gray-900 mb-3">Plate Discipline</h4>
        <div className="space-y-3">
          {rates.map((rate) => (
            <div key={rate.label}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-gray-700">{rate.label}</span>
                <span className="text-sm font-semibold text-gray-900">{rate.value.toFixed(1)}%</span>
              </div>
              <Progress value={(rate.value / rate.max) * 100} className="h-2" />
            </div>
          ))}
        </div>
      </div>

      {/* Counting Stats */}
      <div>
        <h4 className="font-semibold text-gray-900 mb-3">Counting Stats</h4>
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">{player.hits}</div>
            <div className="text-xs text-gray-600">Hits</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">{player.walks}</div>
            <div className="text-xs text-gray-600">Walks</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-red-600">{player.strikeouts}</div>
            <div className="text-xs text-gray-600">Strikeouts</div>
          </div>
        </div>
      </div>

      {/* Extra Base Hits */}
      <div>
        <h4 className="font-semibold text-gray-900 mb-3">Extra Base Hits</h4>
        <div className="flex gap-2">
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            {player.doubles} 2B
          </Badge>
          <Badge variant="secondary" className="bg-orange-100 text-orange-800">
            {player.triples} 3B
          </Badge>
          <Badge variant="secondary" className="bg-red-100 text-red-800">
            {player.homeRuns} HR
          </Badge>
        </div>
      </div>
    </div>
  )
}
