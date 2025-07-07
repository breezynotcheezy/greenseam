import { ImportPanel } from "@/components/import-panel"
import { RecentUploadsPanel } from "@/components/recent-uploads-panel"
import { Header } from "@/components/header"

export default function ImportPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="Import GameChanger Data"
        description="Upload your files and we'll automatically process them for analysis"
      />

      <main className="p-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <ImportPanel />
            </div>
            <div>
              <RecentUploadsPanel />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
