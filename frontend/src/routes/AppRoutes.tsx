import { Navigate, Route, Routes } from "react-router-dom"

import { AppLayout } from "@/components/layout/AppLayout"
import { ProtectedRoute } from "@/routes/ProtectedRoute"
import { DashboardPage } from "@/pages/dashboard/DashboardPage"
import { AnalyticsPage } from "@/pages/analytics/AnalyticsPage"
import { VehiclesPage } from "@/pages/vehicles/VehiclesPage"
import { DriversPage } from "@/pages/drivers/DriversPage"
import { TripsPage } from "@/pages/trips/TripsPage"
import { MaintenancePage } from "@/pages/maintenance/MaintenancePage"
import { SettingsPage } from "@/pages/settings/SettingsPage"
import { FuelExpensesPage } from "@/pages/finance/FuelExpensesPage"
import { AnalyticsPage } from "@/pages/analytics/AnalyticsPage"
import { LoginPage } from "@/pages/auth/LoginPage"
import { useAuthStore } from "@/store/auth.store"

export function AppRoutes() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const isLoading = useAuthStore((state) => state.isLoading)

  if (isLoading) {
    return null
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />}
      />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/fleet" element={<VehiclesPage />} />
          <Route path="/drivers" element={<DriversPage />} />
          <Route path="/trips" element={<TripsPage />} />
          <Route path="/maintenance" element={<MaintenancePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/fuel-expenses" element={<FuelExpensesPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
    </Routes>
  )
}
