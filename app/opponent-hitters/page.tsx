import { Target, BarChart3, Users } from "lucide-react"

export default function OpponentHittersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Opponent Hitters</h1>
        <p className="text-muted-foreground mt-2">Analyze opponent hitting patterns and strategic insights</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-lg border bg-card p-6 text-center">
          <Target className="h-12 w-12 mx-auto mb-4 text-primary" />
          <h3 className="text-lg font-semibold mb-2">Hit Zones</h3>
          <p className="text-muted-foreground text-sm">Identify hot and cold zones for each hitter</p>
        </div>

        <div className="rounded-lg border bg-card p-6 text-center">
          <BarChart3 className="h-12 w-12 mx-auto mb-4 text-primary" />
          <h3 className="text-lg font-semibold mb-2">Tendencies</h3>
          <p className="text-muted-foreground text-sm">Analyze batting patterns and preferences</p>
        </div>

        <div className="rounded-lg border bg-card p-6 text-center">
          <Users className="h-12 w-12 mx-auto mb-4 text-primary" />
          <h3 className="text-lg font-semibold mb-2">Team Analysis</h3>
          <p className="text-muted-foreground text-sm">Comprehensive team hitting breakdown</p>
        </div>
      </div>
    </div>
  )
}
