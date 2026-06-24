import { describe, expect, it } from "vitest"
import { getMappableStations, toMappableStation } from "@/lib/maps/stations"

describe("stations map utils", () => {
  it("maps valid numeric coordinates", () => {
    const station = toMappableStation({
      id: "st-1",
      name: "Central",
      address: "Main St",
      lat: 19.4326,
      lng: -99.1332,
    })

    expect(station).not.toBeNull()
    expect(station?.lat).toBe(19.4326)
    expect(station?.lng).toBe(-99.1332)
  })

  it("maps valid string coordinates", () => {
    const station = toMappableStation({
      id: "st-2",
      name: "North",
      address: "2nd Ave",
      lat: "20.1",
      lng: "-100.5",
    })

    expect(station).not.toBeNull()
    expect(station?.lat).toBe(20.1)
    expect(station?.lng).toBe(-100.5)
  })

  it("rejects null and invalid coordinates", () => {
    expect(
      toMappableStation({
        id: "st-3",
        name: "Invalid A",
        address: "Unknown",
        lat: null,
        lng: -100,
      }),
    ).toBeNull()

    expect(
      toMappableStation({
        id: "st-4",
        name: "Invalid B",
        address: "Unknown",
        lat: 100,
        lng: -99,
      }),
    ).toBeNull()

    expect(
      toMappableStation({
        id: "st-5",
        name: "Invalid C",
        address: "Unknown",
        lat: "x",
        lng: "-99",
      }),
    ).toBeNull()
  })

  it("filters only valid stations for map rendering", () => {
    const stations = getMappableStations([
      { id: "ok-1", name: "A", address: "A", lat: 19.4, lng: -99.1 },
      { id: "bad-1", name: "B", address: "B", lat: 200, lng: -99.1 },
      { id: "bad-2", name: "C", address: "C", lat: undefined, lng: -99.1 },
      { id: "ok-2", name: "D", address: "D", lat: "20.5", lng: "-101.1" },
    ])

    expect(stations).toHaveLength(2)
    expect(stations.map((station) => station.id)).toEqual(["ok-1", "ok-2"])
  })
})
