"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { isAbbreviatedName, formatPlayerName } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"

interface NameMapping {
  abbreviated: string
  fullName: string
}

interface NameMappingPanelProps {
  players: Array<{ id: string; name: string; team: { name: string } }>
  onMappingUpdate?: (mappings: NameMapping[]) => void
}

export function NameMappingPanel({ players, onMappingUpdate }: NameMappingPanelProps) {
  const [mappings, setMappings] = useState<NameMapping[]>([])
  const [newMapping, setNewMapping] = useState({ abbreviated: "", fullName: "" })
  const { toast } = useToast()

  // Get all abbreviated player names
  const abbreviatedPlayers = players.filter(player => isAbbreviatedName(player.name))

  // Load existing mappings from localStorage
  useEffect(() => {
    const savedMappings = localStorage.getItem('playerNameMappings')
    if (savedMappings) {
      try {
        setMappings(JSON.parse(savedMappings))
      } catch (error) {
        console.error('Failed to load name mappings:', error)
      }
    }
  }, [])

  // Save mappings to localStorage
  const saveMappings = (newMappings: NameMapping[]) => {
    localStorage.setItem('playerNameMappings', JSON.stringify(newMappings))
    setMappings(newMappings)
    onMappingUpdate?.(newMappings)
  }

  const addMapping = () => {
    if (!newMapping.abbreviated.trim() || !newMapping.fullName.trim()) {
      toast({
        title: "Invalid mapping",
        description: "Please provide both abbreviated and full names",
        variant: "destructive"
      })
      return
    }

    const normalizedAbbreviated = newMapping.abbreviated.trim().toUpperCase()
    const normalizedFullName = newMapping.fullName.trim()

    // Check if mapping already exists
    if (mappings.some(m => m.abbreviated === normalizedAbbreviated)) {
      toast({
        title: "Mapping exists",
        description: "This abbreviated name is already mapped",
        variant: "destructive"
      })
      return
    }

    const updatedMappings = [...mappings, {
      abbreviated: normalizedAbbreviated,
      fullName: normalizedFullName
    }]

    saveMappings(updatedMappings)
    setNewMapping({ abbreviated: "", fullName: "" })
    
    toast({
      title: "Mapping added",
      description: `${normalizedAbbreviated} → ${normalizedFullName}`
    })
  }

  const removeMapping = (abbreviated: string) => {
    const updatedMappings = mappings.filter(m => m.abbreviated !== abbreviated)
    saveMappings(updatedMappings)
    
    toast({
      title: "Mapping removed",
      description: `Removed mapping for ${abbreviated}`
    })
  }

  const getDisplayName = (playerName: string) => {
    const mapping = mappings.find(m => m.abbreviated === playerName.toUpperCase())
    if (mapping) {
      return mapping.fullName
    }
    return formatPlayerName(playerName)
  }

  if (abbreviatedPlayers.length === 0) {
    return null
  }

  return (
    <Card className="shadow-lg border-0 bg-white">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Badge variant="secondary" className="text-xs">
            {abbreviatedPlayers.length}
          </Badge>
          Player Name Mapping
        </CardTitle>
        <p className="text-sm text-gray-600">
          Map abbreviated player names to full names for better display
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Add new mapping */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="abbreviated">Abbreviated Name</Label>
            <Input
              id="abbreviated"
              value={newMapping.abbreviated}
              onChange={(e) => setNewMapping(prev => ({ ...prev, abbreviated: e.target.value }))}
              placeholder="e.g., A L"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              value={newMapping.fullName}
              onChange={(e) => setNewMapping(prev => ({ ...prev, fullName: e.target.value }))}
              placeholder="e.g., Alex Lee"
              className="mt-1"
            />
          </div>
        </div>
        
        <Button onClick={addMapping} className="w-full">
          Add Mapping
        </Button>

        {/* Existing mappings */}
        {mappings.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Current Mappings</Label>
            <div className="space-y-2">
              {mappings.map((mapping) => (
                <div key={mapping.abbreviated} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm">
                    <span className="font-mono">{mapping.abbreviated}</span>
                    <span className="mx-2">→</span>
                    <span className="font-medium">{mapping.fullName}</span>
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeMapping(mapping.abbreviated)}
                    className="text-red-600 hover:text-red-700"
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Abbreviated players list */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Abbreviated Players</Label>
          <div className="grid grid-cols-2 gap-2">
            {abbreviatedPlayers.map((player) => (
              <div key={player.id} className="p-2 bg-blue-50 rounded text-sm">
                <div className="font-mono">{player.name}</div>
                <div className="text-blue-600 font-medium">
                  {getDisplayName(player.name)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 