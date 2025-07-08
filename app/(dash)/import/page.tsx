import { ImportPanel } from "@/components/import-panel"
import { RecentUploadsPanel } from "@/components/recent-uploads-panel"
import { Header } from "@/components/header"

export default function ImportPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header
        title="Import GameChanger Data"
      />

      <main className="flex-1 p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid gap-6 lg:grid-cols-3 lg:gap-8">
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

