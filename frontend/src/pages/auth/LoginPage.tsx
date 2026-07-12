import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useNavigate } from "react-router-dom"
import { Eye, EyeOff, Lock, UserCircle } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/store/auth.store"
import { extractErrorMessage } from "@/lib/error"

import { UI_CONSTANTS } from "@/constants/ui"

const loginSchema = z.object({
  email: z.string().trim().email(UI_CONSTANTS.AUTH.VALIDATION.EMAIL_INVALID),
  password: z.string().min(1, UI_CONSTANTS.AUTH.VALIDATION.PASSWORD_REQUIRED),
})

type LoginFormValues = z.infer<typeof loginSchema>

export function LoginPage() {
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const onSubmit = async (values: LoginFormValues) => {
    setIsSubmitting(true)

    try {
      await login(values)
      toast.success(UI_CONSTANTS.AUTH.WELCOME_BACK)
      navigate("/dashboard", { replace: true })
    } catch (error) {
      toast.error(extractErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Lock size={28} />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">{UI_CONSTANTS.AUTH.SIGN_IN_TITLE}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {UI_CONSTANTS.AUTH.SIGN_IN_SUBTITLE}
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="email">
              {UI_CONSTANTS.AUTH.EMAIL_LABEL}
            </label>
            <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 focus-within:border-primary">
              <UserCircle size={18} className="text-muted-foreground" />
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder={UI_CONSTANTS.AUTH.EMAIL_PLACEHOLDER}
                className="w-full border-none bg-transparent text-sm outline-none"
                {...register("email")}
              />
            </div>
            {errors.email ? <p className="text-sm text-destructive">{errors.email.message}</p> : null}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="password">
              {UI_CONSTANTS.AUTH.PASSWORD_LABEL}
            </label>
            <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 focus-within:border-primary">
              <Lock size={18} className="text-muted-foreground" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder={UI_CONSTANTS.AUTH.PASSWORD_PLACEHOLDER}
                className="w-full border-none bg-transparent text-sm outline-none"
                {...register("password")}
              />
              <button
                type="button"
                className="text-muted-foreground transition hover:text-foreground"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password ? <p className="text-sm text-destructive">{errors.password.message}</p> : null}
          </div>

          <Button className="w-full rounded-xl py-6 text-sm font-semibold" type="submit" disabled={isSubmitting}>
            {isSubmitting ? UI_CONSTANTS.AUTH.SIGNING_IN_BUTTON : UI_CONSTANTS.AUTH.SIGN_IN_BUTTON}
          </Button>
        </form>
      </div>
    </div>
  )
}
