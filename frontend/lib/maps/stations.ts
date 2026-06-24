export interface GasStationLike {
  id: string
  name: string
  address: string
  hours?: string | null
  lat?: number | string | null
  lng?: number | string | null
}

export interface MappableStation extends Omit<GasStationLike, "lat" | "lng"> {
  lat: number
  lng: number
}

function parseCoordinate(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined) return null

  const parsed = typeof value === "string" ? Number.parseFloat(value) : value
  if (!Number.isFinite(parsed)) return null
  return parsed
}

function isWithinRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max
}

export function toMappableStation(station: GasStationLike): MappableStation | null {
  const lat = parseCoordinate(station.lat)
  const lng = parseCoordinate(station.lng)

  if (lat === null || lng === null) return null
  if (!isWithinRange(lat, -90, 90)) return null
  if (!isWithinRange(lng, -180, 180)) return null

  return {
    ...station,
    lat,
    lng,
  }
}

export function getMappableStations(stations: GasStationLike[]): MappableStation[] {
  return stations
    .map(toMappableStation)
    .filter((station): station is MappableStation => station !== null)
}
