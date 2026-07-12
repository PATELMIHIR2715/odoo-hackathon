import { useAuthStore } from "@/store/auth.store"

export function DashboardPage() {
  const user = useAuthStore((state) => state.user)

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-2xl rounded-3xl border border-border/80 bg-card p-8 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-muted-foreground">Dashboard</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Welcome, {user?.fullName ?? "there"}</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Your authentication foundation is now active and ready for future modules.
        </p>
      </div>
    </div>
  )
}
