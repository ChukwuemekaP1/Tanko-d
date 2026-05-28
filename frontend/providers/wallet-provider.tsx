/** @deprecated Use AuthProvider + @/lib/wallet instead (issue #31). */
'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface WalletState {
  address: string | null
  isConnected: boolean
  isConnecting: boolean
  error: string | null
  freighterInstalled: boolean
}

interface WalletContextType extends WalletState {
  connect: () => Promise<void>
  disconnect: () => void
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

export function WalletProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WalletState>({
    address: null,
    isConnected: false,
    isConnecting: false,
    error: null,
    freighterInstalled: false,
  })

  // On mount: check extension + restore previous session
  useEffect(() => {
    async function restore() {
      try {
        // Dynamic import keeps this browser-only code out of SSR
        const freighter = await import('@stellar/freighter-api')

        const { isConnected } = await freighter.isConnected()
        if (!isConnected) {
          // Extension not installed — still restore address from localStorage
          // so the UI can show a "reconnect" prompt
          const stored = localStorage.getItem('stellar_address')
          if (stored) {
            setState(prev => ({ ...prev, address: stored, isConnected: true, freighterInstalled: false }))
          }
          return
        }

        setState(prev => ({ ...prev, freighterInstalled: true }))

        // If the site is already allowed, restore the session silently
        const { isAllowed } = await freighter.isAllowed()
        if (isAllowed) {
          const { address, error } = await freighter.getAddress()
          if (!error && address) {
            localStorage.setItem('stellar_address', address)
            setState({ address, isConnected: true, isConnecting: false, error: null, freighterInstalled: true })
          }
        } else {
          // Check localStorage fallback
          const stored = localStorage.getItem('stellar_address')
          if (stored) {
            setState(prev => ({ ...prev, address: stored, isConnected: true, freighterInstalled: true }))
          }
        }
      } catch (err) {
        console.error('[Tanko] Freighter init error:', err)
      }
    }

    restore()
  }, [])

  const connect = async () => {
    setState(prev => ({ ...prev, isConnecting: true, error: null }))
    try {
      const freighter = await import('@stellar/freighter-api')

      // Check if extension is installed
      const { isConnected } = await freighter.isConnected()
      if (!isConnected) {
        setState(prev => ({
          ...prev,
          isConnecting: false,
          freighterInstalled: false,
          error: 'Freighter is not installed. Install it at freighter.app and reload the page.',
        }))
        return
      }

      // requestAccess() is what actually opens the Freighter extension popup
      const { address, error } = await freighter.requestAccess()

      if (error) {
        setState(prev => ({
          ...prev,
          isConnecting: false,
          error: `Freighter denied access: ${error}`,
        }))
        return
      }

      if (address) {
        localStorage.setItem('stellar_address', address)
        setState({
          address,
          isConnected: true,
          isConnecting: false,
          error: null,
          freighterInstalled: true,
        })
        console.log(`[Tanko] ✅ Freighter connected: ${address}`)
      }
    } catch (err: any) {
      setState(prev => ({
        ...prev,
        isConnecting: false,
        error: err?.message || 'Connection error. Make sure Freighter is unlocked.',
      }))
    }
  }

  const disconnect = () => {
    localStorage.removeItem('stellar_address')
    setState(prev => ({
      ...prev,
      address: null,
      isConnected: false,
      isConnecting: false,
      error: null,
    }))
    console.log('[Tanko] Wallet disconnected')
  }

  return (
    <WalletContext.Provider value={{ ...state, connect, disconnect }}>
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  const context = useContext(WalletContext)
  if (!context) throw new Error('useWallet must be used within a WalletProvider')
  return context
}
