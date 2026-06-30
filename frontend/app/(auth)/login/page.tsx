'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Wallet, User, Users } from 'lucide-react'
import { useAuth, UserRole } from '@/providers/auth-provider'
import { TankoLogoMinimal } from '@/components/logo'
import { WalletConnectModal } from '@/components/wallet/wallet-connect-modal'

export default function LoginPage() {
  const router = useRouter()
  const t = useTranslations('auth.login')
  const tCommon = useTranslations('common')
  const { address, isConnected, isConnecting, disconnect, setRole, role, networkLabel } = useAuth()
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    if (isConnected && address && role) {
      if (role === 'CONDUCTOR') {
        router.push('/dashboard/conductor')
      } else {
        router.push('/dashboard')
      }
    }
  }, [isConnected, address, role, router])

  const handleRoleSelect = (selectedRole: UserRole) => {
    setRole(selectedRole)
    
    if (selectedRole === 'CONDUCTOR') {
      router.push('/dashboard/conductor')
    } else {
      router.push('/dashboard')
    }
  }

  if (isConnecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">{t('connectingWallet')}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isConnected && address && !role) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
                <TankoLogoMinimal size={28} className="text-primary-foreground" />
              </div>
            </div>
            <CardTitle className="text-2xl">{t('welcome')}</CardTitle>
            <CardDescription>
              {t('connectPrompt', { address: `${address.slice(0, 8)}...${address.slice(-8)}` })}
            </CardDescription>
            {networkLabel && (
              <div className="mt-3 flex justify-center">
                <span className="rounded-md border px-2 py-1 text-xs text-muted-foreground">
                  {networkLabel}
                </span>
              </div>
            )}
          </CardHeader>
          
          <CardContent className="space-y-6">
            <p className="text-sm text-muted-foreground text-center">
              {t('howAccess')}
            </p>

            <div className="grid gap-4">
              <button
                onClick={() => handleRoleSelect('CONDUCTOR')}
                className="flex items-center gap-4 p-4 rounded-lg border-2 border-border hover:border-blue-500/50 hover:bg-blue-500/5 transition-all text-left"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10">
                  <User className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{t('iAmDriver')}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t('iAmDriverDesc')}
                  </p>
                </div>
              </button>

              <button
                onClick={() => handleRoleSelect('JEFE')}
                className="flex items-center gap-4 p-4 rounded-lg border-2 border-border hover:border-violet-500/50 hover:bg-violet-500/5 transition-all text-left"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-violet-500/10">
                  <Users className="h-6 w-6 text-violet-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{t('iAmManager')}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t('iAmManagerDesc')}
                  </p>
                </div>
              </button>
            </div>

            <Button
              variant="ghost"
              onClick={disconnect}
              className="w-full text-muted-foreground"
            >
              {t('disconnectWallet')}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
              <TankoLogoMinimal size={28} className="text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl">{tCommon('appName')}</CardTitle>
          <CardDescription>
            {t('subtitle')}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              {t('walletHint')}
            </p>

            <Button
              onClick={() => setModalOpen(true)}
              className="w-full"
              disabled={isConnecting}
              size="lg"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('connecting')}
                </>
              ) : (
                <>
                  <Wallet className="mr-2 h-4 w-4" />
                  {t('connectWallet')}
                </>
              )}
            </Button>
          </div>

          <WalletConnectModal open={modalOpen} onOpenChange={setModalOpen} />
        </CardContent>
      </Card>
    </div>
  )
}
