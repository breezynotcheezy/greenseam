"use client"

import { Card, CardContent } from "./ui/card"
import { Avatar, AvatarFallback } from "./ui/avatar"
import { Badge } from "./ui/badge"
import { Separator } from "./ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { HitterDetails } from "./hitter-details"
import { getInitials } from "@/lib/utils"

// Define the Hitter type
export interface Hitter {
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

interface HitterCardProps {
  hitter: Hitter
}

export function HitterCard({ hitter }: HitterCardProps) {
  const initials = getInitials(hitter.name)
  const teamColor = hitter.team?.color || "#888888"
  const teamEmoji = hitter.team?.emoji || "⚾"

  // Handle edge cases for ball type distribution
  const hasValidBallData = (hitter.gbPercent + hitter.ldPercent + hitter.fbPercent) > 0
  
  // Calculate percentages that add up to 100% for display
  let displayGB = hitter.gbPercent
  let displayLD = hitter.ldPercent
  let displayFB = hitter.fbPercent
  
  if (hasValidBallData) {
    const total = hitter.gbPercent + hitter.ldPercent + hitter.fbPercent
    if (total !== 100) {
      displayGB = Math.round((hitter.gbPercent / total) * 100)
      displayLD = Math.round((hitter.ldPercent / total) * 100)
      displayFB = 100 - displayGB - displayLD // Ensure they sum to 100%
    }
  } else {
    // Default even distribution if no data
    displayGB = 33
    displayLD = 33
    displayFB = 34
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {/* Header */}
        <div className="p-4 flex items-start gap-3">
          <Avatar className="h-10 w-10 border-2" style={{ borderColor: teamColor }}>
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-medium text-lg leading-tight">{hitter.name}</h3>
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              <span>{teamEmoji}</span>
              <span>{hitter.team.name}</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Stats Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="p-4 pt-3">
            {/* Key Stats */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="bg-muted rounded-md p-2 text-center">
                <div className="text-lg font-semibold">{hitter.avg}</div>
                <div className="text-xs text-muted-foreground">AVG</div>
              </div>
              <div className="bg-muted rounded-md p-2 text-center">
                <div className="text-lg font-semibold">{hitter.obp}</div>
                <div className="text-xs text-muted-foreground">OBP</div>
              </div>
              <div className="bg-muted rounded-md p-2 text-center">
                <div className="text-lg font-semibold">{hitter.slg}</div>
                <div className="text-xs text-muted-foreground">SLG</div>
              </div>
            </div>

            {/* Hit Distribution */}
            <div className="mb-3">
              <div className="text-sm font-medium mb-1">Ball Type Distribution</div>
              {hasValidBallData ? (
                <>
                  <div className="flex h-3 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-500"
                      style={{ width: `${displayGB}%` }}
                      title={`Ground Ball: ${displayGB}%`}
                    />
                    <div
                      className="bg-green-500"
                      style={{ width: `${displayLD}%` }}
                      title={`Line Drive: ${displayLD}%`}
                    />
                    <div
                      className="bg-blue-500"
                      style={{ width: `${displayFB}%` }}
                      title={`Fly Ball: ${displayFB}%`}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>GB: {displayGB}%</span>
                    <span>LD: {displayLD}%</span>
                    <span>FB: {displayFB}%</span>
                  </div>
                </>
              ) : (
                <div className="text-xs text-muted-foreground text-center py-1">
                  Insufficient data
                </div>
              )}
            </div>

            {/* Additional Stats */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">PA:</span>
                <span>{hitter.paCount}</span>
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
          </TabsContent>
          <TabsContent value="details" className="p-0">
            <HitterDetails hitter={hitter} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
