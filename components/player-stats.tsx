"use client"

interface PlayerStatsProps {
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

export function PlayerStats({ player }: PlayerStatsProps) {
  // Calculate derived stats
  const atBats = player.paCount - player.walks;
  const singles = player.hits - (player.doubles + player.triples + player.homeRuns);
  const totalBases = singles + (2 * player.doubles) + (3 * player.triples) + (4 * player.homeRuns);

  return (
    <div className="space-y-6">
      {/* Main Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-muted rounded-md p-3 text-center">
          <div className="text-2xl font-semibold">{player.avg}</div>
          <div className="text-xs text-muted-foreground">AVG</div>
        </div>
        <div className="bg-muted rounded-md p-3 text-center">
          <div className="text-2xl font-semibold">{player.obp}</div>
          <div className="text-xs text-muted-foreground">OBP</div>
        </div>
        <div className="bg-muted rounded-md p-3 text-center">
          <div className="text-2xl font-semibold">{player.slg}</div>
          <div className="text-xs text-muted-foreground">SLG</div>
        </div>
      </div>
      
      {/* Secondary Stats */}
      <div>
        <h3 className="text-sm font-medium mb-2">Batting Stats</h3>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Plate Appearances:</span>
            <span>{player.paCount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">At Bats:</span>
            <span>{atBats}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Hits:</span>
            <span>{player.hits}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Walks:</span>
            <span>{player.walks}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Strikeouts:</span>
            <span>{player.strikeouts}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Bases:</span>
            <span>{totalBases}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">OPS:</span>
            <span>{player.ops}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">K Rate:</span>
            <span>{player.kRate.toFixed(1)}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">BB Rate:</span>
            <span>{player.bbRate.toFixed(1)}%</span>
          </div>
        </div>
      </div>
      
      {/* Hit Breakdown */}
      <div>
        <h3 className="text-sm font-medium mb-2">Hit Breakdown</h3>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Singles:</span>
            <span>{singles}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Doubles:</span>
            <span>{player.doubles}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Triples:</span>
            <span>{player.triples}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Home Runs:</span>
            <span>{player.homeRuns}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
