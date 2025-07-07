"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Loader2, AlertCircle, TrendingUp, Target, BarChart3, Key } from "lucide-react"

interface PlayerDetailsProps {
  player: {
    id: number
    name: string
    paCount: number
    avg: string
    kRate: number
    gbPercent: number
    ldPercent: number
    fbPercent: number
  }
}

interface Prediction {
  outcomes: Array<{
    outcome: string
    probability: number
  }>
  analysis: string
}

export function PlayerDetails({ player }: PlayerDetailsProps) {
  const [prediction, setPrediction] = useState<Prediction | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPrediction = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch(`/api/predict?id=${player.id}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch prediction")
        }

        setPrediction(data)
      } catch (error) {
        console.error("Failed to fetch prediction:", error)
        setError(error instanceof Error ? error.message : "Failed to load prediction")
      } finally {
        setLoading(false)
      }
    }

    fetchPrediction()
  }, [player.id])

  return (
    <div className="mt-8">
      <Tabs defaultValue="prediction" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="prediction" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Prediction
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Insights
          </TabsTrigger>
          <TabsTrigger value="spray" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Spray
          </TabsTrigger>
        </TabsList>

        <TabsContent value="prediction" className="space-y-6 mt-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-forest-600" />
              <span className="ml-3 text-gray-600">Generating prediction...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              {error.includes("API key") ? (
                <>
                  <Key className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600 font-medium">OpenAI API Key Required</p>
                  <p className="text-gray-500 text-sm mt-1">Configure your API key to enable predictions</p>
                </>
              ) : (
                <>
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600">{error}</p>
                </>
              )}
            </div>
          ) : prediction ? (
            <div className="space-y-6">
              <div className="space-y-4">
                {prediction.outcomes.map((outcome, index) => (
                  <div key={index} className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-900">{outcome.outcome}</span>
                      <span className="text-sm font-semibold text-forest-600">{outcome.probability}%</span>
                    </div>
                    <Progress value={outcome.probability} className="h-3" />
                  </div>
                ))}
              </div>
              <div className="bg-forest-50 p-4 rounded-lg border border-forest-200">
                <p className="text-sm text-forest-800">{prediction.analysis}</p>
              </div>
            </div>
          ) : null}
        </TabsContent>

        <TabsContent value="insights" className="space-y-6 mt-6">
          {/* This will be handled by PlayerInsights component */}
        </TabsContent>

        <TabsContent value="spray" className="space-y-6 mt-6">
          <div className="aspect-square bg-gray-50 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-300">
            <div className="text-center">
              <svg
                width="200"
                height="200"
                viewBox="0 0 200 200"
                className="mx-auto mb-4 opacity-40"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M100 180 L20 100 Q20 20 100 20 Q180 20 180 100 L100 180 Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                />
                <path d="M100 140 L60 100 L100 60 L140 100 Z" stroke="currentColor" strokeWidth="1" fill="none" />
                <circle cx="80" cy="120" r="3" fill="#22c55e" opacity="0.6" />
                <circle cx="120" cy="110" r="3" fill="#22c55e" opacity="0.6" />
                <circle cx="90" cy="90" r="3" fill="#22c55e" opacity="0.6" />
                <circle cx="110" cy="130" r="3" fill="#22c55e" opacity="0.6" />
              </svg>
              <h3 className="font-medium text-gray-900 mb-2">Spray Chart</h3>
              <p className="text-sm text-gray-600">Visual hit location data coming soon</p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
