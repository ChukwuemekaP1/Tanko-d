"use client"

import { useEffect } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { getMappableStations } from "@/lib/maps/stations"

// Fix for default Leaflet icons in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
})

const DEFAULT_CENTER: [number, number] = [19.4326, -99.1332]

// Component to handle auto-recentering
function BoundsUpdater({ stations }: { stations: ReturnType<typeof getMappableStations> }) {
  const map = useMap()

  useEffect(() => {
    if (stations.length === 0) return

    const bounds = L.latLngBounds(stations.map(s => [s.lat, s.lng] as [number, number]))
    map.fitBounds(bounds, { padding: [50, 50] })
  }, [map, stations])

  return null
}

export default function StationsMap({ stations }: { stations: ReturnType<typeof getMappableStations> }) {
  return (
    <MapContainer
      center={DEFAULT_CENTER}
      zoom={11}
      style={{ width: "100%", height: "100%", zIndex: 0 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      <BoundsUpdater stations={stations} />

      {stations.map((station) => (
        <Marker key={station.id} position={[station.lat, station.lng]}>
          <Popup>
            <div className="py-1">
              <p className="text-sm font-semibold text-foreground m-0">{station.name}</p>
              <p className="text-xs text-muted-foreground m-0 mt-1">{station.address}</p>
              {station.hours && (
                <p className="mt-1 text-xs text-muted-foreground m-0">
                  <span className="font-medium">Horario:</span> {station.hours}
                </p>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
