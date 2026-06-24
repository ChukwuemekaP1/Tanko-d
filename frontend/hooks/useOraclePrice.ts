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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPrices = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`${API_BASE_URL}/oracle/prices`)

      if (!response.ok) {
        throw new Error(`Failed to fetch prices: ${response.statusText}`)
      }

      const data = await response.json()

      if (data.success && data.data.prices) {
        setPrices(data.data.prices)
      } else {
        throw new Error('Invalid response format from oracle API')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch oracle prices'
      setError(errorMessage)
      console.error('Oracle price fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPrices()

    // Refresh prices every 5 minutes (300000ms)
    const interval = setInterval(fetchPrices, 300000)

    return () => clearInterval(interval)
  }, [fetchPrices])

  const getPrice = useCallback(
    (fuelType: string): OraclePrice | null => {
      if (!prices) return null

      const signedPrice = prices.find((p) => p.payload.fuelType === fuelType)
      return signedPrice?.payload || null
    },
    [prices]
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

      return liters * pricePerLiter
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
