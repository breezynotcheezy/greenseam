import { Upload, FileText, TrendingUp } from "lucide-react"

export default function ImportGCPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Import GC</h1>
        <p className="text-muted-foreground mt-2">Import GameChanger data for AI-powered analysis</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-lg border bg-card p-6 text-center">
          <Upload className="h-12 w-12 mx-auto mb-4 text-primary" />
          <h3 className="text-lg font-semibold mb-2">Upload Data</h3>
          <p className="text-muted-foreground text-sm">Import your GameChanger files for processing</p>
        </div>

        <div className="rounded-lg border bg-card p-6 text-center">
          <FileText className="h-12 w-12 mx-auto mb-4 text-primary" />
          <h3 className="text-lg font-semibold mb-2">Process Files</h3>
          <p className="text-muted-foreground text-sm">AI analyzes your data for insights</p>
        </div>

        <div className="rounded-lg border bg-card p-6 text-center">
          <TrendingUp className="h-12 w-12 mx-auto mb-4 text-primary" />
          <h3 className="text-lg font-semibold mb-2">View Results</h3>
          <p className="text-muted-foreground text-sm">Access detailed analytics and reports</p>
        </div>
      </div>
    </div>
  )
}
