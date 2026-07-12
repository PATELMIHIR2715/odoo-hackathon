import { LogOut, Sun, Moon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useTheme } from "@/components/theme-provider"
import type { AuthUser } from "@/types/auth"

type HeaderProps = {
  user: AuthUser | null
  onLogout: () => void
}

export function Header({ user, onLogout }: HeaderProps) {
  const { theme, setTheme } = useTheme()

  // Get initials from user's full name
  const initials = user?.fullName
    ? user.fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase()
    : "FM"

  const formatRole = (r?: string) => {
    if (!r) return "Manager"
    return r.charAt(0) + r.slice(1).toLowerCase()
  }

  return (
    <header className="flex items-center justify-between border-b border-border/80 bg-background/95 backdrop-blur-sm px-6 py-4.5 shadow-sm">
      {/* User profile layout */}
      <div className="flex items-center gap-3.5">
        {/* Initials profile placeholder image circle */}
        <div className="flex h-11 w-11 shrink-0 select-none items-center justify-center rounded-2xl bg-primary/10 text-primary font-bold text-sm border border-primary/20 shadow-inner">
          {initials}
        </div>

        {/* Text information */}
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold tracking-tight text-foreground">
              {user?.fullName ?? "Fleet Manager"}
            </h2>
            <span className="bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider">
              {formatRole(user?.role)}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {user?.email ?? "operations@fleetos.com"}
          </p>
        </div>
      </div>

      {/* Right controls layout (Theme switcher + Logout button) */}
      <div className="flex items-center gap-2.5">
        {/* Toggle Theme button switcher */}
        <Button
          variant="ghost"
          size="icon-xs"
          className="rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
        </Button>

        {/* Action Logout button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onLogout}
          className="rounded-xl border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-all duration-200"
        >
          <LogOut size={14} className="mr-1.5" />
          Logout
        </Button>
      </div>
    </header>
  )
}
export default Header
