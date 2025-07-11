"use client"

import { useState } from 'react'
import useSWR from 'swr'
import Masonry from 'react-masonry-css'
import { FileSpreadsheet, Users } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { HitterCard } from '@/components/hitter-card'
import { BaseballStats } from '@/lib/types'

interface Hitter {
  id: string
  name: string
  team: {
    id: string
    name: string
    color?: string
    emoji?: string
  }
  stats: BaseballStats
}

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function HittersPage() {
  const [teamId, setTeamId] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [minPA, setMinPA] = useState([1])
  const [sortBy, setSortBy] = useState('pa')

  // Fetch teams
  const { data: teams } = useSWR('/api/teams', fetcher)

  // Fetch hitters with filters
  const { data: hitters, error, isLoading } = useSWR<Hitter[]>(
    `/api/hitters?teamId=${teamId}&minPA=${minPA[0]}`,
    fetcher,
    {
      refreshInterval: 5000, // Refresh every 5 seconds
      revalidateOnFocus: true
    }
  )

  // Filter and sort hitters
  const filteredHitters = hitters?.filter(hitter =>
    hitter.name.toLowerCase().includes(search.toLowerCase())
  ).sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name)
    if (sortBy === 'team') return a.team.name.localeCompare(b.team.name)
    
    // Handle special cases for property name mapping
    let aValue, bValue;
    if (sortBy === 'pa') {
      aValue = a.stats.plateAppearances;
      bValue = b.stats.plateAppearances;
    } else {
      // Handle numeric stats
      aValue = a.stats[sortBy as keyof BaseballStats]
      bValue = b.stats[sortBy as keyof BaseballStats]
    }
    
    // Convert string stats (avg, obp, slg, etc.) to numbers for comparison
    const aNum = typeof aValue === 'string' ? Number(aValue) : (aValue || 0)
    const bNum = typeof bValue === 'string' ? Number(bValue) : (bValue || 0)
    
    return (bNum as number) - (aNum as number) // Sort in descending order
  })

  // Debug logging
  console.log('Hitters data:', hitters);
  console.log('Filtered hitters:', filteredHitters);
  console.log('Current filters:', { teamId, search, minPA: minPA[0], sortBy });

  // Handle export
  const handleExport = () => {
    // TODO: Implement export functionality
  }

  return (
    <div className="container mx-auto p-4">
      {/* Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-wrap gap-4">
          <div className="min-w-[200px]">
            <Label htmlFor="team">Team</Label>
            <Select value={teamId} onValueChange={setTeamId}>
              <SelectTrigger id="team">
                <SelectValue placeholder="Select team" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Teams</SelectItem>
                {teams?.map((team: any) => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="min-w-[200px]">
            <Label htmlFor="search">Search Players</Label>
            <Input
              id="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Enter player name..."
            />
          </div>

          <div className="min-w-[200px]">
            <Label htmlFor="sort">Sort By</Label>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger id="sort">
                <SelectValue placeholder="Sort by..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="team">Team</SelectItem>
                <SelectItem value="pa">Plate Appearances</SelectItem>
                <SelectItem value="avg">Batting Average</SelectItem>
                <SelectItem value="obp">On-base %</SelectItem>
                <SelectItem value="slg">Slugging %</SelectItem>
                <SelectItem value="ops">OPS</SelectItem>
                <SelectItem value="wOBA">wOBA</SelectItem>
                <SelectItem value="wRC">wRC</SelectItem>
                <SelectItem value="iso">ISO</SelectItem>
                <SelectItem value="babip">BABIP</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="min-w-[150px]">
            <Label htmlFor="min-pa">Minimum PA</Label>
            <div className="flex items-center gap-2 h-10">
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

          <div className="flex-1 flex justify-end items-end">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleExport}
              disabled={!filteredHitters || filteredHitters.length === 0}
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Export Excel
            </Button>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {filteredHitters?.length || 0} player{(!filteredHitters || filteredHitters.length !== 1) ? "s" : ""} found
        </p>
      </div>

      {/* Error state */}
      {error && (
        <div className="text-center py-12 bg-red-50 rounded-lg border border-red-200">
          <p className="text-red-600">Failed to load hitters</p>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading...</p>
        </div>
      )}

      {/* Results grid */}
      {filteredHitters && filteredHitters.length > 0 ? (
        <Masonry
          breakpointCols={{
            default: 3,
            1536: 3,
            1280: 2,
            1024: 2,
            768: 1,
          }}
          className="flex -ml-4 w-auto"
          columnClassName="pl-4 bg-clip-padding"
        >
          {filteredHitters.map((hitter) => (
            <div key={hitter.id} className="mb-4">
              <HitterCard {...hitter} />
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
    </div>
  )
}
