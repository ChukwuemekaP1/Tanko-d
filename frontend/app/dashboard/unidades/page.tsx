"use client"

import { useEffect, useState } from "react"
import type { ReactNode } from "react"
import {
  AlertCircle,
  Calendar,
  Car,
  Eye,
  Fuel,
  type LucideIcon,
  MoreHorizontal,
  Search,
  User,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/providers/auth-provider"
import { cn } from "@/lib/utils"

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://127.0.0.1:3001"

interface Unit {
  id: string
  make: string
  model: string
  year?: number
  plates: string
  isActive: boolean
  specs?: string
  permitNumber?: string
  permitExpiry?: string
  user?: {
    name: string
  }
}

export default function UnidadesPage() {
  const { address: walletAddress } = useAuth()
  const [units, setUnits] = useState<Unit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    async function fetchUnits() {
      console.log(`[Units] Fetching from ${BACKEND}/api/v1/units`)
      setLoading(true)
      setError(null)

      try {
        const res = await fetch(`${BACKEND}/api/v1/units`)
        console.log(`[Units] Response status: ${res.status}`)

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`)
        }

        const data = await res.json()
        console.log(`[Units] Response:`, data)

        if (data.success && data.data) {
          setUnits(data.data)
        } else {
          setUnits([])
        }
      } catch (err) {
        console.error("[Units] Error fetching data:", err)
        setError(err instanceof Error ? err.message : "Error de conexión")
        setUnits([])
      } finally {
        setLoading(false)
      }
    }

    fetchUnits()
  }, [walletAddress])

  const filteredUnits = units.filter(unit =>
    unit.make?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    unit.model?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    unit.plates?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    unit.user?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const activeUnits = units.filter(unit => unit.isActive).length
  const assignedUnits = units.filter(unit => unit.user?.name).length

  if (error) {
    return <ErrorState title="Error al cargar unidades" message={error} />
  }

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Fleet registry"
        title="Flota"
        description="Gestionar vehículos registrados, permisos y asignación de conductores."
        icon={Car}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Vehículos" value={units.length.toString()} detail="Registrados" loading={loading} />
        <MetricCard label="Activos" value={activeUnits.toString()} detail="Listos para operar" loading={loading} />
        <MetricCard label="Asignados" value={assignedUnits.toString()} detail="Con conductor" loading={loading} />
      </div>

      <Card className="tanko-glass-subtle rounded-lg py-0">
        <CardHeader className="p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-title text-white">Lista de vehículos</CardTitle>
              <CardDescription>Total: {units.length} vehículos registrados</CardDescription>
            </div>
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar vehículo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-glass pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-5 pt-0">
          {loading ? (
            <CardGridSkeleton />
          ) : filteredUnits.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredUnits.map((unit) => (
                <div
                  key={unit.id}
                  className="rounded-lg border border-glass-border bg-glass p-5 transition-all hover:border-primary/30 hover:bg-glass-strong"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <Car className="h-6 w-6" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="truncate font-semibold text-white">
                          {unit.make} {unit.model}
                        </h3>
                        {unit.year && (
                          <p className="text-body-sm text-muted-foreground">{unit.year}</p>
                        )}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm" aria-label="Abrir acciones">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" />
                          Ver detalles
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="mt-5 space-y-3">
                    <div className="flex items-center justify-between rounded-md border border-glass-border bg-background/35 px-3 py-2">
                      <span className="text-body-sm text-muted-foreground">Placas</span>
                      <span className="font-mono text-body-sm font-semibold text-white">{unit.plates}</span>
                    </div>

                    {unit.user && (
                      <InfoLine icon={User}>{unit.user.name}</InfoLine>
                    )}

                    {unit.permitNumber && (
                      <InfoLine icon={Fuel}>Permiso: {unit.permitNumber}</InfoLine>
                    )}

                    {unit.permitExpiry && (
                      <InfoLine icon={Calendar}>
                        Vence: {new Date(unit.permitExpiry).toLocaleDateString("es-MX")}
                      </InfoLine>
                    )}

                    <div className="flex items-center justify-end pt-2">
                      <span
                        className={cn(
                          "inline-flex rounded-md border px-2.5 py-1 text-caption font-semibold",
                          unit.isActive
                            ? "border-success/20 bg-success/10 text-success"
                            : "border-glass-border bg-glass text-muted-foreground",
                        )}
                      >
                        {unit.isActive ? "Activo" : "Inactivo"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState>No hay vehículos registrados</EmptyState>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function PageHero({ eyebrow, title, description, icon: Icon }: { eyebrow: string; title: string; description: string; icon: LucideIcon }) {
  return (
    <section className="tanko-glass rounded-lg p-5 lg:p-6">
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-micro font-semibold uppercase tracking-[0.28em] text-primary">{eyebrow}</p>
          <h1 className="mt-2 text-heading font-black text-white">{title}</h1>
          <p className="mt-2 max-w-2xl text-body-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </section>
  )
}

function MetricCard({ label, value, detail, loading }: { label: string; value: string; detail: string; loading: boolean }) {
  return (
    <Card className="tanko-glass-subtle rounded-lg py-0">
      <CardContent className="p-5">
        <p className="text-body-sm text-muted-foreground">{label}</p>
        {loading ? <Skeleton className="mt-3 h-8 w-20 bg-white/10" /> : <p className="mt-3 text-3xl font-black text-white">{value}</p>}
        <p className="mt-2 text-caption text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  )
}

function InfoLine({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-body-sm text-muted-foreground">
      <Icon className="h-4 w-4 text-primary" />
      <span>{children}</span>
    </div>
  )
}

function CardGridSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="rounded-lg border border-glass-border bg-glass p-5">
          <div className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 bg-white/10" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-2/3 bg-white/10" />
              <Skeleton className="h-4 w-20 bg-white/10" />
            </div>
          </div>
          <Skeleton className="mt-5 h-10 w-full bg-white/10" />
          <Skeleton className="mt-3 h-4 w-3/4 bg-white/10" />
          <Skeleton className="mt-3 h-4 w-1/2 bg-white/10" />
        </div>
      ))}
    </div>
  )
}

function ErrorState({ title, message }: { title: string; message: string }) {
  return (
    <div className="flex h-[60vh] items-center justify-center">
      <div className="tanko-glass flex max-w-md flex-col items-center gap-4 rounded-lg px-8 py-7 text-center">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="font-semibold text-destructive">{title}</p>
        <p className="text-body-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  )
}

function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-glass-border bg-glass p-8 text-center text-body-sm text-muted-foreground">
      {children}
    </div>
  )
}
