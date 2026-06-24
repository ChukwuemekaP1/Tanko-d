"use client";

import { useState, useEffect } from "react";
import {
  Fuel,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import { useAuth } from "@/providers/auth-provider";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://127.0.0.1:3001";

interface FundRequest {
  id: string;
  liters: number;
  amount: number;
  description: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
}

const STATUS_CONFIG = {
  PENDING: {
    label: "Pendiente",
    icon: Clock,
    className:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  },
  APPROVED: {
    label: "Aprobada",
    icon: CheckCircle2,
    className:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
  REJECTED: {
    label: "Rechazada",
    icon: XCircle,
    className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  },
};

export default function SolicitudesPage() {
  const { userId } = useAuth();
  const [requests, setRequests] = useState<FundRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRequests() {
      if (!userId) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `${BACKEND}/api/v1/fund-requests?userId=${userId}`,
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setRequests(data.success && data.data ? data.data : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error de conexión");
        setRequests([]);
      } finally {
        setLoading(false);
      }
    }
    fetchRequests();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Cargando solicitudes...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <p className="font-medium text-destructive">
            Error al cargar solicitudes
          </p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Mis Solicitudes</h1>
        <p className="text-muted-foreground">
          Historial de tus solicitudes de combustible
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Solicitudes de Combustible</CardTitle>
          <CardDescription>
            Total: {requests.length} solicitudes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {requests.length > 0 ? (
            <div className="space-y-4">
              {requests.map((req) => {
                const status =
                  STATUS_CONFIG[req.status] ?? STATUS_CONFIG.PENDING;
                const StatusIcon = status.icon;
                return (
                  <div
                    key={req.id}
                    className="flex items-center justify-between rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/30"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Fuel className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {(req.liters / 10_000_000).toFixed(0)} L — $
                          {(req.amount / 10_000_000).toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                          })}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {req.description || "Sin descripción"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(req.createdAt).toLocaleDateString("es-MX", {
                            dateStyle: "medium",
                          })}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${status.className}`}
                    >
                      <StatusIcon className="h-3.5 w-3.5" />
                      {status.label}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <Empty className="border border-dashed border-border my-4">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Fuel className="size-5" />
                </EmptyMedia>
                <EmptyTitle>Sin solicitudes</EmptyTitle>
                <EmptyDescription>
                  Aún no has realizado ninguna solicitud de combustible. Tus
                  solicitudes aparecerán aquí.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
