import { NavLink } from "react-router-dom"
import { House, Truck, Users, Route, Wrench, DollarSign, BarChart3, Settings } from "lucide-react"

import { MODULES } from "@/constants/modules"
import { hasModuleAccess } from "@/lib/permissions"
import { useAuthStore } from "@/store/auth.store"

const navigationItems = [
  { title: "Dashboard", icon: House, path: "/dashboard", module: MODULES.DASHBOARD },
  { title: "Vehicles", icon: Truck, path: "/fleet", module: MODULES.VEHICLES },
  { title: "Drivers", icon: Users, path: "/drivers", module: MODULES.DRIVERS },
  { title: "Trips", icon: Route, path: "/trips", module: MODULES.TRIPS },
  { title: "Maintenance", icon: Wrench, path: "/maintenance", module: MODULES.MAINTENANCE },
  { title: "Fuel & Expenses", icon: DollarSign, path: "/fuel-expenses", module: MODULES.FUEL_AND_EXPENSES },
  { title: "Analytics", icon: BarChart3, path: "/analytics", module: MODULES.ANALYTICS },
  { title: "Settings", icon: Settings, path: "/settings", module: MODULES.SETTINGS },
] as const

export function Sidebar() {
  const user = useAuthStore((state) => state.user)

  return (
    <aside className="hidden w-72 flex-col border-r border-border/80 bg-background p-6 lg:flex">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.35em] text-primary">FleetOS</p>
        <p className="mt-2 text-sm text-muted-foreground">Operations control center</p>
      </div>

      <nav className="space-y-1">
        {navigationItems.map(({ title, icon: Icon, path, module }) => {
          const visible = hasModuleAccess(user, module)
          if (!visible) {
            return null
          }

          return (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                [
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                ].join(" ")
              }
            >
              <Icon size={18} />
              <span>{title}</span>
            </NavLink>
          )
        })}
      </nav>
    </aside>
  )
}
