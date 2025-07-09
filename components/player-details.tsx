"use client"

import { Separator } from "./ui/separator"

interface PlayerDetailsProps {
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

export function PlayerDetails({ player }: PlayerDetailsProps) {
  // Format numeric values
  const formatStat = (value: number | string, decimals = 3): string => {
    if (typeof value === 'string') return value;
    return value.toFixed(decimals);
  }

  return (
    <div className="space-y-4">
      {/* Ball Type Distribution */}
      <div>
        <h4 className="text-sm font-medium mb-2">Ball Type Distribution</h4>
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center">
            <div className="text-lg font-bold text-red-600">{player.gbPercent}%</div>
            <div className="text-xs text-gray-600">Ground</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-yellow-600">{player.ldPercent}%</div>
            <div className="text-xs text-gray-600">Line</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">{player.fbPercent}%</div>
            <div className="text-xs text-gray-600">Fly</div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Slash Line */}
      <div>
        <h4 className="text-sm font-medium mb-2">Slash Line</h4>
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center">
            <div className="text-lg font-bold">{player.avg}</div>
            <div className="text-xs text-gray-600">AVG</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold">{player.obp}</div>
            <div className="text-xs text-gray-600">OBP</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold">{player.slg}</div>
            <div className="text-xs text-gray-600">SLG</div>
          </div>
        </div>
      </div>
    </div>
  )
}
