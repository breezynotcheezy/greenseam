"use client"

import { useState, useEffect } from "react"
import { Loader2, AlertCircle, CheckCircle, XCircle, Brain, Target, Key } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface PlayerInsightsProps {
  playerId: string
}

interface InsightsData {
  insight: string
  recommendation: string
  strengths: string[]
  weaknesses: string[]
}

export function PlayerInsights({ playerId }: PlayerInsightsProps) {
  const [insights, setInsights] = useState<InsightsData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchInsights = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch(`/api/insights?id=${playerId}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch insights")
        }

        setInsights(data)
      } catch (error) {
        console.error("Failed to fetch insights:", error)
        setError(error instanceof Error ? error.message : "Failed to load insights")
      } finally {
        setLoading(false)
      }
    }

    fetchInsights()
  }, [playerId])

  if (loading) {
    return (
      <div className="bg-purple-50 rounded-lg p-6">
        <div className="flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
          <span className="ml-3 text-purple-700">Analyzing player data with AI...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 rounded-lg p-6 text-center border border-red-200">
        {error.includes("API key") ? (
          <>
            <Key className="h-8 w-8 mx-auto mb-2 text-red-400" />
            <p className="text-red-700 font-medium">OpenAI API Key Required</p>
            <p className="text-red-600 text-sm mt-1">Configure your API key to enable AI insights</p>
          </>
        ) : (
          <>
            <AlertCircle className="h-8 w-8 mx-auto mb-2 text-red-400" />
            <p className="text-red-700">{error}</p>
          </>
        )}
      </div>
    )
  }

  if (!insights) {
    return (
      <div className="bg-purple-50 rounded-lg p-6 text-center">
        <AlertCircle className="h-8 w-8 mx-auto mb-2 text-purple-400" />
        <p className="text-purple-700">No insights available</p>
      </div>
    )
  }

  return (
    <div className="bg-purple-50 rounded-lg p-4 space-y-4">
      {/* Single AI Insight */}
      <div>
        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Brain className="h-4 w-4 text-purple-600" />
          AI Insight
        </h4>
        <div className="bg-white rounded-lg p-4 border border-purple-200">
          <p className="text-sm text-gray-800 font-medium">{insights.insight}</p>
        </div>
      </div>

      {/* Single Recommendation */}
      <div>
        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Target className="h-4 w-4 text-blue-600" />
          Coaching Recommendation
        </h4>
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <p className="text-sm text-blue-800 font-medium">{insights.recommendation}</p>
        </div>
      </div>

      {/* Strengths & Weaknesses */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            Strengths
          </h4>
          <div className="space-y-1">
            {insights.strengths.map((strength, index) => (
              <Badge key={index} variant="secondary" className="bg-green-100 text-green-800 block w-fit">
                {strength}
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-600" />
            Areas to Improve
          </h4>
          <div className="space-y-1">
            {insights.weaknesses.map((weakness, index) => (
              <Badge key={index} variant="secondary" className="bg-red-100 text-red-800 block w-fit">
                {weakness}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
