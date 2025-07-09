import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Users, Zap } from "lucide-react"

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center bg-gray-50">
      <h1 className="text-4xl font-bold tracking-tight text-forest-700 sm:text-5xl mb-4">Greenseam AI</h1>
      <p className="text-xl text-gray-600 max-w-2xl mb-10">Advanced baseball analytics for strategic insights. Import GameChanger data and analyze player performance with AI-powered tools.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl w-full mt-8">
        <Card className="shadow-md border border-gray-100 bg-white hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-xl text-forest-700">
              <FileText className="h-5 w-5 text-forest-500" />
              Import Data
            </CardTitle>
            <CardDescription>Upload GameChanger files for analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/import" className="w-full">
              <Button variant="outline" className="w-full bg-forest-50 hover:bg-forest-100 text-forest-700 border-forest-200">Go to Import</Button>
            </Link>
          </CardContent>
        </Card>
        
        <Card className="shadow-md border border-gray-100 bg-white hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-xl text-blue-700">
              <Users className="h-5 w-5 text-blue-500" />
              Player Cards
            </CardTitle>
            <CardDescription>View detailed player analytics</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/players" className="w-full">
              <Button variant="outline" className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200">View Players</Button>
            </Link>
          </CardContent>
        </Card>
        
        <Card className="shadow-md border border-gray-100 bg-white hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-xl text-amber-700">
              <Zap className="h-5 w-5 text-amber-500" />
              Hitter Insights
            </CardTitle>
            <CardDescription>Analyze opponent hitter patterns</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/hitters" className="w-full">
              <Button variant="outline" className="w-full bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200">Analyze Hitters</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
