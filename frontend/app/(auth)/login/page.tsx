'use client'

import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  User,
  Users,
  Wallet,
} from 'lucide-react'
import { useAuth, UserRole } from '@/providers/auth-provider'
import { TankoLogoMinimal } from '@/components/logo'
import { WalletConnectModal } from '@/components/wallet/wallet-connect-modal'

const TRUST_POINTS = [
  'Stellar Testnet wallet access',
  'Escrow-backed fuel approvals',
  'Role-aware fleet workspace',
]

export default function LoginPage() {
  const router = useRouter()
  const { address, isConnected, isConnecting, disconnect, setRole, role } = useAuth()
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
      <AuthShell>
        <Card className="tanko-glass w-full max-w-md rounded-lg py-0">
          <CardContent className="flex flex-col items-center justify-center p-8 text-center">
            <Loader2 className="mb-4 h-8 w-8 animate-spin text-primary" />
            <p className="text-body-sm text-muted-foreground">
              Conectando con Freighter...
            </p>
          </CardContent>
        </Card>
      </AuthShell>
    )
  }

  if (isConnected && address && !role) {
    return (
      <AuthShell>
        <Card className="tanko-glass w-full max-w-2xl rounded-lg py-0">
          <CardContent className="p-5 sm:p-7">
            <BrandHeader
              eyebrow="Wallet connected"
              title="Bienvenido a Tanko"
              description={`Conecta tu wallet: ${address.slice(0, 8)}...${address.slice(-8)}`}
            />

            <div className="mt-7 grid gap-3">
              <RoleButton
                icon={User}
                title="Soy Conductor"
                description="Solicitar fondos de combustible y cargar combustible"
                accent="primary"
                onClick={() => handleRoleSelect('CONDUCTOR')}
              />
              <RoleButton
                icon={Users}
                title="Soy Jefe de Flota"
                description="Gestionar conductores, aprobar solicitudes y supervisar la flota"
                accent="accent"
                onClick={() => handleRoleSelect('JEFE')}
              />
            </div>

            <Button
              variant="ghost"
              onClick={disconnect}
              className="mt-5 w-full text-muted-foreground hover:bg-white/10 hover:text-white"
            >
              Desconectar wallet
            </Button>
          </CardContent>
        </Card>
      </AuthShell>
    )
  }

  return (
    <AuthShell>
      <Card className="tanko-glass w-full max-w-md rounded-lg py-0">
        <CardContent className="p-5 sm:p-7">
          <BrandHeader
            eyebrow="Secure access"
            title="Tanko"
            description="Monedero electrónico descentralizado para combustible"
          />

          {error && (
            <div className="mt-6 rounded-md border border-destructive/25 bg-destructive/10 p-3 text-body-sm text-destructive">
              {error}
            </div>
          )}

          <div className="mt-7 space-y-4">
            <p className="text-center text-body-sm text-muted-foreground">
              Conecta tu wallet Freighter para comenzar.
            </p>

            <Button
              onClick={handleWalletConnect}
              className="h-11 w-full"
              disabled={isLoading}
              size="lg"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Conectando...
                </>
              ) : (
                <>
                  <Wallet className="h-4 w-4" />
                  Conectar con Freighter
                </>
              )}
            </Button>
          </div>

          <div className="mt-6 rounded-lg border border-glass-border bg-glass p-4">
            <div className="mb-3 flex items-center gap-2 text-caption font-semibold uppercase tracking-[0.2em] text-primary">
              <ShieldCheck className="h-4 w-4" />
              Freighter
            </div>
            <p className="text-body-sm text-muted-foreground">
              Freighter es una wallet de Stellar que te permite interactuar con
              aplicaciones descentralizadas. Necesitarás crear una cuenta en
              Stellar Testnet para usar esta aplicación.
            </p>
          </div>
        </CardContent>
      </Card>
    </AuthShell>
  )
}

function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-background px-4 py-10 text-foreground">
      <div className="tanko-surface-grid pointer-events-none fixed inset-0" />
      <div className="relative grid w-full max-w-6xl items-center gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="hidden lg:block">
          <div className="max-w-xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-md border border-primary/20 bg-primary/10 px-3 py-2 text-caption font-semibold uppercase tracking-[0.22em] text-primary">
              <Wallet className="h-4 w-4" />
              Tanko Access
            </div>
            <h1 className="text-5xl font-black leading-tight tracking-normal text-white">
              Wallet-first fuel control for fleet operators.
            </h1>
            <p className="mt-5 text-body text-muted-foreground">
              Sign in with Freighter, choose your operational role, and enter the
              Tanko dashboard with the same business flow already in place.
            </p>
            <div className="mt-8 space-y-3">
              {TRUST_POINTS.map((point) => (
                <div key={point} className="flex items-center gap-3 text-body-sm text-muted-foreground">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                  <span>{point}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="flex justify-center">{children}</section>
      </div>
    </main>
  )
}

function BrandHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string
  title: string
  description: string
}) {
  return (
    <div className="text-center">
      <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-md border border-primary/30 bg-primary/10 shadow-glow-blue">
        <TankoLogoMinimal size={26} className="text-primary" />
      </div>
      <p className="text-micro font-semibold uppercase tracking-[0.28em] text-primary">
        {eyebrow}
      </p>
      <h1 className="mt-3 text-heading font-bold text-white">{title}</h1>
      <p className="mt-2 text-body-sm text-muted-foreground">{description}</p>
    </div>
  )
}

function RoleButton({
  icon: Icon,
  title,
  description,
  accent,
  onClick,
}: {
  icon: typeof User
  title: string
  description: string
  accent: 'primary' | 'accent'
  onClick: () => void
}) {
  const accentClass =
    accent === 'primary'
      ? 'border-primary/20 bg-primary/10 text-primary'
      : 'border-accent/25 bg-accent/10 text-accent'

  return (
    <button
      onClick={onClick}
      className="tanko-focus group flex items-center gap-4 rounded-lg border border-glass-border bg-glass p-4 text-left transition-all hover:border-primary/30 hover:bg-glass-strong"
    >
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-md border ${accentClass}`}>
        <Icon className="h-6 w-6" />
      </div>
      <div className="min-w-0 flex-1">
        <h2 className="font-semibold text-white">{title}</h2>
        <p className="mt-1 text-body-sm text-muted-foreground">{description}</p>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
    </button>
  )
}
