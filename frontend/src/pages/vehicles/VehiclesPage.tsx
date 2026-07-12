import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import {
  Plus,
  Search,
  MoreVertical,
  Edit2,
  Trash2,
  Eye,
  Loader2,
  Info,
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
  createVehicleService,
  deleteVehicleService,
  getVehicleByIdService,
  getVehiclesService,
  updateVehicleService,
} from "@/services/vehicles.service"
import type { Vehicle, VehicleType, VehicleStatus } from "@/types/vehicle"
import { extractErrorMessage } from "@/lib/error"

// Validation Schemas
const vehicleFormSchema = z.object({
  registrationNumber: z
    .string()
    .trim()
    .min(1, "Registration number is required")
    .toUpperCase(),
  name: z.string().trim().min(1, "Name/model is required"),
  type: z.enum(["VAN", "TRUCK", "MINI", "CAR", "BUS", "SUV", "PICKUP", "OTHER"], {
    message: "Please select a vehicle type",
  }),
  maxLoadCapacityKg: z.number({ message: "Capacity is required" }).positive("Capacity must be greater than 0"),
  odometerKm: z.number({ message: "Odometer is required" }).nonnegative("Odometer reading cannot be negative"),
  acquisitionCost: z.number({ message: "Acquisition cost is required" }).positive("Acquisition cost must be greater than 0"),
  region: z.string().trim().min(1, "Region is required"),
  status: z.enum(["AVAILABLE", "ON_TRIP", "IN_SHOP", "RETIRED"]).optional(),
})

type VehicleFormValues = z.infer<typeof vehicleFormSchema>

const STATUS_LABELS: Record<VehicleStatus, string> = {
  AVAILABLE: "Available",
  ON_TRIP: "On Trip",
  IN_SHOP: "In Shop",
  RETIRED: "Retired",
}

const STATUS_STYLES: Record<VehicleStatus, string> = {
  AVAILABLE:
    "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full text-xs font-semibold",
  ON_TRIP:
    "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 px-3 py-1 rounded-full text-xs font-semibold",
  IN_SHOP:
    "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-3 py-1 rounded-full text-xs font-semibold",
  RETIRED:
    "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 px-3 py-1 rounded-full text-xs font-semibold",
}

export function VehiclesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState<{
    page: number
    pageSize: number
    total: number
    totalPages: number
  } | null>(null)

  // Dialog States
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  // Selected/Editing Vehicle State
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [fetchingDetails, setFetchingDetails] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Filters read from URL search parameters
  const typeFilter = searchParams.get("type") || "ALL"
  const statusFilter = searchParams.get("status") || "ALL"
  const searchFilter = searchParams.get("search") || ""
  const pageFilter = Number(searchParams.get("page")) || 1
  const pageSize = 10

  // React Hook Form for Add / Edit
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleFormSchema),
    defaultValues: {
      registrationNumber: "",
      name: "",
      type: "TRUCK",
      maxLoadCapacityKg: 0,
      odometerKm: 0,
      acquisitionCost: 0,
      region: "",
    },
  })

  // Fetch all vehicles based on active filters
  const fetchVehicles = async () => {
    setLoading(true)
    try {
      const params: { type?: string; status?: string; search?: string; page?: number; pageSize?: number } = {
        page: pageFilter,
        pageSize,
      }
      if (typeFilter !== "ALL") params.type = typeFilter
      if (statusFilter !== "ALL") params.status = statusFilter
      if (searchFilter) params.search = searchFilter

      const response = await getVehiclesService(params)
      if (response.success) {
        setVehicles(response.data.items)
        setPagination(response.data.pagination)
      } else {
        toast.error("Failed to load vehicles")
      }
    } catch (err) {
      toast.error(extractErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVehicles()
  }, [typeFilter, statusFilter, searchFilter, pageFilter])

  // Filter handlers updating URL Search Params
  const handleTypeChange = (value: string | null) => {
    setSearchParams((prev) => {
      prev.delete("page")
      if (!value || value === "ALL") {
        prev.delete("type")
      } else {
        prev.set("type", value)
      }
      return prev
    })
  }

  const handleStatusChange = (value: string | null) => {
    setSearchParams((prev) => {
      prev.delete("page")
      if (!value || value === "ALL") {
        prev.delete("status")
      } else {
        prev.set("status", value)
      }
      return prev
    })
  }

  const handleSearchChange = (value: string) => {
    setSearchParams((prev) => {
      prev.delete("page")
      if (!value) {
        prev.delete("search")
      } else {
        prev.set("search", value)
      }
      return prev
    })
  }

  const handlePageChange = (newPage: number) => {
    setSearchParams((prev) => {
      prev.set("page", String(newPage))
      return prev
    })
  }

  // Add Action
  const onAddSubmit = async (values: VehicleFormValues) => {
    setSubmitting(true)
    try {
      const response = await createVehicleService({
        registrationNumber: values.registrationNumber,
        name: values.name,
        type: values.type,
        maxLoadCapacityKg: values.maxLoadCapacityKg,
        odometerKm: values.odometerKm,
        acquisitionCost: values.acquisitionCost,
        region: values.region,
      })
      if (response.success) {
        toast.success("Vehicle added successfully")
        setIsAddOpen(false)
        reset()
        fetchVehicles()
      } else {
        toast.error("Failed to create vehicle")
      }
    } catch (err) {
      toast.error(extractErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  // Edit Action (fetches vehicle by ID first)
  const handleEditClick = async (id: string) => {
    setIsEditOpen(true)
    setFetchingDetails(true)
    try {
      const response = await getVehicleByIdService(id)
      if (response.success) {
        setSelectedVehicle(response.data)
        reset({
          registrationNumber: response.data.registrationNumber,
          name: response.data.name,
          type: response.data.type,
          maxLoadCapacityKg: response.data.maxLoadCapacityKg,
          odometerKm: response.data.odometerKm,
          acquisitionCost: response.data.acquisitionCost,
          region: response.data.region,
          status: response.data.status,
        })
      } else {
        toast.error("Failed to fetch vehicle details")
        setIsEditOpen(false)
      }
    } catch (err) {
      toast.error(extractErrorMessage(err))
      setIsEditOpen(false)
    } finally {
      setFetchingDetails(false)
    }
  }

  const onEditSubmit = async (values: VehicleFormValues) => {
    if (!selectedVehicle) return
    setSubmitting(true)
    try {
      const response = await updateVehicleService(selectedVehicle.id, {
        registrationNumber: values.registrationNumber,
        name: values.name,
        type: values.type,
        maxLoadCapacityKg: values.maxLoadCapacityKg,
        odometerKm: values.odometerKm,
        acquisitionCost: values.acquisitionCost,
        region: values.region,
        status: values.status as VehicleStatus,
      })
      if (response.success) {
        toast.success("Vehicle updated successfully")
        setIsEditOpen(false)
        setSelectedVehicle(null)
        reset()
        fetchVehicles()
      } else {
        toast.error("Failed to update vehicle")
      }
    } catch (err) {
      toast.error(extractErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  // View Details Action
  const handleViewDetailsClick = async (id: string) => {
    setIsDetailsOpen(true)
    setFetchingDetails(true)
    try {
      const response = await getVehicleByIdService(id)
      if (response.success) {
        setSelectedVehicle(response.data)
      } else {
        toast.error("Failed to fetch vehicle details")
        setIsDetailsOpen(false)
      }
    } catch (err) {
      toast.error(extractErrorMessage(err))
      setIsDetailsOpen(false)
    } finally {
      setFetchingDetails(false)
    }
  }

  // Delete Action
  const handleDeleteClick = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle)
    setIsDeleteOpen(true)
  }

  const onDeleteConfirm = async () => {
    if (!selectedVehicle) return
    setSubmitting(true)
    try {
      const response = await deleteVehicleService(selectedVehicle.id)
      if (response.success) {
        toast.success(`Vehicle ${selectedVehicle.registrationNumber} retired successfully`)
        setIsDeleteOpen(false)
        setSelectedVehicle(null)
        fetchVehicles()
      } else {
        toast.error("Failed to retire vehicle")
      }
    } catch (err) {
      toast.error(extractErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  // Formatters
  const formatCapacity = (kg: number) => {
    if (kg >= 1000) {
      const tons = kg / 1000
      return `${Number(tons.toFixed(2))} Ton`
    }
    return `${kg} kg`
  }

  const formatCost = (cost: number) => {
    return new Intl.NumberFormat("en-IN").format(cost)
  }

  const formatVehicleType = (type: VehicleType) => {
    if (type === "SUV") return "SUV"
    return type.charAt(0) + type.slice(1).toLowerCase()
  }

  return (
    <div className="space-y-6">
      {/* Top action block */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Vehicles Fleet</h1>
          <p className="text-sm text-muted-foreground">
            Manage your operations fleet, track capacities, and vehicle status.
          </p>
        </div>
        <Button
          onClick={() => {
            reset({
              registrationNumber: "",
              name: "",
              type: "TRUCK",
              maxLoadCapacityKg: 0,
              odometerKm: 0,
              acquisitionCost: 0,
              region: "",
            })
            setIsAddOpen(true)
          }}
          className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/95"
        >
          <Plus size={16} className="mr-2" />
          Add Vehicle
        </Button>
      </div>

      {/* Filters Area */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search reg. no... */}
        <div className="relative flex flex-1 min-w-[200px] max-w-xs items-center rounded-xl border border-border bg-background px-3 py-1.5 focus-within:border-primary">
          <Search size={16} className="text-muted-foreground mr-2" />
          <input
            type="text"
            placeholder="Search reg. no..."
            value={searchFilter}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full border-none bg-transparent text-xs outline-none text-foreground placeholder:text-muted-foreground"
          />
        </div>

        {/* Type Select */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Type:</span>
          <Select value={typeFilter} onValueChange={handleTypeChange}>
            <SelectTrigger className="w-[120px] rounded-xl text-xs">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All</SelectItem>
              <SelectItem value="VAN">Van</SelectItem>
              <SelectItem value="TRUCK">Truck</SelectItem>
              <SelectItem value="MINI">Mini</SelectItem>
              <SelectItem value="CAR">Car</SelectItem>
              <SelectItem value="BUS">Bus</SelectItem>
              <SelectItem value="SUV">SUV</SelectItem>
              <SelectItem value="PICKUP">Pickup</SelectItem>
              <SelectItem value="OTHER">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Status Select */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Status:</span>
          <Select value={statusFilter} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[130px] rounded-xl text-xs">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All</SelectItem>
              <SelectItem value="AVAILABLE">Available</SelectItem>
              <SelectItem value="ON_TRIP">On Trip</SelectItem>
              <SelectItem value="IN_SHOP">In Shop</SelectItem>
              <SelectItem value="RETIRED">Retired</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main Table view */}
      <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-border/85 bg-muted/30 text-muted-foreground font-semibold uppercase tracking-wider">
                <th className="px-6 py-3.5">Reg. No. (Unique)</th>
                <th className="px-6 py-3.5">Name/Model</th>
                <th className="px-6 py-3.5">Type</th>
                <th className="px-6 py-3.5">Capacity</th>
                <th className="px-6 py-3.5">Odometer</th>
                <th className="px-6 py-3.5">Acq. Cost</th>
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
                      Loading fleet...
                    </div>
                  </td>
                </tr>
              ) : vehicles.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-muted-foreground">
                    No vehicles found matching the filters.
                  </td>
                </tr>
              ) : (
                vehicles.map((vehicle) => (
                  <tr
                    key={vehicle.id}
                    className="hover:bg-muted/10 transition-colors"
                  >
                    <td className="px-6 py-3.5 font-mono font-medium text-foreground">
                      {vehicle.registrationNumber}
                    </td>
                    <td className="px-6 py-3.5 font-medium text-foreground">
                      {vehicle.name}
                    </td>
                    <td className="px-6 py-3.5 text-muted-foreground">
                      {formatVehicleType(vehicle.type)}
                    </td>
                    <td className="px-6 py-3.5 text-foreground font-medium">
                      {formatCapacity(vehicle.maxLoadCapacityKg)}
                    </td>
                    <td className="px-6 py-3.5 text-muted-foreground font-mono">
                      {vehicle.odometerKm.toLocaleString()} km
                    </td>
                    <td className="px-6 py-3.5 text-muted-foreground font-mono">
                      ₹{formatCost(vehicle.acquisitionCost)}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className={STATUS_STYLES[vehicle.status]}>
                        {STATUS_LABELS[vehicle.status]}
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
                            onClick={() => handleViewDetailsClick(vehicle.id)}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <Eye size={14} className="text-muted-foreground" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleEditClick(vehicle.id)}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <Edit2 size={14} className="text-muted-foreground" />
                            Edit
                          </DropdownMenuItem>
                          {vehicle.status !== "RETIRED" && (
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => handleDeleteClick(vehicle)}
                              className="flex items-center gap-2 cursor-pointer text-destructive"
                            >
                              <Trash2 size={14} />
                              Retire
                            </DropdownMenuItem>
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

        {/* Footer Info/Rule */}
        <div className="flex items-center gap-2 border-t border-border/80 bg-muted/10 px-6 py-3 text-xs text-amber-600 dark:text-amber-400 font-medium">
          <Info size={14} className="shrink-0" />
          <span>
            Rule: Registration No. must be unique • Retired/In Shop vehicles are hidden from Trip Dispatcher
          </span>
        </div>
      </div>

      {/* ==================== ADD VEHICLE DIALOG ==================== */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl bg-card border border-border p-6 shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Add New Vehicle</DialogTitle>
            <DialogDescription>
              Enter vehicle registration details, capacities, and acquisition cost.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onAddSubmit)} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              {/* Registration Number */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Reg. Number</label>
                <Input
                  placeholder="e.g. ABC-1234"
                  className="rounded-xl text-xs py-5"
                  {...register("registrationNumber")}
                />
                {errors.registrationNumber && (
                  <p className="text-[10px] text-destructive">
                    {errors.registrationNumber.message}
                  </p>
                )}
              </div>

              {/* Name/Model */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Name / Model</label>
                <Input
                  placeholder="e.g. Truck 1"
                  className="rounded-xl text-xs py-5"
                  {...register("name")}
                />
                {errors.name && (
                  <p className="text-[10px] text-destructive">{errors.name.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Type Select */}
              <div className="space-y-1 flex flex-col justify-start">
                <label className="text-xs font-semibold text-foreground">Type</label>
                <Controller
                  control={control}
                  name="type"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={(val) => field.onChange(val ?? "TRUCK")}>
                      <SelectTrigger className="w-full rounded-xl text-xs py-5">
                        <SelectValue placeholder="Select Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="VAN">Van</SelectItem>
                        <SelectItem value="TRUCK">Truck</SelectItem>
                        <SelectItem value="MINI">Mini</SelectItem>
                        <SelectItem value="CAR">Car</SelectItem>
                        <SelectItem value="BUS">Bus</SelectItem>
                        <SelectItem value="SUV">SUV</SelectItem>
                        <SelectItem value="PICKUP">Pickup</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.type && (
                  <p className="text-[10px] text-destructive">{errors.type.message}</p>
                )}
              </div>

              {/* Region */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Region</label>
                <Input
                  placeholder="e.g. Western"
                  className="rounded-xl text-xs py-5"
                  {...register("region")}
                />
                {errors.region && (
                  <p className="text-[10px] text-destructive">{errors.region.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {/* Capacity */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Capacity (Kg)</label>
                <Input
                  type="number"
                  placeholder="8000"
                  className="rounded-xl text-xs py-5"
                  {...register("maxLoadCapacityKg", { valueAsNumber: true })}
                />
                {errors.maxLoadCapacityKg && (
                  <p className="text-[10px] text-destructive">
                    {errors.maxLoadCapacityKg.message}
                  </p>
                )}
              </div>

              {/* Odometer */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Odometer (Km)</label>
                <Input
                  type="number"
                  placeholder="12000"
                  className="rounded-xl text-xs py-5"
                  {...register("odometerKm", { valueAsNumber: true })}
                />
                {errors.odometerKm && (
                  <p className="text-[10px] text-destructive">
                    {errors.odometerKm.message}
                  </p>
                )}
              </div>

              {/* Acquisition Cost */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Acq. Cost (₹)</label>
                <Input
                  type="number"
                  placeholder="4500000"
                  className="rounded-xl text-xs py-5"
                  {...register("acquisitionCost", { valueAsNumber: true })}
                />
                {errors.acquisitionCost && (
                  <p className="text-[10px] text-destructive">
                    {errors.acquisitionCost.message}
                  </p>
                )}
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddOpen(false)}
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
                    Saving...
                  </>
                ) : (
                  "Add Vehicle"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ==================== EDIT VEHICLE DIALOG ==================== */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl bg-card border border-border p-6 shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Edit Vehicle</DialogTitle>
            <DialogDescription>
              Update the vehicle registration, details, or operational status.
            </DialogDescription>
          </DialogHeader>

          {fetchingDetails ? (
            <div className="flex flex-col items-center justify-center py-10 space-y-2">
              <Loader2 size={24} className="animate-spin text-primary" />
              <p className="text-xs text-muted-foreground">Fetching details...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onEditSubmit)} className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                {/* Registration Number */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Reg. Number</label>
                  <Input
                    placeholder="e.g. ABC-1234"
                    className="rounded-xl text-xs py-5 font-mono"
                    {...register("registrationNumber")}
                  />
                  {errors.registrationNumber && (
                    <p className="text-[10px] text-destructive">
                      {errors.registrationNumber.message}
                    </p>
                  )}
                </div>

                {/* Name/Model */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Name / Model</label>
                  <Input
                    placeholder="e.g. Truck 1"
                    className="rounded-xl text-xs py-5"
                    {...register("name")}
                  />
                  {errors.name && (
                    <p className="text-[10px] text-destructive">{errors.name.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Type Select */}
                <div className="space-y-1 flex flex-col justify-start">
                  <label className="text-xs font-semibold text-foreground">Type</label>
                  <Controller
                    control={control}
                    name="type"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={(val) => field.onChange(val ?? "TRUCK")}>
                        <SelectTrigger className="w-full rounded-xl text-xs py-5">
                          <SelectValue placeholder="Select Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="VAN">Van</SelectItem>
                          <SelectItem value="TRUCK">Truck</SelectItem>
                          <SelectItem value="MINI">Mini</SelectItem>
                          <SelectItem value="CAR">Car</SelectItem>
                          <SelectItem value="BUS">Bus</SelectItem>
                          <SelectItem value="SUV">SUV</SelectItem>
                          <SelectItem value="PICKUP">Pickup</SelectItem>
                          <SelectItem value="OTHER">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.type && (
                    <p className="text-[10px] text-destructive">{errors.type.message}</p>
                  )}
                </div>

                {/* Status Select */}
                <div className="space-y-1 flex flex-col justify-start">
                  <label className="text-xs font-semibold text-foreground">Status</label>
                  <Controller
                    control={control}
                    name="status"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={(val) => field.onChange(val ?? "AVAILABLE")}>
                        <SelectTrigger className="w-full rounded-xl text-xs py-5">
                          <SelectValue placeholder="Select Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="AVAILABLE">Available</SelectItem>
                          <SelectItem value="ON_TRIP">On Trip</SelectItem>
                          <SelectItem value="IN_SHOP">In Shop</SelectItem>
                          <SelectItem value="RETIRED">Retired</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.status && (
                    <p className="text-[10px] text-destructive">{errors.status.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Region */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Region</label>
                  <Input
                    placeholder="e.g. Western"
                    className="rounded-xl text-xs py-5"
                    {...register("region")}
                  />
                  {errors.region && (
                    <p className="text-[10px] text-destructive">{errors.region.message}</p>
                  )}
                </div>

                {/* Capacity */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Capacity (Kg)</label>
                  <Input
                    type="number"
                    placeholder="8000"
                    className="rounded-xl text-xs py-5"
                    {...register("maxLoadCapacityKg", { valueAsNumber: true })}
                  />
                  {errors.maxLoadCapacityKg && (
                    <p className="text-[10px] text-destructive">
                      {errors.maxLoadCapacityKg.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Odometer */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Odometer (Km)</label>
                  <Input
                    type="number"
                    placeholder="12000"
                    className="rounded-xl text-xs py-5"
                    {...register("odometerKm", { valueAsNumber: true })}
                  />
                  {errors.odometerKm && (
                    <p className="text-[10px] text-destructive">
                      {errors.odometerKm.message}
                    </p>
                  )}
                </div>

                {/* Acquisition Cost */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Acq. Cost (₹)</label>
                  <Input
                    type="number"
                    placeholder="4500000"
                    className="rounded-xl text-xs py-5"
                    {...register("acquisitionCost", { valueAsNumber: true })}
                  />
                  {errors.acquisitionCost && (
                    <p className="text-[10px] text-destructive">
                      {errors.acquisitionCost.message}
                    </p>
                  )}
                </div>
              </div>

              <DialogFooter className="pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditOpen(false)}
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
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ==================== VIEW DETAILS DIALOG ==================== */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl bg-card border border-border p-6 shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Vehicle Details</DialogTitle>
            <DialogDescription>
              Detailed view of the vehicle's records and specifications.
            </DialogDescription>
          </DialogHeader>

          {fetchingDetails ? (
            <div className="flex flex-col items-center justify-center py-10 space-y-2">
              <Loader2 size={24} className="animate-spin text-primary" />
              <p className="text-xs text-muted-foreground">Fetching details...</p>
            </div>
          ) : selectedVehicle ? (
            <div className="space-y-4 py-2 text-xs">
              <div className="grid grid-cols-2 gap-y-3 gap-x-4 border-b border-border pb-4">
                <div>
                  <p className="text-muted-foreground font-semibold">Registration Number</p>
                  <p className="font-mono font-medium text-foreground text-sm mt-0.5">
                    {selectedVehicle.registrationNumber}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground font-semibold">Name / Model</p>
                  <p className="font-medium text-foreground text-sm mt-0.5">
                    {selectedVehicle.name}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-y-3 gap-x-4 border-b border-border pb-4">
                <div>
                  <p className="text-muted-foreground font-semibold">Vehicle Type</p>
                  <p className="font-medium text-foreground mt-0.5">
                    {formatVehicleType(selectedVehicle.type)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground font-semibold">Operational Status</p>
                  <div className="mt-1">
                    <span className={STATUS_STYLES[selectedVehicle.status]}>
                      {STATUS_LABELS[selectedVehicle.status]}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-y-3 gap-x-4 border-b border-border pb-4">
                <div>
                  <p className="text-muted-foreground font-semibold">Max Load Capacity</p>
                  <p className="font-medium text-foreground mt-0.5">
                    {selectedVehicle.maxLoadCapacityKg.toLocaleString()} kg (
                    {formatCapacity(selectedVehicle.maxLoadCapacityKg)})
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground font-semibold">Odometer Reading</p>
                  <p className="font-mono font-medium text-foreground mt-0.5">
                    {selectedVehicle.odometerKm.toLocaleString()} km
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-y-3 gap-x-4 border-b border-border pb-4">
                <div>
                  <p className="text-muted-foreground font-semibold">Acquisition Cost</p>
                  <p className="font-mono font-medium text-foreground mt-0.5">
                    ₹{formatCost(selectedVehicle.acquisitionCost)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground font-semibold">Region / Branch</p>
                  <p className="font-medium text-foreground mt-0.5">
                    {selectedVehicle.region}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-[10px] text-muted-foreground pt-1">
                <div>
                  <p>Created At</p>
                  <p>{new Date(selectedVehicle.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <p>Last Updated</p>
                  <p>{new Date(selectedVehicle.updatedAt).toLocaleString()}</p>
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

      {/* ==================== DELETE / RETIRE CONFIRMATION DIALOG ==================== */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-sm rounded-2xl bg-card border border-border p-6 shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-destructive">
              Retire Vehicle
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to retire vehicle{" "}
              <span className="font-mono font-bold text-foreground">
                {selectedVehicle?.registrationNumber}
              </span>
              ?
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 text-xs text-muted-foreground">
            This action will soft-retire the vehicle by changing its status to{" "}
            <span className="font-semibold text-rose-500 font-mono">RETIRED</span>.
            Retired vehicles are hidden from the Trip Dispatcher.
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteOpen(false)}
              className="rounded-xl py-5"
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={onDeleteConfirm}
              className="rounded-xl py-5"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 size={14} className="mr-2 animate-spin" />
                  Retiring...
                </>
              ) : (
                "Retire Vehicle"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
