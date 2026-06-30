"use client";

import { useState, useEffect } from "react";
import {
  Search,
  MoreHorizontal,
  Car,
  User,
  Loader2,
  AlertCircle,
  Calendar,
  Eye,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { useTranslations } from "next-intl"
import { useAuth } from "@/providers/auth-provider"
import { UnitGrid } from "@/components/UnitGrid"
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://127.0.0.1:3001";

interface Unit {
  id: string;
  make: string;
  model: string;
  year?: number;
  plates: string;
  isActive: boolean;
  specs?: string;
  permitNumber?: string;
  permitExpiry?: string;
  user?: {
    name: string;
  };
}

export default function UnidadesPage() {
  const t = useTranslations("unidades");
  const tCommon = useTranslations("common");
  const { address: walletAddress } = useAuth();
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function fetchUnits() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${BACKEND}/api/v1/units`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setUnits(data.success && data.data ? data.data : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : tCommon("connectionError"));
        setUnits([]);
      } finally {
        setLoading(false);
      }
    }
    fetchUnits();
  }, [walletAddress]);

  const filteredUnits = units.filter(
    (unit) =>
      unit.make?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      unit.model?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      unit.plates?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      unit.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">{t("loading")}</p>
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
            {t("loadError")}
          </p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
        <p className="text-muted-foreground">
          {t("subtitle")}
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>{t("listTitle")}</CardTitle>
              <CardDescription>
                {t("total", { count: units.length })}
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t("searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <UnitGrid 
            units={filteredUnits} 
            onUnitAction={(action, unit) => {
              console.log(`[Units] Action: ${action} on unit:`, unit)
              // Here would go the logic to open modals/forms as mentioned in issue
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
