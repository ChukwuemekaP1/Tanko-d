'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/providers/auth-provider'
import { Loader2 } from 'lucide-react'

export default function LogoutPage() {
  const t = useTranslations('auth.logout')
  const { disconnect } = useAuth()
  const router = useRouter()

  useEffect(() => {
    disconnect()
    setTimeout(() => {
      router.push('/menu')
    }, 500)
  }, [disconnect, router])

  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">{t('disconnecting')}</p>
      </div>
    </div>
  )
}
