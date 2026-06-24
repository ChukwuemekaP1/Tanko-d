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

// Dynamically import the map component with no SSR to avoid 'window is not defined' errors from Leaflet
const StationsMap = dynamic(
  () => import("@/components/maps/StationsMap"),
  { 
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center bg-muted/20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }
)

interface GasStation {
  id: string
  name: string
  address: string
  city?: string | null
  state?: string | null
  lat?: number | string | null
  lng?: number | string | null
  hours?: string | null
  services?: string[]
  status: string
}

function normalizeStation(station: GasStation): GasStation {
  return {
    ...station,
    services: Array.isArray(station.services) ? station.services : [],
  }
}

function toCoordinate(value: GasStation["lat"]) {
  if (value === null || value === undefined || value === "") return null

  const coordinate = typeof value === "number" ? value : Number(value)
  return Number.isFinite(coordinate) ? coordinate : null
}

function toMapLocation(station: GasStation): StationMapLocation | null {
  const lat = toCoordinate(station.lat)
  const lng = toCoordinate(station.lng)

  if (lat === null || lng === null) return null
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null

  return {
    id: station.id,
    name: station.name,
    address: station.address,
    city: station.city ?? undefined,
    state: station.state ?? undefined,
    lat,
    lng,
    hours: station.hours ?? undefined,
  }
}

export default function LocationsPage() {
  const { role } = useAuth()
  const [stations, setStations] = useState<GasStation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const isJefe = role === "JEFE"
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null)

  useEffect(() => {
    async function fetchStations() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`${BACKEND}/api/v1/stations?active=true`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        const nextStations: GasStation[] = Array.isArray(data.data)
          ? data.data.map((station: GasStation) => normalizeStation(station))
          : []
        const firstMappableStation = nextStations
          .map(toMapLocation)
          .find((station): station is StationMapLocation => Boolean(station))

        setStations(nextStations)
        setSelectedStationId(firstMappableStation?.id ?? nextStations[0]?.id ?? null)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error de conexion")
        setStations([])
        setSelectedStationId(null)
      } finally {
        setLoading(false)
      }
    }
    fetchStations()
  }, [])

  const filtered = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return stations

    return stations.filter((station) =>
      [
        station.name,
        station.address,
        station.city ?? "",
        station.state ?? "",
      ].some((value) => value.toLowerCase().includes(query))
    )
  }, [searchQuery, stations])

  const mapStations = useMemo(
    () => filtered.map(toMapLocation).filter((station): station is StationMapLocation => Boolean(station)),
    [filtered]
  )
  const validStations = useMemo(() => getMappableStations(filtered), [filtered])
  const coordinatesById = useMemo(
    () =>
      new Map(
        getMappableStations(stations).map((station) => [
          station.id,
          { lat: station.lat, lng: station.lng },
        ]),
      ),
    [stations],
  )

  useEffect(() => {
    if (!selectedStationId || filtered.some((station) => station.id === selectedStationId)) return
    setSelectedStationId(mapStations[0]?.id ?? filtered[0]?.id ?? null)
  }, [filtered, mapStations, selectedStationId])

  const StationForm = () => (
    <SheetContent className="sm:max-w-[500px]">
      <SheetHeader className="pb-6">
        <SheetTitle className="text-2xl font-bold">Add New Gas Station</SheetTitle>
        <SheetDescription>
          Register a new authorized fueling location for your fleet.
        </SheetDescription>
      </SheetHeader>
      <div className="space-y-6 py-4">
        {/* Mock form fields for now */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Station Name</label>
          <Input placeholder="e.g. Pemex Santa Fe" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Full Address</label>
          <Input placeholder="Avenida Siempre Viva 123..." />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">City</label>
            <Input placeholder="CDMX" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">State</label>
            <Input placeholder="Mexico" />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Operating Hours</label>
          <Input placeholder="e.g. 24/7 or 06:00 - 22:00" />
        </div>
        <Button className="w-full mt-4" onClick={() => toast.success("Feature coming soon!")}>
          Register Station
        </Button>
      </div>
    </SheetContent>
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
