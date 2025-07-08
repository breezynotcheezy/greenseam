"use client"

import { useState, useMemo, useEffect } from "react"
import useSWR from "swr"
import Fuse from "fuse.js"
import Masonry from "react-masonry-css"
import { Search, Filter, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PlayerCard } from "@/components/player-card"
import { Header } from "@/components/header"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { BarChart, Bar, ResponsiveContainer } from "recharts"
import { ChevronDown, BarChart3, Brain } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

// Test player card component that doesn't rely on external data
function TestPlayerCard() {
  const [statsOpen, setStatsOpen] = useState(false)
  const [insightsOpen, setInsightsOpen] = useState(false)
  const [aiInsights, setAiInsights] = useState("")
  const [isLoadingInsights, setIsLoadingInsights] = useState(false)
  
  const player = {
    id: "test-player",
    name: "TEST PLAYER CARD",
    team: {
      id: "test-team",
      name: "Demo Team",
      color: "#22c55e",
      emoji: "⚾"
    },
    paCount: 25,
    avg: "0.320",
    kRate: 20,
    gbPercent: 40,
    ldPercent: 35,
    fbPercent: 25,
    obp: "0.400",
    slg: "0.550",
    ops: "0.950",
    bbRate: 12,
    hits: 8,
    walks: 3,
    strikeouts: 5,
    doubles: 2,
    triples: 1,
    homeRuns: 1
  }

  // Fetch AI insights when insights panel is opened
  const fetchInsights = async () => {
    if (aiInsights || isLoadingInsights) return;
    
    try {
      setIsLoadingInsights(true);
      const response = await fetch('/api/insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ playerData: player }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch insights');
      }
      
      const data = await response.json();
      setAiInsights(data.insights);
    } catch (error) {
      console.error('Error fetching insights:', error);
      setAiInsights('Unable to load insights at this time.');
    } finally {
      setIsLoadingInsights(false);
    }
  };

  // Call fetchInsights when insights panel is opened
  useEffect(() => {
    if (insightsOpen) {
      fetchInsights();
    }
  }, [insightsOpen]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
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

  const teamColor = player.team?.color || "#22c55e"

  return (
    <Card className="bg-white border border-gray-200 shadow-sm">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <Avatar className="h-8 w-8" style={{ backgroundColor: `${teamColor}15` }}>
            <AvatarFallback style={{ color: teamColor }} className="text-xs font-bold">
              {getInitials(player.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm truncate">{player.name}</h3>
            <div className="flex items-center gap-1">
              {player.team?.emoji && <span className="text-xs">{player.team.emoji}</span>}
              <span className="text-xs text-gray-600">{player.team?.name}</span>
            </div>
          </div>
          <Badge variant="secondary" className="text-xs">
            {player.paCount} PA
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
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="text-center p-1 bg-gray-50 rounded">
            <div className="text-sm font-medium">{player.avg}</div>
            <div className="text-xs text-gray-500">AVG</div>
          </div>
          <div className="text-center p-1 bg-gray-50 rounded">
            <div className="text-sm font-medium">{player.obp}</div>
            <div className="text-xs text-gray-500">OBP</div>
          </div>
          <div className="text-center p-1 bg-gray-50 rounded">
            <div className="text-sm font-medium text-red-600">{player.kRate}%</div>
            <div className="text-xs text-gray-500">K%</div>
          </div>
        </div>

        {/* Dropdown Buttons */}
        <div className="space-y-1">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-between h-8 text-xs"
            onClick={() => setStatsOpen(!statsOpen)}
          >
            <span>Stats</span>
            <ChevronDown className="h-3 w-3" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-between h-8 text-xs"
            onClick={() => setInsightsOpen(!insightsOpen)}
          >
            <span>Insights</span>
            <ChevronDown className="h-3 w-3" />
          </Button>
        </div>

        {/* Stats Collapsible */}
        <Collapsible open={statsOpen} className="mt-2">
          <CollapsibleContent>
            <div className="text-xs space-y-2 pt-2 border-t">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-gray-500">OPS</div>
                  <div className="font-medium">{player.ops}</div>
                </div>
                <div>
                  <div className="text-gray-500">SLG</div>
                  <div className="font-medium">{player.slg}</div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <div className="text-gray-500">H</div>
                  <div className="font-medium">{player.hits}</div>
                </div>
                <div>
                  <div className="text-gray-500">BB</div>
                  <div className="font-medium">{player.walks}</div>
                </div>
                <div>
                  <div className="text-gray-500">K</div>
                  <div className="font-medium">{player.strikeouts}</div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <div className="text-gray-500">2B</div>
                  <div className="font-medium">{player.doubles}</div>
                </div>
                <div>
                  <div className="text-gray-500">3B</div>
                  <div className="font-medium">{player.triples}</div>
                </div>
                <div>
                  <div className="text-gray-500">HR</div>
                  <div className="font-medium">{player.homeRuns}</div>
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Insights Collapsible */}
        <Collapsible open={insightsOpen} className="mt-2">
          <CollapsibleContent>
            <div className="text-xs space-y-2 pt-2 border-t">
              {isLoadingInsights ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-pulse text-gray-500">Loading AI insights...</div>
                </div>
              ) : (
                <div className="prose prose-sm max-w-none">
                  <div className="flex items-start gap-2 mb-2">
                    <Brain className="h-4 w-4 text-forest-500 mt-0.5 flex-shrink-0" />
                    <p className="text-xs leading-normal text-gray-700 m-0">{aiInsights}</p>
                  </div>
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  )
}

export default function PlayersPage() {
  const [selectedTeam, setSelectedTeam] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [minPA, setMinPA] = useState([5])
  const [sortBy, setSortBy] = useState("name")
  const [showFilters, setShowFilters] = useState(false)

  // Fetch teams and players
  const { data: teams } = useSWR("/api/teams", fetcher)
  const { data: players, mutate } = useSWR(`/api/hitters?teamId=${selectedTeam}&minPA=${minPA[0]}`, fetcher)

  // Setup fuzzy search
  const fuse = useMemo(() => {
    if (!players) return null
    return new Fuse(players, {
      keys: ["name", "team.name"],
      threshold: 0.3,
    })
  }, [players])

  // Filter and sort players
  const filteredPlayers = useMemo(() => {
    if (!players) return []

    let filtered = players

    // Apply search filter
    if (searchQuery && fuse) {
      const searchResults = fuse.search(searchQuery)
      filtered = searchResults.map((result) => result.item)
    }

    // Sort players
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
  }, [players, searchQuery, fuse, sortBy])

  const breakpointColumns = {
    default: 3,
    1100: 2,
    700: 1,
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="Player Cards"
        description={`${filteredPlayers.length} players available for analysis`}
        showRefresh
        onRefresh={() => mutate()}
      />

      <main className="p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Search and Filters */}
          <Card className="shadow-sm border-0 bg-white">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Find Players</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="bg-transparent"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search players or teams..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 text-base border-gray-300 focus:border-forest-500 focus:ring-forest-500"
                />
              </div>

              {/* Filters */}
              {showFilters && (
                <div className="grid gap-4 md:grid-cols-3 pt-4 border-t">
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">Team</Label>
                    <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                      <SelectTrigger className="border-gray-300 focus:border-forest-500 focus:ring-forest-500">
                        <SelectValue placeholder="All teams" />
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

                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">Sort By</Label>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="border-gray-300 focus:border-forest-500 focus:ring-forest-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="name">Name</SelectItem>
                        <SelectItem value="avg">Batting Average</SelectItem>
                        <SelectItem value="pa">Plate Appearances</SelectItem>
                        <SelectItem value="k-rate">Strikeout Rate</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">
                      Min Plate Appearances: {minPA[0]}
                    </Label>
                    <Slider value={minPA} onValueChange={setMinPA} min={1} max={50} step={1} className="mt-2" />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Player Cards */}
          {filteredPlayers.length > 0 ? (
            <Masonry
              breakpointCols={breakpointColumns}
              className="flex w-auto -ml-6"
              columnClassName="pl-6 bg-clip-padding"
            >
              {filteredPlayers.map((player: any) => (
                <div key={player.id} className="mb-6">
                  <PlayerCard player={player} />
                </div>
              ))}
            </Masonry>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i}>
                  <TestPlayerCard />
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
