"use client"

import { useEffect, useState } from "react"
import {
  Fuel,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  DollarSign,
  Droplets,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from "recharts"
import { useAuth } from "@/providers/auth-provider"

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://127.0.0.1:3001"

interface DashboardStats {
  totalSpent: number
  totalLiters: number
  transactionCount: number
  activeUsers: number
  registeredUnits: number
  activeUnits: number
  escrowBalance: number
  totalReleased: number
  pendingRequests: number
}

interface MonthlyStats {
  month: string
  spend: number
  liters: number
  transactionCount: number
}

interface PendingRequest {
  id: string
  liters: number
  amount: number
  description: string
  status: string
  createdAt: string
  driver: {
    name: string
    stellarPubKey: string
  }
}

interface RecentTransaction {
  id: string
  date: string
  driver: string
  unit: string
  plates: string
  station: string
  amount: number
  liters: number
}

interface TopUnit {
  id: string
  make: string
  model: string
  plates: string
  monthlySpend: number
  totalLiters: number
  driverName: string
}

export default function DashboardPage() {
  const { address: walletAddress } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats[]>([])
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([])
  const [topUnits, setTopUnits] = useState<TopUnit[]>([])
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      if (!walletAddress) {
        setLoading(false)
        return
      }

      try {
        const [statsRes, monthlyRes, transactionsRes, topUnitsRes, pendingRes] = await Promise.all([
          fetch(`${BACKEND}/api/v1/stats/dashboard`),
          fetch(`${BACKEND}/api/v1/stats/monthly`),
          fetch(`${BACKEND}/api/v1/stats/recent-transactions?limit=5`),
          fetch(`${BACKEND}/api/v1/stats/top-units?limit=5`),
          fetch(`${BACKEND}/api/v1/funds/manager/${walletAddress}/pending`),
        ])

        if (statsRes.ok) {
          const statsData = await statsRes.json()
          setStats(statsData.data)
        }

        if (monthlyRes.ok) {
          const monthlyData = await monthlyRes.json()
          setMonthlyStats(monthlyData.data)
        }

        if (transactionsRes.ok) {
          const transactionsData = await transactionsRes.json()
          setRecentTransactions(transactionsData.data)
        }

        if (topUnitsRes.ok) {
          const unitsData = await topUnitsRes.json()
          setTopUnits(unitsData.data)
        }

        if (pendingRes.ok) {
          const pendingData = await pendingRes.json()
          setPendingRequests(pendingData.data || [])
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [walletAddress])

  const handleApprove = async (requestId: string) => {
    setProcessingId(requestId)
    try {
      const res = await fetch(`${BACKEND}/api/v1/trustless/solicitud/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId }),
      })
      const data = await res.json()

      if (res.ok && data.success) {
        toast.success("Solicitud aprobada")
        setPendingRequests(prev => prev.filter(r => r.id !== requestId))
      } else {
        toast.error("Error al aprobar", { description: data.error })
      }
    } catch (err) {
      toast.error("Error de conexión")
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (requestId: string) => {
    setProcessingId(requestId)
    try {
      const res = await fetch(`${BACKEND}/api/v1/trustless/solicitud/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId }),
      })
      const data = await res.json()

      if (res.ok && data.success) {
        toast.success("Solicitud rechazada")
        setPendingRequests(prev => prev.filter(r => r.id !== requestId))
      } else {
        toast.error("Error al rechazar", { description: data.error })
      }
    } catch (err) {
      toast.error("Error de conexión")
    } finally {
      setProcessingId(null)
    }
  }

  const defaultStats: DashboardStats = {
    totalSpent: 0,
    totalLiters: 0,
    transactionCount: 0,
    activeUsers: 0,
    registeredUnits: 0,
    activeUnits: 0,
    escrowBalance: 0,
    totalReleased: 0,
    pendingRequests: 0,
  }

  const displayStats = stats || defaultStats

  const statsCards = [
    {
      title: "Total Gastado",
      value: `$${(displayStats.totalReleased / 10000000).toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
      trend: "up" as const,
      icon: DollarSign,
      color: "emerald"
    },
    {
      title: "Solicitudes Pendientes",
      value: displayStats.pendingRequests.toString(),
      trend: (pendingRequests.length > 0 ? "up" : "neutral") as "up" | "down" | "neutral",
      icon: Clock,
      color: "amber"
    },
    {
      title: "Conductores Activos",
      value: displayStats.activeUsers.toString(),
      trend: "neutral" as const,
      icon: Users,
      color: "blue"
    },
    {
      title: "Litros Cargados",
      value: `${(displayStats.totalLiters / 10000000).toLocaleString()} L`,
      trend: "neutral" as const,
      icon: Droplets,
      color: "violet"
    },
  ]

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Cargando dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Panel de Control</h1>
        <p className="text-muted-foreground">Resumen de la operación de tu flota</p>
      </div>

      {pendingRequests.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-800/30 dark:bg-amber-900/10">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base text-amber-800 dark:text-amber-200">
              <AlertCircle className="h-5 w-5" />
              Solicitudes Pendientes ({pendingRequests.length})
            </CardTitle>
            <CardDescription className="text-amber-700 dark:text-amber-400">
              Revisa y aprueba las solicitudes de combustible de tus conductores
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingRequests.slice(0, 3).map((request) => (
              <div
                key={request.id}
                className="flex items-center justify-between rounded-lg border border-amber-200/50 bg-white p-4 dark:border-amber-800/50 dark:bg-card"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30">
                    <Fuel className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{request.driver?.name || "Conductor"}</p>
                    <p className="text-sm text-muted-foreground">
                      {request.liters}L · ${(request.amount / 10000000).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(request.createdAt).toLocaleDateString("es-MX", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleReject(request.id)}
                    disabled={processingId === request.id}
                    className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400"
                  >
                    {processingId === request.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleApprove(request.id)}
                    disabled={processingId === request.id}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {processingId === request.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
            {pendingRequests.length > 3 && (
              <p className="text-center text-sm text-muted-foreground">
                y {pendingRequests.length - 3} solicitudes más...
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-${stat.color}-500/10`}>
                <stat.icon className={`h-5 w-5 text-${stat.color}-600 dark:text-${stat.color}-400`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {stat.trend === "up" && (
                  <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                )}
                {stat.trend === "down" && (
                  <ArrowDownRight className="h-3 w-3 text-red-500" />
                )}
                <span className={stat.trend === "up" ? "text-emerald-500" : stat.trend === "down" ? "text-red-500" : ""}>
                  {stat.title}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Gasto Mensual</CardTitle>
            <CardDescription>Gasto en combustible (USD) últimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyStats.length > 0 ? monthlyStats : []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    dataKey="month"
                    className="text-xs text-muted-foreground"
                    tick={{ fill: 'currentColor' }}
                  />
                  <YAxis
                    className="text-xs text-muted-foreground"
                    tick={{ fill: 'currentColor' }}
                    tickFormatter={(value) => `$${(value / 1000000).toFixed(0)}M`}
                  />
                  <Tooltip
                    formatter={(value: number) => [`$${(value / 10000000).toLocaleString("en-US")}`, "Gasto"]}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="spend"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary) / 0.2)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Litros por Mes</CardTitle>
            <CardDescription>Volumen de combustible cargado por mes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyStats.length > 0 ? monthlyStats : []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    dataKey="month"
                    className="text-xs text-muted-foreground"
                    tick={{ fill: 'currentColor' }}
                  />
                  <YAxis
                    className="text-xs text-muted-foreground"
                    tick={{ fill: 'currentColor' }}
                  />
                  <Tooltip
                    formatter={(value: number) => [`${(value / 10000000).toLocaleString("en-US")} L`, "Litros"]}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar
                    dataKey="liters"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Transacciones Recientes</CardTitle>
            <CardDescription>Últimas cargas de combustible registradas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(recentTransactions || []).length > 0 ? (recentTransactions || []).map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between rounded-lg border border-border p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <Fuel className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{tx.driver}</p>
                      <p className="text-xs text-muted-foreground">{tx.unit} - {tx.plates}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground">
                      ${(tx.amount / 10000000).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-muted-foreground">{(tx.liters / 10000000).toLocaleString()} L</p>
                  </div>
                </div>
              )) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay transacciones recientes
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Unidades con Mayor Consumo</CardTitle>
            <CardDescription>Top 5 unidades por gasto de combustible este mes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topUnits.length > 0 ? topUnits.map((unit, index) => (
                <div
                  key={unit.id}
                  className="flex items-center justify-between rounded-lg border border-border p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-bold text-muted-foreground">
                      #{index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{unit.make} {unit.model}</p>
                      <p className="text-xs text-muted-foreground">{unit.plates}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground">
                      ${(unit.monthlySpend / 10000000).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-muted-foreground">{(unit.totalLiters / 10000000).toLocaleString()} L</p>
                  </div>
                </div>
              )) : (
                <p className="text-sm text-muted-foreground text-center py-4">No hay unidades registradas</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
