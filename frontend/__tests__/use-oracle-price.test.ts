import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  roundFuelCost,
  selectOraclePrice,
  type SignedOraclePrice,
} from '@/hooks/useOraclePrice'

function signedPrice(
  fuelType: string,
  overrides: Partial<SignedOraclePrice['payload']> = {}
): SignedOraclePrice {
  return {
    payload: {
      fuelType,
      pricePerLiter: 24.5,
      timestamp: Date.now(),
      ...overrides,
    },
    signature: 'sig',
    oraclePublicKey: 'GTEST',
  }
}

describe('selectOraclePrice', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('matches fuel types regardless of casing or surrounding whitespace', () => {
    const prices = [signedPrice('DIESEL')]

    expect(selectOraclePrice(prices, 'diesel')?.fuelType).toBe('DIESEL')
    expect(selectOraclePrice(prices, 'Diesel')?.fuelType).toBe('DIESEL')
    expect(selectOraclePrice(prices, '  DIESEL  ')?.fuelType).toBe('DIESEL')
  })

  it('returns null when no matching fuel type exists', () => {
    const prices = [signedPrice('Magna')]

    expect(selectOraclePrice(prices, 'Diesel')).toBeNull()
  })

  it('returns null for a null price list', () => {
    expect(selectOraclePrice(null, 'Diesel')).toBeNull()
  })

  it('returns a fresh price within maxPriceAge', () => {
    const prices = [signedPrice('Diesel', { timestamp: Date.now() - 60_000 })]

    expect(selectOraclePrice(prices, 'Diesel', 10 * 60 * 1000)?.pricePerLiter).toBe(24.5)
  })

  it('returns null and warns when the price is older than maxPriceAge', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const prices = [
      signedPrice('Diesel', { timestamp: Date.now() - 11 * 60 * 1000 }),
    ]

    expect(selectOraclePrice(prices, 'Diesel')).toBeNull()
    expect(warn).toHaveBeenCalledOnce()
    expect(warn.mock.calls[0][0]).toMatch(/expired/i)
  })

  it('does not treat a price at the maxPriceAge boundary as expired', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-27T12:00:00.000Z'))
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const maxPriceAge = 10 * 60 * 1000
    const prices = [signedPrice('Diesel', { timestamp: Date.now() - maxPriceAge })]

    expect(selectOraclePrice(prices, 'Diesel', maxPriceAge)?.fuelType).toBe('Diesel')
    expect(warn).not.toHaveBeenCalled()
    vi.useRealTimers()
  })
})

describe('roundFuelCost', () => {
  it('rounds fiat costs to two decimal places', () => {
    expect(roundFuelCost(50 * 24.555)).toBe(1227.75)
    expect(roundFuelCost(10 * 27.449)).toBe(274.49)
  })
})
