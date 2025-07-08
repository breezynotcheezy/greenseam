"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useDropzone } from "react-dropzone"
import { Upload, FileText, Loader2, CheckCircle, AlertCircle, Zap, Key } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"  
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { importFormSchema, type ImportFormData } from "@/lib/validations"

export function ImportPanel() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<ImportFormData>({
    chunkSize: 1500,
  })

  const { getRootProps, getInputProps, isDragActive, acceptedFiles } = useDropzone({
    accept: {
      "text/plain": [".txt"],
      "text/csv": [".csv"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
    },
    maxFiles: 1,
    onDrop: (files) => {
      if (files.length > 0) {
        setFormData((prev) => ({ ...prev, file: files[0] }))
      }
    },
  })

  const handleSubmit = async () => {
    try {
      const validatedData = importFormSchema.parse({
        ...formData,
        file: acceptedFiles[0] || formData.file,
      })

      setLoading(true)

      let response: Response

      if (validatedData.file) {
        const formDataToSend = new FormData()
        formDataToSend.append("file", validatedData.file)
        if (validatedData.teamOverride) {
          formDataToSend.append("teamOverride", validatedData.teamOverride)
        }
        formDataToSend.append("chunkSize", validatedData.chunkSize.toString())

        response = await fetch("/api/parse", {
          method: "POST",
          body: formDataToSend,
        })
      } else {
        response = await fetch("/api/parse", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rawText: validatedData.rawText,
            teamOverride: validatedData.teamOverride,
            chunkSize: validatedData.chunkSize,
          }),
        })
      }

      const result = await response.json()

      if (!response.ok) {
        if (result.error?.includes("API key")) {
          toast.error("OpenAI API key is required for data processing")
        } else {
          toast.error(result.error || "Failed to parse data")
        }
        return
      }

      if (result.results) {
        const totalInserted = result.results.reduce((sum: number, r: any) => sum + r.inserted, 0)
        const totalNewPlayers = result.results.reduce((sum: number, r: any) => sum + r.newPlayers, 0)
        toast.success(`Successfully imported ${totalInserted} plate appearances and ${totalNewPlayers} new players`)
      } else {
        toast.success(
          `Successfully imported ${result.inserted} plate appearances and ${result.newPlayers} new players for ${result.teamName}`,
        )
      }

      router.push("/players")
    } catch (error) {
      console.error("Import error:", error)
      toast.error(error instanceof Error ? error.message : "Failed to import data")
    } finally {
      setLoading(false)
    }
  }

  const isValid = acceptedFiles.length > 0 || (formData.rawText && formData.rawText.trim().length > 0)

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
          <Zap className="h-4 w-4 text-yellow-500" />
          <span className="text-sm text-gray-600">Powered by fine-tuned AI model</span>
          <Key className="h-4 w-4 text-blue-500" />
          <span className="text-sm text-blue-600">Requires OpenAI API Key</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* File Dropzone */}
        <div>
          <Label className="text-base font-medium text-gray-900 mb-3 block">Upload GameChanger File</Label>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
              isDragActive
                ? "border-forest-400 bg-forest-50"
                : acceptedFiles.length > 0
                  ? "border-green-400 bg-green-50"
                  : "border-gray-300 hover:border-forest-400 hover:bg-forest-50"
            }`}
          >
            <input {...getInputProps()} />
            {acceptedFiles.length > 0 ? (
              <div className="space-y-3">
                <CheckCircle className="h-12 w-12 mx-auto text-green-600" />
                <div>
                  <p className="font-medium text-green-800">{acceptedFiles[0].name}</p>
                  <p className="text-sm text-green-600">Ready for AI processing</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <FileText className="h-12 w-12 mx-auto text-gray-400" />
                {isDragActive ? (
                  <p className="text-forest-600 font-medium">Drop the GameChanger file here...</p>
                ) : (
                  <div>
                    <p className="font-medium text-gray-900">Drop GameChanger files here or click to browse</p>
                    <p className="text-sm text-gray-500 mt-1">Supports .txt, .csv, .xlsx files</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Raw Text Input */}
        <div>
          <Label htmlFor="rawText" className="text-base font-medium text-gray-900 mb-3 block">
            Or Paste GameChanger Data
          </Label>
          <Textarea
            id="rawText"
            placeholder="Paste your GameChanger play-by-play data here..."
            className="h-32 resize-none border-gray-300 focus:border-forest-500 focus:ring-forest-500"
            value={formData.rawText || ""}
            onChange={(e) => setFormData((prev) => ({ ...prev, rawText: e.target.value }))}
          />
        </div>

        {/* Settings */}
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <Label className="text-base font-medium text-gray-900 mb-3 block">
              Processing Chunk Size: {formData.chunkSize} tokens
            </Label>
            <Slider
              value={[formData.chunkSize]}
              onValueChange={([value]) => setFormData((prev) => ({ ...prev, chunkSize: value }))}
              min={800}
              max={2000}
              step={100}
              className="mt-2"
            />
            <p className="text-sm text-gray-500 mt-2">Optimized for fine-tuned model (1500 tokens recommended)</p>
          </div>

          <div>
            <Label htmlFor="teamOverride" className="text-base font-medium text-gray-900 mb-3 block">
              Team Name Override
            </Label>
            <Input
              id="teamOverride"
              placeholder="Optional team name..."
              value={formData.teamOverride || ""}
              onChange={(e) => setFormData((prev) => ({ ...prev, teamOverride: e.target.value }))}
              className="border-gray-300 focus:border-forest-500 focus:ring-forest-500"
            />
            <p className="text-sm text-gray-500 mt-2">Leave blank to auto-detect from file</p>
          </div>
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={!isValid || loading}
          className="w-full h-12 text-lg bg-forest-600 hover:bg-forest-700 text-white"
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 mr-3 animate-spin" />
              Processing with AI...
            </>
          ) : (
            <>
              <Zap className="h-5 w-5 mr-3" />
              Parse with Fine-Tuned AI
            </>
          )}
        </Button>

        {!isValid && (
          <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-3 rounded-lg">
            <AlertCircle className="h-4 w-4" />
            <p className="text-sm">Please upload a GameChanger file or paste data to continue</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
