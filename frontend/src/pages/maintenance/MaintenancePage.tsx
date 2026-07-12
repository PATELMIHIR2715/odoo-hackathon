import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import {
  Plus,
  MoreVertical,
  Loader2,
  Wrench,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import {
  closeMaintenanceService,
  createMaintenanceService,
  getMaintenancesService,
} from "@/services/maintenance.service"
import { getVehiclesService } from "@/services/vehicles.service"

import type { Maintenance, MaintenanceStatus } from "@/types/maintenance"
import type { Vehicle } from "@/types/vehicle"
import { extractErrorMessage } from "@/lib/error"

// Validation Schema
const createMaintenanceSchema = z.object({
  vehicleId: z.string().trim().min(1, "Vehicle selection is required"),
  description: z.string().trim().min(1, "Description is required"),
  cost: z
    .number({ message: "Cost is required" })
    .positive("Cost must be greater than 0"),
})

type CreateMaintenanceFormValues = z.infer<typeof createMaintenanceSchema>

const STATUS_LABELS: Record<MaintenanceStatus, string> = {
  OPEN: "In Progress",
  CLOSED: "Closed",
}

const STATUS_STYLES: Record<MaintenanceStatus, string> = {
  OPEN: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-3 py-1 rounded-full text-xs font-semibold",
  CLOSED: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full text-xs font-semibold",
}

export function MaintenancePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [logs, setLogs] = useState<Maintenance[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState<{
    page: number
    pageSize: number
    total: number
    totalPages: number
  } | null>(null)

  // Dialog States
  const [isLogOpen, setIsLogOpen] = useState(false)
  const [isConfirmCloseOpen, setIsConfirmCloseOpen] = useState(false)

  // Dropdown list data for vehicles
  const [vehiclesOptions, setVehiclesOptions] = useState<Vehicle[]>([])
  const [loadingVehicles, setLoadingVehicles] = useState(false)

  // Selected state for close operation
  const [selectedLog, setSelectedLog] = useState<Maintenance | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Filters read from URL
  const pageFilter = Number(searchParams.get("page")) || 1
  const pageSize = 10

  // React Hook Form
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<CreateMaintenanceFormValues>({
    resolver: zodResolver(createMaintenanceSchema),
    defaultValues: {
      vehicleId: "",
      description: "",
      cost: 0,
    },
  })

  // Fetch paginated maintenance logs
  const fetchLogs = async () => {
    setLoading(true)
    try {
      const response = await getMaintenancesService({ page: pageFilter, pageSize })
      if (response.success) {
        setLogs(response.data.items)
        setPagination(response.data.pagination)
      } else {
        toast.error("Failed to load maintenance logs")
      }
    } catch (err) {
      toast.error(extractErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  // Load vehicles excluding retired ones for log options
  const fetchVehiclesOptions = async () => {
    setLoadingVehicles(true)
    try {
      const response = await getVehiclesService({ pageSize: 100 })
      if (response.success) {
        // filter out RETIRED vehicles
        const activeVehicles = response.data.items.filter((v) => v.status !== "RETIRED")
        setVehiclesOptions(activeVehicles)
      }
    } catch (err) {
      toast.error("Failed to fetch vehicles list options")
      console.error(err)
    } finally {
      setLoadingVehicles(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [pageFilter])

  useEffect(() => {
    if (isLogOpen) {
      fetchVehiclesOptions()
    }
  }, [isLogOpen])

  // Page selection
  const handlePageChange = (newPage: number) => {
    setSearchParams((prev) => {
      prev.set("page", String(newPage))
      return prev
    })
  }

  // Log Maintenance Submit
  const onLogSubmit = async (values: CreateMaintenanceFormValues) => {
    setSubmitting(true)
    try {
      const response = await createMaintenanceService(values)
      if (response.success) {
        toast.success("Maintenance log created successfully")
        setIsLogOpen(false)
        reset()
        fetchLogs()
      } else {
        toast.error("Failed to log maintenance")
      }
    } catch (err) {
      toast.error(extractErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  // Close log Confirmation Actions
  const handleCloseClick = (log: Maintenance) => {
    setSelectedLog(log)
    setIsConfirmCloseOpen(true)
  }

  const handleCloseConfirm = async () => {
    if (!selectedLog) return
    setSubmitting(true)
    try {
      const response = await closeMaintenanceService(selectedLog.id)
      if (response.success) {
        toast.success("Maintenance log marked as CLOSED")
        setIsConfirmCloseOpen(false)
        setSelectedLog(null)
        fetchLogs()
      } else {
        toast.error("Failed to close maintenance log")
      }
    } catch (err) {
      toast.error(extractErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header Block */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Maintenance & Workshops</h1>
          <p className="text-sm text-muted-foreground">
            Track repairs, log routine maintenance tasks, and control service workshop costs.
          </p>
        </div>
        <Button
          onClick={() => {
            reset({
              vehicleId: "",
              description: "",
              cost: 0,
            })
            setIsLogOpen(true)
          }}
          className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/95"
        >
          <Plus size={16} className="mr-2" />
          Log Maintenance
        </Button>
      </div>

      {/* Main logs Table */}
      <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-border/85 bg-muted/30 text-muted-foreground font-semibold uppercase tracking-wider">
                <th className="px-6 py-3.5">Log ID</th>
                <th className="px-6 py-3.5">Vehicle</th>
                <th className="px-6 py-3.5">Description</th>
                <th className="px-6 py-3.5">Cost</th>
                <th className="px-6 py-3.5">Opened At</th>
                <th className="px-6 py-3.5">Closed At</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/70">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <Loader2 size={18} className="animate-spin text-primary" />
                      Loading logs...
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-muted-foreground">
                    No active maintenance records. Click Log Maintenance to create one.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-muted/10 transition-colors"
                  >
                    <td className="px-6 py-3.5 font-mono font-medium text-foreground">
                      {log.id.substring(0, 8)}...
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="font-medium text-foreground">
                        {log.vehicle?.name || "Unknown"}
                      </div>
                      <div className="font-mono text-muted-foreground text-[10px] mt-0.5">
                        {log.vehicle?.registrationNumber || "No Reg"}
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-foreground max-w-xs truncate font-medium">
                      {log.description}
                    </td>
                    <td className="px-6 py-3.5 font-mono text-foreground font-semibold">
                      ₹{log.cost.toLocaleString("en-IN")}
                    </td>
                    <td className="px-6 py-3.5 text-muted-foreground font-medium">
                      {new Date(log.openedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-3.5 text-muted-foreground font-medium">
                      {log.closedAt ? new Date(log.closedAt).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className={STATUS_STYLES[log.status]}>
                        {STATUS_LABELS[log.status]}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      {log.status === "OPEN" ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="icon-xs"
                                className="rounded-full hover:bg-muted"
                              >
                                <MoreVertical size={16} />
                              </Button>
                            }
                          />
                          <DropdownMenuContent align="end" className="w-36 rounded-xl">
                            <DropdownMenuItem
                              onClick={() => handleCloseClick(log)}
                              className="flex items-center gap-2 cursor-pointer text-emerald-600 dark:text-emerald-400"
                            >
                              <CheckCircle size={14} />
                              Close Log
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <span className="text-[10px] text-muted-foreground font-medium px-2 py-1">
                          Completed
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {pagination && pagination.total > 0 && (
          <div className="flex items-center justify-between border-t border-border/80 bg-muted/5 px-6 py-3.5 text-xs">
            <span className="text-muted-foreground font-medium">
              Showing {(pagination.page - 1) * pagination.pageSize + 1} -{" "}
              {Math.min(pagination.page * pagination.pageSize, pagination.total)} of{" "}
              {pagination.total} entries
            </span>
            {pagination.totalPages > 1 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon-xs"
                  className="rounded-lg hover:bg-muted"
                  disabled={pagination.page <= 1}
                  onClick={() => handlePageChange(pagination.page - 1)}
                >
                  <ChevronLeft size={14} />
                </Button>
                <span className="text-muted-foreground select-none font-medium px-1">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon-xs"
                  className="rounded-lg hover:bg-muted"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => handlePageChange(pagination.page + 1)}
                >
                  <ChevronRight size={14} />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ==================== LOG MAINTENANCE DIALOG ==================== */}
      <Dialog open={isLogOpen} onOpenChange={setIsLogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl bg-card border border-border p-6 shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Log Maintenance Task</DialogTitle>
            <DialogDescription>
              Assign a vehicle to maintenance, detailing description logs and repair cost estimates.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onLogSubmit)} className="space-y-4 py-2">
            {/* Vehicle Selection */}
            <div className="space-y-1 flex flex-col justify-start">
              <label className="text-xs font-semibold text-foreground">Select Vehicle</label>
              <Controller
                control={control}
                name="vehicleId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full rounded-xl text-xs py-5">
                      <SelectValue placeholder="Choose a Vehicle" />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingVehicles ? (
                        <SelectItem value="_loading" disabled>
                          Loading vehicles...
                        </SelectItem>
                      ) : vehiclesOptions.length === 0 ? (
                        <SelectItem value="_empty" disabled>
                          No active vehicles found
                        </SelectItem>
                      ) : (
                        vehiclesOptions.map((vehicle) => (
                          <SelectItem key={vehicle.id} value={vehicle.id}>
                            {vehicle.name} ({vehicle.registrationNumber}) - {vehicle.status}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.vehicleId && (
                <p className="text-[10px] text-destructive">{errors.vehicleId.message}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Task Description</label>
              <textarea
                placeholder="e.g. Regular oil and filter change service"
                className="w-full min-w-0 rounded-xl border border-input bg-transparent px-3 py-2 text-xs transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 min-h-[80px] dark:bg-input/30"
                {...register("description")}
              />
              {errors.description && (
                <p className="text-[10px] text-destructive">{errors.description.message}</p>
              )}
            </div>

            {/* Cost */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Cost (₹)</label>
              <Input
                type="number"
                placeholder="e.g. 12000"
                className="rounded-xl text-xs py-5"
                {...register("cost", { valueAsNumber: true })}
              />
              {errors.cost && (
                <p className="text-[10px] text-destructive">{errors.cost.message}</p>
              )}
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsLogOpen(false)}
                className="rounded-xl py-5"
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/95 py-5"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 size={14} className="mr-2 animate-spin" />
                    Logging...
                  </>
                ) : (
                  "Log Maintenance"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ==================== CONFIRM CLOSE DIALOG ==================== */}
      <Dialog open={isConfirmCloseOpen} onOpenChange={setIsConfirmCloseOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl bg-card border border-border p-6 shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <Wrench size={20} />
              Close Maintenance Log
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to mark this maintenance record as complete? This action will set
              the status to CLOSED and record the completion timestamp.
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="rounded-xl bg-muted/40 p-4 border border-border/80 space-y-2 text-xs">
              <div>
                <span className="text-muted-foreground font-semibold">Vehicle: </span>
                <span className="font-semibold text-foreground">
                  {selectedLog.vehicle?.name || "Unknown"} ({selectedLog.vehicle?.registrationNumber || "No Reg"})
                </span>
              </div>
              <div>
                <span className="text-muted-foreground font-semibold">Description: </span>
                <span className="font-medium text-foreground">{selectedLog.description}</span>
              </div>
              <div>
                <span className="text-muted-foreground font-semibold">Total Cost: </span>
                <span className="font-mono font-bold text-foreground">
                  ₹{selectedLog.cost.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          )}

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsConfirmCloseOpen(false)}
              className="rounded-xl py-5"
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCloseConfirm}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white py-5"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 size={14} className="mr-2 animate-spin" />
                  Closing...
                </>
              ) : (
                "Confirm & Close"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
