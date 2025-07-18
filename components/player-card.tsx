"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PlayerDetails } from "@/components/player-details"
import { PlayerStats } from "@/components/player-stats"
import { PlayerInsights } from "@/components/player-insights"
import { Trash2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { formatPlayerName, isAbbreviatedName, getMappedPlayerName } from "@/lib/utils"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface PlayerCardProps {
  player: {
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
}

export function PlayerCard({ player }: PlayerCardProps) {
  const [activeTab, setActiveTab] = useState("stats")
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()

  // Format the player name for display with mapping support
  const displayName = getMappedPlayerName(player.name);
  const isAbbreviated = isAbbreviatedName(player.name);

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/players?id=${player.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete player")
      }

      toast({
        title: "Player deleted",
        description: `${player.name} has been removed successfully.`,
      })
      
      // Optionally refresh the page or trigger a parent component refresh
      window.location.reload()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete player. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  // Format numeric values
  const formatStat = (value: number | string, decimals = 3): string => {
    if (typeof value === 'string') return value;
    return value.toFixed(decimals);
  }

  // Custom tab styles
  const tabClass = (tab: string) => {
    if (tab === "insights") {
      return activeTab === "insights"
        ? "bg-purple-600 text-white font-bold shadow rounded-full px-4 py-1"
        : "bg-purple-100 text-purple-800 rounded-full px-4 py-1 hover:bg-purple-200"
    }
    if (tab === "details") {
      return activeTab === "details"
        ? "bg-yellow-400 text-gray-900 font-bold shadow rounded-full px-4 py-1"
        : "bg-yellow-100 text-yellow-900 rounded-full px-4 py-1 hover:bg-yellow-200"
    }
    return activeTab === tab
      ? "bg-gray-900 text-white font-bold shadow rounded-full px-4 py-1"
      : "bg-gray-100 text-gray-700 rounded-full px-4 py-1 hover:bg-gray-200"
  }

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-lg font-bold">{displayName.split(' ').map(n => n[0]).join('')}</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                {displayName}
                {isAbbreviated && (
                  <span className="text-xs bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full">
                    Abbreviated
                  </span>
                )}
              </h3>
              <p className="text-blue-100 text-sm">{player.team.name}</p>
            </div>
          </div>
          <button
            onClick={() => setShowDeleteDialog(true)}
            className="text-white/80 hover:text-white transition-colors"
            title="Delete player"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      </div>

      <Tabs defaultValue="stats" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 w-full gap-1 bg-gray-50 p-1 rounded-b-none rounded-t-lg">
          <TabsTrigger value="details" className={tabClass("details") + " rounded-l-md transition-all duration-150"}>
            Details
          </TabsTrigger>
          <TabsTrigger value="stats" className={tabClass("stats") + " transition-all duration-150"}>
            Stats
          </TabsTrigger>
          <TabsTrigger value="insights" className={tabClass("insights") + " rounded-r-md transition-all duration-150"}>
            AI Insights
          </TabsTrigger>
        </TabsList>
        <TabsContent value="details" className="p-4">
          <PlayerDetails player={player} />
        </TabsContent>
        <TabsContent value="stats" className="p-4">
          <PlayerStats player={player} />
        </TabsContent>
        <TabsContent value="insights" className="p-4">
          <PlayerInsights playerId={player.id} />
        </TabsContent>
      </Tabs>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Player?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {player.name} and all their stats. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-500"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
