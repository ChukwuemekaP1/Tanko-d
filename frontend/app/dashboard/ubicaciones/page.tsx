"use client"

import { useEffect, useMemo, useState } from "react"
import type { ReactNode } from "react"

import dynamic from "next/dynamic"

import {
  AlertCircle,
  Clock,
  Fuel,
  MapPin,
  Search,
  type LucideIcon,
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
import { StationMap, type StationMapLocation } from "@/components/station-map"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { useAuth } from "@/providers/auth-provider"
import { toast } from "sonner"
import { getMappableStations } from "@/lib/maps/stations"
import { useTranslations } from "next-intl"

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://127.0.0.1:3001"

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
  const t = useTranslations("ubicaciones")
  const tCommon = useTranslations("common")
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
        setError(err instanceof Error ? err.message : tCommon("connectionError"))
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

  useEffect(() => {
    if (!selectedStationId || filtered.some((station) => station.id === selectedStationId)) return
    setSelectedStationId(mapStations[0]?.id ?? filtered[0]?.id ?? null)
  }, [filtered, mapStations, selectedStationId])

  const StationForm = () => (
    <SheetContent className="sm:max-w-[500px]">
      <SheetHeader className="pb-6">
        <SheetTitle className="text-2xl font-bold">{t("addStation")}</SheetTitle>
        <SheetDescription>
          {t("addStationDesc")}
        </SheetDescription>
      </SheetHeader>
      <div className="space-y-6 py-4">
        {/* Mock form fields for now */}
        <div className="space-y-2">
          <label className="text-sm font-medium">{t("stationName")}</label>
          <Input placeholder={t("stationNamePlaceholder")} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">{t("fullAddress")}</label>
          <Input placeholder={t("fullAddressPlaceholder")} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("city")}</label>
            <Input placeholder={t("cityPlaceholder")} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("state")}</label>
            <Input placeholder={t("statePlaceholder")} />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">{t("hours")}</label>
          <Input placeholder={t("hoursPlaceholder")} />
        </div>
        <Button className="w-full mt-4" onClick={() => toast.success(t("comingSoon"))}>
          {t("registerStation")}
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
          </CardHeader>
          <CardContent>
            {filtered.length === 0 ? (
              <div className="space-y-4 py-8 text-center">
                <p className="text-muted-foreground">
                  {searchQuery
                    ? t("noSearchResults")
                    : t("noAuthorized")}
                </p>
                {isJefe && !searchQuery && (
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button className="gap-2" size="lg">
                        <Plus className="h-4 w-4" />
                        {t("registerFirst")}
                      </Button>
                    </SheetTrigger>
                    <StationForm />
                  </Sheet>
                )}
              </div>
            ) : (
              <div className="max-h-[calc(100vh-320px)] min-h-[360px] space-y-3 overflow-y-auto pr-1">
                {filtered.map((station) => {
                  const mapLocation = toMapLocation(station)
                  const isSelected = selectedStationId === station.id

                  return (
                    <button
                      key={station.id}
                      type="button"
                      onClick={() => setSelectedStationId(station.id)}
                      className={`flex w-full items-start gap-3 rounded-lg border p-4 text-left transition-all ${
                        isSelected
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border bg-card hover:border-primary/40"
                      }`}
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-primary/10">
                        <Fuel className="h-5 w-5 text-primary" />
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
