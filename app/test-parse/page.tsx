"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function TestParsePage() {
  const [file, setFile] = useState<File | null>(null)
  const [rawText, setRawText] = useState("")
  const [teamOverride, setTeamOverride] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleFileUpload = async () => {
    if (!file) return

    setLoading(true)
    const formData = new FormData()
    formData.append("file", file)
    if (teamOverride) formData.append("teamOverride", teamOverride)

    try {
      const response = await fetch("/api/parse", {
        method: "POST",
        body: formData,
      })
      const data = await response.json()
      setResult(data)
    } catch (error) {
      console.error("Upload error:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleTextSubmit = async () => {
    if (!rawText) return

    setLoading(true)
    try {
      const response = await fetch("/api/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawText,
          teamOverride: teamOverride || undefined,
        }),
      })
      const data = await response.json()
      setResult(data)
    } catch (error) {
      console.error("Submit error:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Test Parse API</h1>
        <p className="text-muted-foreground mt-2">Test the game data parsing functionality</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>File Upload</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input type="file" accept=".txt,.csv,.xlsx" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            <Input
              placeholder="Team Override (optional)"
              value={teamOverride}
              onChange={(e) => setTeamOverride(e.target.value)}
            />
            <Button onClick={handleFileUpload} disabled={!file || loading}>
              {loading ? "Processing..." : "Upload & Parse"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Raw Text</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Paste game data here..."
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              rows={6}
            />
            <Button onClick={handleTextSubmit} disabled={!rawText || loading}>
              {loading ? "Processing..." : "Parse Text"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Results</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded text-sm overflow-auto">{JSON.stringify(result, null, 2)}</pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
