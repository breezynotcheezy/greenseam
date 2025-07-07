"use client"

import { useState } from "react"
import { BarChart, Bar, ResponsiveContainer } from "recharts"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { HitterDetails } from "./hitter-details"

interface HitterCardProps {
  hitter: {
    id: number
    name: string
    team: {
      id: number
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
  }
}

export function HitterCard({ hitter }: HitterCardProps) {
  const [open, setOpen] = useState(false)

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
      GB: hitter.gbPercent,
      LD: hitter.ldPercent,
      FB: hitter.fbPercent,
    },
  ]

  const teamColor = hitter.team?.color || "#00467F"

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Card
          className="cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] backdrop-blur-sm bg-card/80 border-2"
          style={{ borderColor: `${teamColor}20` }}
        >
          <CardContent className="p-4">
            <div className="flex items-start gap-3 mb-3">
              <Avatar className="h-10 w-10" style={{ backgroundColor: `${teamColor}15` }}>
                <AvatarFallback style={{ color: teamColor }}>{getInitials(hitter.name)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm truncate">{hitter.name}</h3>
                <Badge variant="secondary" className="text-xs mt-1">
                  {hitter.paCount} PA
                </Badge>
              </div>
            </div>

            {/* Ball Type Chart */}
            <div className="h-8 mb-3">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ballTypeData} layout="horizontal">
                  <Bar dataKey="GB" stackId="a" fill="#ef4444" />
                  <Bar dataKey="LD" stackId="a" fill="#f59e0b" />
                  <Bar dataKey="FB" stackId="a" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Stats Line */}
            <div className="text-xs text-muted-foreground space-y-1">
              <div className="flex justify-between">
                <span>{hitter.avg} AVG</span>
                <span>{hitter.paCount} PA</span>
                <span>{hitter.kRate}% K</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span style={{ color: "#ef4444" }}>GB {hitter.gbPercent}%</span>
                <span style={{ color: "#f59e0b" }}>LD {hitter.ldPercent}%</span>
                <span style={{ color: "#3b82f6" }}>FB {hitter.fbPercent}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </SheetTrigger>

      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {hitter.team?.emoji && <span className="text-lg">{hitter.team.emoji}</span>}
            {hitter.name}
            <Badge variant="outline">{hitter.team?.name}</Badge>
          </SheetTitle>
        </SheetHeader>

        <HitterDetails hitter={hitter} />
      </SheetContent>
    </Sheet>
  )
}
