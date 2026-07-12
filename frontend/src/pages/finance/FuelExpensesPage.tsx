import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import {
  Plus,
  Loader2,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Droplet,
  FileText,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import {
  createExpenseService,
  createFuelLogService,
  getExpensesService,
  getFuelLogsService,
} from "@/services/finance.service"
import { getVehiclesService } from "@/services/vehicles.service"
import { getTripsService } from "@/services/trips.service"

import type { FuelLog, Expense } from "@/types/finance"
import type { Vehicle } from "@/types/vehicle"
import type { Trip } from "@/types/trip"
import { extractErrorMessage } from "@/lib/error"

// Validation Schemas
const fuelLogSchema = z.object({
  vehicleId: z.string().trim().min(1, "Vehicle is required"),
  liters: z.number({ message: "Liters are required" }).positive("Liters must be greater than 0"),
  cost: z.number({ message: "Cost is required" }).positive("Cost must be greater than 0"),
  date: z.string().min(1, "Date is required"),
})

type FuelLogFormValues = z.infer<typeof fuelLogSchema>

const expenseSchema = z.object({
  vehicleId: z.string().trim().min(1, "Vehicle is required"),
  type: z.enum(["TOLL", "MAINTENANCE", "OTHER"], { message: "Invalid type selection" }),
  amount: z.number({ message: "Amount is required" }).positive("Amount must be greater than 0"),
  note: z.string().trim().min(1, "Note description is required"),
  date: z.string().min(1, "Date is required"),
})

type ExpenseFormValues = z.infer<typeof expenseSchema>

export function FuelExpensesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState<"summary" | "fuel" | "expenses">("summary")

  // Paginated Data Lists
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [trips, setTrips] = useState<Trip[]>([])

  // Loaders
  const [loading, setLoading] = useState(true)
  const [loadingOptions, setLoadingOptions] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Pagination Metadata
  const [fuelPagination, setFuelPagination] = useState<{
    page: number
    pageSize: number
    total: number
    totalPages: number
  } | null>(null)

  const [expensePagination, setExpensePagination] = useState<{
    page: number
    pageSize: number
    total: number
    totalPages: number
  } | null>(null)

  // Dialog open triggers
  const [isFuelOpen, setIsFuelOpen] = useState(false)
  const [isExpenseOpen, setIsExpenseOpen] = useState(false)

  // Options list
  const [vehiclesOptions, setVehiclesOptions] = useState<Vehicle[]>([])

  // Filters read from URL
  const pageFilter = Number(searchParams.get("page")) || 1

  // Forms
  const {
    register: registerFuel,
    handleSubmit: handleSubmitFuel,
    control: controlFuel,
    reset: resetFuel,
    formState: { errors: errorsFuel },
  } = useForm<FuelLogFormValues>({
    resolver: zodResolver(fuelLogSchema),
    defaultValues: {
      vehicleId: "",
      liters: 0,
      cost: 0,
      date: new Date().toISOString().split("T")[0],
    },
  })

  const {
    register: registerExpense,
    handleSubmit: handleSubmitExpense,
    control: controlExpense,
    reset: resetExpense,
    formState: { errors: errorsExpense },
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      vehicleId: "",
      type: "TOLL",
      amount: 0,
      note: "",
      date: new Date().toISOString().split("T")[0],
    },
  })

  // Load lists
  const fetchData = async () => {
    setLoading(true)
    try {
      // 1. Fetch paginated logs based on current page
      const fuelRes = await getFuelLogsService({ page: activeTab === "fuel" ? pageFilter : 1, pageSize: 100 })
      const expRes = await getExpensesService({ page: activeTab === "expenses" ? pageFilter : 1, pageSize: 100 })
      const tripsRes = await getTripsService({ page: 1, pageSize: 100 })

      if (fuelRes.success) {
        setFuelLogs(fuelRes.data.items)
        setFuelPagination(fuelRes.data.pagination)
      }
      if (expRes.success) {
        setExpenses(expRes.data.items)
        setExpensePagination(expRes.data.pagination)
      }
      if (tripsRes.success) {
        setTrips(tripsRes.data.items)
      }
    } catch (err) {
      toast.error(extractErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  // Load vehicles excluding retired ones for log options
  const fetchVehiclesOptions = async () => {
    setLoadingOptions(true)
    try {
      const response = await getVehiclesService({ pageSize: 100 })
      if (response.success) {
        const activeVehicles = response.data.items.filter((v) => v.status !== "RETIRED")
        setVehiclesOptions(activeVehicles)
      }
    } catch (err) {
      toast.error("Failed to fetch vehicles list options")
    } finally {
      setLoadingOptions(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [activeTab, pageFilter])

  useEffect(() => {
    if (isFuelOpen || isExpenseOpen) {
      fetchVehiclesOptions()
    }
  }, [isFuelOpen, isExpenseOpen])

  // Reset page parameter on Tab changes
  const handleTabChange = (tab: "summary" | "fuel" | "expenses") => {
    setSearchParams((prev) => {
      prev.delete("page")
      return prev
    })
    setActiveTab(tab)
  }

  // Page selection
  const handlePageChange = (newPage: number) => {
    setSearchParams((prev) => {
      prev.set("page", String(newPage))
      return prev
    })
  }

  // Log Fuel Action
  const onFuelSubmit = async (values: FuelLogFormValues) => {
    setSubmitting(true)
    try {
      const response = await createFuelLogService({
        vehicleId: values.vehicleId,
        liters: values.liters,
        cost: values.cost,
        date: new Date(values.date).toISOString(),
      })
      if (response.success) {
        toast.success("Fuel log added successfully")
        setIsFuelOpen(false)
        resetFuel({
          vehicleId: "",
          liters: 0,
          cost: 0,
          date: new Date().toISOString().split("T")[0],
        })
        fetchData()
      } else {
        toast.error("Failed to create fuel log")
      }
    } catch (err) {
      toast.error(extractErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  // Add Expense Action
  const onExpenseSubmit = async (values: ExpenseFormValues) => {
    setSubmitting(true)
    try {
      const response = await createExpenseService({
        vehicleId: values.vehicleId,
        type: values.type,
        amount: values.amount,
        note: values.note,
        date: new Date(values.date).toISOString(),
      })
      if (response.success) {
        toast.success("Expense record logged successfully")
        setIsExpenseOpen(false)
        resetExpense({
          vehicleId: "",
          type: "TOLL",
          amount: 0,
          note: "",
          date: new Date().toISOString().split("T")[0],
        })
        fetchData()
      } else {
        toast.error("Failed to log expense")
      }
    } catch (err) {
      toast.error(extractErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  // Dynamic cost calculations
  const totalFuelCostVal = fuelLogs.reduce((acc, item) => acc + item.cost, 0)
  const totalExpensesCostVal = expenses.reduce((acc, item) => acc + item.amount, 0)
  const totalOperationalCost = totalFuelCostVal + totalExpensesCostVal

  // Formatting Date values
  const formatShortDate = (isoDate: string) => {
    const d = new Date(isoDate)
    const day = String(d.getDate()).padStart(2, "0")
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const month = months[d.getMonth()]
    const year = d.getFullYear()
    return `${day} ${month} ${year}`
  }

  return (
    <div className="space-y-6">
      {/* Top action block */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Fuel & Expenses</h1>
          <p className="text-sm text-muted-foreground">
            Track vehicle refueling entries, monitor tolls, and analyze fleet maintenance costs.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => {
              resetFuel({
                vehicleId: "",
                liters: 0,
                cost: 0,
                date: new Date().toISOString().split("T")[0],
              })
              setIsFuelOpen(true)
            }}
            className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/95 py-5"
          >
            <Plus size={16} className="mr-2" />
            Log Fuel
          </Button>
          <Button
            onClick={() => {
              resetExpense({
                vehicleId: "",
                type: "TOLL",
                amount: 0,
                note: "",
                date: new Date().toISOString().split("T")[0],
              })
              setIsExpenseOpen(true)
            }}
            className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white py-5"
          >
            <Plus size={16} className="mr-2" />
            Add Expense
          </Button>
        </div>
      </div>

      {/* Tabs Menu Navigation */}
      <div className="flex border-b border-border/80 gap-6 text-sm">
        <button
          onClick={() => handleTabChange("summary")}
          className={`pb-3 font-semibold transition-colors flex items-center gap-1.5 ${
            activeTab === "summary" ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <DollarSign size={16} />
          Operational Overview
        </button>
        <button
          onClick={() => handleTabChange("fuel")}
          className={`pb-3 font-semibold transition-colors flex items-center gap-1.5 ${
            activeTab === "fuel" ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Droplet size={16} />
          Fuel Logs
        </button>
        <button
          onClick={() => handleTabChange("expenses")}
          className={`pb-3 font-semibold transition-colors flex items-center gap-1.5 ${
            activeTab === "expenses" ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <FileText size={16} />
          Expense Logs
        </button>
      </div>

      {/* TAB 1: SUMMARY DASHBOARD (MATCHING THE SCREENSHOT EXACTLY) */}
      {activeTab === "summary" && (
        <div className="space-y-8">
          {/* Section 1: Fuel Logs table */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Fuel Logs
            </h2>
            <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-border/85 bg-muted/30 text-muted-foreground font-semibold uppercase tracking-wider">
                      <th className="px-6 py-3.5">Vehicle</th>
                      <th className="px-6 py-3.5">Date</th>
                      <th className="px-6 py-3.5">Liters</th>
                      <th className="px-6 py-3.5 text-right">Fuel Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/70">
                    {loading ? (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-muted-foreground">
                          Loading fuel logs...
                        </td>
                      </tr>
                    ) : fuelLogs.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-muted-foreground">
                          No refueling records logged.
                        </td>
                      </tr>
                    ) : (
                      fuelLogs.slice(0, 5).map((log) => (
                        <tr key={log.id} className="hover:bg-muted/10 transition-colors">
                          <td className="px-6 py-3.5 font-semibold text-foreground">
                            {log.vehicle?.name || "Unknown Vehicle"}
                          </td>
                          <td className="px-6 py-3.5 text-muted-foreground">
                            {formatShortDate(log.date)}
                          </td>
                          <td className="px-6 py-3.5 text-muted-foreground font-mono">
                            {log.liters} L
                          </td>
                          <td className="px-6 py-3.5 text-right font-mono font-semibold text-foreground">
                            ₹{log.cost.toLocaleString("en-IN")}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Section 2: Other Expenses table */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Other Expenses (Toll / Misc)
            </h2>
            <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-border/85 bg-muted/30 text-muted-foreground font-semibold uppercase tracking-wider">
                      <th className="px-6 py-3.5">Trip</th>
                      <th className="px-6 py-3.5">Vehicle</th>
                      <th className="px-6 py-3.5 text-right">Toll</th>
                      <th className="px-6 py-3.5 text-right">Other</th>
                      <th className="px-6 py-3.5 text-right">Maint. (Linked)</th>
                      <th className="px-6 py-3.5 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/70">
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-muted-foreground">
                          Loading expenses...
                        </td>
                      </tr>
                    ) : trips.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-muted-foreground">
                          No operational trip expenses found.
                        </td>
                      </tr>
                    ) : (
                      trips.slice(0, 5).map((trip, idx) => {
                        // Calculate sums for this vehicle
                        const tollVal = expenses
                          .filter((e) => e.vehicleId === trip.vehicleId && e.type === "TOLL")
                          .reduce((sum, e) => sum + e.amount, 0)
                        const otherVal = expenses
                          .filter((e) => e.vehicleId === trip.vehicleId && e.type === "OTHER")
                          .reduce((sum, e) => sum + e.amount, 0)
                        const maintVal = expenses
                          .filter((e) => e.vehicleId === trip.vehicleId && e.type === "MAINTENANCE")
                          .reduce((sum, e) => sum + e.amount, 0)

                        // Status styling
                        const isCompleted = trip.status === "COMPLETED"
                        const statusBadgeClass = isCompleted
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full text-[10px] font-semibold"
                          : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 px-2.5 py-0.5 rounded-full text-[10px] font-semibold"

                        return (
                          <tr key={trip.id} className="hover:bg-muted/10 transition-colors">
                            <td className="px-6 py-3.5 font-mono font-medium text-foreground">
                              TR{String(idx + 1).padStart(3, "0")}
                            </td>
                            <td className="px-6 py-3.5 font-semibold text-foreground">
                              {trip.vehicle?.name || "Unknown"}
                            </td>
                            <td className="px-6 py-3.5 text-right font-mono text-muted-foreground">
                              {tollVal > 0 ? `₹${tollVal.toLocaleString("en-IN")}` : "0"}
                            </td>
                            <td className="px-6 py-3.5 text-right font-mono text-muted-foreground">
                              {otherVal > 0 ? `₹${otherVal.toLocaleString("en-IN")}` : "0"}
                            </td>
                            <td className="px-6 py-3.5 text-right font-mono text-muted-foreground">
                              {maintVal > 0 ? `₹${maintVal.toLocaleString("en-IN")}` : "0"}
                            </td>
                            <td className="px-6 py-3.5 text-right">
                              <span className={statusBadgeClass}>
                                {isCompleted ? "Completed" : "Available"}
                              </span>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Total Operational Summary Box Footer */}
              <div className="flex items-center justify-between border-t border-border/80 bg-muted/20 px-6 py-4.5">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Total Operational Cost (Auto) = Fuel + Maintenance
                </span>
                <span className="font-mono text-base font-bold text-amber-500">
                  ₹{totalOperationalCost.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: RAW FUEL LOGS LIST */}
      {activeTab === "fuel" && (
        <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-border/85 bg-muted/30 text-muted-foreground font-semibold uppercase tracking-wider">
                  <th className="px-6 py-3.5">Log ID</th>
                  <th className="px-6 py-3.5">Vehicle</th>
                  <th className="px-6 py-3.5">Date</th>
                  <th className="px-6 py-3.5">Liters</th>
                  <th className="px-6 py-3.5 text-right">Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/70">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground">
                      Loading...
                    </td>
                  </tr>
                ) : fuelLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground">
                      No fuel log records found.
                    </td>
                  </tr>
                ) : (
                  fuelLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-muted/10 transition-colors">
                      <td className="px-6 py-3.5 font-mono text-muted-foreground">
                        {log.id.substring(0, 8)}...
                      </td>
                      <td className="px-6 py-3.5 font-semibold text-foreground">
                        {log.vehicle?.name || "Unknown"} ({log.vehicle?.registrationNumber || "No Reg"})
                      </td>
                      <td className="px-6 py-3.5 text-muted-foreground">
                        {new Date(log.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-3.5 text-muted-foreground font-mono">{log.liters} L</td>
                      <td className="px-6 py-3.5 text-right font-mono font-semibold text-foreground">
                        ₹{log.cost.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {fuelPagination && fuelPagination.total > 0 && (
            <div className="flex items-center justify-between border-t border-border/80 bg-muted/5 px-6 py-3.5 text-xs">
              <span className="text-muted-foreground font-medium">
                Showing {(fuelPagination.page - 1) * fuelPagination.pageSize + 1} -{" "}
                {Math.min(fuelPagination.page * fuelPagination.pageSize, fuelPagination.total)} of{" "}
                {fuelPagination.total} entries
              </span>
              {fuelPagination.totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon-xs"
                    className="rounded-lg hover:bg-muted"
                    disabled={fuelPagination.page <= 1}
                    onClick={() => handlePageChange(fuelPagination.page - 1)}
                  >
                    <ChevronLeft size={14} />
                  </Button>
                  <span className="text-muted-foreground select-none font-medium px-1">
                    Page {fuelPagination.page} of {fuelPagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="icon-xs"
                    className="rounded-lg hover:bg-muted"
                    disabled={fuelPagination.page >= fuelPagination.totalPages}
                    onClick={() => handlePageChange(fuelPagination.page + 1)}
                  >
                    <ChevronRight size={14} />
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: RAW EXPENSES LIST */}
      {activeTab === "expenses" && (
        <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-border/85 bg-muted/30 text-muted-foreground font-semibold uppercase tracking-wider">
                  <th className="px-6 py-3.5">Log ID</th>
                  <th className="px-6 py-3.5">Vehicle</th>
                  <th className="px-6 py-3.5">Date</th>
                  <th className="px-6 py-3.5">Type</th>
                  <th className="px-6 py-3.5">Note/Description</th>
                  <th className="px-6 py-3.5 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/70">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground">
                      Loading...
                    </td>
                  </tr>
                ) : expenses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground">
                      No expense records found.
                    </td>
                  </tr>
                ) : (
                  expenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-muted/10 transition-colors">
                      <td className="px-6 py-3.5 font-mono text-muted-foreground">
                        {exp.id.substring(0, 8)}...
                      </td>
                      <td className="px-6 py-3.5 font-semibold text-foreground">
                        {exp.vehicle?.name || "Unknown"} ({exp.vehicle?.registrationNumber || "No Reg"})
                      </td>
                      <td className="px-6 py-3.5 text-muted-foreground">
                        {new Date(exp.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="font-semibold text-foreground uppercase tracking-wide text-[10px]">
                          {exp.type}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-foreground max-w-xs truncate">
                        {exp.note}
                      </td>
                      <td className="px-6 py-3.5 text-right font-mono font-semibold text-foreground">
                        ₹{exp.amount.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {expensePagination && expensePagination.total > 0 && (
            <div className="flex items-center justify-between border-t border-border/80 bg-muted/5 px-6 py-3.5 text-xs">
              <span className="text-muted-foreground font-medium">
                Showing {(expensePagination.page - 1) * expensePagination.pageSize + 1} -{" "}
                {Math.min(expensePagination.page * expensePagination.pageSize, expensePagination.total)} of{" "}
                {expensePagination.total} entries
              </span>
              {expensePagination.totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon-xs"
                    className="rounded-lg hover:bg-muted"
                    disabled={expensePagination.page <= 1}
                    onClick={() => handlePageChange(expensePagination.page - 1)}
                  >
                    <ChevronLeft size={14} />
                  </Button>
                  <span className="text-muted-foreground select-none font-medium px-1">
                    Page {expensePagination.page} of {expensePagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="icon-xs"
                    className="rounded-lg hover:bg-muted"
                    disabled={expensePagination.page >= expensePagination.totalPages}
                    onClick={() => handlePageChange(expensePagination.page + 1)}
                  >
                    <ChevronRight size={14} />
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ==================== LOG FUEL DIALOG ==================== */}
      <Dialog open={isFuelOpen} onOpenChange={setIsFuelOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl bg-card border border-border p-6 shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Droplet className="text-primary" />
              Log Vehicle Fuel Refueling
            </DialogTitle>
            <DialogDescription>
              Record the liters and cost logged during vehicle refueling.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitFuel(onFuelSubmit)} className="space-y-4 py-2">
            {/* Vehicle Selector */}
            <div className="space-y-1 flex flex-col justify-start">
              <label className="text-xs font-semibold text-foreground">Select Vehicle</label>
              <Controller
                control={controlFuel}
                name="vehicleId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full rounded-xl text-xs py-5">
                      <SelectValue placeholder="Choose a Vehicle">
                        {field.value && vehiclesOptions.find((v) => v.id === field.value)
                          ? (() => {
                              const v = vehiclesOptions.find((v) => v.id === field.value)!
                              return `${v.name} (${v.registrationNumber})`
                            })()
                          : undefined}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {loadingOptions ? (
                        <SelectItem value="_loading" disabled>
                          Loading options...
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
              {errorsFuel.vehicleId && (
                <p className="text-[10px] text-destructive">{errorsFuel.vehicleId.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Liters */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Liters (L)</label>
                <Input
                  type="number"
                  step="any"
                  placeholder="e.g. 20"
                  className="rounded-xl text-xs py-5"
                  {...registerFuel("liters", { valueAsNumber: true })}
                />
                {errorsFuel.liters && (
                  <p className="text-[10px] text-destructive">{errorsFuel.liters.message}</p>
                )}
              </div>

              {/* Fuel Cost */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Fuel Cost (₹)</label>
                <Input
                  type="number"
                  placeholder="e.g. 6000"
                  className="rounded-xl text-xs py-5"
                  {...registerFuel("cost", { valueAsNumber: true })}
                />
                {errorsFuel.cost && (
                  <p className="text-[10px] text-destructive">{errorsFuel.cost.message}</p>
                )}
              </div>
            </div>

            {/* Date */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Refueling Date</label>
              <Input
                type="date"
                className="rounded-xl text-xs py-5"
                {...registerFuel("date")}
              />
              {errorsFuel.date && (
                <p className="text-[10px] text-destructive">{errorsFuel.date.message}</p>
              )}
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsFuelOpen(false)}
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
                  "Log Refueling"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ==================== ADD EXPENSE DIALOG ==================== */}
      <Dialog open={isExpenseOpen} onOpenChange={setIsExpenseOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl bg-card border border-border p-6 shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <DollarSign className="text-amber-500" />
              Log Other Operation Expense
            </DialogTitle>
            <DialogDescription>
              Record toll charges, miscellaneous expenses, or manual maintenance costs.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitExpense(onExpenseSubmit)} className="space-y-4 py-2">
            {/* Vehicle Selector */}
            <div className="space-y-1 flex flex-col justify-start">
              <label className="text-xs font-semibold text-foreground">Select Vehicle</label>
              <Controller
                control={controlExpense}
                name="vehicleId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full rounded-xl text-xs py-5">
                      <SelectValue placeholder="Choose a Vehicle">
                        {field.value && vehiclesOptions.find((v) => v.id === field.value)
                          ? (() => {
                              const v = vehiclesOptions.find((v) => v.id === field.value)!
                              return `${v.name} (${v.registrationNumber})`
                            })()
                          : undefined}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {loadingOptions ? (
                        <SelectItem value="_loading" disabled>
                          Loading options...
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
              {errorsExpense.vehicleId && (
                <p className="text-[10px] text-destructive">{errorsExpense.vehicleId.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Type selector */}
              <div className="space-y-1 flex flex-col justify-start">
                <label className="text-xs font-semibold text-foreground">Expense Type</label>
                <Controller
                  control={controlExpense}
                  name="type"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full rounded-xl text-xs py-5">
                        <SelectValue placeholder="Choose Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TOLL">Toll Charge</SelectItem>
                        <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                        <SelectItem value="OTHER">Other / Misc</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errorsExpense.type && (
                  <p className="text-[10px] text-destructive">{errorsExpense.type.message}</p>
                )}
              </div>

              {/* Amount */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Amount (₹)</label>
                <Input
                  type="number"
                  placeholder="e.g. 250"
                  className="rounded-xl text-xs py-5"
                  {...registerExpense("amount", { valueAsNumber: true })}
                />
                {errorsExpense.amount && (
                  <p className="text-[10px] text-destructive">{errorsExpense.amount.message}</p>
                )}
              </div>
            </div>

            {/* Note / Description */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Note / Reference</label>
              <Input
                placeholder="e.g. Ahmedabad Expressway Toll"
                className="rounded-xl text-xs py-5"
                {...registerExpense("note")}
              />
              {errorsExpense.note && (
                <p className="text-[10px] text-destructive">{errorsExpense.note.message}</p>
              )}
            </div>

            {/* Date */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Expense Date</label>
              <Input
                type="date"
                className="rounded-xl text-xs py-5"
                {...registerExpense("date")}
              />
              {errorsExpense.date && (
                <p className="text-[10px] text-destructive">{errorsExpense.date.message}</p>
              )}
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsExpenseOpen(false)}
                className="rounded-xl py-5"
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white py-5"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 size={14} className="mr-2 animate-spin" />
                    Logging...
                  </>
                ) : (
                  "Log Expense"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
