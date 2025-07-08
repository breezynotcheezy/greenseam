"use client"

import { useState, useMemo } from "react"
import useSWR from "swr"
import Fuse from "fuse.js"
import Masonry from "react-masonry-css"
import { RefreshCw, Search, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { HitterCard } from "@/components/hitter-card"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { BarChart, Bar, ResponsiveContainer } from "recharts"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

// Standalone test hitter card that doesn't rely on the HitterCard component
function TestHitterCard() {
  const hitter = {
    id: 999,
    name: "TEST HITTER CARD",
    team: {
      id: 1,
      name: "Demo Team",
      color: "#00467F",
      emoji: "⚾"
    },
    paCount: 25,
    avg: "0.320",
    kRate: 20,
    gbPercent: 40,
    ldPercent: 35,
    fbPercent: 25
  }

  // Sample spray chart data points
  const sprayChartData = [
    { x: 75, y: 60, type: "single" },
    { x: 60, y: 40, type: "double" },
    { x: 90, y: 30, type: "flyout" },
    { x: 40, y: 70, type: "groundout" },
    { x: 110, y: 50, type: "lineout" },
    { x: 80, y: 20, type: "homerun" },
    { x: 50, y: 50, type: "single" },
    { x: 95, y: 65, type: "groundout" },
    { x: 65, y: 80, type: "lineout" },
    { x: 85, y: 45, type: "double" },
  ]

  const teamColor = hitter.team?.color || "#00467F"

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <Card className="bg-white border border-gray-200 shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <Avatar className="h-8 w-8" style={{ backgroundColor: `${teamColor}15` }}>
            <AvatarFallback style={{ color: teamColor }} className="text-xs font-bold">
              {getInitials(hitter.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm truncate">{hitter.name}</h3>
            <div className="flex items-center gap-1">
              {hitter.team?.emoji && <span className="text-xs">{hitter.team.emoji}</span>}
              <span className="text-xs text-gray-600">{hitter.team?.name}</span>
            </div>
          </div>
          <Badge variant="secondary" className="text-xs">
            {hitter.paCount} PA
          </Badge>
        </div>

        {/* Spray Chart */}
        <div className="mb-3">
          <div className="text-xs font-medium text-gray-700 mb-1">Spray Chart</div>
          <div className="relative h-24 w-full bg-gray-50 rounded-md overflow-hidden">
            {/* Field outline */}
            <svg viewBox="0 0 120 100" className="w-full h-full">
              {/* Outfield */}
              <path
                d="M60,90 L10,40 A50,50 0 0,1 110,40 L60,90 Z"
                fill="#e7f5e7"
                stroke="#c0c0c0"
                strokeWidth="1"
              />
              
              {/* Infield */}
              <path
                d="M60,90 L40,70 L60,50 L80,70 L60,90 Z"
                fill="#e0e0e0"
                stroke="#c0c0c0"
                strokeWidth="1"
              />
              
              {/* Bases */}
              <rect x="59" y="89" width="2" height="2" fill="#fff" stroke="#888" />
              <rect x="39" y="69" width="2" height="2" fill="#fff" stroke="#888" />
              <rect x="59" y="49" width="2" height="2" fill="#fff" stroke="#888" />
              <rect x="79" y="69" width="2" height="2" fill="#fff" stroke="#888" />
              
              {/* Pitcher's mound */}
              <circle cx="60" cy="70" r="2" fill="#e0e0e0" stroke="#c0c0c0" />
              
              {/* Hit locations */}
              {sprayChartData.map((hit, i) => {
                let color;
                let size;
                
                switch(hit.type) {
                  case "single":
                    color = "#22c55e";
                    size = 2;
                    break;
                  case "double":
                    color = "#3b82f6";
                    size = 2.5;
                    break;
                  case "homerun":
                    color = "#ef4444";
                    size = 3;
                    break;
                  case "groundout":
                    color = "#9ca3af";
                    size = 1.5;
                    break;
                  case "flyout":
                    color = "#6b7280";
                    size = 1.5;
                    break;
                  case "lineout":
                    color = "#4b5563";
                    size = 1.5;
                    break;
                  default:
                    color = "#9ca3af";
                    size = 1.5;
                }
                
                return (
                  <circle 
                    key={i}
                    cx={hit.x}
                    cy={hit.y}
                    r={size}
                    fill={color}
                    opacity="0.8"
                  />
                );
              })}
            </svg>
          </div>
        </div>

        {/* Key Stats */}
        <div className="grid grid-cols-3 gap-2 mb-2">
          <div className="text-center p-1 bg-gray-50 rounded">
            <div className="text-sm font-medium">{hitter.avg}</div>
            <div className="text-xs text-gray-500">AVG</div>
          </div>
          <div className="text-center p-1 bg-gray-50 rounded">
            <div className="text-sm font-medium">{hitter.kRate}%</div>
            <div className="text-xs text-gray-500">K%</div>
          </div>
          <div className="text-center p-1 bg-gray-50 rounded">
            <div className="text-sm font-medium">{hitter.gbPercent}%</div>
            <div className="text-xs text-gray-500">GB%</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function HittersPage() {
  const [selectedTeam, setSelectedTeam] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [minPA, setMinPA] = useState([5])
  const [sortBy, setSortBy] = useState("name")

  // Fetch teams and hitters
  const { data: teams } = useSWR("/api/teams", fetcher)
  const { data: hitters, mutate } = useSWR(`/api/hitters?teamId=${selectedTeam}&minPA=${minPA[0]}`, fetcher)

  // Setup fuzzy search
  const fuse = useMemo(() => {
    if (!hitters) return null
    return new Fuse(hitters, {
      keys: ["name", "team.name"],
      threshold: 0.3,
    })
  }, [hitters])

  // Filter and sort hitters
  const filteredHitters = useMemo(() => {
    if (!hitters || hitters.length === 0) return []

    let filtered = hitters

    // Apply search filter
    if (searchQuery && fuse) {
      const searchResults = fuse.search(searchQuery)
      filtered = searchResults.map((result) => result.item)
    }

    // Sort hitters
    filtered.sort((a: any, b: any) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name)
        case "avg":
          return Number.parseFloat(b.avg) - Number.parseFloat(a.avg)
        case "pa":
          return b.paCount - a.paCount
        case "k-rate":
          return a.kRate - b.kRate
        default:
          return 0
      }
    })

    return filtered
  }, [hitters, searchQuery, fuse, sortBy])

  const breakpointColumns = {
    default: 4,
    1100: 3,
    700: 2,
    500: 1,
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Opponent Hitters</h1>
        <p className="text-muted-foreground mt-2">Analyze opponent hitting patterns and strategic insights</p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-4 p-4 bg-card rounded-lg border">
        <div className="flex-1 min-w-[200px]">
          <Label htmlFor="team-select">Team</Label>
          <Select value={selectedTeam} onValueChange={setSelectedTeam}>
            <SelectTrigger id="team-select">
              <SelectValue placeholder="Select team" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Teams</SelectItem>
              {teams?.map((team: any) => (
                <SelectItem key={team.id} value={team.id.toString()}>
                  {team.emoji ? `${team.emoji} ` : ""}
                  {team.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 min-w-[200px]">
          <Label htmlFor="search">Search Players</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Search by name or team..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="min-w-[150px]">
          <Label>Min PA: {minPA[0]}</Label>
          <Slider value={minPA} onValueChange={setMinPA} min={1} max={50} step={1} className="mt-2" />
        </div>

        <div className="min-w-[120px]">
          <Label htmlFor="sort-select">Sort By</Label>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger id="sort-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="avg">Average</SelectItem>
              <SelectItem value="pa">Plate Apps</SelectItem>
              <SelectItem value="k-rate">K Rate</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Test hitter card - Compact and Inline */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-medium text-gray-500">Test Card (For Reference)</h3>
        <Badge variant="outline" className="text-xs">Example</Badge>
      </div>
      <div className="max-w-xs mx-auto mb-4">
        <TestHitterCard />
      </div>

      {/* Results */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {filteredHitters.length} hitter{filteredHitters.length !== 1 ? "s" : ""} found
        </p>
        <Button variant="outline" size="sm" onClick={() => mutate()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Hitter Cards */}
      {filteredHitters.length > 0 ? (
        <Masonry
          breakpointCols={breakpointColumns}
          className="flex w-auto -ml-6"
          columnClassName="pl-6 bg-clip-padding"
        >
          {filteredHitters.map((hitter: any) => (
            <div key={hitter.id} className="mb-6">
              <HitterCard hitter={hitter} />
            </div>
          ))}
        </Masonry>
      ) : (
        <Card className="shadow-sm border-0 bg-white">
          <CardContent className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Users className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Test Mode Active</h3>
            <p className="text-gray-600">
              Displaying test hitter cards for demonstration purposes
            </p>
          </CardContent>
        </Card>
      )}

      {/* FAB Refresh Button */}
      <Button className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg" size="icon" onClick={() => mutate()}>
        <RefreshCw className="h-5 w-5" />
      </Button>
    </div>
  )
}
