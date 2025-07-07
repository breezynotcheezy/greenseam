"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, CheckCircle, XCircle } from "lucide-react"

export default function TestAPIPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const testOpenAI = async () => {
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/test-openai")
      const data = await response.json()
      setResult({ success: response.ok, data })
    } catch (error) {
      setResult({
        success: false,
        data: { error: "Network error", details: error instanceof Error ? error.message : "Unknown" },
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">OpenAI API Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={testOpenAI} disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Testing Connection...
                </>
              ) : (
                "Test OpenAI Connection"
              )}
            </Button>

            {result && (
              <Card className={result.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    {result.success ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    <span className={`font-medium ${result.success ? "text-green-800" : "text-red-800"}`}>
                      {result.success ? "Success!" : "Failed"}
                    </span>
                  </div>
                  <pre className="text-sm bg-white p-3 rounded border overflow-auto">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
