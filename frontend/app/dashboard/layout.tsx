"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Car,
  MapPin,
  Receipt,
  LogOut,
  Menu,
  X,
  Fuel,
  UserCircle,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth, type UserRole } from "@/providers/auth-provider";
import { Loader2 } from "lucide-react";
import { TankoLogoMinimal } from "@/components/logo";

// ── Navigation config ────────────────────────────────────────────────────────
// Each item declares which roles can see it. An empty `roles` array means
// the item is visible to everyone who is authenticated.

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  roles: UserRole[];
}

const NAV_ITEMS: NavItem[] = [
  {
    name: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["JEFE"],
  },
  {
    name: "Users",
    href: "/dashboard/usuarios",
    icon: Users,
    roles: ["JEFE"],
  },
  {
    name: "Fleet",
    href: "/dashboard/unidades",
    icon: Car,
    roles: ["JEFE"],
  },
  {
    name: "Fuel Logs",
    href: "/dashboard/consumos",
    icon: Receipt,
    roles: ["JEFE"],
  },
  {
    name: "Locations",
    href: "/dashboard/ubicaciones",
    icon: MapPin,
    roles: ["JEFE"],
  },
  {
    name: "My Requests",
    href: "/dashboard/solicitudes",
    icon: Fuel,
    roles: ["CONDUCTOR"],
  },
  {
    name: "Profile",
    href: "/dashboard/perfil",
    icon: UserCircle,
    roles: ["CONDUCTOR"],
  },
];

// ── Role-based redirect map ──────────────────────────────────────────────────
// When a CONDUCTOR lands on a JEFE-only route, redirect them to their home.
const CONDUCTOR_HOME = "/dashboard/solicitudes";
const JEFE_ONLY_PREFIXES = [
  "/dashboard/usuarios",
  "/dashboard/unidades",
  "/dashboard/consumos",
  "/dashboard/ubicaciones",
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { isConnected, isConnecting, address, role, disconnect } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Redirect unauthenticated users to the menu
  useEffect(() => {
    if (!isConnecting && !isConnected) {
      router.push("/menu");
    }
  }, [isConnected, isConnecting, router]);

  // Redirect CONDUCTORs away from JEFE-only routes
  useEffect(() => {
    if (role === "CONDUCTOR") {
      const isOnJefeRoute = JEFE_ONLY_PREFIXES.some((prefix) =>
        pathname.startsWith(prefix),
      );
      // Also redirect the bare /dashboard overview to the conductor home
      if (isOnJefeRoute || pathname === "/dashboard") {
        router.replace(CONDUCTOR_HOME);
      }
    }
  }, [role, pathname, router]);

  if (isConnecting || !isConnected) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Verifying connection...
          </p>
        </div>
      </div>
    );
  }

  // Filter nav items to only those the current role can see
  const navigation = NAV_ITEMS.filter(
    (item) => item.roles.length === 0 || item.roles.includes(role),
  );

  const handleDisconnect = () => {
    disconnect();
    router.push("/menu");
  };

  const roleLabel = role === "CONDUCTOR" ? "Driver" : "Fleet Manager";

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        style={{ backgroundColor: "#1B2D4F" }}
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col transition-transform lg:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div
          style={{ borderBottomColor: "rgba(255,255,255,0.08)" }}
          className="flex h-16 items-center justify-between border-b px-5"
        >
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
              <TankoLogoMinimal size={20} className="text-white" />
            </div>
            <span className="text-xl font-black tracking-widest text-white">
              TANKO
            </span>
          </div>
          <button
            className="lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5 text-white/50" />
          </button>
        </div>

        {/* Role badge */}
        <div className="px-5 pt-4 pb-1">
          <span className="inline-flex items-center rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-medium text-white/70">
            {roleLabel}
          </span>
        </div>

        {/* Nav links */}
        <nav className="flex-1 space-y-0.5 p-3 pt-2">
          {navigation.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsSidebarOpen(false)}
                style={isActive ? { backgroundColor: "#22c55e" } : undefined}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "text-white shadow-md"
                    : "text-white/60 hover:bg-white/10 hover:text-white"
                }`}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Disconnect */}
        <div
          style={{ borderTopColor: "rgba(255,255,255,0.08)" }}
          className="border-t p-3 space-y-0.5"
        >
          <button
            onClick={handleDisconnect}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/60 hover:bg-white/10 hover:text-white transition-colors"
          >
            <LogOut className="h-5 w-5" />
            Disconnect
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col lg:pl-64">
        {/* Top header */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-card px-4 lg:px-6">
          <button
            className="lg:hidden"
            onClick={() => setIsSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <Menu className="h-6 w-6 text-foreground" />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-foreground">{roleLabel}</p>
              <p className="text-xs text-muted-foreground font-mono">
                {address?.slice(0, 8)}...{address?.slice(-8)}
              </p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
              {address?.slice(0, 2)}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
