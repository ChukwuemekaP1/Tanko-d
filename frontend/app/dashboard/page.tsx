"use client";

import { useEffect, useState } from "react"
import type { ReactNode } from "react"
import {
  AlertCircle,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  Clock,
  DollarSign,
  Droplets,
  Fuel,
  Loader2,
  LucideIcon,
  Receipt,
  ShieldCheck,
  Truck,
  Users,
  XCircle,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { useAuth } from "@/providers/auth-provider"
import { cn } from "@/lib/utils"

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://127.0.0.1:3001";

interface DashboardStats {
  totalSpent: number;
  totalLiters: number;
  transactionCount: number;
  activeUsers: number;
  registeredUnits: number;
  activeUnits: number;
  escrowBalance: number;
  totalReleased: number;
  pendingRequests: number;
}

interface MonthlyStats {
  month: string;
  spend: number;
  liters: number;
  transactionCount: number;
}

interface PendingRequest {
  id: string;
  liters: number;
  amount: number;
  description: string;
  status: string;
  createdAt: string;
  driver: {
    name: string;
    stellarPubKey: string;
  };
}

interface RecentTransaction {
  id: string;
  date: string;
  driver: string;
  unit: string;
  plates: string;
  station: string;
  amount: number;
  liters: number;
}

interface TopUnit {
  id: string;
  make: string;
  model: string;
  plates: string;
  monthlySpend: number;
  totalLiters: number;
  driverName: string;
}

export default function DashboardPage() {
  const { address: walletAddress, role, userId } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<
    RecentTransaction[]
  >([]);
  const [topUnits, setTopUnits] = useState<TopUnit[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const [kycData, setKycData] = useState<any>(null);
  const [showKYCForm, setShowKYCForm] = useState(false);

  const fetchKYC = async () => {
    if (!userId) return;
    try {
      const res = await fetch(`${BACKEND}/api/v1/kyc/${userId}`);
      const data = await res.json();
      if (data.success) {
        setKycData(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch KYC", err);
    }
  };

  useEffect(() => {
    fetchKYC();
  }, [userId]);

  useEffect(() => {
    async function fetchData() {
      if (!walletAddress) {
        setLoading(false);
        return;
      }

      try {
        const [statsRes, monthlyRes, transactionsRes, topUnitsRes, pendingRes] =
          await Promise.all([
            fetch(`${BACKEND}/api/v1/stats/dashboard`),
            fetch(`${BACKEND}/api/v1/stats/monthly`),
            fetch(`${BACKEND}/api/v1/stats/recent-transactions?limit=5`),
            fetch(`${BACKEND}/api/v1/stats/top-units?limit=5`),
            fetch(`${BACKEND}/api/v1/funds/manager/${walletAddress}/pending`),
          ]);

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData.data);
        }

        if (monthlyRes.ok) {
          const monthlyData = await monthlyRes.json();
          setMonthlyStats(monthlyData.data);
        }

        if (transactionsRes.ok) {
          const transactionsData = await transactionsRes.json();
          setRecentTransactions(transactionsData.data);
        }

        if (topUnitsRes.ok) {
          const unitsData = await topUnitsRes.json();
          setTopUnits(unitsData.data);
        }

        if (pendingRes.ok) {
          const pendingData = await pendingRes.json();
          setPendingRequests(pendingData.data || []);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [walletAddress]);

  const handleApprove = async (requestId: string) => {
    setProcessingId(requestId);
    try {
      const res = await fetch(`${BACKEND}/api/v1/trustless/solicitud/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        toast.success("Solicitud aprobada");
        setPendingRequests((prev) => prev.filter((r) => r.id !== requestId));
      } else {
        toast.error("Error al aprobar", { description: data.error });
      }
    } catch (err) {
      toast.error("Error de conexión");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (requestId: string) => {
    setProcessingId(requestId);
    try {
      const res = await fetch(`${BACKEND}/api/v1/trustless/solicitud/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        toast.success("Solicitud rechazada");
        setPendingRequests((prev) => prev.filter((r) => r.id !== requestId));
      } else {
        toast.error("Error al rechazar", { description: data.error });
      }
    } catch (err) {
      toast.error("Error de conexión");
    } finally {
      setProcessingId(null);
    }
  };

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
  };

  const displayStats = stats || defaultStats;

  const statsCards = [
    {
      title: "Total liberado",
      value: `$${(displayStats.totalReleased / 10000000).toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
      detail: "USD via escrow",
      icon: DollarSign,
      tone: "primary" as const,
    },
    {
      title: "Solicitudes pendientes",
      value: displayStats.pendingRequests.toString(),
      detail: pendingRequests.length > 0 ? "Requieren revisión" : "Sin bloqueos",
      icon: Clock,
      tone: "warning" as const,
    },
    {
      title: "Conductores activos",
      value: displayStats.activeUsers.toString(),
      detail: `${displayStats.registeredUnits} unidades registradas`,
      icon: Users,
      tone: "accent" as const,
    },
    {
      title: "Litros cargados",
      value: `${(displayStats.totalLiters / 10000000).toLocaleString()} L`,
      detail: `${displayStats.transactionCount} transacciones`,
      icon: Droplets,
      tone: "success" as const,
    },
  ];

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="tanko-glass flex flex-col items-center gap-4 rounded-lg px-8 py-7">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-body-sm text-muted-foreground">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="tanko-glass overflow-hidden rounded-lg p-5 lg:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2 text-micro font-semibold uppercase tracking-[0.28em] text-primary">
              <ShieldCheck className="h-4 w-4" />
              Fleet control plane
            </div>
            <h1 className="text-heading font-black text-white">Panel de Control</h1>
            <p className="mt-2 max-w-2xl text-body-sm text-muted-foreground">
              Resumen operativo de solicitudes, liberaciones, litros y unidades
              para tu flota conectada a Tanko.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:flex">
            <Signal label="Escrow" value={`$${(displayStats.escrowBalance / 10000000).toLocaleString("en-US", { minimumFractionDigits: 2 })}`} />
            <Signal label="Activas" value={displayStats.activeUnits.toString()} />
          </div>
        </div>
      </section>

      {role === "CONDUCTOR" && kycData?.status !== "VERIFIED" && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-900/10">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <CardTitle className="text-amber-800 dark:text-amber-400">
                KYC Verification Required
              </CardTitle>
            </div>
            <CardDescription className="text-amber-700 dark:text-amber-500">
              {kycData?.status === "PENDING"
                ? "Your KYC is currently under review. Please wait for an administrator to verify it."
                : "You need to verify your driver's license before you can operate fleet units."}
            </CardDescription>
          </CardHeader>
          {kycData?.status !== "PENDING" && (
            <CardContent>
              {!showKYCForm ? (
                <Button onClick={() => setShowKYCForm(true)}>
                  Start Verification
                </Button>
              ) : (
                <div className="max-w-md bg-background p-6 rounded-xl border shadow-sm">
                  <DriverKYCForm
                    userId={userId!}
                    onSuccess={() => {
                      setShowKYCForm(false);
                      fetchKYC();
                    }}
                  />
                </div>
              )}
            </CardContent>
          )}
        </Card>
      )}

      {pendingRequests.length > 0 && (
        <Card className="tanko-glass rounded-lg border-warning/25 py-0">
          <CardHeader className="border-b border-warning/15 p-5">
            <CardTitle className="flex items-center gap-2 text-title text-white">
              <AlertCircle className="h-5 w-5 text-warning" />
              Solicitudes Pendientes ({pendingRequests.length})
            </CardTitle>
            <CardDescription>
              Revisa y aprueba las solicitudes de combustible de tus conductores.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 p-5">
            {pendingRequests.slice(0, 3).map((request) => (
              <div
                key={request.id}
                className="grid gap-4 rounded-lg border border-glass-border bg-glass p-4 sm:grid-cols-[1fr_auto] sm:items-center"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-warning/10 text-warning">
                    <Fuel className="h-6 w-6" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-white">{request.driver?.name || "Conductor"}</p>
                    <p className="text-body-sm text-muted-foreground">
                      {request.liters}L · ${(request.amount / 10000000).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-caption text-muted-foreground">
                      {new Date(request.createdAt).toLocaleDateString("es-MX", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleReject(request.id)}
                    disabled={processingId === request.id}
                    className="border-destructive/30 text-destructive hover:bg-destructive/10"
                    aria-label="Rechazar solicitud"
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
                    className="bg-success text-success-foreground hover:bg-success/90"
                    aria-label="Aprobar solicitud"
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
              <p className="text-center text-body-sm text-muted-foreground">
                y {pendingRequests.length - 3} solicitudes más...
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statsCards.map((stat) => (
          <MetricCard key={stat.title} {...stat} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <DashboardChart
          title="Gasto Mensual"
          description="Gasto en combustible (USD) últimos 6 meses"
          icon={BarChart3}
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyStats.length > 0 ? monthlyStats : []}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgb(255 255 255 / 0.08)" />
              <XAxis dataKey="month" tick={{ fill: "#8f9bb3", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fill: "#8f9bb3", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => `$${(value / 1000000).toFixed(0)}M`}
              />
              <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [`$${(value / 10000000).toLocaleString("en-US")}`, "Gasto"]} />
              <Area type="monotone" dataKey="spend" stroke="var(--primary)" fill="rgb(0 194 255 / 0.18)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </DashboardChart>

        <DashboardChart
          title="Litros por Mes"
          description="Volumen de combustible cargado por mes"
          icon={Droplets}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyStats.length > 0 ? monthlyStats : []}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgb(255 255 255 / 0.08)" />
              <XAxis dataKey="month" tick={{ fill: "#8f9bb3", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#8f9bb3", fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [`${(value / 10000000).toLocaleString("en-US")} L`, "Litros"]} />
              <Bar dataKey="liters" fill="var(--primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </DashboardChart>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ActivityPanel
          title="Transacciones Recientes"
          description="Últimas cargas de combustible registradas"
          icon={Receipt}
        >
          {recentTransactions.length > 0 ? recentTransactions.map((tx) => (
            <ListRow
              key={tx.id}
              icon={Fuel}
              title={tx.driver}
              subtitle={`${tx.unit} - ${tx.plates}`}
              value={`$${(tx.amount / 10000000).toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
              meta={`${(tx.liters / 10000000).toLocaleString()} L`}
            />
          )) : (
            <EmptyState>No hay transacciones aún</EmptyState>
          )}
        </ActivityPanel>

        <ActivityPanel
          title="Unidades con Mayor Consumo"
          description="Top 5 unidades por gasto de combustible este mes"
          icon={Truck}
        >
          {topUnits.length > 0 ? topUnits.map((unit, index) => (
            <ListRow
              key={unit.id}
              badge={`#${index + 1}`}
              title={`${unit.make} ${unit.model}`}
              subtitle={unit.plates}
              value={`$${(unit.monthlySpend / 10000000).toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
              meta={`${(unit.totalLiters / 10000000).toLocaleString()} L`}
            />
          )) : (
            <EmptyState>No hay unidades registradas</EmptyState>
          )}
        </ActivityPanel>
      </div>
    </div>
  )
}

const tooltipStyle = {
  backgroundColor: "var(--card)",
  border: "1px solid var(--glass-border)",
  borderRadius: "8px",
  color: "var(--foreground)",
}

function Signal({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-glass-border bg-glass px-4 py-3">
      <p className="text-micro font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-title font-bold text-white">{value}</p>
    </div>
  )
}

function MetricCard({
  title,
  value,
  detail,
  icon: Icon,
  tone,
}: {
  title: string
  value: string
  detail: string
  icon: LucideIcon
  tone: "primary" | "warning" | "accent" | "success"
}) {
  const toneClass = {
    primary: "bg-primary/10 text-primary border-primary/20",
    warning: "bg-warning/10 text-warning border-warning/20",
    accent: "bg-accent/10 text-accent border-accent/20",
    success: "bg-success/10 text-success border-success/20",
  }[tone]

  return (
    <Card className="tanko-glass-subtle rounded-lg py-0">
      <CardContent className="p-5">
        <div className="mb-5 flex items-center justify-between gap-3">
          <p className="text-body-sm font-medium text-muted-foreground">{title}</p>
          <div className={cn("flex h-10 w-10 items-center justify-center rounded-md border", toneClass)}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
        <p className="text-3xl font-black text-white">{value}</p>
        <div className="mt-3 flex items-center gap-1 text-caption text-muted-foreground">
          <ArrowUpRight className="h-3.5 w-3.5 text-success" />
          <span>{detail}</span>
        </div>
      </CardContent>
    </Card>
  )
}

function DashboardChart({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string
  description: string
  icon: LucideIcon
  children: ReactNode
}) {
  return (
    <Card className="tanko-glass-subtle rounded-lg py-0">
      <CardHeader className="p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-title text-white">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-5 pt-0">
        <div className="h-[300px]">{children}</div>
      </CardContent>
    </Card>
  )
}

function ActivityPanel({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string
  description: string
  icon: LucideIcon
  children: ReactNode
}) {
  return (
    <Card className="tanko-glass-subtle rounded-lg py-0">
      <CardHeader className="p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-title text-white">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 p-5 pt-0">{children}</CardContent>
    </Card>
  )
}

function ListRow({
  icon: Icon,
  badge,
  title,
  subtitle,
  value,
  meta,
}: {
  icon?: LucideIcon
  badge?: string
  title: string
  subtitle: string
  value: string
  meta: string
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-glass-border bg-glass p-3">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          {Icon ? <Icon className="h-5 w-5" /> : <span className="text-caption font-bold">{badge}</span>}
        </div>
        <div className="min-w-0">
          <p className="truncate text-body-sm font-semibold text-white">{title}</p>
          <p className="truncate text-caption text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-body-sm font-semibold text-white">{value}</p>
        <p className="text-caption text-muted-foreground">{meta}</p>
      </div>
    </div>
  );
}

function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-glass-border bg-glass p-6 text-center text-body-sm text-muted-foreground">
      {children}
    </div>
  )
}
