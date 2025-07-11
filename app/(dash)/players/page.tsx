"use client"

import { useState, useMemo, useEffect } from "react"
import useSWR from "swr"
import Fuse from "fuse.js"
import Masonry from "react-masonry-css"
import { RefreshCw, Search, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { PlayerCard } from "@/components/player-card"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

// Define player type
interface Player {
  id: string
  name: string
  team: {
    id: string
    name: string
    emoji?: string
    color?: string
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

const fetcher = (url: string) => fetch(url).then((res) => {
  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }
  return res.json();
}).catch(error => {
  console.error("Fetch error:", error);
  throw error;
});

export default function PlayersPage() {
  const [selectedTeam, setSelectedTeam] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [minPA, setMinPA] = useState([1]) // Default to 1 minimum plate appearance
  const [sortBy, setSortBy] = useState("name")
  const [showDebug, setShowDebug] = useState(false)

  // Fetch teams and players
  const { data: teams } = useSWR("/api/teams", fetcher)
  const { data: players, mutate, error, isLoading } = useSWR<Player[]>(
    `/api/hitters?teamId=${selectedTeam}&minPA=0`, // Always fetch all players
    fetcher,
    { 
      refreshInterval: 5000, // Refresh every 5 seconds
      revalidateOnFocus: true
    }
  )

  // Force refresh on mount
  useEffect(() => {
    mutate();
  }, [mutate]);

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
    if (!players || players.length === 0) return []

    let filtered = [...players]

    // Apply search filter
    if (searchQuery && fuse) {
      const searchResults = fuse.search(searchQuery)
      filtered = searchResults.map((result) => result.item)
    }

    // Apply minPA filter client-side
    if (minPA[0] > 0) {
      filtered = filtered.filter((player: Player) => player.paCount >= minPA[0])
    }

    // Sort players
    filtered.sort((a: Player, b: Player) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name)
        case "avg":
          return parseFloat(b.avg) - parseFloat(a.avg)
        case "pa":
          return b.paCount - a.paCount
        case "k-rate":
          return a.kRate - b.kRate
        default:
          return 0
      }
    })

    return filtered
  }, [players, searchQuery, fuse, sortBy, minPA])

  const breakpointColumns = {
    default: 3,
    1100: 2,
    700: 1,
  }

  // Debug function to show raw player data
  const toggleDebug = () => {
    setShowDebug(!showDebug);
  }

  const handleRefresh = () => {
    // Force refresh the data
    mutate();
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Players</h1>
          <p className="text-muted-foreground mt-2">Analyze your team's performance and insights</p>
        </div>
        <Button variant="ghost" size="sm" onClick={toggleDebug}>
          {showDebug ? "Hide Debug" : "Debug"}
        </Button>
      </div>

      {/* Debug Info */}
      {showDebug && (
        <div className="bg-gray-100 p-4 rounded-md overflow-auto max-h-60">
          <h3 className="font-bold mb-2">Raw Player Data ({players?.length || 0} players):</h3>
          <pre className="text-xs">{JSON.stringify(players, null, 2)}</pre>
        </div>
      )}

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
          <Label htmlFor="min-pa">Minimum PA: {minPA[0]}</Label>
          <div className="flex items-center gap-2 h-10">
            <Slider 
              id="min-pa"
              value={minPA} 
              onValueChange={setMinPA} 
              min={0} 
              max={50} 
              step={1} 
              className="flex-1" 
            />
          </div>
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

      {/* Results */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {filteredPlayers?.length || 0} player{(!filteredPlayers || filteredPlayers.length !== 1) ? "s" : ""} found
        </p>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
          Error loading player data: {error.message || "Please try again"}
        </div>
      )}

      {/* Loading state */}
      {isLoading && !players && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="bg-white border border-gray-200 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start gap-3 mb-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
                <Skeleton className="h-8 w-full mb-3" />
                <div className="grid grid-cols-3 gap-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Player Cards */}
      {!isLoading && filteredPlayers && filteredPlayers.length > 0 ? (
        <Masonry
          breakpointCols={breakpointColumns}
          className="flex w-auto -ml-6"
          columnClassName="pl-6 bg-clip-padding"
        >
          {filteredPlayers.map((player: Player) => (
            <div key={player.id} className="mb-6">
              <PlayerCard player={player} />
            </div>
          ))}
        </Masonry>
      ) : !isLoading && !error ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No players found</h3>
          <p className="text-gray-500 mb-4">Try importing some data or adjusting your filters</p>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Data
          </Button>
        </div>
      ) : null}

      {/* FAB Refresh Button */}
      <Button className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg" size="icon" onClick={handleRefresh}>
        <RefreshCw className="h-5 w-5" />
      </Button>
    </div>
  )
}
