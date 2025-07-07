"use client"

import { useState, useMemo } from "react"
import useSWR from "swr"
import Fuse from "fuse.js"
import Masonry from "react-masonry-css"
import { RefreshCw, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { HitterCard } from "@/components/hitter-card"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

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
    if (!hitters) return []

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

      {/* Masonry Grid */}
      {filteredHitters.length > 0 ? (
        <Masonry
          breakpointCols={breakpointColumns}
          className="flex w-auto -ml-4"
          columnClassName="pl-4 bg-clip-padding"
        >
          {filteredHitters.map((hitter: any) => (
            <div key={hitter.id} className="mb-4">
              <HitterCard hitter={hitter} />
            </div>
          ))}
        </Masonry>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No hitters found matching your criteria</p>
        </div>
      )}

      {/* FAB Refresh Button */}
      <Button className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg" size="icon" onClick={() => mutate()}>
        <RefreshCw className="h-5 w-5" />
      </Button>
    </div>
  )
}
