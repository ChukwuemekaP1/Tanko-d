"use client";

import { useEffect, useState } from "react"
import type { ReactNode } from "react"
import {
  AlertCircle,
  Calendar,
  Car,
  Fuel,
  type LucideIcon,
  MapPin,
  ReceiptText,
  Search,
  User,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/providers/auth-provider"

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://127.0.0.1:3001";

interface FuelLog {
  id: string;
  date: string;
  liters: number;
  amount: number;
  fuelType: string;
  station: string;
  stationAddress?: string;
  unit?: {
    plates: string;
    make: string;
    model: string;
  };
  user?: {
    name: string;
  };
}

function StatCard({
  label,
  value,
  icon: Icon,
  helper,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  helper?: string;
}) {
  return (
    <div className="rounded-xl border bg-background p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
        </div>
        <div className="rounded-full bg-muted p-2 text-muted-foreground">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      {helper ? (
        <p className="mt-3 text-xs text-muted-foreground">{helper}</p>
      ) : null}
    </div>
  );
}

export default function FuelLogsPage() {
  const t = useTranslations("consumos");
  const tCommon = useTranslations("common");
  const tFuel = useTranslations("fuelTypes");
  const { address: walletAddress } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams.toString();

  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const selectedRange = useMemo(() => {
    const start = searchParams.get("startDate");
    const end = searchParams.get("endDate");
    return {
      from: start ? parseISO(start) : undefined,
      to: end ? parseISO(end) : undefined,
    } as DateRangeValue;
  }, [searchParamsString]);

  useEffect(() => {
    async function fetchFuelLogs() {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        params.set("limit", "50");
        if (selectedRange?.from) params.set("startDate", format(selectedRange.from, "yyyy-MM-dd"));
        if (selectedRange?.to) params.set("endDate", format(selectedRange.to, "yyyy-MM-dd"));

        const res = await fetch(`${BACKEND}/api/v1/stats/recent-transactions?${params.toString()}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setFuelLogs(data.success && data.data ? data.data : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : tCommon("connectionError"));
        setFuelLogs([]);
      } finally {
        setLoading(false);
      }
    }
    fetchFuelLogs();
  }, [walletAddress, selectedRange?.from, selectedRange?.to]);

  const filtered = fuelLogs.filter(
    (c) =>
      c.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.unit?.make?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.unit?.plates?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.station?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalAmount = filtered.reduce((acc, c) => acc + c.amount, 0);
  const totalLiters = filtered.reduce((acc, c) => acc + c.liters, 0);

  const totalAmount = filtered.reduce((acc, c) => acc + c.amount, 0)
  const totalLiters = filtered.reduce((acc, c) => acc + c.liters, 0)

  if (error) {
    return <ErrorState title="Error al cargar registros" message={error} />
  }

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Fuel ledger"
        title="Registros de Combustible"
        description="Historial de cargas, estaciones, unidades y conductores registrados."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="Total gastado"
          value={`$${(totalAmount / 10000000).toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
          detail="Monto liberado"
          loading={loading}
        />
        <MetricCard
          label="Litros cargados"
          value={`${(totalLiters / 10000000).toLocaleString()} L`}
          detail="Volumen acumulado"
          loading={loading}
        />
        <MetricCard
          label="Transacciones"
          value={filtered.length.toString()}
          detail="Registros filtrados"
          loading={loading}
        />
      </div>

      <Card className="tanko-glass-subtle rounded-lg py-0">
        <CardHeader className="p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="text-title text-white">Cargas registradas</CardTitle>
              <CardDescription>Todas las cargas registradas en el sistema</CardDescription>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-glass pl-10"
                />
              </div>
              <Select value={filterPeriod} onValueChange={setFilterPeriod}>
                <SelectTrigger className="w-full bg-glass sm:w-40">
                  <SelectValue placeholder="Periodo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todo</SelectItem>
                  <SelectItem value="today">Hoy</SelectItem>
                  <SelectItem value="week">Esta semana</SelectItem>
                  <SelectItem value="month">Este mes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-5 pt-0">
          {loading ? (
            <ListSkeleton />
          ) : filtered.length > 0 ? (
            <div className="space-y-3">
              {filtered.map((log) => (
                <div
                  key={log.id}
                  className="rounded-lg border border-glass-border bg-glass p-5 transition-all hover:border-primary/30 hover:bg-glass-strong"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <Fuel className="h-6 w-6" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-title font-bold text-white">
                            ${(log.amount / 10000000).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                          </span>
                          <span className="rounded-md border border-glass-border bg-background/35 px-2 py-0.5 text-caption font-medium text-muted-foreground">
                            {(log.liters / 10000000).toFixed(0)} L
                          </span>
                          <span className="rounded-md border border-primary/20 bg-primary/10 px-2 py-0.5 text-caption font-medium text-primary">
                            {log.fuelType || "Diesel"}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-body-sm text-muted-foreground">
                          {log.user?.name && (
                            <InfoLine icon={User}>{log.user.name}</InfoLine>
                          )}
                          {log.unit && (
                            <InfoLine icon={Car}>
                              {log.unit.make} {log.unit.model} ({log.unit.plates})
                            </InfoLine>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-start gap-2 lg:items-end">
                      <div className="flex items-center gap-1.5 text-body-sm">
                        <MapPin className="h-4 w-4 text-primary" />
                        <span className="font-medium text-white">{log.station}</span>
                      </div>
                      {log.stationAddress && (
                        <p className="text-caption text-muted-foreground">{log.stationAddress}</p>
                      )}
                      <div className="flex items-center gap-1.5 text-caption text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(log.date).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" })}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium uppercase tracking-tight">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(log.date).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState>No hay registros de combustible</EmptyState>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PageHero({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <section className="tanko-glass rounded-lg p-5 lg:p-6">
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          <ReceiptText className="h-5 w-5" />
        </div>
        <div>
          <p className="text-micro font-semibold uppercase tracking-[0.28em] text-primary">{eyebrow}</p>
          <h1 className="mt-2 text-heading font-black text-white">{title}</h1>
          <p className="mt-2 max-w-2xl text-body-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </section>
  )
}

function MetricCard({ label, value, detail, loading }: { label: string; value: string; detail: string; loading: boolean }) {
  return (
    <Card className="tanko-glass-subtle rounded-lg py-0">
      <CardContent className="p-5">
        <p className="text-body-sm text-muted-foreground">{label}</p>
        {loading ? <Skeleton className="mt-3 h-8 w-28 bg-white/10" /> : <p className="mt-3 text-3xl font-black text-white">{value}</p>}
        <p className="mt-2 text-caption text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  )
}

function InfoLine({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) {
  return (
    <span className="flex items-center gap-1">
      <Icon className="h-3.5 w-3.5" />
      {children}
    </span>
  )
}

function ListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="rounded-lg border border-glass-border bg-glass p-5">
          <div className="flex gap-4">
            <Skeleton className="h-12 w-12 bg-white/10" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-6 w-44 bg-white/10" />
              <Skeleton className="h-4 w-2/3 bg-white/10" />
              <Skeleton className="h-4 w-1/2 bg-white/10" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function ErrorState({ title, message }: { title: string; message: string }) {
  return (
    <div className="flex h-[60vh] items-center justify-center">
      <div className="tanko-glass flex max-w-md flex-col items-center gap-4 rounded-lg px-8 py-7 text-center">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="font-semibold text-destructive">{title}</p>
        <p className="text-body-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  )
}

function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-glass-border bg-glass p-8 text-center text-body-sm text-muted-foreground">
      {children}
    </div>
  )
}
