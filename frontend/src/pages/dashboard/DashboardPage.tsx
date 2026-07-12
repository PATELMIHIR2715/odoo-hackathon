import { useEffect, useMemo, useState, type ComponentType } from "react"
import {
  BarChart3,
  Building2,
  ChevronRight,
  Loader2,
  Search,
  ShieldCheck,
  Truck,
  Users,
  X,
} from "lucide-react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { extractErrorMessage } from "@/lib/error"
import { cn } from "@/lib/utils"
import { getDashboardOverviewService } from "@/services/dashboard.service"
import type { DashboardOverview } from "@/types/dashboard"
import type { VehicleStatus, VehicleType } from "@/types/vehicle"

const vehicleTypeOptions: Array<{ label: string; value: VehicleType }> = [
  { label: "Van", value: "VAN" },
  { label: "Truck", value: "TRUCK" },
  { label: "Mini", value: "MINI" },
  { label: "Car", value: "CAR" },
  { label: "Bus", value: "BUS" },
  { label: "SUV", value: "SUV" },
  { label: "Pickup", value: "PICKUP" },
  { label: "Other", value: "OTHER" },
]

const vehicleStatusOptions: Array<{ label: string; value: VehicleStatus }> = [
  { label: "Available", value: "AVAILABLE" },
  { label: "On Trip", value: "ON_TRIP" },
  { label: "In Shop", value: "IN_SHOP" },
  { label: "Retired", value: "RETIRED" },
]

const numberFormatter = new Intl.NumberFormat("en-IN")

function formatStatusLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function statusTone(value: string) {
  switch (value) {
    case "AVAILABLE":
      return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full text-[10px] font-semibold"
    case "ON_TRIP":
    case "DISPATCHED":
      return "bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 px-2.5 py-0.5 rounded-full text-[10px] font-semibold"
    case "IN_SHOP":
    case "OPEN":
      return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-2.5 py-0.5 rounded-full text-[10px] font-semibold"
    case "RETIRED":
    case "CANCELLED":
      return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 px-2.5 py-0.5 rounded-full text-[10px] font-semibold"
    case "COMPLETED":
      return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full text-[10px] font-semibold"
    case "DRAFT":
      return "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border border-zinc-500/20 px-2.5 py-0.5 rounded-full text-[10px] font-semibold"
    case "OFF_DUTY":
      return "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border border-zinc-500/20 px-2.5 py-0.5 rounded-full text-[10px] font-semibold"
    default:
      return "bg-muted text-muted-foreground ring-border/70 text-[10px] font-semibold"
  }
}

const getBorderColor = (accent: string) => {
  if (accent.includes("sky")) return "border-l-sky-500"
  if (accent.includes("emerald")) return "border-l-emerald-500"
  if (accent.includes("amber")) return "border-l-amber-500"
  return "border-l-primary"
}

function DashboardMetricCard({
  title,
  value,
  accent,
  icon: Icon,
}: {
  title: string
  value: string
  accent: string
  icon: ComponentType<{ className?: string }>
  className?: string
}) {
  const borderColor = getBorderColor(accent)
  return (
    <div
      className={cn(
        "rounded-2xl border border-l-4 border-border bg-card p-5 shadow-sm transition-all",
        borderColor
      )}
    >
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0 flex-1 pr-1">
          <p className="max-w-[15ch] text-[10px] leading-4 font-bold tracking-wider text-muted-foreground uppercase">
            {title}
          </p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">
            {value}
          </p>
        </div>
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-muted/40 text-muted-foreground shadow-sm">
          <Icon className="size-[18px]" />
        </div>
      </div>
    </div>
  )
}

export function DashboardPage() {
  const [overview, setOverview] = useState<DashboardOverview | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [vehicleType, setVehicleType] = useState<VehicleType | "">("")
  const [status, setStatus] = useState<VehicleStatus | "">("")
  const [region, setRegion] = useState("")

  useEffect(() => {
    let active = true

    async function loadDashboard() {
      try {
        setIsLoading(true)
        setError(null)

        const response = await getDashboardOverviewService({
          vehicleType,
          status,
          region: region.trim() || undefined,
          recentTripsLimit: 8,
        })

        if (!active) {
          return
        }

        if (!response.success) {
          setError(
            "error" in response && response.error
              ? response.error
              : "Unable to load dashboard"
          )
          setOverview(null)
          return
        }

        setOverview(response.data)
      } catch (loadError) {
        if (!active) {
          return
        }

        setError(extractErrorMessage(loadError))
        setOverview(null)
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }

    void loadDashboard()

    return () => {
      active = false
    }
  }, [vehicleType, status, region])

  const filteredTrips = useMemo(() => {
    const trips = overview?.recentTrips ?? []
    const query = search.trim().toLowerCase()

    if (!query) {
      return trips
    }

    return trips.filter((trip) => {
      const haystack = [
        trip.id,
        trip.source,
        trip.destination,
        trip.vehicle?.registrationNumber,
        trip.vehicle?.name,
        trip.vehicle?.manufacturer,
        trip.vehicle?.model,
        trip.driver?.name,
        trip.driver?.licenseNumber,
        trip.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()

      return haystack.includes(query)
    })
  }, [overview?.recentTrips, search])

  const statusBreakdown = overview?.vehicleStatusBreakdown ?? []
  const maxVehicleCount = Math.max(
    ...statusBreakdown.map((item) => item.count),
    1
  )

  const kpis = overview?.kpis
  const metricCards = [
    {
      title: "Active Vehicles",
      value: isLoading
        ? "…"
        : numberFormatter.format(kpis?.activeVehicles ?? 0),
      accent: "bg-sky-500",
      icon: Truck,
    },
    {
      title: "Available Vehicles",
      value: isLoading
        ? "…"
        : numberFormatter.format(kpis?.availableVehicles ?? 0),
      accent: "bg-emerald-500",
      icon: ShieldCheck,
    },
    {
      title: "Vehicles in Maintenance",
      value: isLoading
        ? "…"
        : numberFormatter.format(kpis?.inMaintenanceVehicles ?? 0),
      accent: "bg-amber-500",
      icon: Building2,
    },
    {
      title: "Active Trips",
      value: isLoading ? "…" : numberFormatter.format(kpis?.activeTrips ?? 0),
      accent: "bg-sky-500",
      icon: BarChart3,
    },
    {
      title: "Pending Trips",
      value: isLoading ? "…" : numberFormatter.format(kpis?.pendingTrips ?? 0),
      accent: "bg-amber-500",
      icon: ChevronRight,
    },
    {
      title: "Drivers on Duty",
      value: isLoading ? "…" : numberFormatter.format(kpis?.driversOnDuty ?? 0),
      accent: "bg-sky-500",
      icon: Users,
    },
    {
      title: "Fleet Utilization",
      value: isLoading ? "…" : `${kpis?.fleetUtilizationPercent ?? 0}%`,
      accent: "bg-emerald-500",
      icon: BarChart3,
    },
  ] as const

  return (
    <div className="space-y-6">
      {/* Top Search bar block */}
      <div className="flex flex-col gap-4 rounded-2xl border border-border/80 bg-card p-4.5 shadow-sm xl:flex-row xl:items-center xl:justify-between">
        <div className="relative w-full max-w-xl">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search trips, vehicles, drivers..."
            className="h-10 rounded-xl py-5 pl-10.5 text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl border-border py-4.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            onClick={() => {
              setSearch("")
              setVehicleType("")
              setStatus("")
              setRegion("")
            }}
          >
            Reset filters
          </Button>
          <div className="rounded-xl border border-border bg-muted/20 px-3.5 py-2 text-[10px] font-semibold tracking-wider text-foreground uppercase">
            {overview?.filters.region ? overview.filters.region : "All regions"}
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm">
        <div className="mb-3 text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
          Filters
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="relative">
            <Select
              value={vehicleType || "ALL"}
              onValueChange={(value) =>
                setVehicleType(value === "ALL" ? "" : (value as VehicleType))
              }
            >
              <SelectTrigger className="h-10 w-full rounded-xl bg-background py-5 pr-10 text-xs">
                <SelectValue placeholder="Vehicle Type: All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All types</SelectItem>
                {vehicleTypeOptions.map((option) => (
                  <SelectItem key={option.label} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {vehicleType ? (
              <button
                type="button"
                aria-label="Clear vehicle type"
                onClick={() => setVehicleType("")}
                className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            ) : null}
          </div>

          <div className="relative">
            <Select
              value={status || "ALL"}
              onValueChange={(value) =>
                setStatus(value === "ALL" ? "" : (value as VehicleStatus))
              }
            >
              <SelectTrigger className="h-10 w-full rounded-xl bg-background py-5 pr-10 text-xs">
                <SelectValue placeholder="Status: All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All statuses</SelectItem>
                {vehicleStatusOptions.map((option) => (
                  <SelectItem key={option.label} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {status ? (
              <button
                type="button"
                aria-label="Clear status"
                onClick={() => setStatus("")}
                className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-5 text-xs text-rose-700 dark:text-rose-300">
          <p className="font-semibold">Dashboard unavailable</p>
          <p className="mt-1">{error}</p>
        </div>
      ) : null}

      {/* KPIs Grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {metricCards.map((card) => {
          // const isLastCard = index === metricCards.length - 1
          // const hasOddRemainder = metricCards.length % 4 === 1
          return (
            <DashboardMetricCard
              key={card.title}
              title={card.title}
              value={card.value}
              accent={card.accent}
              icon={card.icon}
              // className={isLastCard && hasOddRemainder ? "xl:col-span-full 2xl:col-span-full" : undefined}
            />
          )
        })}
      </div>

      {/* Main dashboard columns */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(320px,1fr)]">
        {/* Recent Trips table list */}
        <section className="space-y-4 rounded-2xl border border-border/80 bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                Recent Trips
              </h3>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                Live operational dispatch activity
              </p>
            </div>
            <div className="rounded-lg border border-border/50 bg-muted/30 px-2 py-0.5 font-mono text-[10px] font-bold text-muted-foreground">
              {filteredTrips.length} of {overview?.recentTrips.length ?? 0}
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-border/85 bg-muted/30 font-semibold tracking-wider text-muted-foreground uppercase">
                    <th className="px-4 py-3.5">Trip</th>
                    <th className="px-4 py-3.5">Vehicle</th>
                    <th className="px-4 py-3.5">Driver</th>
                    <th className="px-4 py-3.5">Route</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5">ETA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/70">
                  {isLoading ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-12 text-center text-muted-foreground"
                      >
                        <Loader2 className="mx-auto mb-3 size-5 animate-spin text-primary" />
                        Loading dashboard records...
                      </td>
                    </tr>
                  ) : filteredTrips.length > 0 ? (
                    filteredTrips.map((trip) => (
                      <tr
                        key={trip.id}
                        className="transition-colors hover:bg-muted/10"
                      >
                        <td className="px-4 py-3.5 font-mono font-semibold text-muted-foreground">
                          {trip.id.substring(0, 8)}...
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="font-semibold text-foreground">
                            {trip.vehicle?.registrationNumber ?? "—"}
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            {trip.vehicle?.name ?? "—"}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="font-semibold text-foreground">
                            {trip.driver?.name ?? "—"}
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            {trip.driver?.licenseNumber ?? "—"}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 font-medium text-foreground">
                          <div className="max-w-xs truncate">
                            {trip.source} → {trip.destination}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={cn(statusTone(trip.status))}>
                            {formatStatusLabel(trip.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-muted-foreground">
                          {trip.status === "COMPLETED"
                            ? "Completed"
                            : trip.status === "CANCELLED"
                              ? "Cancelled"
                              : trip.status === "DISPATCHED"
                                ? "In transit"
                                : "Awaiting dispatch"}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-12 text-center text-muted-foreground"
                      >
                        No trips match the current filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Aside status distribution graph bars */}
        <aside className="space-y-4 rounded-2xl border border-border/80 bg-card p-5 shadow-sm">
          <div>
            <h3 className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
              Vehicle Status Breakdown
            </h3>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Fleet distribution statistics
            </p>
          </div>

          <div className="space-y-4 pt-2">
            {isLoading ? (
              <div className="rounded-2xl border border-dashed border-border/85 p-8 text-center text-muted-foreground">
                <Loader2 className="mx-auto mb-3 size-5 animate-spin text-primary" />
                Loading status summary...
              </div>
            ) : statusBreakdown.length > 0 ? (
              statusBreakdown.map((item) => {
                const width = `${Math.max((item.count / maxVehicleCount) * 100, item.count > 0 ? 10 : 0)}%`

                let barColor = "bg-rose-500/70 border border-rose-500/25"
                if (item.status === "AVAILABLE") {
                  barColor = "bg-emerald-500/70 border border-emerald-500/25"
                } else if (item.status === "ON_TRIP") {
                  barColor = "bg-sky-500/70 border border-sky-500/25"
                } else if (item.status === "IN_SHOP") {
                  barColor = "bg-amber-500/70 border border-amber-500/25"
                }

                return (
                  <div key={item.status} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span className="text-foreground">
                        {formatStatusLabel(item.status)}
                      </span>
                      <span className="font-mono font-bold text-foreground">
                        {item.count}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-3 flex-1 overflow-hidden rounded-full border border-border/20 bg-muted/30">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-500",
                            barColor
                          )}
                          style={{ width }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="rounded-2xl border border-dashed border-border/85 p-8 text-center text-muted-foreground">
                No vehicle status data available.
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}

export default DashboardPage
