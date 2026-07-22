"use client";

import { useEffect, useState } from "react"
import type { ReactNode } from "react"
import {
  AlertCircle,
  Car,
  Mail,
  Phone,
  Search,
  Users,
  type LucideIcon,
} from "lucide-react"
import { Input } from "@/components/ui/input"
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
import { useTranslations } from "next-intl";
import { useAuth } from "@/providers/auth-provider";
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/providers/auth-provider"
import { cn } from "@/lib/utils"

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://127.0.0.1:3001";

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  stellarPubKey: string;
  role: string;
  units?: Array<{
    id: string;
    plates: string;
    make: string;
    model: string;
  }>;
  createdAt: string;
}

export default function UsersPage() {
  const t = useTranslations("usuarios");
  const tCommon = useTranslations("common");
  const tRoles = useTranslations("roles");
  const { address: walletAddress } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function fetchUsers() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${BACKEND}/api/v1/users`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setUsers(data.success && data.data ? data.data : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : tCommon("connectionError"));
        setUsers([]);
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, [walletAddress]);

  const filteredUsers = users.filter(
    (user) =>
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.stellarPubKey?.toLowerCase().includes(searchQuery.toLowerCase()),
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
  const managerCount = users.filter(user => user.role === "JEFE").length
  const driverCount = users.filter(user => user.role !== "JEFE").length
  const assignedUnits = users.reduce((total, user) => total + (user.units?.length || 0), 0)

  if (error) {
    return <ErrorState title="Error al cargar usuarios" message={error} />
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
        <p className="text-muted-foreground">
          {t("subtitle")}
        </p>
      <PageHero
        eyebrow="Identity registry"
        title="Usuarios"
        description="Gestionar conductores y usuarios conectados a la wallet de flota."
        icon={Users}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Usuarios" value={users.length.toString()} detail="Registros totales" loading={loading} />
        <MetricCard label="Conductores" value={driverCount.toString()} detail="Operación activa" loading={loading} />
        <MetricCard label="Unidades asignadas" value={assignedUnits.toString()} detail={`${managerCount} jefes de flota`} loading={loading} />
      </div>

      <Card className="tanko-glass-subtle rounded-lg py-0">
        <CardHeader className="p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>{t("listTitle")}</CardTitle>
              <CardDescription>
                {t("total", { count: users.length })}
              </CardDescription>
              <CardTitle className="text-title text-white">Lista de usuarios</CardTitle>
              <CardDescription>Total: {users.length} usuarios registrados</CardDescription>
            </div>
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t("searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-glass pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-5 pt-0">
          {loading ? (
            <TableSkeleton columns={5} />
          ) : filteredUsers.length > 0 ? (
            <div className="overflow-x-auto rounded-lg border border-glass-border bg-glass">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-glass-border">
                    <th className="px-4 py-3 text-left text-caption font-semibold uppercase tracking-[0.18em] text-muted-foreground">Usuario</th>
                    <th className="px-4 py-3 text-left text-caption font-semibold uppercase tracking-[0.18em] text-muted-foreground">Contacto</th>
                    <th className="px-4 py-3 text-left text-caption font-semibold uppercase tracking-[0.18em] text-muted-foreground">Wallet</th>
                    <th className="px-4 py-3 text-left text-caption font-semibold uppercase tracking-[0.18em] text-muted-foreground">Unidades</th>
                    <th className="px-4 py-3 text-left text-caption font-semibold uppercase tracking-[0.18em] text-muted-foreground">Rol</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-glass-border">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="transition-colors hover:bg-white/[0.03]">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-md border border-primary/20 bg-primary/10 text-caption font-bold text-primary">
                            {user.name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">
                              {user.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {t("createdAt", {
                                date: new Date(user.createdAt).toLocaleDateString("es-MX"),
                              })}
                            <p className="font-semibold text-white">{user.name}</p>
                            <p className="text-caption text-muted-foreground">
                              Creado: {new Date(user.createdAt).toLocaleDateString("es-MX")}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          {user.email && (
                            <p className="flex items-center gap-1.5 text-body-sm text-white">
                              <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                              {user.email}
                            </p>
                          )}
                          {user.phone && (
                            <p className="flex items-center gap-1.5 text-body-sm text-white">
                              <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                              {user.phone}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <code className="font-mono text-caption text-muted-foreground">
                          {user.stellarPubKey.slice(0, 12)}...{user.stellarPubKey.slice(-8)}
                        </code>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5">
                          <Car className="h-4 w-4 text-primary" />
                          <span className="text-body-sm text-white">{user.units?.length || 0}</span>
                        </div>
                      </td>
                      <td className="py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            user.role === "JEFE"
                              ? "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400"
                              : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                          }`}
                        >
                          {user.role === "JEFE" ? tRoles("manager") : tRoles("driver")}
                        </span>
                      <td className="px-4 py-4">
                        <RoleBadge role={user.role} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty className="border border-dashed border-border my-4">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Users className="size-5" />
                </EmptyMedia>
                <EmptyTitle>
                  {searchQuery ? tCommon("noResults") : t("noDrivers")}
                </EmptyTitle>
                <EmptyDescription>
                  {searchQuery
                    ? t("noMatch", { query: searchQuery })
                    : t("emptyDesc")}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
            <EmptyState>No hay usuarios registrados</EmptyState>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PageHero({ eyebrow, title, description, icon: Icon }: { eyebrow: string; title: string; description: string; icon: LucideIcon }) {
  return (
    <section className="tanko-glass rounded-lg p-5 lg:p-6">
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
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
        {loading ? <Skeleton className="mt-3 h-8 w-20 bg-white/10" /> : <p className="mt-3 text-3xl font-black text-white">{value}</p>}
        <p className="mt-2 text-caption text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  )
}

function RoleBadge({ role }: { role: string }) {
  const isManager = role === "JEFE"

  return (
    <span
      className={cn(
        "inline-flex rounded-md border px-2.5 py-1 text-caption font-semibold",
        isManager
          ? "border-accent/25 bg-accent/10 text-accent"
          : "border-primary/20 bg-primary/10 text-primary",
      )}
    >
      {isManager ? "Jefe de Flota" : "Conductor"}
    </span>
  )
}

function TableSkeleton({ columns }: { columns: number }) {
  return (
    <div className="rounded-lg border border-glass-border bg-glass p-4">
      {Array.from({ length: 5 }).map((_, row) => (
        <div key={row} className="grid gap-4 border-b border-glass-border py-4 last:border-0 md:grid-cols-5">
          {Array.from({ length: columns }).map((__, column) => (
            <Skeleton key={column} className="h-5 bg-white/10" />
          ))}
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
