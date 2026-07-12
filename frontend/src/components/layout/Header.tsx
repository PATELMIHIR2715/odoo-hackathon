import { LogOut } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { AuthUser } from "@/types/auth"

type HeaderProps = {
  user: AuthUser | null
  onLogout: () => void
}

export function Header({ user, onLogout }: HeaderProps) {
  return (
    <header className="flex items-center justify-between border-b border-border/80 bg-background px-4 py-4 sm:px-6 lg:px-8">
      <div>
        <p className="text-sm font-medium text-muted-foreground">Welcome back</p>
        <h2 className="text-lg font-semibold tracking-tight">{user?.fullName ?? "Fleet Manager"}</h2>
      </div>

      <Button variant="outline" onClick={onLogout} className="rounded-full">
        <LogOut size={16} className="mr-2" />
        Logout
      </Button>
    </header>
  )
}
