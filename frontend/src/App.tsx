import { useEffect } from "react"
import { Toaster } from "sonner"

import { AppRoutes } from "@/routes/AppRoutes"
import { useAuthStore } from "@/store/auth.store"

export function App() {
  const initializeAuth = useAuthStore((state) => state.initializeAuth)

  useEffect(() => {
    initializeAuth()
  }, [initializeAuth])

  return (
    <>
      <AppRoutes />
      <Toaster richColors position="top-right" />
    </>
  )
}

export default App
