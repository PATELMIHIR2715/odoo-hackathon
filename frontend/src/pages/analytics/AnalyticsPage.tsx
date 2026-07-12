import { ArrowUpRight, BarChart3, Clock3, Download, Fuel, Truck, TrendingUp, Wrench } from "lucide-react"

const kpis = [
  {
    title: "Operational cost",
    value: "₹8.42L",
    change: "+12.4%",
    tone: "text-amber-500",
    icon: TrendingUp,
  },
  {
    title: "Fuel efficiency",
    value: "6.8 km/L",
    change: "+0.9 km/L",
    tone: "text-emerald-500",
    icon: Fuel,
  },
  {
    title: "Fleet utilization",
    value: "74%",
    change: "+8 vehicles active",
    tone: "text-blue-500",
    icon: Truck,
  },
  {
    title: "Open maintenance",
    value: "06",
    change: "2 urgent",
    tone: "text-rose-500",
    icon: Wrench,
  },
] as const

const monthlyTrend = [
  { month: "Jan", fuel: 120000, maintenance: 76000, expenses: 42000 },
  { month: "Feb", fuel: 98000, maintenance: 59000, expenses: 35000 },
  { month: "Mar", fuel: 132000, maintenance: 81000, expenses: 50000 },
  { month: "Apr", fuel: 148000, maintenance: 92000, expenses: 47000 },
  { month: "May", fuel: 125000, maintenance: 68000, expenses: 62000 },
  { month: "Jun", fuel: 156000, maintenance: 101000, expenses: 54000 },
]

const costMix = [
  { name: "Fuel", value: 46, color: "#3b82f6" },
  { name: "Maintenance", value: 31, color: "#f59e0b" },
  { name: "Expenses", value: 23, color: "#8b5cf6" },
]

const topVehicles = [
  { registration: "WP-TR-2048", vehicle: "Tata Ultra", cost: "₹1.86L", delta: "+18%" },
  { registration: "WP-TR-1187", vehicle: "Isuzu N-Series", cost: "₹1.54L", delta: "+11%" },
  { registration: "NC-8821", vehicle: "Ashok Leyland", cost: "₹1.27L", delta: "+9%" },
  { registration: "WB-TR-4490", vehicle: "Mahindra Furio", cost: "₹1.03L", delta: "+7%" },
]

const recentSignals = [
  "Fuel spend dipped 8% after route consolidation.",
  "Two vehicles crossed the 90-day service window.",
  "Maintenance cost is concentrated in the western region.",
  "Four trips used more fuel than the fleet average.",
]

type TrendMetric = "fuel" | "maintenance" | "expenses"

function TrendBars({ metric }: { metric: TrendMetric }) {
  return (
    <div className="flex h-28 items-end gap-1.5 rounded-xl border border-border/70 bg-background/50 px-3 py-3">
      {monthlyTrend.map((item) => {
        const currentValue = item[metric]
        const height = Math.max(18, Math.round(currentValue / 9000))
        return (
          <div key={item.month} className="flex flex-1 flex-col items-center gap-2">
            <div
              className={`w-full rounded-t-lg ${
                metric === "fuel"
                  ? "bg-blue-500"
                  : metric === "maintenance"
                    ? "bg-amber-500"
                    : "bg-violet-500"
              }`}
              style={{ height: `${height}%` }}
              title={`${item.month}: ₹${currentValue.toLocaleString("en-IN")}`}
            />
            <span className="text-[10px] text-muted-foreground">{item.month}</span>
          </div>
        )
      })}
    </div>
  )
}

function DonutChart() {
  const radius = 42
  const strokeWidth = 16
  const circumference = 2 * Math.PI * radius
  let offset = 0

  return (
    <div className="relative flex items-center justify-center">
      <svg viewBox="0 0 120 120" className="h-56 w-56">
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
          opacity="0.45"
        />
        {costMix.map((item) => {
          const dash = (item.value / 100) * circumference
          const circle = (
            <circle
              key={item.name}
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke={item.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-offset}
              strokeLinecap="round"
              transform="rotate(-90 60 60)"
            />
          )
          offset += dash
          return circle
        })}
      </svg>
      <div className="absolute text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
          Total
        </p>
        <p className="mt-1 font-mono text-lg font-semibold">₹8.42L</p>
      </div>
    </div>
  )
}

export function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-card p-6 shadow-sm sm:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.10),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(245,158,11,0.10),transparent_35%)]" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-primary">Analytics</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Reports that read like an operations cockpit.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              Track fuel, maintenance, and general expenses in one place. This view now matches the
              rest of FleetOS and no longer depends on an external chart package.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button className="inline-flex items-center gap-2 rounded-xl border border-border/80 bg-background px-4 py-2.5 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted">
              <Clock3 size={16} />
              Last 30 days
            </button>
            <button className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/95">
              <Download size={16} />
              Export report
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((item) => {
          const Icon = item.icon
          return (
            <div
              key={item.title}
              className="rounded-3xl border border-border/80 bg-card p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                    {item.title}
                  </p>
                  <p className="mt-3 text-3xl font-semibold tracking-tight">{item.value}</p>
                </div>
                <div className={`rounded-2xl border border-border/80 bg-muted/40 p-3 ${item.tone}`}>
                  <Icon size={18} />
                </div>
              </div>
              <div className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
                <ArrowUpRight size={16} className={item.tone} />
                <span>{item.change}</span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_0.9fr]">
        <div className="rounded-3xl border border-border/80 bg-card p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Monthly cost trend</h2>
              <p className="text-sm text-muted-foreground">
                Fuel, maintenance, and other spend over time.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="rounded-full bg-blue-500/10 px-2.5 py-1 text-blue-600">Fuel</span>
              <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-amber-600">
                Maintenance
              </span>
              <span className="rounded-full bg-violet-500/10 px-2.5 py-1 text-violet-600">
                Expenses
              </span>
            </div>
          </div>

          <div className="mt-6 grid gap-4">
            <TrendBars metric="fuel" />
            <TrendBars metric="maintenance" />
            <TrendBars metric="expenses" />
          </div>
        </div>

        <div className="grid gap-6">
          <div className="rounded-3xl border border-border/80 bg-card p-5 shadow-sm sm:p-6">
            <div className="flex items-center gap-2">
              <BarChart3 size={18} className="text-primary" />
              <h2 className="text-lg font-semibold tracking-tight">Cost mix</h2>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              How the current month’s spend is distributed.
            </p>

            <div className="mt-4">
              <DonutChart />
            </div>

            <div className="mt-3 space-y-3">
              {costMix.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span>{item.name}</span>
                  </div>
                  <span className="font-medium text-muted-foreground">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-border/80 bg-card p-5 shadow-sm sm:p-6">
            <div className="flex items-center gap-2">
              <TrendingUp size={18} className="text-primary" />
              <h2 className="text-lg font-semibold tracking-tight">Top costly vehicles</h2>
            </div>
            <div className="mt-4 space-y-3">
              {topVehicles.map((vehicle, index) => (
                <div
                  key={vehicle.registration}
                  className="flex items-center justify-between rounded-2xl border border-border/70 bg-muted/20 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium">{vehicle.vehicle}</p>
                    <p className="text-xs text-muted-foreground">{vehicle.registration}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm font-semibold">{vehicle.cost}</p>
                    <p className={`text-xs ${index === 0 ? "text-rose-500" : "text-amber-500"}`}>
                      {vehicle.delta}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-border/80 bg-card p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-2">
            <BarChart3 size={18} className="text-primary" />
            <h2 className="text-lg font-semibold tracking-tight">Signal summary</h2>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {recentSignals.map((signal) => (
              <div
                key={signal}
                className="rounded-2xl border border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground"
              >
                {signal}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-border/80 bg-card p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-2">
            <Clock3 size={18} className="text-primary" />
            <h2 className="text-lg font-semibold tracking-tight">What this screen is ready for</h2>
          </div>
          <div className="mt-4 space-y-3 text-sm text-muted-foreground">
            <p>• Hook these cards to `/api/v1/analytics/overview`.</p>
            <p>• Replace the static trend with the monthly-trend report.</p>
            <p>• Add filters for vehicle, region, and date range.</p>
            <p>• Keep the same card structure so the data swap is painless.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
