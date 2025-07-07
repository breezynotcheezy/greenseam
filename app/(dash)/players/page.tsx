"use client"

import { useState, useMemo } from "react"
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

const fetcher = (url: string) => fetch(url).then((res) => res.json())

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
            <Card className="shadow-sm border-0 bg-white">
              <CardContent className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <Users className="h-16 w-16 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No players found</h3>
                <p className="text-gray-600">
                  {players?.length === 0
                    ? "Import some GameChanger data to see player cards here"
                    : "Try adjusting your search or filter criteria"}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
