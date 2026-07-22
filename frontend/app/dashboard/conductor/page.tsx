'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  CheckCheck,
  CheckCircle2,
  ChevronRight,
  Clock,
  Copy,
  Droplets,
  Fuel,
  Loader2,
  LucideIcon,
  Plus,
  ReceiptText,
  Send,
  ShieldCheck,
  Wallet,
  XCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/providers/auth-provider'
import { cn } from '@/lib/utils'

interface Balance {
  asset: string
  balance: string
}

interface FuelRequest {
  id: string
  estado?: string
  status?: string
  montoSolicitado?: number
  amount?: number
  tipoCombustible?: string
  litros?: number
  precioLitro?: number
  motivo?: string
  description?: string
  createdAt: string
}

const INITIAL_FORM = {
  litros: '100',
  precioLitro: '25',
  tipoCombustible: 'DIESEL',
  motivo: '',
}

export default function DriverDashboardPage() {
  const { address } = useAuth()
  const [copied, setCopied] = useState(false)
  const [balances, setBalances] = useState<Balance[]>([])
  const [requests, setRequests] = useState<FuelRequest[]>([])
  const [loadingBalances, setLoadingBalances] = useState(true)
  const [loadingRequests, setLoadingRequests] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState(INITIAL_FORM)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchBalances() {
      if (!address) {
        setLoadingBalances(false)
        return
      }

      try {
        const res = await fetch(`/api/stellar/balance?address=${address}&asset=XLM`)
        if (res.ok) {
          const data = await res.json()
          if (data.balance) {
            setBalances([{ asset: 'XLM', balance: data.balance }])
          }
        }

        const usdcRes = await fetch(`/api/stellar/balance?address=${address}&asset=USDC`)
        if (usdcRes.ok) {
          const usdcData = await usdcRes.json()
          if (usdcData.balance) {
            setBalances(prev => [...prev, { asset: 'USDC', balance: usdcData.balance }])
          }
        }
      } catch (balanceError) {
        console.error('Error fetching balances:', balanceError)
      } finally {
        setLoadingBalances(false)
      }
    }

    fetchBalances()
  }, [address])

  useEffect(() => {
    async function fetchRequests() {
      try {
        const res = await fetch('/api/trustless/solicitud')
        if (res.ok) {
          const data = await res.json()
          setRequests(Array.isArray(data) ? data : data.data || [])
        }
      } catch (requestError) {
        console.error('Error fetching fuel requests:', requestError)
      } finally {
        setLoadingRequests(false)
      }
    }

    fetchRequests()
  }, [])

  const xlmBalance = balances.find(b => b.asset === 'XLM')?.balance || '0'
  const usdcBalance = balances.find(b => b.asset === 'USDC')?.balance || '0'
  const totalUSD = parseFloat(usdcBalance).toFixed(2)
  const liters = Number.parseFloat(form.litros) || 0
  const price = Number.parseFloat(form.precioLitro) || 0
  const requestTotal = useMemo(() => liters * price, [liters, price])
  const pendingCount = requests.filter(request => normalizeStatus(request) === 'PENDIENTE').length
  const approvedCount = requests.filter(request => normalizeStatus(request) === 'APROBADA' || normalizeStatus(request) === 'APPROVED').length

  function copyAddress() {
    if (address) {
      navigator.clipboard.writeText(address)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/trustless/solicitud', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monto: requestTotal,
          tipoCombustible: form.tipoCombustible,
          litros: liters,
          precioLitro: price,
          motivo: form.motivo,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'No se pudo enviar la solicitud')
        return
      }

      setRequests(prev => [data, ...prev])
      setForm(INITIAL_FORM)
    } catch (submitError) {
      setError('Error de conexión al enviar la solicitud')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <section className="tanko-glass overflow-hidden rounded-lg p-5 lg:p-6">
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr] xl:items-center">
          <div>
            <div className="mb-3 flex items-center gap-2 text-micro font-semibold uppercase tracking-[0.28em] text-primary">
              <Wallet className="h-4 w-4" />
              Driver wallet dashboard
            </div>
            <h1 className="text-heading font-black text-white">Conductor</h1>
            <p className="mt-2 max-w-2xl text-body-sm text-muted-foreground">
              Solicita fondos de combustible, monitorea el estado de tus
              peticiones y revisa el balance disponible en tu wallet Freighter.
            </p>
          </div>

          <div className="rounded-lg border border-primary/20 bg-primary/10 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-micro font-semibold uppercase tracking-[0.2em] text-primary">
                  Wallet conectada
                </p>
                <p className="mt-2 font-mono text-body-sm text-white">
                  {address ? truncate(address) : 'Not connected'}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={copyAddress}
                aria-label="Copiar dirección"
              >
                {copied ? (
                  <CheckCheck className="h-4 w-4 text-success" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <WalletBalanceCard
          title="Balance total"
          value={`$${totalUSD}`}
          detail="USDC disponible"
          icon={Wallet}
          loading={loadingBalances}
          tone="primary"
        />
        <WalletBalanceCard
          title="USDC"
          value={`$${parseFloat(usdcBalance).toFixed(2)}`}
          detail="Asset operativo"
          icon={ShieldCheck}
          loading={loadingBalances}
          tone="success"
        />
        <WalletBalanceCard
          title="XLM"
          value={parseFloat(xlmBalance).toFixed(2)}
          detail="Gas de red Stellar"
          icon={Fuel}
          loading={loadingBalances}
          tone="accent"
        />
        <WalletBalanceCard
          title="Solicitudes"
          value={requests.length.toString()}
          detail={`${pendingCount} pendientes · ${approvedCount} aprobadas`}
          icon={ReceiptText}
          loading={loadingRequests}
          tone="warning"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="tanko-glass rounded-lg py-0">
          <CardHeader className="border-b border-glass-border p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Plus className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-title text-white">Nueva solicitud</CardTitle>
                <CardDescription>
                  Calcula el monto por litros y precio antes de enviarla.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-5">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="litros">Litros</Label>
                  <Input
                    id="litros"
                    inputMode="decimal"
                    value={form.litros}
                    onChange={(event) => setForm(prev => ({ ...prev, litros: event.target.value }))}
                    className="bg-glass"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="precioLitro">Precio por litro</Label>
                  <Input
                    id="precioLitro"
                    inputMode="decimal"
                    value={form.precioLitro}
                    onChange={(event) => setForm(prev => ({ ...prev, precioLitro: event.target.value }))}
                    className="bg-glass"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipoCombustible">Tipo de combustible</Label>
                <Input
                  id="tipoCombustible"
                  value={form.tipoCombustible}
                  onChange={(event) => setForm(prev => ({ ...prev, tipoCombustible: event.target.value.toUpperCase() }))}
                  className="bg-glass"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="motivo">Motivo</Label>
                <Textarea
                  id="motivo"
                  value={form.motivo}
                  onChange={(event) => setForm(prev => ({ ...prev, motivo: event.target.value }))}
                  className="min-h-24 bg-glass"
                  placeholder="Ruta, unidad o comentario para el jefe de flota"
                />
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-md border border-destructive/25 bg-destructive/10 p-3 text-body-sm text-destructive">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="rounded-lg border border-glass-border bg-glass p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-micro font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      Monto estimado
                    </p>
                    <p className="mt-1 text-3xl font-black text-white">
                      ${requestTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <Droplets className="h-8 w-8 text-primary" />
                </div>
              </div>

              <Button
                type="submit"
                className="h-11 w-full"
                disabled={submitting || requestTotal <= 0}
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Enviar solicitud
                <ChevronRight className="h-4 w-4" />
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="tanko-glass-subtle rounded-lg py-0">
          <CardHeader className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle className="text-title text-white">Estado de solicitudes</CardTitle>
                <CardDescription>
                  Seguimiento rápido del flujo de aprobación de combustible.
                </CardDescription>
              </div>
              <div className="rounded-md border border-success/20 bg-success/10 px-3 py-1.5 text-caption font-semibold text-success">
                {pendingCount} pendientes
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 p-5 pt-0">
            {loadingRequests ? (
              <div className="flex items-center justify-center rounded-lg border border-glass-border bg-glass p-8 text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin text-primary" />
                Cargando solicitudes...
              </div>
            ) : requests.length > 0 ? (
              requests.map((request) => (
                <RequestStatusCard key={request.id} request={request} />
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-glass-border bg-glass p-8 text-center text-body-sm text-muted-foreground">
                Aún no hay solicitudes de combustible.
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

function WalletBalanceCard({
  title,
  value,
  detail,
  icon: Icon,
  loading,
  tone,
}: {
  title: string
  value: string
  detail: string
  icon: LucideIcon
  loading: boolean
  tone: 'primary' | 'success' | 'accent' | 'warning'
}) {
  const toneClass = {
    primary: 'border-primary/20 bg-primary/10 text-primary',
    success: 'border-success/20 bg-success/10 text-success',
    accent: 'border-accent/20 bg-accent/10 text-accent',
    warning: 'border-warning/20 bg-warning/10 text-warning',
  }[tone]

  return (
    <Card className="tanko-glass-subtle rounded-lg py-0">
      <CardContent className="p-5">
        <div className="mb-5 flex items-center justify-between gap-3">
          <p className="text-body-sm font-medium text-muted-foreground">{title}</p>
          <div className={cn('flex h-10 w-10 items-center justify-center rounded-md border', toneClass)}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
        {loading ? (
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
        ) : (
          <p className="text-3xl font-black text-white">{value}</p>
        )}
        <p className="mt-3 text-caption text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  )
}

function RequestStatusCard({ request }: { request: FuelRequest }) {
  const status = normalizeStatus(request)
  const statusMeta = getStatusMeta(status)
  const amount = request.montoSolicitado ?? request.amount ?? 0

  return (
    <div className="rounded-lg border border-glass-border bg-glass p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-md border', statusMeta.className)}>
            <statusMeta.icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold text-white">
                {request.tipoCombustible || 'DIESEL'} · {request.litros || 0} L
              </p>
              <span className={cn('rounded-md border px-2 py-0.5 text-micro font-semibold uppercase tracking-[0.18em]', statusMeta.className)}>
                {statusMeta.label}
              </span>
            </div>
            <p className="mt-1 text-body-sm text-muted-foreground">
              {request.motivo || request.description || 'Solicitud de combustible'}
            </p>
            <p className="mt-2 text-caption text-muted-foreground">
              {new Date(request.createdAt).toLocaleDateString('es-MX', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        </div>
        <div className="shrink-0 text-left sm:text-right">
          <p className="text-title font-bold text-white">
            ${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-caption text-muted-foreground">
            ${(request.precioLitro || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}/L
          </p>
        </div>
      </div>
    </div>
  )
}

function normalizeStatus(request: FuelRequest) {
  return (request.estado || request.status || 'PENDIENTE').toUpperCase()
}

function getStatusMeta(status: string): {
  label: string
  icon: LucideIcon
  className: string
} {
  if (status === 'APROBADA' || status === 'APPROVED') {
    return {
      label: 'Aprobada',
      icon: CheckCircle2,
      className: 'border-success/20 bg-success/10 text-success',
    }
  }

  if (status === 'RECHAZADA' || status === 'REJECTED') {
    return {
      label: 'Rechazada',
      icon: XCircle,
      className: 'border-destructive/25 bg-destructive/10 text-destructive',
    }
  }

  return {
    label: 'Pendiente',
    icon: Clock,
    className: 'border-warning/20 bg-warning/10 text-warning',
  }
}

function truncate(addr: string, start = 8, end = 6) {
  return `${addr.slice(0, start)}...${addr.slice(-end)}`
}
