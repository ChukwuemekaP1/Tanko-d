"use client"

import { useEffect, useMemo, useState } from "react"
import { AlertCircle, Clock, Fuel, Loader2, MapPin, Search } from "lucide-react"
import { StationMap, type StationMapLocation } from "@/components/station-map"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

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
  const [stations, setStations] = useState<GasStation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
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

  useEffect(() => {
    if (!selectedStationId || filtered.some((station) => station.id === selectedStationId)) return
    setSelectedStationId(mapStations[0]?.id ?? filtered[0]?.id ?? null)
  }, [filtered, mapStations, selectedStationId])

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
        <p className="text-muted-foreground">Gasolineras autorizadas para la flota</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,0.75fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Mapa de gasolineras</CardTitle>
            <CardDescription>
              {mapStations.length} de {filtered.length} estacion{filtered.length !== 1 ? "es" : ""} con coordenadas validas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StationMap
              stations={mapStations}
              selectedStationId={selectedStationId}
              onSelectStation={setSelectedStationId}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gasolineras</CardTitle>
            <CardDescription>
              {stations.length} estacion{stations.length !== 1 ? "es" : ""} autorizada{stations.length !== 1 ? "s" : ""}
            </CardDescription>
            <div className="relative mt-3">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, direccion o ciudad..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent>
            {filtered.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">
                {searchQuery ? "Sin resultados para tu busqueda" : "No hay gasolineras autorizadas"}
              </p>
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
                      <div className="min-w-0 flex-1">
                        <h4 className="font-semibold leading-tight text-foreground">{station.name}</h4>
                        <p className="mt-1 text-sm text-muted-foreground">{station.address}</p>
                        {(station.city || station.state) && (
                          <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3 shrink-0" />
                            {[station.city, station.state].filter(Boolean).join(", ")}
                          </p>
                        )}
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          {station.hours && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {station.hours}
                            </span>
                          )}
                          {!mapLocation && (
                            <span className="rounded-full bg-destructive/10 px-2 py-1 text-xs text-destructive">
                              Sin coordenadas validas
                            </span>
                          )}
                        </div>
                        {station.services && station.services.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {station.services.map((service) => (
                              <span
                                key={service}
                                className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary"
                              >
                                {service}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
