"use client"

import { useEffect, useState } from "react"
import type { ReactNode } from "react"
import {
  AlertCircle,
  Clock,
  Fuel,
  type LucideIcon,
  MapPin,
  Navigation,
  Search,
  Star,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://127.0.0.1:3001"

interface Location {
  id: string
  name: string
  address: string
  city?: string
  coordinates?: string
  hours?: string
  services?: string[]
}

export default function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    async function fetchLocations() {
      console.log(`[Locations] Fetching from ${BACKEND}/api/v1/stats/recent-transactions`)
      setLoading(true)
      setError(null)

      try {
        const res = await fetch(`${BACKEND}/api/v1/stats/recent-transactions?limit=100`)
        console.log(`[Locations] Response status: ${res.status}`)

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`)
        }

        const data = await res.json()
        console.log(`[Locations] Response:`, data)

        if (data.success && data.data) {
          const uniqueStations = new Map<string, Location>()
          data.data.forEach((tx: any) => {
            if (tx.station && !uniqueStations.has(tx.station)) {
              uniqueStations.set(tx.station, {
                id: tx.id,
                name: tx.station,
                address: tx.station,
                city: "México",
              })
            }
          })
          setLocations(Array.from(uniqueStations.values()))
        } else {
          setLocations([])
        }
      } catch (err) {
        console.error("[Locations] Error fetching data:", err)
        setError(err instanceof Error ? err.message : "Error de conexión")
        setLocations([])
      } finally {
        setLoading(false)
      }
    }

    fetchLocations()
  }, [])

  const filteredLocations = locations.filter(loc =>
    loc.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    loc.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    loc.city?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (error) {
    return <ErrorState title="Error al cargar ubicaciones" message={error} />
  }

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Station network"
        title="Ubicaciones"
        description="Gasolineras donde la flota ha cargado combustible y puntos de operación recientes."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Estaciones" value={locations.length.toString()} detail="Puntos únicos" loading={loading} />
        <MetricCard label="Ciudad" value="México" detail="Cobertura detectada" loading={loading} />
        <MetricCard label="Servicios" value="Fuel" detail="Red de carga" loading={loading} />
      </div>

      <Card className="tanko-glass-subtle rounded-lg py-0">
        <CardHeader className="p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-title text-white">Gasolineras</CardTitle>
              <CardDescription>Estaciones donde se han registrado cargas de combustible</CardDescription>
            </div>
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar estación..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-glass pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-5 pt-0">
          {loading ? (
            <LocationSkeleton />
          ) : filteredLocations.length > 0 ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {filteredLocations.map((location) => (
                <div
                  key={location.id}
                  className="rounded-lg border border-glass-border bg-glass p-5 transition-all hover:border-primary/30 hover:bg-glass-strong"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <Fuel className="h-6 w-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-semibold text-white">{location.name}</h4>
                        <span className="inline-flex items-center gap-1 rounded-md border border-success/20 bg-success/10 px-2 py-0.5 text-caption font-semibold text-success">
                          <Star className="h-3 w-3" />
                          Activa
                        </span>
                      </div>
                      <InfoLine icon={MapPin}>{location.address}</InfoLine>
                      {location.city && (
                        <InfoLine icon={Navigation}>{location.city}</InfoLine>
                      )}
                      {location.coordinates && (
                        <p className="mt-2 font-mono text-caption text-muted-foreground">
                          {location.coordinates}
                        </p>
                      )}
                    </div>
                    <div className="hidden shrink-0 flex-col items-end gap-2 sm:flex">
                      {location.hours && (
                        <div className="flex items-center gap-1.5 text-caption text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {location.hours}
                        </div>
                      )}
                      {location.services && location.services.length > 0 && (
                        <div className="flex flex-wrap justify-end gap-1">
                          {location.services.map((service, idx) => (
                            <span
                              key={idx}
                              className="rounded-md border border-primary/20 bg-primary/10 px-2 py-0.5 text-caption text-primary"
                            >
                              {service}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState>No hay ubicaciones registradas</EmptyState>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function PageHero({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <section className="tanko-glass rounded-lg p-5 lg:p-6">
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          <MapPin className="h-5 w-5" />
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
        {loading ? <Skeleton className="mt-3 h-8 w-24 bg-white/10" /> : <p className="mt-3 text-3xl font-black text-white">{value}</p>}
        <p className="mt-2 text-caption text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  )
}

function InfoLine({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) {
  return (
    <p className="mt-2 flex items-center gap-2 text-body-sm text-muted-foreground">
      <Icon className="h-4 w-4 text-primary" />
      {children}
    </p>
  )
}

function LocationSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="rounded-lg border border-glass-border bg-glass p-5">
          <div className="flex gap-4">
            <Skeleton className="h-12 w-12 bg-white/10" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-5 w-2/3 bg-white/10" />
              <Skeleton className="h-4 w-full bg-white/10" />
              <Skeleton className="h-4 w-32 bg-white/10" />
            </div>
          </div>
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
