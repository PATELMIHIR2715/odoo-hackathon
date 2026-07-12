import { useEffect, useMemo, useState, type ComponentType } from "react"
import { BarChart3, Building2, ChevronRight, Loader2, Search, ShieldCheck, Truck, Users } from "lucide-react"

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
      return "bg-emerald-500/15 text-emerald-700 ring-emerald-500/25 dark:text-emerald-300"
    case "ON_TRIP":
    case "DISPATCHED":
      return "bg-sky-500/15 text-sky-700 ring-sky-500/25 dark:text-sky-300"
    case "IN_SHOP":
    case "OPEN":
      return "bg-amber-500/15 text-amber-700 ring-amber-500/25 dark:text-amber-300"
    case "RETIRED":
    case "CANCELLED":
      return "bg-rose-500/15 text-rose-700 ring-rose-500/25 dark:text-rose-300"
    case "COMPLETED":
      return "bg-lime-500/15 text-lime-700 ring-lime-500/25 dark:text-lime-300"
    case "DRAFT":
      return "bg-slate-500/15 text-slate-700 ring-slate-500/25 dark:text-slate-300"
    case "OFF_DUTY":
      return "bg-zinc-500/15 text-zinc-700 ring-zinc-500/25 dark:text-zinc-300"
    default:
      return "bg-muted text-muted-foreground ring-border/70"
  }
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
}) {
  return (
    <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm">
      <div className={cn("mb-4 h-1.5 w-16 rounded-full", accent)} />
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            {title}
          </p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
        </div>
        <div className="rounded-xl border border-border/70 bg-muted/40 p-2 text-muted-foreground">
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
          setError("error" in response && response.error ? response.error : "Unable to load dashboard")
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
  const maxVehicleCount = Math.max(...statusBreakdown.map((item) => item.count), 1)

  const kpis = overview?.kpis

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-border/80 bg-card p-4 shadow-sm xl:flex-row xl:items-center xl:justify-between">
        <div className="relative w-full max-w-xl">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search trips, vehicles, drivers..."
            className="h-10 rounded-xl pl-10 text-sm"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl"
            onClick={() => {
              setSearch("")
              setVehicleType("")
              setStatus("")
              setRegion("")
            }}
          >
            Reset filters
          </Button>
          <div className="rounded-full border border-border/70 bg-muted/40 px-3 py-1.5">
            {overview?.filters.region ? overview.filters.region : "All regions"}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm">
        <div className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Filters
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <Select
            value={vehicleType || undefined}
            onValueChange={(value) => setVehicleType(value as VehicleType)}
          >
            <SelectTrigger className="h-10 w-full rounded-xl text-sm">
              <SelectValue placeholder="Vehicle Type: All" />
            </SelectTrigger>
            <SelectContent>
              {vehicleTypeOptions.map((option) => (
                <SelectItem key={option.label} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={status || undefined}
            onValueChange={(value) => setStatus(value as VehicleStatus)}
          >
            <SelectTrigger className="h-10 w-full rounded-xl text-sm">
              <SelectValue placeholder="Status: All" />
            </SelectTrigger>
            <SelectContent>
              {vehicleStatusOptions.map((option) => (
                <SelectItem key={option.label} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            value={region}
            onChange={(event) => setRegion(event.target.value)}
            placeholder="Region: All"
            className="h-10 rounded-xl text-sm"
          />
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-5 text-sm text-rose-700 dark:text-rose-300">
          <p className="font-medium">Dashboard unavailable</p>
          <p className="mt-1">{error}</p>
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-7">
        <DashboardMetricCard
          title="Active Vehicles"
          value={isLoading ? "…" : numberFormatter.format(kpis?.activeVehicles ?? 0)}
          accent="bg-sky-500"
          icon={Truck}
        />
        <DashboardMetricCard
          title="Available Vehicles"
          value={isLoading ? "…" : numberFormatter.format(kpis?.availableVehicles ?? 0)}
          accent="bg-emerald-500"
          icon={ShieldCheck}
        />
        <DashboardMetricCard
          title="Vehicles in Maintenance"
          value={isLoading ? "…" : numberFormatter.format(kpis?.inMaintenanceVehicles ?? 0)}
          accent="bg-amber-500"
          icon={Building2}
        />
        <DashboardMetricCard
          title="Active Trips"
          value={isLoading ? "…" : numberFormatter.format(kpis?.activeTrips ?? 0)}
          accent="bg-sky-500"
          icon={BarChart3}
        />
        <DashboardMetricCard
          title="Pending Trips"
          value={isLoading ? "…" : numberFormatter.format(kpis?.pendingTrips ?? 0)}
          accent="bg-amber-500"
          icon={ChevronRight}
        />
        <DashboardMetricCard
          title="Drivers on Duty"
          value={isLoading ? "…" : numberFormatter.format(kpis?.driversOnDuty ?? 0)}
          accent="bg-sky-500"
          icon={Users}
        />
        <DashboardMetricCard
          title="Fleet Utilization"
          value={isLoading ? "…" : `${kpis?.fleetUtilizationPercent ?? 0}%`}
          accent="bg-emerald-500"
          icon={BarChart3}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,1fr)]">
        <section className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Recent Trips
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">Live operational activity</p>
            </div>
            <div className="text-xs text-muted-foreground">
              {filteredTrips.length} of {overview?.recentTrips.length ?? 0}
            </div>
          </div>

          <div className="mt-4 overflow-hidden rounded-2xl border border-border/70">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border/70 text-left">
                <thead className="bg-muted/30 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Trip</th>
                    <th className="px-4 py-3 font-medium">Vehicle</th>
                    <th className="px-4 py-3 font-medium">Driver</th>
                    <th className="px-4 py-3 font-medium">Route</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">ETA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/70">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">
                        <Loader2 className="mx-auto mb-3 size-5 animate-spin" />
                        Loading dashboard...
                      </td>
                    </tr>
                  ) : filteredTrips.length > 0 ? (
                    filteredTrips.map((trip) => (
                      <tr key={trip.id} className="bg-background/40">
                        <td className="px-4 py-3">
                          <div className="font-medium">{trip.id}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium">{trip.vehicle?.registrationNumber ?? "—"}</div>
                          <div className="text-xs text-muted-foreground">{trip.vehicle?.name ?? "—"}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium">{trip.driver?.name ?? "—"}</div>
                          <div className="text-xs text-muted-foreground">
                            {trip.driver?.licenseNumber ?? "—"}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="max-w-xs truncate">
                            {trip.source} → {trip.destination}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ring-inset",
                              statusTone(trip.status)
                            )}
                          >
                            {formatStatusLabel(trip.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
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
                      <td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">
                        No trips match the current filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <aside className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Vehicle Status
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">Fleet distribution by current status</p>
          </div>

          <div className="mt-5 space-y-4">
            {isLoading ? (
              <div className="rounded-2xl border border-dashed border-border/80 p-8 text-center text-sm text-muted-foreground">
                <Loader2 className="mx-auto mb-3 size-5 animate-spin" />
                Loading status summary...
              </div>
            ) : statusBreakdown.length > 0 ? (
              statusBreakdown.map((item) => {
                const width = `${Math.max((item.count / maxVehicleCount) * 100, item.count > 0 ? 10 : 0)}%`

                return (
                  <div key={item.status} className="grid grid-cols-[90px_minmax(0,1fr)] items-center gap-3">
                    <div className="text-sm text-muted-foreground">{formatStatusLabel(item.status)}</div>
                    <div className="flex items-center gap-3">
                      <div className="h-3 flex-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className={cn(
                            "h-full rounded-full",
                            item.status === "AVAILABLE"
                              ? "bg-emerald-500"
                              : item.status === "ON_TRIP"
                                ? "bg-sky-500"
                                : item.status === "IN_SHOP"
                                  ? "bg-amber-500"
                                  : "bg-rose-500"
                          )}
                          style={{ width }}
                        />
                      </div>
                      <div className="w-10 text-right text-xs text-muted-foreground">{item.count}</div>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="rounded-2xl border border-dashed border-border/80 p-8 text-center text-sm text-muted-foreground">
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
