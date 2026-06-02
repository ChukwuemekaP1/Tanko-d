'use client'

import { AuthProvider } from '@/providers/auth-provider'
import { ReactNode } from 'react'
import { useDeepLinks } from '@/hooks/useDeepLinks'

export function Providers({ children }: { children: ReactNode }) {
  useDeepLinks()
  
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  )
}
