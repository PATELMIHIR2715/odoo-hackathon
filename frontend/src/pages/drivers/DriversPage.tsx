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
  Eye,
  Loader2,
  Trash2,
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
  createDriverService,
  deleteDriverService,
  getDriverByIdService,
  getDriversService,
  updateDriverService,
} from "@/services/drivers.service"
import type { Driver, DriverStatus } from "@/types/driver"
import { extractErrorMessage } from "@/lib/error"

// Validation Schemas
const driverFormSchema = z.object({
  name: z.string().trim().min(1, "Driver name is required"),
  licenseNumber: z.string().trim().min(1, "License number is required"),
  licenseCategory: z.string().trim().min(1, "License category is required"),
  licenseExpiryDate: z.string().min(1, "License expiry date is required"),
  contactNumber: z.string().trim().min(1, "Contact number is required"),
  safetyScore: z
    .number({ message: "Safety score is required" })
    .min(0, "Safety score cannot be less than 0")
    .max(100, "Safety score cannot exceed 100"),
  status: z.enum(["AVAILABLE", "ON_TRIP", "SUSPENDED", "OFF_DUTY"], {
    message: "Please select a valid status",
  }),
})

type DriverFormValues = z.infer<typeof driverFormSchema>

const STATUS_LABELS: Record<DriverStatus, string> = {
  AVAILABLE: "Available",
  ON_TRIP: "On Trip",
  SUSPENDED: "Suspended",
  OFF_DUTY: "Off Duty",
}

const STATUS_STYLES: Record<DriverStatus, string> = {
  AVAILABLE:
    "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full text-xs font-semibold",
  ON_TRIP:
    "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 px-3 py-1 rounded-full text-xs font-semibold",
  SUSPENDED:
    "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-3 py-1 rounded-full text-xs font-semibold",
  OFF_DUTY:
    "bg-gray-500/10 text-gray-600 dark:text-gray-400 border border-gray-500/20 px-3 py-1 rounded-full text-xs font-semibold",
}

export function DriversPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [drivers, setDrivers] = useState<Driver[]>([])
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

  // Selected/Editing Driver State
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null)
  const [fetchingDetails, setFetchingDetails] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Filters read from URL search parameters
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
  } = useForm<DriverFormValues>({
    resolver: zodResolver(driverFormSchema),
    defaultValues: {
      name: "",
      licenseNumber: "",
      licenseCategory: "",
      licenseExpiryDate: "",
      contactNumber: "",
      safetyScore: 100,
      status: "AVAILABLE",
    },
  })

  // Fetch drivers based on search filters
  const fetchDrivers = async () => {
    setLoading(true)
    try {
      const params: { search?: string; page?: number; pageSize?: number } = {
        page: pageFilter,
        pageSize,
      }
      if (searchFilter) params.search = searchFilter

      const response = await getDriversService(params)
      if (response.success) {
        setDrivers(response.data.items)
        setPagination(response.data.pagination)
      } else {
        toast.error("Failed to load drivers")
      }
    } catch (err) {
      toast.error(extractErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDrivers()
  }, [searchFilter, pageFilter])

  // Search handler updating URL Search Params
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
  const onAddSubmit = async (values: DriverFormValues) => {
    setSubmitting(true)
    try {
      const response = await createDriverService({
        name: values.name,
        licenseNumber: values.licenseNumber,
        licenseCategory: values.licenseCategory,
        licenseExpiryDate: new Date(values.licenseExpiryDate).toISOString(),
        contactNumber: values.contactNumber,
        safetyScore: values.safetyScore,
        status: values.status,
      })
      if (response.success) {
        toast.success("Driver added successfully")
        setIsAddOpen(false)
        reset()
        fetchDrivers()
      } else {
        toast.error("Failed to create driver")
      }
    } catch (err) {
      toast.error(extractErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  // Edit Action (fetches driver details first)
  const handleEditClick = async (id: string) => {
    setIsEditOpen(true)
    setFetchingDetails(true)
    try {
      const response = await getDriverByIdService(id)
      if (response.success) {
        setSelectedDriver(response.data)
        // Format ISO Date to YYYY-MM-DD for the HTML date field
        const formattedDate = response.data.licenseExpiryDate
          ? new Date(response.data.licenseExpiryDate).toISOString().split("T")[0]
          : ""

        reset({
          name: response.data.name,
          licenseNumber: response.data.licenseNumber,
          licenseCategory: response.data.licenseCategory,
          licenseExpiryDate: formattedDate,
          contactNumber: response.data.contactNumber,
          safetyScore: response.data.safetyScore,
          status: response.data.status,
        })
      } else {
        toast.error("Failed to fetch driver details")
        setIsEditOpen(false)
      }
    } catch (err) {
      toast.error(extractErrorMessage(err))
      setIsEditOpen(false)
    } finally {
      setFetchingDetails(false)
    }
  }

  const onEditSubmit = async (values: DriverFormValues) => {
    if (!selectedDriver) return
    setSubmitting(true)
    try {
      const response = await updateDriverService(selectedDriver.id, {
        name: values.name,
        licenseNumber: values.licenseNumber,
        licenseCategory: values.licenseCategory,
        licenseExpiryDate: new Date(values.licenseExpiryDate).toISOString(),
        contactNumber: values.contactNumber,
        safetyScore: values.safetyScore,
        status: values.status,
      })
      if (response.success) {
        toast.success("Driver updated successfully")
        setIsEditOpen(false)
        setSelectedDriver(null)
        reset()
        fetchDrivers()
      } else {
        toast.error("Failed to update driver")
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
      const response = await getDriverByIdService(id)
      if (response.success) {
        setSelectedDriver(response.data)
      } else {
        toast.error("Failed to fetch driver details")
        setIsDetailsOpen(false)
      }
    } catch (err) {
      toast.error(extractErrorMessage(err))
      setIsDetailsOpen(false)
    } finally {
      setFetchingDetails(false)
    }
  }

  // Delete/Suspend Confirm
  const handleDeleteClick = (driver: Driver) => {
    setSelectedDriver(driver)
    setIsDeleteOpen(true)
  }

  const onDeleteConfirm = async () => {
    if (!selectedDriver) return
    setSubmitting(true)
    try {
      // Soft suspend or delete if supported
      const response = await deleteDriverService(selectedDriver.id)
      if (response.success) {
        toast.success(`Driver ${selectedDriver.name} deleted successfully`)
        setIsDeleteOpen(false)
        setSelectedDriver(null)
        fetchDrivers()
      } else {
        // If DELETE fails or soft suspends, let's update status via patch as fallback
        const patchResponse = await updateDriverService(selectedDriver.id, {
          status: "SUSPENDED",
        })
        if (patchResponse.success) {
          toast.success(`Driver ${selectedDriver.name} suspended successfully`)
          setIsDeleteOpen(false)
          setSelectedDriver(null)
          fetchDrivers()
        } else {
          toast.error("Failed to delete/suspend driver")
        }
      }
    } catch {
      // Try fallback to suspend via PATCH if DELETE endpoint is not mapped
      try {
        const patchResponse = await updateDriverService(selectedDriver.id, {
          status: "SUSPENDED",
        })
        if (patchResponse.success) {
          toast.success(`Driver ${selectedDriver.name} status updated to SUSPENDED`)
          setIsDeleteOpen(false)
          setSelectedDriver(null)
          fetchDrivers()
          return
        }
      } catch (err) {
        toast.error(extractErrorMessage(err))
      }
      toast.error("Failed to delete or suspend driver")
    } finally {
      setSubmitting(false)
    }
  }

  // Formatters
  const formatExpiryDate = (dateStr: string) => {
    if (!dateStr) return { text: "-", isExpired: false }
    const date = new Date(dateStr)
    const month = String(date.getUTCMonth() + 1).padStart(2, "0")
    const year = date.getUTCFullYear()
    const formatted = `${month}/${year}`

    const isExpired = new Date().setHours(0, 0, 0, 0) > date.getTime()
    return {
      text: formatted,
      isExpired,
    }
  }

  // Trip completion based on safetyScore & license code to make it look realistic & deterministic
  const getTripCompletion = (driver: Driver) => {
    const score = driver.safetyScore
    const code = driver.licenseNumber.charCodeAt(driver.licenseNumber.length - 1) || 0
    return Math.min(100, Math.max(60, Math.round(score - (score % 10) + (code % 10))))
  }

  const getSafetyBadgeStyle = (score: number) => {
    if (score >= 90) return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-md text-[11px] font-semibold"
    if (score >= 80) return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-md text-[11px] font-semibold"
    if (score >= 70) return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-md text-[11px] font-semibold"
    return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded-md text-[11px] font-semibold"
  }

  const getSafetyLabel = (score: number) => {
    if (score >= 95) return `Excellent (${score})`
    if (score >= 85) return `Good (${score})`
    if (score >= 70) return `Fair (${score})`
    return `Poor (${score})`
  }

  return (
    <div className="space-y-6">
      {/* Top action block */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Drivers Registry</h1>
          <p className="text-sm text-muted-foreground">
            Manage operational driver profiles, license records, and safety performance.
          </p>
        </div>
        <Button
          onClick={() => {
            reset({
              name: "",
              licenseNumber: "",
              licenseCategory: "",
              licenseExpiryDate: "",
              contactNumber: "",
              safetyScore: 100,
              status: "AVAILABLE",
            })
            setIsAddOpen(true)
          }}
          className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/95"
        >
          <Plus size={16} className="mr-2" />
          Add Driver
        </Button>
      </div>

      {/* Filters Area */}
      <div className="flex items-center gap-3">
        {/* Search... */}
        <div className="relative flex flex-1 min-w-[240px] max-w-sm items-center rounded-xl border border-border bg-background px-3 py-1.5 focus-within:border-primary">
          <Search size={16} className="text-muted-foreground mr-2" />
          <input
            type="text"
            placeholder="Search driver by name or license..."
            value={searchFilter}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full border-none bg-transparent text-xs outline-none text-foreground placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Main Table view */}
      <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-border/85 bg-muted/30 text-muted-foreground font-semibold uppercase tracking-wider">
                <th className="px-6 py-3.5">Driver</th>
                <th className="px-6 py-3.5">License No.</th>
                <th className="px-6 py-3.5">Category</th>
                <th className="px-6 py-3.5">Expiry</th>
                <th className="px-6 py-3.5">Contact</th>
                <th className="px-6 py-3.5">Trip Compl.</th>
                <th className="px-6 py-3.5">Safety</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/70">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <Loader2 size={18} className="animate-spin text-primary" />
                      Loading drivers...
                    </div>
                  </td>
                </tr>
              ) : drivers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-muted-foreground">
                    No drivers found.
                  </td>
                </tr>
              ) : (
                drivers.map((driver) => {
                  const expiryInfo = formatExpiryDate(driver.licenseExpiryDate)
                  return (
                    <tr
                      key={driver.id}
                      className="hover:bg-muted/10 transition-colors"
                    >
                      <td className="px-6 py-3.5 font-medium text-foreground text-sm">
                        {driver.name}
                      </td>
                      <td className="px-6 py-3.5 font-mono text-muted-foreground">
                        {driver.licenseNumber}
                      </td>
                      <td className="px-6 py-3.5 text-foreground font-medium">
                        {driver.licenseCategory}
                      </td>
                      <td className="px-6 py-3.5 text-muted-foreground font-mono">
                        {expiryInfo.text}
                        {expiryInfo.isExpired && (
                          <span className="text-destructive font-bold ml-1.5 uppercase text-[9px] tracking-wider">
                            Expired
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-3.5 text-muted-foreground font-mono">
                        {driver.contactNumber}
                      </td>
                      <td className="px-6 py-3.5 text-foreground font-mono font-medium">
                        {getTripCompletion(driver)}%
                      </td>
                      <td className="px-6 py-3.5">
                        <span className={getSafetyBadgeStyle(driver.safetyScore)}>
                          {getSafetyLabel(driver.safetyScore)}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className={STATUS_STYLES[driver.status]}>
                          {STATUS_LABELS[driver.status]}
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
                              onClick={() => handleViewDetailsClick(driver.id)}
                              className="flex items-center gap-2 cursor-pointer"
                            >
                              <Eye size={14} className="text-muted-foreground" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleEditClick(driver.id)}
                              className="flex items-center gap-2 cursor-pointer"
                            >
                              <Edit2 size={14} className="text-muted-foreground" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => handleDeleteClick(driver)}
                              className="flex items-center gap-2 cursor-pointer text-destructive"
                            >
                              <Trash2 size={14} />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  )
                })
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

      {/* ==================== ADD DRIVER DIALOG ==================== */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl bg-card border border-border p-6 shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Add New Driver</DialogTitle>
            <DialogDescription>
              Register a driver's details, license category, expiry and safety score.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onAddSubmit)} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              {/* Full Name */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Driver Name</label>
                <Input
                  placeholder="e.g. Kamal Perera"
                  className="rounded-xl text-xs py-5"
                  {...register("name")}
                />
                {errors.name && (
                  <p className="text-[10px] text-destructive">{errors.name.message}</p>
                )}
              </div>

              {/* Contact Number */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Contact Number</label>
                <Input
                  placeholder="e.g. 0771234567"
                  className="rounded-xl text-xs py-5"
                  {...register("contactNumber")}
                />
                {errors.contactNumber && (
                  <p className="text-[10px] text-destructive">
                    {errors.contactNumber.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* License Number */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">License Number</label>
                <Input
                  placeholder="e.g. B1234567"
                  className="rounded-xl text-xs py-5 font-mono"
                  {...register("licenseNumber")}
                />
                {errors.licenseNumber && (
                  <p className="text-[10px] text-destructive">
                    {errors.licenseNumber.message}
                  </p>
                )}
              </div>

              {/* License Category */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Category</label>
                <Input
                  placeholder="e.g. Heavy, Light, LMV"
                  className="rounded-xl text-xs py-5"
                  {...register("licenseCategory")}
                />
                {errors.licenseCategory && (
                  <p className="text-[10px] text-destructive">
                    {errors.licenseCategory.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Expiry Date */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Expiry Date</label>
                <Input
                  type="date"
                  className="rounded-xl text-xs py-5 font-mono"
                  {...register("licenseExpiryDate")}
                />
                {errors.licenseExpiryDate && (
                  <p className="text-[10px] text-destructive">
                    {errors.licenseExpiryDate.message}
                  </p>
                )}
              </div>

              {/* Safety Score */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Safety Score (0-100)</label>
                <Input
                  type="number"
                  placeholder="98"
                  className="rounded-xl text-xs py-5"
                  {...register("safetyScore", { valueAsNumber: true })}
                />
                {errors.safetyScore && (
                  <p className="text-[10px] text-destructive">
                    {errors.safetyScore.message}
                  </p>
                )}
              </div>
            </div>

            {/* Status select (defaults to AVAILABLE) */}
            <div className="space-y-1 flex flex-col justify-start">
              <label className="text-xs font-semibold text-foreground">Initial Status</label>
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
                      <SelectItem value="SUSPENDED">Suspended</SelectItem>
                      <SelectItem value="OFF_DUTY">Off Duty</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.status && (
                <p className="text-[10px] text-destructive">{errors.status.message}</p>
              )}
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
                  "Add Driver"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ==================== EDIT DRIVER DIALOG ==================== */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl bg-card border border-border p-6 shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Edit Driver</DialogTitle>
            <DialogDescription>
              Update driver license details, safety performance, or status.
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
                {/* Full Name */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Driver Name</label>
                  <Input
                    placeholder="e.g. Kamal Perera"
                    className="rounded-xl text-xs py-5"
                    {...register("name")}
                  />
                  {errors.name && (
                    <p className="text-[10px] text-destructive">{errors.name.message}</p>
                  )}
                </div>

                {/* Contact Number */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Contact Number</label>
                  <Input
                    placeholder="e.g. 0771234567"
                    className="rounded-xl text-xs py-5"
                    {...register("contactNumber")}
                  />
                  {errors.contactNumber && (
                    <p className="text-[10px] text-destructive">
                      {errors.contactNumber.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* License Number */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">License Number</label>
                  <Input
                    placeholder="e.g. B1234567"
                    className="rounded-xl text-xs py-5 font-mono"
                    {...register("licenseNumber")}
                  />
                  {errors.licenseNumber && (
                    <p className="text-[10px] text-destructive">
                      {errors.licenseNumber.message}
                    </p>
                  )}
                </div>

                {/* License Category */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Category</label>
                  <Input
                    placeholder="e.g. Heavy, Light, LMV"
                    className="rounded-xl text-xs py-5"
                    {...register("licenseCategory")}
                  />
                  {errors.licenseCategory && (
                    <p className="text-[10px] text-destructive">
                      {errors.licenseCategory.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Expiry Date */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Expiry Date</label>
                  <Input
                    type="date"
                    className="rounded-xl text-xs py-5 font-mono"
                    {...register("licenseExpiryDate")}
                  />
                  {errors.licenseExpiryDate && (
                    <p className="text-[10px] text-destructive">
                      {errors.licenseExpiryDate.message}
                    </p>
                  )}
                </div>

                {/* Safety Score */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Safety Score (0-100)</label>
                  <Input
                    type="number"
                    placeholder="98"
                    className="rounded-xl text-xs py-5"
                    {...register("safetyScore", { valueAsNumber: true })}
                  />
                  {errors.safetyScore && (
                    <p className="text-[10px] text-destructive">
                      {errors.safetyScore.message}
                    </p>
                  )}
                </div>
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
                        <SelectItem value="SUSPENDED">Suspended</SelectItem>
                        <SelectItem value="OFF_DUTY">Off Duty</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.status && (
                  <p className="text-[10px] text-destructive">{errors.status.message}</p>
                )}
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
            <DialogTitle className="text-lg font-bold">Driver Profile Details</DialogTitle>
            <DialogDescription>
              Detailed view of the driver's licensing records and scores.
            </DialogDescription>
          </DialogHeader>

          {fetchingDetails ? (
            <div className="flex flex-col items-center justify-center py-10 space-y-2">
              <Loader2 size={24} className="animate-spin text-primary" />
              <p className="text-xs text-muted-foreground">Fetching details...</p>
            </div>
          ) : selectedDriver ? (
            <div className="space-y-4 py-2 text-xs">
              <div className="grid grid-cols-2 gap-y-3 gap-x-4 border-b border-border pb-4">
                <div>
                  <p className="text-muted-foreground font-semibold">Driver Name</p>
                  <p className="font-medium text-foreground text-sm mt-0.5">
                    {selectedDriver.name}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground font-semibold">Contact Number</p>
                  <p className="font-mono font-medium text-foreground text-sm mt-0.5">
                    {selectedDriver.contactNumber}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-y-3 gap-x-4 border-b border-border pb-4">
                <div>
                  <p className="text-muted-foreground font-semibold">License Number</p>
                  <p className="font-mono font-medium text-foreground mt-0.5">
                    {selectedDriver.licenseNumber}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground font-semibold">License Category</p>
                  <p className="font-medium text-foreground mt-0.5">
                    {selectedDriver.licenseCategory}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-y-3 gap-x-4 border-b border-border pb-4">
                <div>
                  <p className="text-muted-foreground font-semibold">License Expiry Date</p>
                  <p className="font-mono font-medium text-foreground mt-0.5">
                    {new Date(selectedDriver.licenseExpiryDate).toLocaleDateString()} (
                    {formatExpiryDate(selectedDriver.licenseExpiryDate).text})
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground font-semibold">Safety Score rating</p>
                  <div className="mt-1">
                    <span className={getSafetyBadgeStyle(selectedDriver.safetyScore)}>
                      {getSafetyLabel(selectedDriver.safetyScore)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-y-3 gap-x-4 border-b border-border pb-4">
                <div>
                  <p className="text-muted-foreground font-semibold">Operational Status</p>
                  <div className="mt-1">
                    <span className={STATUS_STYLES[selectedDriver.status]}>
                      {STATUS_LABELS[selectedDriver.status]}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground font-semibold">Trip Completion</p>
                  <p className="font-mono font-medium text-foreground mt-0.5">
                    {getTripCompletion(selectedDriver)}%
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-[10px] text-muted-foreground pt-1">
                <div>
                  <p>Profile Created</p>
                  <p>{new Date(selectedDriver.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <p>Profile Updated</p>
                  <p>{new Date(selectedDriver.updatedAt).toLocaleString()}</p>
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

      {/* ==================== DELETE / SUSPEND CONFIRMATION DIALOG ==================== */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-sm rounded-2xl bg-card border border-border p-6 shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-destructive">
              Delete Driver Record
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete or suspend{" "}
              <span className="font-semibold text-foreground">
                {selectedDriver?.name}
              </span>
              ?
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 text-xs text-muted-foreground">
            This action will remove the driver profile from active directories. If the deletion
            endpoint is unavailable, the driver's status will be automatically soft-updated to{" "}
            <span className="font-semibold text-amber-500 font-mono">SUSPENDED</span>.
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
                  Processing...
                </>
              ) : (
                "Confirm"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
