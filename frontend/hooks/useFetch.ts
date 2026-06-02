import { useState, useEffect, useCallback } from 'react'
import { Network } from '@capacitor/network'
import { Capacitor } from '@capacitor/core'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:3001'

const resolveUrl = (url: string) => {
  if (url.startsWith('/api/')) {
    // In mobile/static builds, we call the backend directly
    // The Next.js API routes are essentially proxies to /api/v1/...
    return `${BACKEND_URL}${url.replace('/api/', '/api/v1/')}`
  }
  return url
}

interface FetchState<T> {
  data: T | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useFetch<T>(url: string, options?: RequestInit): FetchState<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // Check network if on native
      if (Capacitor.isNativePlatform()) {
        const status = await Network.getStatus()
        if (!status.connected) {
          throw new Error('No internet connection')
        }
      }

      const response = await fetch(resolveUrl(url), options)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const result = await response.json()
      setData(result.data || result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [url, JSON.stringify(options)])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}

export function usePost<T, R>(url: string) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const post = useCallback(async (data: T): Promise<R | null> => {
    setLoading(true)
    setError(null)

    try {
      // Check network if on native
      if (Capacitor.isNativePlatform()) {
        const status = await Network.getStatus()
        if (!status.connected) {
          throw new Error('No internet connection. Cannot submit transaction.')
        }
      }

      const response = await fetch(resolveUrl(url), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      return null
    } finally {
      setLoading(false)
    }
  }, [url])

  return { post, loading, error }
}
