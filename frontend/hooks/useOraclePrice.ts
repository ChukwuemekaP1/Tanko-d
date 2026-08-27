'use client'

import { useState, useEffect, useCallback } from 'react'

export interface OraclePrice {
  fuelType: string
  pricePerLiter: number
  timestamp: number
  stationId?: number
}

export interface SignedOraclePrice {
  payload: OraclePrice
  signature: string
  oraclePublicKey: string
}

export interface OraclePricesResponse {
  prices: SignedOraclePrice[]
  oraclePublicKey: string
  fetchedAt: string
  maxPriceAge: number
}

interface UsePriceState {
  prices: SignedOraclePrice[] | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  getPrice: (fuelType: string) => OraclePrice | null
  getPricePerLiter: (fuelType: string) => number | null
  calculateFuelCost: (liters: number, fuelType: string) => number | null
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1'
const DEFAULT_MAX_PRICE_AGE_MS = 10 * 60 * 1000
const POLL_INTERVAL_MS = 5 * 60 * 1000

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError'
}

export function selectOraclePrice(
  prices: SignedOraclePrice[] | null,
  fuelType: string,
  maxPriceAge = DEFAULT_MAX_PRICE_AGE_MS
): OraclePrice | null {
  if (!prices) return null

  const target = fuelType.toLowerCase().trim()
  const signedPrice = prices.find(
    (p) => p.payload.fuelType.toLowerCase().trim() === target
  )

  if (!signedPrice) return null

  const age = Date.now() - signedPrice.payload.timestamp
  if (age > maxPriceAge) {
    console.warn(
      `Oracle price for "${fuelType}" is expired (${Math.round(age / 1000)}s old, max ${Math.round(maxPriceAge / 1000)}s)`
    )
    return null
  }

  return signedPrice.payload
}

export function roundFuelCost(cost: number): number {
  return Math.round(cost * 100) / 100
}

/**
 * useOraclePrice Hook
 *
 * Fetches real-time fuel prices from the Tanko Oracle backend
 * Provides helpers to calculate fuel costs based on oracle prices
 *
 * @example
 * const { prices, getPricePerLiter, calculateFuelCost } = useOraclePrice()
 *
 * if (loading) return <div>Loading prices...</div>
 * if (error) return <div>Error: {error}</div>
 *
 * const dieselPrice = getPricePerLiter('Diesel')
 * const cost = calculateFuelCost(50, 'Diesel') // 50 liters of Diesel
 */
export function useOraclePrice(): UsePriceState {
  const [prices, setPrices] = useState<SignedOraclePrice[] | null>(null)
  const [maxPriceAge, setMaxPriceAge] = useState(DEFAULT_MAX_PRICE_AGE_MS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPrices = useCallback(async (isSilent = false, signal?: AbortSignal) => {
    if (!isSilent) {
      setLoading(true)
      setError(null)
    }

    try {
      const response = await fetch(`${API_BASE_URL}/oracle/prices`, { signal })

      if (!response.ok) {
        throw new Error(`Failed to fetch prices: ${response.statusText}`)
      }

      const data = await response.json()

      if (data.success && data.data.prices) {
        setPrices(data.data.prices)
        if (typeof data.data.maxPriceAge === 'number') {
          setMaxPriceAge(data.data.maxPriceAge)
        }
        setError(null)
      } else {
        throw new Error('Invalid response format from oracle API')
      }
    } catch (err) {
      if (isAbortError(err)) return

      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch oracle prices'
      setError(errorMessage)
      console.error('Oracle price fetch error:', err)
    } finally {
      if (!isSilent && !signal?.aborted) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()

    fetchPrices(false, controller.signal)

    const interval = setInterval(() => {
      fetchPrices(true, controller.signal)
    }, POLL_INTERVAL_MS)

    return () => {
      controller.abort()
      clearInterval(interval)
    }
  }, [fetchPrices])

  const getPrice = useCallback(
    (fuelType: string): OraclePrice | null => {
      return selectOraclePrice(prices, fuelType, maxPriceAge)
    },
    [prices, maxPriceAge]
  )

  const getPricePerLiter = useCallback(
    (fuelType: string): number | null => {
      const price = getPrice(fuelType)
      return price?.pricePerLiter || null
    },
    [getPrice]
  )

  const calculateFuelCost = useCallback(
    (liters: number, fuelType: string): number | null => {
      const pricePerLiter = getPricePerLiter(fuelType)

      if (pricePerLiter === null) {
        return null
      }

      return roundFuelCost(liters * pricePerLiter)
    },
    [getPricePerLiter]
  )

  return {
    prices,
    loading,
    error,
    refetch: fetchPrices,
    getPrice,
    getPricePerLiter,
    calculateFuelCost,
  }
}

/**
 * Fetches price for a specific fuel type
 * Useful for single-type queries
 */
export async function fetchFuelPrice(fuelType: string): Promise<OraclePrice | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/oracle/prices/${fuelType}`)

    if (!response.ok) {
      console.error(`Failed to fetch ${fuelType} price:`, response.statusText)
      return null
    }

    const data = await response.json()

    if (data.success && data.data.price) {
      return data.data.price.payload
    }

    return null
  } catch (err) {
    console.error(`Error fetching ${fuelType} price:`, err)
    return null
  }
}

/**
 * Fetches oracle status
 */
export async function fetchOracleStatus() {
  try {
    const response = await fetch(`${API_BASE_URL}/oracle/status`)

    if (!response.ok) {
      throw new Error('Failed to fetch oracle status')
    }

    return await response.json()
  } catch (err) {
    console.error('Error fetching oracle status:', err)
    return null
  }
}

/**
 * Verifies a signed price (useful for contract integration)
 */
export async function verifySignedPrice(signedPrice: SignedOraclePrice): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/oracle/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ price: signedPrice }),
    })

    if (!response.ok) {
      return false
    }

    const data = await response.json()
    return data.data?.isValid || false
  } catch (err) {
    console.error('Error verifying price:', err)
    return false
  }
}
