"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useDropzone } from "react-dropzone"
import { Upload, FileText, Loader2, CheckCircle, AlertCircle, Zap } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
    <Card className="shadow-md border border-gray-100 bg-white overflow-hidden">
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* File Dropzone */}
          <div>
            <Label className="text-base font-medium text-gray-900 mb-2 block">Upload GameChanger File</Label>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200 ${
                isDragActive
                  ? "border-forest-400 bg-forest-50"
                  : acceptedFiles.length > 0
                    ? "border-green-400 bg-green-50"
                    : "border-gray-200 hover:border-forest-400 hover:bg-forest-50"
              }`}
            >
              <input {...getInputProps()} />
              {acceptedFiles.length > 0 ? (
                <div className="space-y-2">
                  <CheckCircle className="h-10 w-10 mx-auto text-green-600" />
                  <div>
                    <p className="font-medium text-green-800">{acceptedFiles[0].name}</p>
                    <p className="text-sm text-green-600">Ready for processing</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <FileText className="h-10 w-10 mx-auto text-gray-400" />
                  {isDragActive ? (
                    <p className="text-forest-600 font-medium">Drop the file here...</p>
                  ) : (
                    <div>
                      <p className="font-medium text-gray-900">Drop files here or click to browse</p>
                      <p className="text-sm text-gray-500 mt-1">Supports .txt, .csv, .xlsx files</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Raw Text Input */}
          <div>
            <Label htmlFor="rawText" className="text-base font-medium text-gray-900 mb-2 block">
              Or Paste GameChanger Data
            </Label>
            <Textarea
              id="rawText"
              placeholder="Paste your GameChanger play-by-play data here..."
              className="h-32 resize-none border-gray-200 focus:border-forest-500 focus:ring-forest-500"
              value={formData.rawText || ""}
              onChange={(e) => setFormData((prev) => ({ ...prev, rawText: e.target.value }))}
            />
          </div>

          {/* Settings */}
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <Label className="text-base font-medium text-gray-900 mb-2 block">
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
              <p className="text-sm text-gray-500 mt-2">Optimized for model (1500 tokens recommended)</p>
            </div>

            <div>
              <Label htmlFor="teamOverride" className="text-base font-medium text-gray-900 mb-2 block">
                Team Name Override
              </Label>
              <Input
                id="teamOverride"
                placeholder="Optional team name..."
                value={formData.teamOverride || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, teamOverride: e.target.value }))}
                className="border-gray-200 focus:border-forest-500 focus:ring-forest-500"
              />
              <p className="text-sm text-gray-500 mt-2">Leave blank to auto-detect from file</p>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={!isValid || loading}
            className="w-full h-11 text-base bg-forest-600 hover:bg-forest-700 text-white"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Parse Data
              </>
            )}
          </Button>

          {!isValid && (
            <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-3 rounded-md border border-amber-200">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <p className="text-sm">Please upload a file or paste data to continue</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
