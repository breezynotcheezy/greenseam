import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowRight, BarChart3, Brain, Target, Upload, Users, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function HomePage() {
  redirect("/import")

  return (
    <div className="min-h-screen bg-gradient-to-br from-forest-50 via-white to-blue-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-forest-500 to-forest-600 flex items-center justify-center">
                <span className="text-white font-bold text-lg">G</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Greenseam AI</h1>
                <p className="text-sm text-gray-600">Baseball Analytics Platform</p>
              </div>
            </div>
            <Link href="/import">
              <Button className="bg-forest-600 hover:bg-forest-700 text-white">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
              Transform Your Baseball
              <span className="text-forest-600"> Scouting</span>
              <br />
              with AI-Powered Analytics
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Import GameChanger data, analyze opponent hitting patterns, and get AI-powered predictions to gain the
              competitive edge your team needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/import">
                <Button size="lg" className="bg-forest-600 hover:bg-forest-700 text-white px-8 py-3 text-lg">
                  <Upload className="mr-2 h-5 w-5" />
                  Import Data
                </Button>
              </Link>
              <Link href="/hitters">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-forest-600 text-forest-600 hover:bg-forest-50 px-8 py-3 text-lg bg-transparent"
                >
                  <Target className="mr-2 h-5 w-5" />
                  View Analytics
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Powerful Features for Modern Baseball</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Everything you need to analyze, understand, and predict opponent behavior
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="text-center pb-4">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mx-auto mb-4">
                  <Upload className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl text-gray-900">Smart Data Import</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="text-gray-600 leading-relaxed">
                  Upload GameChanger files (.txt, .csv, .xlsx) and let our AI automatically parse and organize your data
                  with intelligent team detection.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="text-center pb-4">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-forest-500 to-forest-600 flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl text-gray-900">Advanced Analytics</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="text-gray-600 leading-relaxed">
                  Comprehensive hitting analysis with ground ball, line drive, and fly ball percentages, plus batting
                  averages and strikeout rates.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="text-center pb-4">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
                  <Brain className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl text-gray-900">AI Predictions</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="text-gray-600 leading-relaxed">
                  Get AI-powered predictions for each hitter's next at-bat based on historical performance and recent
                  trends.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="text-center pb-4">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center mx-auto mb-4">
                  <Target className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl text-gray-900">Spray Charts</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="text-gray-600 leading-relaxed">
                  Visual heat maps showing where each hitter tends to place the ball, helping you position your defense
                  strategically.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="text-center pb-4">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl text-gray-900">Team Management</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="text-gray-600 leading-relaxed">
                  Organize players by teams with custom colors and emojis. Filter and search across multiple teams
                  effortlessly.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="text-center pb-4">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center mx-auto mb-4">
                  <Zap className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl text-gray-900">Real-time Insights</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="text-gray-600 leading-relaxed">
                  Get instant insights and recommendations based on player performance, with detailed breakdowns
                  available at 15+ plate appearances.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-forest-600 to-forest-700">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-6">Ready to Revolutionize Your Scouting?</h2>
            <p className="text-xl text-forest-100 mb-8">
              Join teams already using Greenseam AI to gain competitive advantages through data-driven insights.
            </p>
            <Link href="/import">
              <Button size="lg" className="bg-white text-forest-600 hover:bg-gray-100 px-8 py-3 text-lg">
                <Upload className="mr-2 h-5 w-5" />
                Start Analyzing Now
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-3 mb-4 md:mb-0">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-forest-500 to-forest-600 flex items-center justify-center">
                <span className="text-white font-bold">G</span>
              </div>
              <span className="text-lg font-semibold">Greenseam AI</span>
            </div>
            <p className="text-gray-400 text-sm">© 2024 Greenseam AI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
