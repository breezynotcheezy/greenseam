"use client"

import { useEffect, useState } from "react"
import { Clock, FileText, Users } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { UploadRecord } from "@/lib/validations"

export function RecentUploadsPanel() {
  const [uploads, setUploads] = useState<UploadRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUploads = async () => {
      try {
        const response = await fetch("/api/uploads")
        if (response.ok) {
          const data = await response.json()
          setUploads(data)
        }
      } catch (error) {
        console.error("Failed to fetch uploads:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchUploads()
  }, [])

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return dateString
    }
  }

  return (
    <Card className="shadow-md border border-gray-100 bg-white h-fit">
      <CardHeader className="p-6 pb-3">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <Clock className="h-4 w-4 text-blue-600" />
          Recent Imports
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 pt-3">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : uploads.length === 0 ? (
          <div className="text-center py-6">
            <FileText className="h-10 w-10 mx-auto mb-2 text-gray-300" />
            <p className="text-gray-500 text-sm">No imports yet</p>
            <p className="text-gray-400 text-xs mt-1">Your recent uploads will appear here</p>
          </div>
        ) : (
          <div className="space-y-2">
            {uploads.slice(0, 5).map((upload) => (
              <div key={upload.id} className="p-3 bg-gray-50 rounded-md border border-gray-100">
                <div className="flex items-start justify-between mb-1">
                  <p className="font-medium text-sm text-gray-900 truncate flex-1">{upload.filename}</p>
                  <Badge variant="secondary" className="text-xs ml-2 font-normal">
                    {formatDate(upload.createdAt)}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-600">
                  <div className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    {upload.plateAppearances} PA
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {upload.teamName}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
