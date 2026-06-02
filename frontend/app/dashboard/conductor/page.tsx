"use client";

import { useState, useEffect, useCallback } from "react";
import { Fuel, Loader2, Send } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/providers/auth-provider";
import { useToast } from "@/hooks/use-toast";

type FuelType = "MAGNA" | "PREMIUM" | "DIESEL";

interface OraclePrice {
  fuel_type: FuelType;
  price_mxn: number;
  price_usdc: number;
  timestamp: number;
  station_id: string;
}

interface EscrowReserve {
  liters: number;
  fuel_type: FuelType;
  price_per_liter_mxn: number;
  price_per_liter_usdc: number;
  total_mxn: number;
  total_usdc: number;
  total_usdc_stroops: number;
}

const FUEL_LABELS: Record<FuelType, string> = {
  MAGNA: "Gasolina Magna",
  PREMIUM: "Gasolina Premium",
  DIESEL: "Diésel",
};

const DEFAULT_MANAGER =
  process.env.NEXT_PUBLIC_MANAGER_PUBKEY ?? "";

export default function ConductorFundRequestPage() {
  const { address } = useAuth();
  const { toast } = useToast();

  const [prices, setPrices] = useState<OraclePrice[]>([]);
  const [fuelType, setFuelType] = useState<FuelType>("MAGNA");
  const [liters, setLiters] = useState("");
  const [managerPubKey, setManagerPubKey] = useState(DEFAULT_MANAGER);
  const [description, setDescription] = useState("");
  const [reserve, setReserve] = useState<EscrowReserve | null>(null);
  const [loadingPrices, setLoadingPrices] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadPrices() {
      setLoadingPrices(true);
      try {
        const res = await fetch("/api/oracle/prices");
        const data = await res.json();
        if (data.success && data.data?.prices) {
          setPrices(data.data.prices);
        }
      } catch {
        toast({
          title: "Error",
          description: "No se pudieron cargar los precios del oráculo",
          variant: "destructive",
        });
      } finally {
        setLoadingPrices(false);
      }
    }
    void loadPrices();
  }, [toast]);

  const fetchReserve = useCallback(async () => {
    const litersNum = parseFloat(liters);
    if (!Number.isFinite(litersNum) || litersNum <= 0) {
      setReserve(null);
      return;
    }
    try {
      const params = new URLSearchParams({
        liters: String(litersNum),
        fuelType,
      });
      const res = await fetch(`/api/oracle/calculate?${params}`);
      const data = await res.json();
      if (data.success) {
        setReserve(data.data);
      }
    } catch {
      setReserve(null);
    }
  }, [liters, fuelType]);

  useEffect(() => {
    const timer = setTimeout(() => void fetchReserve(), 300);
    return () => clearTimeout(timer);
  }, [fetchReserve]);

  const selectedPrice = prices.find((p) => p.fuel_type === fuelType);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!address) {
      toast({ title: "Wallet requerida", variant: "destructive" });
      return;
    }
    if (!managerPubKey) {
      toast({
        title: "Manager requerido",
        description: "Ingresa la clave pública del jefe de flota",
        variant: "destructive",
      });
      return;
    }
    if (!reserve) {
      toast({ title: "Calcula el monto primero", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/fund-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          driverPubKey: address,
          managerPubKey,
          liters: reserve.liters,
          amount: reserve.total_usdc_stroops,
          description:
            description ||
            `${FUEL_LABELS[fuelType]} — ${reserve.liters}L @ $${reserve.price_per_liter_mxn.toFixed(2)} MXN/L`,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Error al crear solicitud");
      }
      toast({
        title: "Solicitud enviada",
        description: `Reserva USDC: ${reserve.total_usdc.toFixed(4)}`,
      });
      setLiters("");
      setDescription("");
      setReserve(null);
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Error desconocido",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Solicitud de Combustible
        </h1>
        <p className="text-muted-foreground">
          Precios certificados por el oráculo Tanko — MXN y equivalente USDC
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Fuel className="h-5 w-5 text-primary" />
              Precios del Oráculo
            </CardTitle>
            <CardDescription>
              Valoración en tiempo real para reserva de escrow
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingPrices ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Cargando precios...
              </div>
            ) : (
              <div className="space-y-3">
                {(["MAGNA", "PREMIUM", "DIESEL"] as FuelType[]).map((fuel) => {
                  const p = prices.find((x) => x.fuel_type === fuel);
                  return (
                    <div
                      key={fuel}
                      className={`rounded-lg border p-3 ${
                        fuelType === fuel
                          ? "border-primary bg-primary/5"
                          : "border-border"
                      }`}
                    >
                      <p className="font-medium">{FUEL_LABELS[fuel]}</p>
                      {p ? (
                        <p className="text-sm text-muted-foreground">
                          ${p.price_mxn.toFixed(2)} MXN/L ·{" "}
                          {p.price_usdc.toFixed(4)} USDC/L
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground">—</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Nueva Solicitud</CardTitle>
            <CardDescription>
              El monto en USDC se calcula automáticamente vía FX
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Tipo de combustible</Label>
                <Select
                  value={fuelType}
                  onValueChange={(v) => setFuelType(v as FuelType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(["MAGNA", "PREMIUM", "DIESEL"] as FuelType[]).map(
                      (fuel) => (
                        <SelectItem key={fuel} value={fuel}>
                          {FUEL_LABELS[fuel]}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="liters">Litros</Label>
                <Input
                  id="liters"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="ej. 150"
                  value={liters}
                  onChange={(e) => setLiters(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="manager">Clave pública del jefe (G...)</Label>
                <Input
                  id="manager"
                  placeholder="G..."
                  value={managerPubKey}
                  onChange={(e) => setManagerPubKey(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción (opcional)</Label>
                <Input
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {selectedPrice && (
                <div className="rounded-lg bg-muted/50 p-3 text-sm">
                  <p>
                    Precio oráculo:{" "}
                    <strong>${selectedPrice.price_mxn.toFixed(2)} MXN/L</strong>{" "}
                    · <strong>{selectedPrice.price_usdc.toFixed(4)} USDC/L</strong>
                  </p>
                </div>
              )}

              {reserve && (
                <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
                  <p className="text-sm font-medium text-foreground">
                    Reserva de escrow estimada
                  </p>
                  <p className="mt-1 text-lg font-bold">
                    ${reserve.total_mxn.toLocaleString("es-MX", {
                      minimumFractionDigits: 2,
                    })}{" "}
                    MXN
                  </p>
                  <p className="text-lg font-bold text-primary">
                    {reserve.total_usdc.toFixed(4)} USDC
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {reserve.liters} L × ${reserve.price_per_liter_mxn.toFixed(2)}{" "}
                    MXN/L
                  </p>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Enviar solicitud
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
