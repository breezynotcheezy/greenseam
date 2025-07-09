"use client"

import { create } from "zustand"
import { Separator } from "./ui/separator"
import { Hitter } from "./hitter-card"

interface SprayChartState {
  selectedHitType: string
  setSelectedHitType: (type: string) => void
}

const useSprayChartStore = create<SprayChartState>((set) => ({
  selectedHitType: "all",
  setSelectedHitType: (type) => set({ selectedHitType: type }),
}))

export function HitterDetails({ hitter }: { hitter: Hitter }) {
  const { selectedHitType, setSelectedHitType } = useSprayChartStore()

  // Generate mock spray chart data based on ball distribution
  const generateSprayChartPoints = () => {
    const points = []
    const totalPoints = Math.min(hitter.paCount, 30) // Cap at 30 points for visual clarity

    // Distribution based on hitter profile
    const groundBallCount = Math.round((hitter.gbPercent / 100) * totalPoints)
    const lineDriveCount = Math.round((hitter.ldPercent / 100) * totalPoints)
    const flyBallCount = totalPoints - groundBallCount - lineDriveCount

    // Generate ground balls (mostly to pull and middle)
    for (let i = 0; i < groundBallCount; i++) {
      const angle = Math.random() * 110 - 15 // -15 to 95 degrees
      const distance = Math.random() * 30 + 60 // 60-90% of field
      points.push({
        x: Math.cos((angle * Math.PI) / 180) * distance,
        y: Math.sin((angle * Math.PI) / 180) * distance,
        type: "Ground",
      })
    }

    // Generate line drives (more evenly distributed)
    for (let i = 0; i < lineDriveCount; i++) {
      const angle = Math.random() * 140 - 30 // -30 to 110 degrees
      const distance = Math.random() * 30 + 65 // 65-95% of field
      points.push({
        x: Math.cos((angle * Math.PI) / 180) * distance,
        y: Math.sin((angle * Math.PI) / 180) * distance,
        type: "Line",
      })
    }

    // Generate fly balls (more to pull side for power)
    for (let i = 0; i < flyBallCount; i++) {
      const angle = Math.random() * 120 - 20 // -20 to 100 degrees
      const distance = Math.random() * 40 + 60 // 60-100% of field
      points.push({
        x: Math.cos((angle * Math.PI) / 180) * distance,
        y: Math.sin((angle * Math.PI) / 180) * distance,
        type: "Fly",
      })
    }

    return points
  }

  const sprayPoints = generateSprayChartPoints()
  const filteredPoints = selectedHitType === "all" 
    ? sprayPoints 
    : sprayPoints.filter(point => point.type === selectedHitType)

  return (
    <div className="space-y-4 p-4">
      {/* Stats Overview */}
      <div>
        <h3 className="text-sm font-medium mb-2">Hitting Stats</h3>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">PA:</span>
            <span>{hitter.paCount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">AVG:</span>
            <span>{hitter.avg}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">OBP:</span>
            <span>{hitter.obp}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">SLG:</span>
            <span>{hitter.slg}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">OPS:</span>
            <span>{hitter.ops}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">K Rate:</span>
            <span>{hitter.kRate.toFixed(1)}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">BB Rate:</span>
            <span>{hitter.bbRate.toFixed(1)}%</span>
          </div>
        </div>
      </div>

      <Separator />

      {/* Detailed Stats */}
      <div>
        <h3 className="text-sm font-medium mb-2">Hit Breakdown</h3>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Hits:</span>
            <span>{hitter.hits}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Doubles:</span>
            <span>{hitter.doubles}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Triples:</span>
            <span>{hitter.triples}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Home Runs:</span>
            <span>{hitter.homeRuns}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Walks:</span>
            <span>{hitter.walks}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Strikeouts:</span>
            <span>{hitter.strikeouts}</span>
          </div>
        </div>
      </div>

      <Separator />

      {/* Spray Chart */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-medium">Spray Chart</h3>
          <div className="flex gap-1">
            <button
              onClick={() => setSelectedHitType("all")}
              className={`px-2 py-1 text-xs rounded ${
                selectedHitType === "all" ? "bg-primary text-primary-foreground" : "bg-secondary"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSelectedHitType("Ground")}
              className={`px-2 py-1 text-xs rounded ${
                selectedHitType === "Ground" ? "bg-amber-500 text-white" : "bg-secondary"
              }`}
            >
              GB
            </button>
            <button
              onClick={() => setSelectedHitType("Line")}
              className={`px-2 py-1 text-xs rounded ${
                selectedHitType === "Line" ? "bg-green-500 text-white" : "bg-secondary"
              }`}
            >
              LD
            </button>
            <button
              onClick={() => setSelectedHitType("Fly")}
              className={`px-2 py-1 text-xs rounded ${
                selectedHitType === "Fly" ? "bg-blue-500 text-white" : "bg-secondary"
              }`}
            >
              FB
            </button>
          </div>
        </div>

        {/* Baseball Field SVG */}
        <div className="relative w-full aspect-square bg-green-100 rounded-full overflow-hidden">
          {/* Field lines */}
          <svg
            viewBox="-100 -100 200 200"
            className="absolute inset-0 w-full h-full"
            style={{ transform: "rotate(-45deg)" }}
          >
            {/* Infield dirt */}
            <path
              d="M 0,0 L 70.7,70.7 L 0,100 L -70.7,70.7 Z"
              fill="#e2c19d"
              stroke="#b58863"
              strokeWidth="1"
            />
            
            {/* Bases */}
            <rect x="-3" y="-3" width="6" height="6" fill="white" stroke="#333" strokeWidth="1" /> {/* Home */}
            <rect x="67" y="67" width="6" height="6" fill="white" stroke="#333" strokeWidth="1" /> {/* 1st */}
            <rect x="-3" y="97" width="6" height="6" fill="white" stroke="#333" strokeWidth="1" /> {/* 2nd */}
            <rect x="-73" y="67" width="6" height="6" fill="white" stroke="#333" strokeWidth="1" /> {/* 3rd */}
            
            {/* Pitcher's mound */}
            <circle cx="0" cy="50" r="5" fill="#e2c19d" stroke="#b58863" strokeWidth="1" />
            
            {/* Outfield lines */}
            <line x1="70.7" y1="70.7" x2="100" y2="100" stroke="#ffffff" strokeWidth="2" />
            <line x1="-70.7" y1="70.7" x2="-100" y2="100" stroke="#ffffff" strokeWidth="2" />
            
            {/* Hit points */}
            {filteredPoints.map((point, i) => {
              let color = "#666";
              if (point.type === "Ground") color = "#f59e0b";
              if (point.type === "Line") color = "#10b981";
              if (point.type === "Fly") color = "#3b82f6";
              
              return (
                <circle
                  key={i}
                  cx={point.x}
                  cy={point.y}
                  r="2.5"
                  fill={color}
                  stroke="#fff"
                  strokeWidth="0.5"
                />
              );
            })}
          </svg>
        </div>
        <div className="flex justify-center gap-4 mt-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-amber-500"></span>
            <span>Ground Ball</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-green-500"></span>
            <span>Line Drive</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-blue-500"></span>
            <span>Fly Ball</span>
          </div>
        </div>
      </div>
    </div>
  )
}
