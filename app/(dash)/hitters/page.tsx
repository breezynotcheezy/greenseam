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
import { Skeleton } from "@/components/ui/skeleton"

// Define hitter type
interface Hitter {
  id: string
  name: string
  team: {
    id: string
    name: string
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

const fetcher = (url: string) => fetch(url).then((res) => {
  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }
  return res.json();
}).catch(error => {
  console.error("Fetch error:", error);
  throw error;
});

export default function HittersPage() {
  const [selectedTeam, setSelectedTeam] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [minPA, setMinPA] = useState([5]) // Default to 5 minimum plate appearances
  const [sortBy, setSortBy] = useState("name")

  // Fetch teams and hitters
  const { data: teams } = useSWR("/api/teams", fetcher)
  const { data: hitters, mutate, error, isLoading } = useSWR<Hitter[]>(
    `/api/hitters?teamId=${selectedTeam}&minPA=0`, // Always use minPA=0 in the API call
    fetcher
  )

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

    // Apply minPA filter client-side
    if (minPA[0] > 0) {
      filtered = filtered.filter((hitter: Hitter) => hitter.paCount >= minPA[0])
    }

    // Sort hitters
    filtered.sort((a: Hitter, b: Hitter) => {
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
  }, [hitters, searchQuery, fuse, sortBy, minPA])

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
          <Label htmlFor="min-pa">Minimum PA</Label>
          <div className="flex items-center gap-2">
            <Slider 
              id="min-pa"
              value={minPA} 
              onValueChange={setMinPA} 
              min={1} 
              max={50} 
              step={1} 
              className="flex-1" 
            />
            <span className="text-sm font-medium w-8 text-center">{minPA[0]}</span>
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
          {filteredHitters?.length || 0} hitter{(!filteredHitters || filteredHitters.length !== 1) ? "s" : ""} found
        </p>
        <Button variant="outline" size="sm" onClick={() => mutate()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
          Error loading hitter data. Please try again.
        </div>
      )}

      {/* Loading state */}
      {isLoading && !hitters && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
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

      {/* Hitter Cards */}
      {!isLoading && filteredHitters && filteredHitters.length > 0 ? (
        <Masonry
          breakpointCols={breakpointColumns}
          className="flex w-auto -ml-6"
          columnClassName="pl-6 bg-clip-padding"
        >
          {filteredHitters.map((hitter: Hitter) => (
            <div key={hitter.id} className="mb-6">
              <HitterCard hitter={hitter} />
            </div>
          ))}
        </Masonry>
      ) : !isLoading && !error ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No hitters found</h3>
          <p className="text-gray-500">Try adjusting your filters or importing some data</p>
        </div>
      ) : null}

      {/* FAB Refresh Button */}
      <Button className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg" size="icon" onClick={() => mutate()}>
        <RefreshCw className="h-5 w-5" />
      </Button>
    </div>
  )
}
