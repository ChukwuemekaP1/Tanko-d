"use client"

import { useEffect, useRef, useState } from "react"

export interface StationMapLocation {
  id: string
  name: string
  address: string
  city?: string
  state?: string
  lat: number
  lng: number
  hours?: string
}

interface StationMapProps {
  stations: StationMapLocation[]
  selectedStationId: string | null
  onSelectStation: (stationId: string) => void
}

const DEFAULT_CENTER: [number, number] = [19.4326, -99.1332]

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

function popupHtml(station: StationMapLocation) {
  const location = [station.city, station.state].filter(Boolean).join(", ")

  return `
    <div class="station-popup">
      <p class="station-popup-title">${escapeHtml(station.name)}</p>
      <p class="station-popup-address">${escapeHtml(station.address)}</p>
      ${location ? `<p class="station-popup-meta">${escapeHtml(location)}</p>` : ""}
      ${
        station.hours
          ? `<p class="station-popup-hours">${escapeHtml(station.hours)}</p>`
          : ""
      }
    </div>
  `
}

export function StationMap({ stations, selectedStationId, onSelectStation }: StationMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<import("leaflet").Map | null>(null)
  const leafletRef = useRef<typeof import("leaflet") | null>(null)
  const markerLayerRef = useRef<import("leaflet").LayerGroup | null>(null)
  const markerRefs = useRef<Record<string, import("leaflet").Marker>>({})
  const onSelectRef = useRef(onSelectStation)
  const [mapReady, setMapReady] = useState(false)

  useEffect(() => {
    onSelectRef.current = onSelectStation
  }, [onSelectStation])

  useEffect(() => {
    let cancelled = false

    async function initializeMap() {
      const L = await import("leaflet")
      if (cancelled || !containerRef.current || mapRef.current) return

      leafletRef.current = L
      const map = L.map(containerRef.current, {
        center: DEFAULT_CENTER,
        zoom: 11,
        zoomControl: false,
      })

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map)

      L.control.zoom({ position: "bottomright" }).addTo(map)
      markerLayerRef.current = L.layerGroup().addTo(map)
      mapRef.current = map
      setMapReady(true)

      requestAnimationFrame(() => map.invalidateSize())
    }

    initializeMap()

    return () => {
      cancelled = true
      mapRef.current?.remove()
      mapRef.current = null
      markerLayerRef.current = null
      markerRefs.current = {}
    }
  }, [])

  useEffect(() => {
    const L = leafletRef.current
    const map = mapRef.current
    const layer = markerLayerRef.current
    if (!mapReady || !L || !map || !layer) return

    layer.clearLayers()
    markerRefs.current = {}

    const icon = L.divIcon({
      className: "station-marker-icon",
      html: '<span class="station-pin"><span class="station-pin-dot"></span></span>',
      iconSize: [34, 42],
      iconAnchor: [17, 41],
      popupAnchor: [0, -38],
    })

    const coordinates: [number, number][] = []

    stations.forEach((station) => {
      const latLng: [number, number] = [station.lat, station.lng]
      coordinates.push(latLng)

      const marker = L.marker(latLng, { icon })
        .bindPopup(popupHtml(station), {
          className: "station-map-popup",
          closeButton: false,
          keepInView: true,
          maxWidth: 260,
        })
        .on("click", () => onSelectRef.current(station.id))
        .addTo(layer)

      markerRefs.current[station.id] = marker
    })

    requestAnimationFrame(() => {
      map.invalidateSize()

      if (coordinates.length > 1) {
        map.fitBounds(L.latLngBounds(coordinates), {
          animate: true,
          maxZoom: 14,
          padding: [48, 48],
        })
        return
      }

      if (coordinates.length === 1) {
        map.setView(coordinates[0], 14, { animate: true })
        return
      }

      map.setView(DEFAULT_CENTER, 11, { animate: true })
    })
  }, [mapReady, stations])

  useEffect(() => {
    const map = mapRef.current
    if (!mapReady || !map || !selectedStationId) return

    const marker = markerRefs.current[selectedStationId]
    if (!marker) return

    map.flyTo(marker.getLatLng(), Math.max(map.getZoom(), 14), {
      duration: 0.7,
    })
    marker.openPopup()
  }, [mapReady, selectedStationId, stations])

  useEffect(() => {
    const map = mapRef.current
    const container = containerRef.current
    if (!mapReady || !map || !container) return

    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(() => {
        map.invalidateSize()

        if (!selectedStationId) return
        const marker = markerRefs.current[selectedStationId]
        if (!marker) return

        map.panTo(marker.getLatLng(), { animate: false })
        marker.openPopup()
      })
    })

    resizeObserver.observe(container)

    return () => resizeObserver.disconnect()
  }, [mapReady, selectedStationId])

  return (
    <div className="relative h-[420px] min-h-[360px] overflow-hidden rounded-lg border border-border bg-muted md:h-[calc(100vh-260px)] md:min-h-[480px]">
      <div ref={containerRef} className="h-full w-full" aria-label="Mapa de gasolineras autorizadas" />
      {stations.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 p-6 text-center text-sm text-muted-foreground backdrop-blur-sm">
          No hay gasolineras con coordenadas validas para mostrar en el mapa.
        </div>
      )}
    </div>
  )
}
