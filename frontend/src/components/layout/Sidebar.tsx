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
      <div className="mb-8 flex items-center gap-3.5 select-none">
        {/* Modern styled logo mark */}
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary to-purple-500 text-white shadow-md shadow-primary/20">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5.5 w-5.5"
          >
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </div>

        {/* Brand name and description */}
        <div className="flex flex-col">
          <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
            FleetOS
          </span>
          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
            Control Center
          </span>
        </div>
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
