"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Loader2, AlertCircle } from "lucide-react"

interface HitterDetailsProps {
  hitter: {
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

export function HitterDetails({ hitter }: HitterDetailsProps) {
  const [prediction, setPrediction] = useState<Prediction | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchPrediction = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/predict?id=${hitter.id}`)
        if (response.ok) {
          const data = await response.json()
          setPrediction(data)
        }
      } catch (error) {
        console.error("Failed to fetch prediction:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchPrediction()
  }, [hitter.id])

  const insights = [
    `Batting average of ${hitter.avg} indicates ${Number.parseFloat(hitter.avg) > 0.3 ? "strong" : "developing"} contact ability`,
    `${hitter.kRate}% strikeout rate is ${hitter.kRate < 20 ? "excellent" : hitter.kRate < 25 ? "good" : "concerning"}`,
    `Ground ball tendency at ${hitter.gbPercent}% suggests ${hitter.gbPercent > 50 ? "contact-first" : "power"} approach`,
    `Line drive rate of ${hitter.ldPercent}% shows ${hitter.ldPercent > 20 ? "quality" : "inconsistent"} barrel contact`,
  ]

  return (
    <div className="mt-6">
      <Tabs defaultValue="prediction" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="prediction">Prediction</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="spray">Spray</TabsTrigger>
        </TabsList>

        <TabsContent value="prediction" className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Generating prediction...</span>
            </div>
          ) : prediction ? (
            <div className="space-y-4">
              <div className="space-y-3">
                {prediction.outcomes.map((outcome, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{outcome.outcome}</span>
                      <span className="text-muted-foreground">{outcome.probability}%</span>
                    </div>
                    <Progress value={outcome.probability} className="h-2" />
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground bg-muted p-3 rounded">{prediction.analysis}</p>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="h-8 w-8 mx-auto mb-2" />
              <p>Unable to generate prediction</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          {hitter.paCount >= 15 ? (
            <div className="space-y-3">
              {insights.map((insight, index) => (
                <div key={index} className="flex items-start gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <p className="text-sm text-muted-foreground">{insight}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Insights available with 15+ plate appearances</p>
              <Badge variant="outline" className="mt-2">
                {hitter.paCount}/15 PA
              </Badge>
            </div>
          )}
        </TabsContent>

        <TabsContent value="spray" className="space-y-4">
          <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
            <div className="text-center">
              <svg
                width="200"
                height="200"
                viewBox="0 0 200 200"
                className="mx-auto mb-4 opacity-50"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Baseball field outline */}
                <path
                  d="M100 180 L20 100 Q20 20 100 20 Q180 20 180 100 L100 180 Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                />
                {/* Infield diamond */}
                <path d="M100 140 L60 100 L100 60 L140 100 Z" stroke="currentColor" strokeWidth="1" fill="none" />
                {/* Sample hit dots */}
                <circle cx="80" cy="120" r="3" fill="hsl(var(--primary))" opacity="0.6" />
                <circle cx="120" cy="110" r="3" fill="hsl(var(--primary))" opacity="0.6" />
                <circle cx="90" cy="90" r="3" fill="hsl(var(--primary))" opacity="0.6" />
                <circle cx="110" cy="130" r="3" fill="hsl(var(--primary))" opacity="0.6" />
              </svg>
              <p className="text-sm text-muted-foreground">Spray Chart</p>
              <p className="text-xs text-muted-foreground mt-1">Heat map visualization coming soon</p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
