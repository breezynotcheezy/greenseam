"use client"

import { useCallback, useState } from "react"
import { useRouter } from "next/navigation"
import { useDropzone } from "react-dropzone"
import { AlertCircle, Loader2, Upload } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import { importFormSchema } from "@/lib/validations"

export function ImportPanel() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<any>(null)

  // Initialize form data state
  const [formData, setFormData] = useState({
    file: null as File | null,
    rawText: "",
    teamOverride: "",
    chunkSize: 4000,
  })

  // File upload handling
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFormData(prev => ({ ...prev, file: acceptedFiles[0] }))
      // Clear raw text when file is uploaded
      setFormData(prev => ({ ...prev, rawText: "" }))
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    multiple: false,
    accept: {
      'text/plain': ['.txt'],
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
  })

  const handleSubmit = async () => {
    try {
      // Validate that we have either file or text
      if (!formData.file && !formData.rawText?.trim()) {
        throw new Error("Please provide either a file or text data")
      }

      setLoading(true)
      setError(null)

      let response: Response

      if (formData.file) {
        const formDataToSend = new FormData()
        formDataToSend.append("file", formData.file)
        if (formData.teamOverride) {
          formDataToSend.append("teamOverride", formData.teamOverride)
        }
        formDataToSend.append("chunkSize", formData.chunkSize.toString())

        response = await fetch("/api/parse", {
          method: "POST",
          body: formDataToSend,
        })
      } else {
        // Make sure we have text content
        const rawText = formData.rawText?.trim()
        if (!rawText) {
          throw new Error("Please provide text data")
        }

        response = await fetch("/api/parse", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            rawText: rawText,
            teamOverride: formData.teamOverride,
            chunkSize: formData.chunkSize,
          }),
        })
      }

      let data
      try {
        data = await response.json()
      } catch (e) {
        throw new Error("Failed to parse server response. Please try again.")
      }

      if (!response.ok) {
        const errorMsg = data.error || "Failed to parse data"
        if (data.code === "OPENAI_API_KEY_MISSING") {
          setError("OpenAI API key is not configured. Please contact the administrator to set up the API key.")
          toast.error("OpenAI API key is required for data processing")
        } else {
          setError(errorMsg)
          toast.error(errorMsg)
        }
        return
      }

      setResult(data)

      // Check if plays were extracted
      if (!data.plays || data.plays.length === 0) {
        const warningMsg = "No plays were extracted from the data. Please check the format and try again."
        toast.warning(warningMsg)
        setError(warningMsg)
      } else {
        const successMsg = `Successfully processed ${data.plays.length} plays and saved to database!`
        toast.success(successMsg)
        setResult({
          ...data,
          message: successMsg + " You can now view the player cards on the Players page."
        })
      }
    } catch (error: any) {
      console.error("Import error:", error)
      const errorMsg = error.message || "Failed to import data"
      setError(errorMsg)
      toast.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      file: null,
      rawText: "",
      teamOverride: "",
      chunkSize: 4000,
    })
    setResult(null)
    setError(null)
  }

  const isValid = formData.file !== null || (formData.rawText && formData.rawText.trim().length > 0)

  return (
    <Card className="shadow-lg border-0 bg-white">
      <CardHeader className="pb-6">
        <CardTitle className="flex items-center gap-3 text-xl">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-forest-500 to-forest-600 flex items-center justify-center">
            <Upload className="h-5 w-5 text-white" />
          </div>
          Import GameChanger Data
        </CardTitle>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-sm text-gray-600">Upload or paste GameChanger play-by-play data</span>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* File Upload */}
        <div {...getRootProps()} className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors duration-200 ${isDragActive ? 'border-forest-500 bg-forest-50' : 'border-gray-300 hover:border-forest-400'}`}>
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-2">
            <Upload className={`h-8 w-8 ${isDragActive ? 'text-forest-600' : 'text-gray-400'}`} />
            <div className="text-sm">
              <span className="font-medium text-forest-600">Click to upload</span> or drag and drop
            </div>
            <p className="text-xs text-gray-500">GameChanger play-by-play data</p>
            {formData.file && (
              <p className="text-sm text-forest-600 mt-2">Selected: {formData.file.name}</p>
            )}
          </div>
        </div>

        {/* Paste Text */}
        <div>
          <Label htmlFor="rawText">Or paste play-by-play data</Label>
          <Textarea
            id="rawText"
            value={formData.rawText}
            onChange={(e) => {
              setFormData(prev => ({ ...prev, rawText: e.target.value, file: null }))
            }}
            placeholder="Paste GameChanger play-by-play data here..."
            className="mt-2 h-32"
          />
        </div>

        {/* Team Override */}
        <div>
          <Label htmlFor="teamOverride">Team Name (Optional)</Label>
          <Input
            id="teamOverride"
            value={formData.teamOverride}
            onChange={(e) => setFormData((prev) => ({ ...prev, teamOverride: e.target.value }))}
            placeholder="Override team name from data"
            className="mt-2"
          />
        </div>

        {/* Chunk Size */}
        <div>
          <div className="flex justify-between">
            <Label htmlFor="chunkSize">Processing Chunk Size</Label>
            <span className="text-sm text-gray-500">{formData.chunkSize}</span>
          </div>
          <Slider
            id="chunkSize"
            value={[formData.chunkSize]}
            onValueChange={([value]) => setFormData((prev) => ({ ...prev, chunkSize: value }))}
            min={1000}
            max={8000}
            step={500}
            className="mt-2"
          />
          <p className="text-sm text-gray-500 mt-2">Larger values process more plays at once (4000 recommended)</p>
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={!isValid || loading}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            'Import Data'
          )}
        </Button>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-4 w-4" />
              <p className="text-sm font-medium">Error</p>
            </div>
            <p className="text-sm text-red-600 mt-1">{error}</p>
          </div>
        )}

        {/* Success Display */}
        {result && result.plays && result.plays.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
            <div className="flex items-center gap-2 text-green-700">
              <div className="h-4 w-4 rounded-full bg-green-500 flex items-center justify-center">
                <div className="h-2 w-2 rounded-full bg-white"></div>
              </div>
              <p className="text-sm font-medium">Success!</p>
            </div>
            <p className="text-sm text-green-600 mt-1">{result.message}</p>
            <div className="flex gap-2 mt-3">
              <Button 
                onClick={() => router.push("/players")}
                size="sm"
                className="bg-green-600 hover:bg-green-700"
              >
                View Player Cards
              </Button>
              <Button 
                onClick={resetForm}
                variant="outline"
                size="sm"
              >
                Import More Data
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
