import { useCallback, useEffect, useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import {
  Building2,
  Check,
  Edit3,
  Loader2,
  RefreshCcw,
  Save,
  ShieldCheck,
  Users,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { ModuleName } from "@/constants/modules"
import { extractErrorMessage } from "@/lib/error"
import { useAuthStore } from "@/store/auth.store"
import { getOrganizationSettingsService, getSettingsRbacService, updateOrganizationSettingsService, updateSettingsRbacService } from "@/services/settings.service"
import type { AppRole, OrganizationSettings, SettingsProfile, SettingsRbacData } from "@/types/settings"

const organizationSettingsSchema = z.object({
  orgName: z.string().trim().min(2, "Organization name is required"),
  depotName: z.string().trim().min(2, "Depot name is required"),
  currency: z.string().trim().min(2, "Currency is required").max(8, "Currency code is too long"),
  distanceUnit: z.string().trim().min(1, "Distance unit is required").max(10, "Distance unit is too long"),
  timezone: z.string().trim().min(2, "Timezone is required").max(64, "Timezone is too long"),
  contactEmail: z.string().trim().optional(),
  contactPhone: z.string().trim().optional(),
  address: z.string().trim().optional(),
})

type OrganizationSettingsFormValues = z.infer<typeof organizationSettingsSchema>

const ROLE_OPTIONS: { label: string; value: AppRole }[] = [
  { label: "Admin", value: "ADMIN" },
  { label: "Fleet Manager", value: "FLEET_MANAGER" },
  { label: "Driver", value: "DRIVER" },
  { label: "Safety Officer", value: "SAFETY_OFFICER" },
  { label: "Financial Analyst", value: "FINANCIAL_ANALYST" },
]

const ROLE_LABELS: Record<AppRole, string> = {
  ADMIN: "Admin",
  FLEET_MANAGER: "Fleet Manager",
  DRIVER: "Driver",
  SAFETY_OFFICER: "Safety Officer",
  FINANCIAL_ANALYST: "Financial Analyst",
}

const MODULE_LABELS: Record<ModuleName, string> = {
  dashboard: "Dashboard",
  fleet: "Vehicles",
  drivers: "Drivers",
  trips: "Trips",
  maintenance: "Maintenance",
  fuel_expenses: "Fuel & Expenses",
  analytics: "Analytics",
  settings: "Settings",
}

function emptyOrganizationSettings(): OrganizationSettingsFormValues {
  return {
    orgName: "",
    depotName: "",
    currency: "",
    distanceUnit: "",
    timezone: "",
    contactEmail: "",
    contactPhone: "",
    address: "",
  }
}

function normalizeSettingsFormValues(values: OrganizationSettingsFormValues) {
  return {
    orgName: values.orgName.trim(),
    depotName: values.depotName.trim(),
    currency: values.currency.trim().toUpperCase(),
    distanceUnit: values.distanceUnit.trim().toUpperCase(),
    timezone: values.timezone.trim(),
    contactEmail: values.contactEmail?.trim() || null,
    contactPhone: values.contactPhone?.trim() || null,
    address: values.address?.trim() || null,
  }
}

function settingsToFormValues(settings: OrganizationSettings): OrganizationSettingsFormValues {
  return {
    orgName: settings.orgName ?? "",
    depotName: settings.depotName ?? "",
    currency: settings.currency ?? "",
    distanceUnit: settings.distanceUnit ?? "",
    timezone: settings.timezone ?? "",
    contactEmail: settings.contactEmail ?? "",
    contactPhone: settings.contactPhone ?? "",
    address: settings.address ?? "",
  }
}

function ProfileAccessChips({ profile }: { profile: SettingsProfile }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {profile.moduleAccess.map((module) => (
        <span
          key={`${profile.id}-${module}`}
          className="rounded-full border border-border/80 bg-muted px-2.5 py-1 text-[11px] font-medium text-foreground"
        >
          {MODULE_LABELS[module]}
        </span>
      ))}
    </div>
  )
}

export function SettingsPage() {
  const user = useAuthStore((state) => state.user)
  const isAdmin = user?.role === "ADMIN"

  const [orgSettings, setOrgSettings] = useState<OrganizationSettings | null>(null)
  const [rbacData, setRbacData] = useState<SettingsRbacData | null>(null)
  const [loadingOrg, setLoadingOrg] = useState(false)
  const [loadingRbac, setLoadingRbac] = useState(false)
  const [savingOrg, setSavingOrg] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [editorOpen, setEditorOpen] = useState(false)
  const [selectedProfile, setSelectedProfile] = useState<SettingsProfile | null>(null)
  const [selectedRole, setSelectedRole] = useState<AppRole>("ADMIN")
  const [selectedModules, setSelectedModules] = useState<ModuleName[]>([])

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<OrganizationSettingsFormValues>({
    resolver: zodResolver(organizationSettingsSchema),
    defaultValues: emptyOrganizationSettings(),
  })

  const roleDefaults = useMemo(() => rbacData?.roleDefaults ?? null, [rbacData])

  const loadOrgSettings = useCallback(async () => {
    setLoadingOrg(true)
    try {
      const response = await getOrganizationSettingsService()
      if (response.success) {
        setOrgSettings(response.data)
        reset(settingsToFormValues(response.data))
      } else {
        toast.error("Unable to load organization settings")
      }
    } catch (error) {
      toast.error(extractErrorMessage(error))
    } finally {
      setLoadingOrg(false)
    }
  }, [reset])

  const loadRbacData = useCallback(async () => {
    setLoadingRbac(true)
    try {
      const response = await getSettingsRbacService()
      if (response.success) {
        setRbacData(response.data)
      } else {
        toast.error("Unable to load access control data")
      }
    } catch (error) {
      toast.error(extractErrorMessage(error))
    } finally {
      setLoadingRbac(false)
    }
  }, [])

  useEffect(() => {
    if (!isAdmin) {
      return
    }

    void Promise.all([loadOrgSettings(), loadRbacData()])
  }, [isAdmin, loadOrgSettings, loadRbacData])

  const handleOrgSave = async (values: OrganizationSettingsFormValues) => {
    setSavingOrg(true)
    try {
      const response = await updateOrganizationSettingsService(normalizeSettingsFormValues(values))
      if (response.success) {
        toast.success("Organization settings saved")
        setOrgSettings(response.data)
        reset(settingsToFormValues(response.data))
      } else {
        toast.error("Failed to save organization settings")
      }
    } catch (error) {
      toast.error(extractErrorMessage(error))
    } finally {
      setSavingOrg(false)
    }
  }

  const openProfileEditor = (profile: SettingsProfile) => {
    setSelectedProfile(profile)
    setSelectedRole(profile.role)
    const fallbackModules = rbacData?.roleDefaults[profile.role] ?? []
    setSelectedModules(profile.moduleAccess.length > 0 ? profile.moduleAccess : fallbackModules)
    setEditorOpen(true)
  }

  const toggleModuleAccess = (module: ModuleName) => {
    setSelectedModules((current) =>
      current.includes(module) ? current.filter((item) => item !== module) : [...current, module]
    )
  }

  const handleSaveProfile = async () => {
    if (!selectedProfile) {
      return
    }

    setSavingProfile(true)
    try {
      const response = await updateSettingsRbacService(selectedProfile.id, {
        role: selectedRole,
        moduleAccess: selectedModules,
      })

      if (response.success) {
        toast.success("Access control updated")
        setEditorOpen(false)
        setSelectedProfile(null)
        await loadRbacData()
      } else {
        toast.error("Failed to update access control")
      }
    } catch (error) {
      toast.error(extractErrorMessage(error))
    } finally {
      setSavingProfile(false)
    }
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-3xl items-center justify-center px-4">
        <div className="w-full rounded-3xl border border-border/80 bg-card p-8 text-center shadow-sm">
          <ShieldCheck className="mx-auto h-10 w-10 text-muted-foreground" />
          <h1 className="mt-4 text-2xl font-semibold">Settings are hidden for this account</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your account does not have the settings module assigned. If you think this is wrong,
            ask an administrator to update your module access.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-muted-foreground">Settings</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Organization and access control</h1>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
            Manage the organization profile used across the app and control which modules each
            profile can open.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          className="rounded-xl"
          onClick={() => {
            void loadOrgSettings()
            void loadRbacData()
          }}
          disabled={loadingOrg || loadingRbac}
        >
          {loadingOrg || loadingRbac ? (
            <>
              <Loader2 size={16} className="mr-2 animate-spin" />
              Refreshing
            </>
          ) : (
            <>
              <RefreshCcw size={16} className="mr-2" />
              Refresh
            </>
          )}
        </Button>
      </div>

      {!isAdmin ? (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5 text-sm text-amber-700 dark:text-amber-300">
          This section is admin-only in the backend. The page can be viewed, but the save actions
          will be rejected unless the signed-in user is an administrator.
        </div>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.95fr] xl:items-start">
        <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm xl:self-start">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Building2 size={18} className="text-primary" />
                <h2 className="text-lg font-semibold">Organization settings</h2>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                These values power the org header, depot defaults, and localization rules.
              </p>
            </div>
            {orgSettings ? (
              <span className="rounded-full border border-border/80 bg-muted px-3 py-1 text-xs text-muted-foreground">
                Last updated {new Date(orgSettings.updatedAt).toLocaleDateString()}
              </span>
            ) : null}
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit(handleOrgSave)}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Organization name</label>
                <Input className="rounded-xl" placeholder="TransitOps" {...register("orgName")} />
                {errors.orgName ? (
                  <p className="text-[11px] text-destructive">{errors.orgName.message}</p>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Depot name</label>
                <Input className="rounded-xl" placeholder="Main Depot" {...register("depotName")} />
                {errors.depotName ? (
                  <p className="text-[11px] text-destructive">{errors.depotName.message}</p>
                ) : null}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Currency</label>
                <Input className="rounded-xl uppercase" placeholder="LKR" {...register("currency")} />
                {errors.currency ? (
                  <p className="text-[11px] text-destructive">{errors.currency.message}</p>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Distance unit</label>
                <Input className="rounded-xl uppercase" placeholder="KM" {...register("distanceUnit")} />
                {errors.distanceUnit ? (
                  <p className="text-[11px] text-destructive">{errors.distanceUnit.message}</p>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Timezone</label>
                <Input className="rounded-xl" placeholder="Asia/Colombo" {...register("timezone")} />
                {errors.timezone ? (
                  <p className="text-[11px] text-destructive">{errors.timezone.message}</p>
                ) : null}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Contact email</label>
                <Input
                  className="rounded-xl"
                  placeholder="ops@example.com"
                  {...register("contactEmail")}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Contact phone</label>
                <Input className="rounded-xl" placeholder="0112345678" {...register("contactPhone")} />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Address</label>
              <textarea
                rows={4}
                placeholder="Colombo, Sri Lanka"
                className="flex min-h-24 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
                {...register("address")}
              />
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <p className="text-xs text-muted-foreground">
                Admin-only updates are written through <code>/settings/org</code>.
              </p>
              <Button type="submit" className="rounded-xl" disabled={savingOrg || loadingOrg || !isAdmin}>
                {savingOrg ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" />
                    Saving
                  </>
                ) : (
                  <>
                    <Save size={16} className="mr-2" />
                    Save organization
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>

        <div className="space-y-6 xl:self-start">
          <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm xl:self-start">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck size={18} className="text-primary" />
                  <h2 className="text-lg font-semibold">Access control</h2>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Module access lives on each profile as a simple array, so the sidebar and API
                  guards stay consistent.
                </p>
              </div>
              <Users size={18} className="text-muted-foreground" />
            </div>

            <div className="mt-5 grid gap-3">
              {ROLE_OPTIONS.map((role) => {
                const modules = roleDefaults?.[role.value] ?? []
                return (
                  <div key={role.value} className="rounded-2xl border border-border/80 bg-muted/20 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium">{role.label}</p>
                        <p className="text-xs text-muted-foreground">Default modules for new profiles.</p>
                      </div>
                      <span className="text-xs text-muted-foreground">{modules.length} modules</span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {modules.map((module) => (
                        <span
                          key={`${role.value}-${module}`}
                          className="rounded-full border border-border/70 bg-background px-2.5 py-1 text-[11px] font-medium"
                        >
                          {MODULE_LABELS[module]}
                        </span>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm xl:self-start">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold">Profiles</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Edit role and module access for each user profile.
                </p>
              </div>
              {loadingRbac ? <Loader2 size={18} className="animate-spin text-primary" /> : null}
            </div>

            <div className="mt-4 overflow-hidden rounded-2xl border border-border/80">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/40 uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3.5">Profile</th>
                    <th className="px-4 py-3.5">Role</th>
                    <th className="px-4 py-3.5">Modules</th>
                    <th className="px-4 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/70">
                  {loadingRbac ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                        Loading access matrix...
                      </td>
                    </tr>
                  ) : rbacData?.profiles.length ? (
                    rbacData.profiles.map((profile) => (
                      <tr key={profile.id} className="align-top hover:bg-muted/20">
                        <td className="px-4 py-4">
                          <p className="font-medium text-foreground">{profile.fullName}</p>
                          <p className="mt-1 text-[11px] text-muted-foreground">{profile.email}</p>
                        </td>
                        <td className="px-4 py-4">
                          <span className="inline-flex whitespace-nowrap rounded-full border border-border/80 bg-muted px-2.5 py-1 text-[11px] font-medium">
                            {ROLE_LABELS[profile.role]}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <ProfileAccessChips profile={profile} />
                        </td>
                        <td className="px-4 py-4 text-right">
                          <Button
                            type="button"
                            variant="outline"
                            className="rounded-xl"
                            onClick={() => openProfileEditor(profile)}
                          >
                            <Edit3 size={14} className="mr-2" />
                            Edit
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                        No profiles found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="sm:max-w-2xl rounded-3xl border border-border/80 bg-card p-6 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Edit access control</DialogTitle>
            <DialogDescription>
              Update the role and the module access array that will be saved on the profile.
            </DialogDescription>
          </DialogHeader>

          {selectedProfile ? (
            <div className="space-y-5 py-2">
              <div className="rounded-2xl border border-border/80 bg-muted/20 p-4">
                <p className="text-sm font-medium">{selectedProfile.fullName}</p>
                <p className="mt-1 text-xs text-muted-foreground">{selectedProfile.email}</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Role</label>
                  <Select
                    value={selectedRole}
                    onValueChange={(value) => {
                      const nextRole = value as AppRole
                      setSelectedRole(nextRole)
                      setSelectedModules(rbacData?.roleDefaults[nextRole] ?? [])
                    }}
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLE_OPTIONS.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Current modules</label>
                  <p className="rounded-xl border border-border/80 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                    {selectedModules.length} module(s) selected
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs font-medium">Module access</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {(rbacData?.availableModules ?? []).map((module) => {
                    const checked = selectedModules.includes(module)
                    return (
                      <label
                        key={module}
                        className={[
                          "flex cursor-pointer items-center gap-3 rounded-2xl border px-3 py-2.5 text-sm transition-colors",
                          checked
                            ? "border-primary/30 bg-primary/5"
                            : "border-border/80 bg-background hover:bg-muted/30",
                        ].join(" ")}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleModuleAccess(module)}
                          className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                        />
                        <span className="flex-1">{MODULE_LABELS[module]}</span>
                        {checked ? <Check size={14} className="text-primary" /> : null}
                      </label>
                    )
                  })}
                </div>
              </div>
            </div>
          ) : null}

          <DialogFooter className="pt-2">
            <Button variant="outline" className="rounded-xl" onClick={() => setEditorOpen(false)} type="button">
              Cancel
            </Button>
            <Button className="rounded-xl" onClick={() => void handleSaveProfile()} disabled={savingProfile}>
              {savingProfile ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Saving
                </>
              ) : (
                <>
                  <Save size={16} className="mr-2" />
                  Save changes
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
