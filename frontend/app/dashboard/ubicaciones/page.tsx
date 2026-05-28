"use client"

import { useMemo, useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { Search, Fuel, Loader2, AlertCircle, Clock } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getMappableStations } from "@/lib/maps/stations"

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
  city?: string
  state?: string
  lat?: number
  lng?: number
  hours?: string
  services: string[]
  status: string
}

export default function LocationsPage() {
  const [stations, setStations] = useState<GasStation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    async function fetchStations() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`${BACKEND}/api/v1/stations`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        setStations(data.success ? data.data : [])
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error de conexión")
        setStations([])
      } finally {
        setLoading(false)
      }
    }
    fetchStations()
  }, [])

  const filtered = stations.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.state?.toLowerCase().includes(searchQuery.toLowerCase())
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

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Cargando ubicaciones...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <p className="text-destructive">Error al cargar ubicaciones</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Ubicaciones</h1>
        <p className="text-muted-foreground">Gasolineras registradas para la flota</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gasolineras</CardTitle>
          <CardDescription>{stations.length} estación{stations.length !== 1 ? "es" : ""} registrada{stations.length !== 1 ? "s" : ""}</CardDescription>
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, dirección o ciudad..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6 overflow-hidden rounded-xl border border-border bg-muted/30">
            <div className="relative h-[320px] w-full sm:h-[420px] lg:h-[520px] z-0">
              {validStations.length === 0 ? (
                <div className="flex h-full items-center justify-center px-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    No hay estaciones con coordenadas válidas para mostrar en el mapa.
                  </p>
                </div>
              ) : (
                <div className="absolute inset-0 z-0">
                  <StationsMap stations={validStations} />
                </div>
              )}
            </div>
          </div>

          {filtered.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              {searchQuery ? "Sin resultados para tu búsqueda" : "No hay gasolineras registradas"}
            </p>
          ) : (
            <div className="space-y-4">
              {filtered.map((station) => {
                const coordinates = coordinatesById.get(station.id)
                return (
                <div
                  key={station.id}
                  className="flex items-start gap-4 rounded-xl border border-border p-4 transition-all hover:border-primary/30"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Fuel className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-foreground">{station.name}</h4>
                    <p className="text-sm text-muted-foreground">{station.address}</p>
                    {(station.city || station.state) && (
                      <p className="text-xs text-muted-foreground">
                        {[station.city, station.state].filter(Boolean).join(", ")}
                      </p>
                    )}
                    {coordinates && (
                      <p className="mt-1 font-mono text-xs text-muted-foreground">
                        {coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    {station.hours && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {station.hours}
                      </div>
                    )}
                    {station.services.length > 0 && (
                      <div className="flex flex-wrap justify-end gap-1">
                        {station.services.map((svc) => (
                          <span
                            key={svc}
                            className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary"
                          >
                            {svc}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
