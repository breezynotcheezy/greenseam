"use client"

import { useState, useEffect } from "react"
import { Loader2, AlertCircle, CheckCircle, XCircle, Brain, Target, Key } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface PlayerInsightsProps {
  playerId: string
}

interface InsightsData {
  insight: string;
  pitchingRecommendation?: string;
  fieldingRecommendation?: string;
  strengths: string[];
  weaknesses: string[];
  confidence?: number;
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
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to fetch insights")
        }
        
        const data = await response.json()
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
          <span className="ml-3 text-purple-700">Analyzing opponent data with AI...</span>
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
      {/* Weakness Insight */}
      <div>
        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Brain className="h-4 w-4 text-purple-600" />
          Opponent Weakness
        </h4>
        <div className="bg-white rounded-lg p-4 border border-purple-200">
          <p className="text-sm text-gray-800 font-medium">{insights.insight}</p>
        </div>
      </div>

      {/* Pitching Recommendation with Confidence Circle */}
      {insights.pitchingRecommendation && (
        <div>
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Target className="h-4 w-4 text-blue-600" />
            Pitching Recommendation
            {typeof insights.confidence === 'number' && (
              <span title={`Confidence: ${(insights.confidence * 100).toFixed(0)}%`} className="ml-2 flex items-center">
                <span
                  className={
                    'inline-block w-4 h-4 rounded-full border-2 border-white shadow ' +
                    (insights.confidence >= 0.8
                      ? 'bg-blue-500'
                      : insights.confidence >= 0.5
                      ? 'bg-yellow-400'
                      : 'bg-red-500')
                  }
                />
                <span className="ml-1 text-xs text-gray-600">{(insights.confidence * 100).toFixed(0)}%</span>
              </span>
            )}
          </h4>
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <p className="text-sm text-blue-800 font-medium">{insights.pitchingRecommendation}</p>
          </div>
        </div>
      )}

      {/* Fielding Recommendation */}
      {insights.fieldingRecommendation && (
        <div>
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Target className="h-4 w-4 text-green-600" />
            Fielding Recommendation
          </h4>
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <p className="text-sm text-green-800 font-medium">{insights.fieldingRecommendation}</p>
          </div>
        </div>
      )}

      {/* Strengths & Weaknesses */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-amber-600" />
            Be Cautious Of
          </h4>
          <div className="space-y-1">
            {insights.strengths.map((strength, index) => (
              <Badge key={index} variant="secondary" className="bg-amber-100 text-amber-800 block w-fit">
                {strength}
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <XCircle className="h-4 w-4 text-green-600" />
            Exploit These
          </h4>
          <div className="space-y-1">
            {insights.weaknesses.map((weakness, index) => (
              <Badge key={index} variant="secondary" className="bg-green-100 text-green-800 block w-fit">
                {weakness}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
