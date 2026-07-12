import { useCallback, useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { useForm, Controller, useWatch } from "react-hook-form"
import { UI_CONSTANTS } from "@/constants/ui"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import {
  Plus,
  MoreVertical,
  Eye,
  Loader2,
  AlertTriangle,
  Play,
  CheckCircle,
  XCircle,
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
  cancelTripService,
  completeTripService,
  createTripService,
  dispatchTripService,
  getTripsService,
} from "@/services/trips.service"
import { getVehiclesService } from "@/services/vehicles.service"
import { getDriversService } from "@/services/drivers.service"

import type { Trip, TripStatus } from "@/types/trip"
import type { Vehicle } from "@/types/vehicle"
import type { Driver } from "@/types/driver"
import { extractErrorMessage } from "@/lib/error"

// Validation Schemas
const createTripSchema = z.object({
  source: z.string().trim().min(1, UI_CONSTANTS.TRIPS.VALIDATION.SOURCE_REQUIRED),
  destination: z.string().trim().min(1, UI_CONSTANTS.TRIPS.VALIDATION.DEST_REQUIRED),
  vehicleId: z.string().trim().min(1, UI_CONSTANTS.TRIPS.VALIDATION.VEHICLE_REQUIRED),
  driverId: z.string().trim().min(1, UI_CONSTANTS.TRIPS.VALIDATION.DRIVER_REQUIRED),
  cargoWeightKg: z
    .number({ message: UI_CONSTANTS.TRIPS.VALIDATION.CARGO_REQUIRED })
    .positive(UI_CONSTANTS.TRIPS.VALIDATION.CARGO_POSITIVE),
  plannedDistance: z
    .number({ message: UI_CONSTANTS.TRIPS.VALIDATION.PLANNED_DIST_REQUIRED })
    .positive(UI_CONSTANTS.TRIPS.VALIDATION.PLANNED_DIST_POSITIVE),
})

type CreateTripFormValues = z.infer<typeof createTripSchema>

const positiveOptionalNumber = z
  .union([z.string(), z.number()])
  .optional()
  .refine((val) => {
    if (val === "" || val === null || val === undefined) return true
    const num = Number(val)
    return !isNaN(num) && num > 0
  }, UI_CONSTANTS.TRIPS.VALIDATION.POSITIVE_NUMBER)

const completeTripSchema = z.object({
  actualDistance: z
    .number({ message: UI_CONSTANTS.TRIPS.VALIDATION.ACTUAL_DIST_REQUIRED })
    .positive(UI_CONSTANTS.TRIPS.VALIDATION.ACTUAL_DIST_POSITIVE),
  fuelConsumedL: positiveOptionalNumber,
  fuelCost: positiveOptionalNumber,
})

type CompleteTripFormValues = {
  actualDistance: number
  fuelConsumedL?: string | number
  fuelCost?: string | number
}

const STATUS_LABELS: Record<TripStatus, string> = {
  DRAFT: "Draft",
  DISPATCHED: "Dispatched",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
}

const STATUS_STYLES: Record<TripStatus, string> = {
  DRAFT:
    "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 px-3 py-1 rounded-full text-xs font-semibold",
  DISPATCHED:
    "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 px-3 py-1 rounded-full text-xs font-semibold",
  COMPLETED:
    "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full text-xs font-semibold",
  CANCELLED:
    "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 px-3 py-1 rounded-full text-xs font-semibold",
}

export function TripsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState<{
    page: number
    pageSize: number
    total: number
    totalPages: number
  } | null>(null)

  // Dialog States
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isCompleteOpen, setIsCompleteOpen] = useState(false)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  // Dropdown list data for available entities
  const [availableVehicles, setAvailableVehicles] = useState<Vehicle[]>([])
  const [availableDrivers, setAvailableDrivers] = useState<Driver[]>([])
  const [loadingOptions, setLoadingOptions] = useState(false)

  // Selected Trip States
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Filters read from URL
  const pageFilter = Number(searchParams.get("page")) || 1
  const pageSize = 10

  // React Hook Forms
  const {
    register: registerCreate,
    handleSubmit: handleSubmitCreate,
    control: controlCreate,
    watch: watchCreate,
    reset: resetCreate,
    formState: { errors: errorsCreate },
  } = useForm<CreateTripFormValues>({
    resolver: zodResolver(createTripSchema),
    defaultValues: {
      source: "",
      destination: "",
      vehicleId: "",
      driverId: "",
      cargoWeightKg: 0,
      plannedDistance: 0,
    },
  })

  const {
    register: registerComplete,
    handleSubmit: handleSubmitComplete,
    reset: resetComplete,
    formState: { errors: errorsComplete },
  } = useForm<CompleteTripFormValues>({
    resolver: zodResolver(completeTripSchema),
    defaultValues: {
      actualDistance: 0,
    },
  })

  // Watchers for Cargo Warning Calculations using useWatch to satisfy React compiler
  const watchedVehicleId = useWatch({ control: controlCreate, name: "vehicleId" })
  const watchedCargoWeight = useWatch({ control: controlCreate, name: "cargoWeightKg" }) || 0

  const selectedVehicleObj = availableVehicles.find((v) => v.id === watchedVehicleId)
  const isCapacityExceeded =
    selectedVehicleObj && watchedCargoWeight > selectedVehicleObj.maxLoadCapacityKg
  const capacityExcess = selectedVehicleObj
    ? watchedCargoWeight - selectedVehicleObj.maxLoadCapacityKg
    : 0

  // Fetch paginated trips list
  const fetchTrips = useCallback(async () => {
    setLoading(true)
    try {
      const response = await getTripsService({ page: pageFilter, pageSize })
      if (response.success) {
        setTrips(response.data.items)
        setPagination(response.data.pagination)
      } else {
        toast.error(UI_CONSTANTS.TRIPS.TOAST_LOAD_FAIL)
      }
    } catch (err) {
      toast.error(extractErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [pageFilter])

  // Load available vehicles and drivers for the dropdowns
  const fetchAvailableEntities = useCallback(async () => {
    setLoadingOptions(true)
    try {
      const vehiclesRes = await getVehiclesService({ status: "AVAILABLE", pageSize: 100 })
      const driversRes = await getDriversService({ pageSize: 100 })

      if (vehiclesRes.success) {
        setAvailableVehicles(vehiclesRes.data.items)
      }
      if (driversRes.success) {
        // filter AVAILABLE drivers on client side
        const availDrivers = driversRes.data.items.filter((d) => d.status === "AVAILABLE")
        setAvailableDrivers(availDrivers)
      }
    } catch (err) {
      toast.error(UI_CONSTANTS.TRIPS.TOAST_ENTITIES_FAIL)
      console.error(err)
    } finally {
      setLoadingOptions(false)
    }
  }, [])

  useEffect(() => {
    void fetchTrips()
  }, [fetchTrips])

  // Trigger loading options only when Create modal opens
  useEffect(() => {
    if (isCreateOpen) {
      void fetchAvailableEntities()
    }
  }, [fetchAvailableEntities, isCreateOpen])

  // Page selection
  const handlePageChange = (newPage: number) => {
    setSearchParams((prev) => {
      prev.set("page", String(newPage))
      return prev
    })
  }

  // Actions handlers
  const onCreateSubmit = async (values: CreateTripFormValues, autoDispatch = false) => {
    setSubmitting(true)
    try {
      // 1. Create Trip (DRAFT state)
      const createResponse = await createTripService(values)
      if (createResponse.success) {
        const createdTrip = createResponse.data

        if (autoDispatch) {
          // 2. Transition immediately to DISPATCHED
          const dispatchResponse = await dispatchTripService(createdTrip.id)
          if (dispatchResponse.success) {
            toast.success(UI_CONSTANTS.TRIPS.TOAST_CREATE_SUCCESS_DISPATCHED)
          } else {
            toast.warning(UI_CONSTANTS.TRIPS.TOAST_CREATE_WARNING_DISPATCH_FAIL)
          }
        } else {
          toast.success(UI_CONSTANTS.TRIPS.TOAST_CREATE_SUCCESS_DRAFT)
        }

        setIsCreateOpen(false)
        resetCreate()
        fetchTrips()
      } else {
        toast.error(UI_CONSTANTS.TRIPS.TOAST_CREATE_FAIL)
      }
    } catch (err) {
      toast.error(extractErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const handleDispatchClick = async (id: string) => {
    try {
      const response = await dispatchTripService(id)
      if (response.success) {
        toast.success(UI_CONSTANTS.TRIPS.TOAST_DISPATCH_SUCCESS)
        fetchTrips()
      } else {
        toast.error(UI_CONSTANTS.TRIPS.TOAST_DISPATCH_FAIL)
      }
    } catch (err) {
      toast.error(extractErrorMessage(err))
    }
  }

  const handleCancelClick = async (id: string) => {
    try {
      const response = await cancelTripService(id)
      if (response.success) {
        toast.success(UI_CONSTANTS.TRIPS.TOAST_CANCEL_SUCCESS)
        fetchTrips()
      } else {
        toast.error(UI_CONSTANTS.TRIPS.TOAST_CANCEL_FAIL)
      }
    } catch (err) {
      toast.error(extractErrorMessage(err))
    }
  }

  const handleCompleteClick = (trip: Trip) => {
    setSelectedTrip(trip)
    resetComplete({
      actualDistance: trip.plannedDistance,
    })
    setIsCompleteOpen(true)
  }

  const onCompleteSubmit = async (values: CompleteTripFormValues) => {
    if (!selectedTrip) return
    setSubmitting(true)
    try {
      const fuelL = values.fuelConsumedL !== "" && values.fuelConsumedL !== undefined && values.fuelConsumedL !== null ? Number(values.fuelConsumedL) : undefined
      const fuelC = values.fuelCost !== "" && values.fuelCost !== undefined && values.fuelCost !== null ? Number(values.fuelCost) : undefined

      const response = await completeTripService(selectedTrip.id, {
        actualDistance: values.actualDistance,
        fuelConsumedL: fuelL && !isNaN(fuelL) ? fuelL : undefined,
        fuelCost: fuelC && !isNaN(fuelC) ? fuelC : undefined,
      })
      if (response.success) {
        toast.success(UI_CONSTANTS.TRIPS.TOAST_COMPLETE_SUCCESS)
        setIsCompleteOpen(false)
        setSelectedTrip(null)
        fetchTrips()
      } else {
        toast.error(UI_CONSTANTS.TRIPS.TOAST_COMPLETE_FAIL)
      }
    } catch (err) {
      toast.error(extractErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const handleDetailsClick = (trip: Trip) => {
    setSelectedTrip(trip)
    setIsDetailsOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Top action block */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{UI_CONSTANTS.TRIPS.HEADER_TITLE}</h1>
          <p className="text-sm text-muted-foreground">
            {UI_CONSTANTS.TRIPS.HEADER_SUBTITLE}
          </p>
        </div>
        <Button
          onClick={() => {
            resetCreate({
              source: "",
              destination: "",
              vehicleId: "",
              driverId: "",
              cargoWeightKg: 0,
              plannedDistance: 0,
            })
            setIsCreateOpen(true)
          }}
          className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/95"
        >
          <Plus size={16} className="mr-2" />
          {UI_CONSTANTS.TRIPS.CREATE_TRIP}
        </Button>
      </div>

      {/* Main Table view */}
      <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-border/85 bg-muted/30 text-muted-foreground font-semibold uppercase tracking-wider">
                <th className="px-6 py-3.5">{UI_CONSTANTS.TRIPS.TABLE_TRIP_ID}</th>
                <th className="px-6 py-3.5">{UI_CONSTANTS.TRIPS.TABLE_ROUTE}</th>
                <th className="px-6 py-3.5">{UI_CONSTANTS.TRIPS.TABLE_VEHICLE}</th>
                <th className="px-6 py-3.5">{UI_CONSTANTS.TRIPS.TABLE_DRIVER}</th>
                <th className="px-6 py-3.5">{UI_CONSTANTS.TRIPS.TABLE_CARGO}</th>
                <th className="px-6 py-3.5">{UI_CONSTANTS.TRIPS.TABLE_DISTANCE}</th>
                <th className="px-6 py-3.5">{UI_CONSTANTS.TRIPS.TABLE_STATUS}</th>
                <th className="px-6 py-3.5 text-right">{UI_CONSTANTS.TRIPS.TABLE_ACTIONS}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/70">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <Loader2 size={18} className="animate-spin text-primary" />
                      {UI_CONSTANTS.TRIPS.LOADING_TEXT}
                    </div>
                  </td>
                </tr>
              ) : trips.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-muted-foreground">
                    {UI_CONSTANTS.TRIPS.NO_TRIPS}
                  </td>
                </tr>
              ) : (
                trips.map((trip) => (
                  <tr
                    key={trip.id}
                    className="hover:bg-muted/10 transition-colors"
                  >
                    <td className="px-6 py-3.5 font-mono font-medium text-foreground">
                      {trip.id.substring(0, 8)}...
                    </td>
                    <td className="px-6 py-3.5 text-foreground font-medium">
                      {trip.source} → {trip.destination}
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="font-medium text-foreground">
                        {trip.vehicle?.name || "Unknown"}
                      </div>
                      <div className="font-mono text-muted-foreground text-[10px] mt-0.5">
                        {trip.vehicle?.registrationNumber || "No Reg"}
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-foreground font-medium">
                      {trip.driver?.name || "No Driver"}
                    </td>
                    <td className="px-6 py-3.5 text-muted-foreground font-mono">
                      {trip.cargoWeightKg.toLocaleString()} kg
                    </td>
                    <td className="px-6 py-3.5 text-muted-foreground font-mono">
                      {trip.plannedDistance} km
                      {trip.actualDistance !== null && (
                        <span className="text-foreground font-semibold block text-[10px] mt-0.5">
                          Act: {trip.actualDistance} km
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className={STATUS_STYLES[trip.status]}>
                        {STATUS_LABELS[trip.status]}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right">
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
                            onClick={() => handleDetailsClick(trip)}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <Eye size={14} className="text-muted-foreground" />
                            View Details
                          </DropdownMenuItem>

                          {trip.status === "DRAFT" && (
                            <>
                              <DropdownMenuItem
                                onClick={() => handleDispatchClick(trip.id)}
                                className="flex items-center gap-2 cursor-pointer text-blue-600 dark:text-blue-400"
                              >
                                <Play size={14} />
                                Dispatch Trip
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleCancelClick(trip.id)}
                                className="flex items-center gap-2 cursor-pointer text-destructive"
                              >
                                <XCircle size={14} />
                                Cancel Trip
                              </DropdownMenuItem>
                            </>
                          )}

                          {trip.status === "DISPATCHED" && (
                            <>
                              <DropdownMenuItem
                                onClick={() => handleCompleteClick(trip)}
                                className="flex items-center gap-2 cursor-pointer text-emerald-600 dark:text-emerald-400"
                              >
                                <CheckCircle size={14} />
                                Complete Trip
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleCancelClick(trip.id)}
                                className="flex items-center gap-2 cursor-pointer text-destructive"
                              >
                                <XCircle size={14} />
                                Cancel Trip
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
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

      {/* ==================== CREATE TRIP DIALOG ==================== */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl bg-card border border-border p-6 shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Create Trip</DialogTitle>
            <DialogDescription>
              Deploy a new cargo consignment. Only available vehicles and drivers can be dispatched.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={handleSubmitCreate((values) => onCreateSubmit(values, false))}
            className="space-y-4 py-2"
          >
            {/* Source */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Source</label>
              <Input
                placeholder="e.g. Gandhinagar Depot"
                className="rounded-xl text-xs py-5"
                {...registerCreate("source")}
              />
              {errorsCreate.source && (
                <p className="text-[10px] text-destructive">{errorsCreate.source.message}</p>
              )}
            </div>

            {/* Destination */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Destination</label>
              <Input
                placeholder="e.g. Ahmedabad Hub"
                className="rounded-xl text-xs py-5"
                {...registerCreate("destination")}
              />
              {errorsCreate.destination && (
                <p className="text-[10px] text-destructive">{errorsCreate.destination.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Vehicle Select */}
              <div className="space-y-1 flex flex-col justify-start">
                <label className="text-xs font-semibold text-foreground">
                  Vehicle (Available Only)
                </label>
                <Controller
                  control={controlCreate}
                  name="vehicleId"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full rounded-xl text-xs py-5">
                        <SelectValue placeholder="Select Vehicle">
                          {field.value && availableVehicles.find((v) => v.id === field.value)
                            ? (() => {
                                const v = availableVehicles.find((v) => v.id === field.value)!
                                return `${v.name} - ${v.maxLoadCapacityKg.toLocaleString()} kg capacity`
                              })()
                            : undefined}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {loadingOptions ? (
                          <SelectItem value="_loading" disabled>
                            Loading options...
                          </SelectItem>
                        ) : availableVehicles.length === 0 ? (
                          <SelectItem value="_empty" disabled>
                            No available vehicles
                          </SelectItem>
                        ) : (
                          availableVehicles.map((vehicle) => (
                            <SelectItem key={vehicle.id} value={vehicle.id}>
                              {vehicle.name} - {vehicle.maxLoadCapacityKg.toLocaleString()} kg
                              capacity
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errorsCreate.vehicleId && (
                  <p className="text-[10px] text-destructive">{errorsCreate.vehicleId.message}</p>
                )}
              </div>

              {/* Driver Select */}
              <div className="space-y-1 flex flex-col justify-start">
                <label className="text-xs font-semibold text-foreground">
                  Driver (Available Only)
                </label>
                <Controller
                  control={controlCreate}
                  name="driverId"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full rounded-xl text-xs py-5">
                        <SelectValue placeholder="Select Driver">
                          {field.value && availableDrivers.find((d) => d.id === field.value)
                            ? availableDrivers.find((d) => d.id === field.value)?.name
                            : undefined}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {loadingOptions ? (
                          <SelectItem value="_loading" disabled>
                            Loading options...
                          </SelectItem>
                        ) : availableDrivers.length === 0 ? (
                          <SelectItem value="_empty" disabled>
                            No available drivers
                          </SelectItem>
                        ) : (
                          availableDrivers.map((driver) => (
                            <SelectItem key={driver.id} value={driver.id}>
                              {driver.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errorsCreate.driverId && (
                  <p className="text-[10px] text-destructive">{errorsCreate.driverId.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Cargo Weight */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Cargo Weight (Kg)</label>
                <Input
                  type="number"
                  placeholder="e.g. 700"
                  className="rounded-xl text-xs py-5"
                  {...registerCreate("cargoWeightKg", { valueAsNumber: true })}
                />
                {errorsCreate.cargoWeightKg && (
                  <p className="text-[10px] text-destructive">{errorsCreate.cargoWeightKg.message}</p>
                )}
              </div>

              {/* Planned Distance */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">
                  Planned Distance (Km)
                </label>
                <Input
                  type="number"
                  placeholder="e.g. 38"
                  className="rounded-xl text-xs py-5"
                  {...registerCreate("plannedDistance", { valueAsNumber: true })}
                />
                {errorsCreate.plannedDistance && (
                  <p className="text-[10px] text-destructive">
                    {errorsCreate.plannedDistance.message}
                  </p>
                )}
              </div>
            </div>

            {/* CAPACITY EXCEEDED WARNING PANEL */}
            {isCapacityExceeded && selectedVehicleObj && (
              <div className="rounded-xl border border-destructive bg-destructive/10 p-3.5 space-y-1 text-xs text-destructive">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertTriangle size={14} className="shrink-0 animate-bounce" />
                  <span>Dispatch Blocked</span>
                </div>
                <div className="font-medium">
                  Vehicle Capacity: {selectedVehicleObj.maxLoadCapacityKg.toLocaleString()} kg
                </div>
                <div className="font-medium">
                  Cargo Weight: {watchedCargoWeight.toLocaleString()} kg
                </div>
                <div className="font-bold underline mt-1">
                  ✕ Capacity exceeded by {capacityExcess.toLocaleString()} kg — dispatch blocked
                </div>
              </div>
            )}

            <DialogFooter className="pt-4 flex flex-wrap gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                className="rounded-xl py-5"
                disabled={submitting}
              >
                Cancel
              </Button>

              {/* Save Draft Option */}
              <Button
                type="submit"
                variant="secondary"
                className="rounded-xl py-5"
                disabled={submitting}
              >
                {submitting ? "Saving..." : "Save Draft"}
              </Button>

              {/* Dispatch immediately option */}
              <Button
                type="button"
                onClick={handleSubmitCreate((values) => onCreateSubmit(values, true))}
                className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/95 py-5"
                disabled={submitting || isCapacityExceeded}
              >
                {submitting ? (
                  <>
                    <Loader2 size={14} className="mr-2 animate-spin" />
                    Dispatching...
                  </>
                ) : (
                  "Dispatch"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ==================== COMPLETE TRIP DIALOG ==================== */}
      <Dialog open={isCompleteOpen} onOpenChange={setIsCompleteOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl bg-card border border-border p-6 shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Complete Trip</DialogTitle>
            <DialogDescription>
              Record the actual distance traversed and fuel metrics.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitComplete(onCompleteSubmit)} className="space-y-4 py-2">
            {/* Actual Distance */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Actual Distance (Km)</label>
              <Input
                type="number"
                placeholder="e.g. 125"
                className="rounded-xl text-xs py-5"
                {...registerComplete("actualDistance", { valueAsNumber: true })}
              />
              {errorsComplete.actualDistance && (
                <p className="text-[10px] text-destructive">{errorsComplete.actualDistance.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Fuel Consumed L */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">
                  Fuel Consumed (Liters)
                </label>
                <Input
                  type="number"
                  step="any"
                  placeholder="e.g. 18.5"
                  className="rounded-xl text-xs py-5"
                  {...registerComplete("fuelConsumedL")}
                />
                {errorsComplete.fuelConsumedL && (
                  <p className="text-[10px] text-destructive">
                    {errorsComplete.fuelConsumedL.message}
                  </p>
                )}
              </div>

              {/* Fuel Cost */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Fuel Cost (₹)</label>
                <Input
                  type="number"
                  placeholder="e.g. 6200"
                  className="rounded-xl text-xs py-5"
                  {...registerComplete("fuelCost")}
                />
                {errorsComplete.fuelCost && (
                  <p className="text-[10px] text-destructive">{errorsComplete.fuelCost.message}</p>
                )}
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCompleteOpen(false)}
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
                    Completing...
                  </>
                ) : (
                  "Complete Trip"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ==================== VIEW DETAILS DIALOG ==================== */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl bg-card border border-border p-6 shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Trip Consignment Details</DialogTitle>
            <DialogDescription>
              Full operational breakdown and records for Trip Consignment.
            </DialogDescription>
          </DialogHeader>

          {selectedTrip ? (
            <div className="space-y-4 py-2 text-xs">
              <div className="grid grid-cols-2 gap-y-3 gap-x-4 border-b border-border pb-4">
                <div>
                  <p className="text-muted-foreground font-semibold">Trip ID</p>
                  <p className="font-mono font-medium text-foreground mt-0.5">{selectedTrip.id}</p>
                </div>
                <div>
                  <p className="text-muted-foreground font-semibold">Consignment Status</p>
                  <div className="mt-1">
                    <span className={STATUS_STYLES[selectedTrip.status]}>
                      {STATUS_LABELS[selectedTrip.status]}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-y-3 gap-x-4 border-b border-border pb-4">
                <div>
                  <p className="text-muted-foreground font-semibold">Source location</p>
                  <p className="font-medium text-foreground text-sm mt-0.5">
                    {selectedTrip.source}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground font-semibold">Destination location</p>
                  <p className="font-medium text-foreground text-sm mt-0.5">
                    {selectedTrip.destination}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-y-3 gap-x-4 border-b border-border pb-4">
                <div>
                  <p className="text-muted-foreground font-semibold">Assigned Vehicle</p>
                  <p className="font-medium text-foreground mt-0.5">
                    {selectedTrip.vehicle?.name || "Unknown"}
                  </p>
                  <p className="font-mono text-muted-foreground text-[10px] mt-0.5">
                    Reg: {selectedTrip.vehicle?.registrationNumber || "No Reg"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground font-semibold">Assigned Driver</p>
                  <p className="font-medium text-foreground mt-0.5">
                    {selectedTrip.driver?.name || "No Driver"}
                  </p>
                  <p className="font-mono text-muted-foreground text-[10px] mt-0.5">
                    Lic: {selectedTrip.driver?.licenseNumber || "No License"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-y-3 gap-x-4 border-b border-border pb-4">
                <div>
                  <p className="text-muted-foreground font-semibold">Cargo Consignment</p>
                  <p className="font-mono font-medium text-foreground mt-0.5">
                    {selectedTrip.cargoWeightKg.toLocaleString()} kg
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground font-semibold">Distance planned</p>
                  <p className="font-mono font-medium text-foreground mt-0.5">
                    {selectedTrip.plannedDistance} km
                  </p>
                </div>
              </div>

              {selectedTrip.status === "COMPLETED" && (
                <div className="rounded-xl bg-muted/30 p-3 border border-border/80 grid grid-cols-3 gap-2">
                  <div>
                    <p className="text-[10px] text-muted-foreground font-semibold uppercase">
                      Act. Distance
                    </p>
                    <p className="font-mono font-medium text-foreground text-sm mt-0.5">
                      {selectedTrip.actualDistance || "-"} km
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground font-semibold uppercase">
                      Fuel Used
                    </p>
                    <p className="font-mono font-medium text-foreground text-sm mt-0.5">
                      {selectedTrip.fuelConsumedL || "-"} L
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground font-semibold uppercase">
                      Fuel Cost
                    </p>
                    <p className="font-mono font-medium text-foreground text-sm mt-0.5">
                      ₹{selectedTrip.fuelCost?.toLocaleString() || "-"}
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-[10px] text-muted-foreground pt-1">
                <div>
                  <p>Dispatched At</p>
                  <p>
                    {selectedTrip.dispatchedAt
                      ? new Date(selectedTrip.dispatchedAt).toLocaleString()
                      : "-"}
                  </p>
                </div>
                <div>
                  <p>Completed/Cancelled At</p>
                  <p>
                    {selectedTrip.completedAt
                      ? new Date(selectedTrip.completedAt).toLocaleString()
                      : selectedTrip.cancelledAt
                        ? new Date(selectedTrip.cancelledAt).toLocaleString()
                        : "-"}
                  </p>
                </div>
              </div>

              <DialogFooter className="pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDetailsOpen(false)}
                  className="rounded-xl w-full sm:w-auto py-5"
                >
                  Close
                </Button>
              </DialogFooter>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
