"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  AlertCircle,
  Banknote,
  CalendarRange,
  Fuel,
  Loader2,
  Search,
  Users,
  X,
  MapPin,
  Calendar,
  User,
  Car,
  Filter,
} from "lucide-react";
import { format, isValid, parseISO } from "date-fns";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import { useAuth } from "@/providers/auth-provider";
import DateRangePicker, { type DateRangeValue } from "@/components/DateRangePicker";
import { Button } from "@/components/ui/button";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

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
        setError(err instanceof Error ? err.message : "Connection Error");
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

  const handleDateRangeChange = useCallback((value: DateRangeValue) => {
    const params = new URLSearchParams(searchParamsString);
    if (value?.from) params.set("startDate", format(value.from, "yyyy-MM-dd"));
    else params.delete("startDate");
    if (value?.to) params.set("endDate", format(value.to, "yyyy-MM-dd"));
    else params.delete("endDate");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [pathname, router, searchParamsString]);

  if (error) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center max-w-md px-4">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <h3 className="text-xl font-bold text-destructive">Unable to load records</h3>
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" onClick={() => window.location.reload()}>Retry Connection</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground uppercase">Fuel Logs</h1>
          <p className="text-muted-foreground mt-1">Audit trail for all fleet fueling operations.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Total Spend"
          value={`$${(totalAmount / 10000000).toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
          icon={Banknote}
          helper="Aggregated cost of filtered transactions."
        />
        <StatCard
          label="Total Volume"
          value={`${(totalLiters / 10000000).toLocaleString()} L`}
          icon={Fuel}
          helper="Total liters delivered to the fleet."
        />
        <StatCard
          label="Transactions"
          value={filtered.length.toString()}
          icon={Users}
          helper="Number of fueling events recorded."
        />
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center bg-card p-4 rounded-xl border border-border/40 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
          <Input
            placeholder="Search by driver, unit or station..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 bg-background border-muted"
          />
        </div>
        <DateRangePicker
          value={selectedRange}
          onChange={handleDateRangeChange}
          placeholder="Filter by date range"
          className="h-12 sm:w-auto"
        />
      </div>

      {loading ? (
        <div className="flex h-[40vh] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest">Synchronizing Logs...</p>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <Empty className="border border-dashed border-border py-16">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Fuel className="size-10 text-muted-foreground/40" />
            </EmptyMedia>
            <EmptyTitle className="text-xl font-bold mt-4">No records found</EmptyTitle>
            <EmptyDescription className="max-w-xs mx-auto mt-2">
              {searchQuery
                ? `No fueling logs match "${searchQuery}". Try adjusting your filters.`
                : "Your fleet hasn't recorded any fueling operations yet."}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="space-y-4">
          {filtered.map((log) => (
            <Card
              key={log.id}
              className="group overflow-hidden border-border/40 transition-all duration-300 hover:shadow-md hover:border-primary/20"
            >
              <CardContent className="p-0">
                <div className="flex flex-col lg:flex-row lg:items-stretch">
                  <div className="flex items-center gap-4 p-5 lg:w-2/3 border-b lg:border-b-0 lg:border-r border-border/50">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                      <Fuel className="h-7 w-7" />
                    </div>
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xl font-black text-foreground">
                          ${(log.amount / 10000000).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </span>
                        <span className="rounded-full bg-muted/80 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          {(log.liters / 10000000).toFixed(2)} L
                        </span>
                        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                          {log.fuelType || "Diesel"}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5 font-medium">
                          <User className="h-3.5 w-3.5" />
                          {log.user?.name || "Unknown Driver"}
                        </span>
                        <span className="flex items-center gap-1.5 font-medium">
                          <Car className="h-3.5 w-3.5" />
                          {log.unit ? `${log.unit.make} ${log.unit.model} (${log.unit.plates})` : "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col justify-center gap-2 p-5 bg-muted/5 lg:w-1/3">
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                      <div className="min-w-0">
                        <p className="font-bold text-foreground truncate">{log.station}</p>
                        {log.stationAddress && <p className="text-xs text-muted-foreground truncate">{log.stationAddress}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium uppercase tracking-tight">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(log.date).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
