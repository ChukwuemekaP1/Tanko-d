"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  Car,
  ChevronRight,
  LayoutDashboard,
  Loader2,
  LogOut,
  MapPin,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Receipt,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from "lucide-react"
import { AnimatePresence, motion } from "framer-motion"
import { useEffect, useState } from "react"
import { TankoLogoMinimal } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/providers/auth-provider"
import { cn } from "@/lib/utils"

const navigationJefe = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "Users", href: "/dashboard/usuarios", icon: Users },
  { name: "Fleet", href: "/dashboard/unidades", icon: Car },
  { name: "Fuel Logs", href: "/dashboard/consumos", icon: Receipt },
  { name: "Locations", href: "/dashboard/ubicaciones", icon: MapPin },
]

const sidebarVariants = {
  expanded: { width: 288 },
  collapsed: { width: 88 },
}

const pageTransition = {
  initial: { opacity: 0, y: 12, filter: "blur(4px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  exit: { opacity: 0, y: -8, filter: "blur(4px)" },
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { isConnected, isConnecting, address, role, disconnect } = useAuth()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Redirect unauthenticated users to the menu
  useEffect(() => {
    if (!isConnecting && !isConnected) {
      router.push("/menu")
    }
  }, [isConnected, isConnecting, router]);

  if (isConnecting || !isConnected) {
    return (
      <div className="relative flex h-screen items-center justify-center overflow-hidden bg-background">
        <div className="tanko-surface-grid absolute inset-0" />
        <div className="tanko-glass relative flex flex-col items-center gap-4 rounded-lg px-8 py-7">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-body-sm text-muted-foreground">
            Verifying connection...
          </p>
        </div>
      </div>
    );
  }

  const navigation = navigationJefe
  const shellSidebarWidth = isCollapsed ? "88px" : "288px"

  const handleDisconnect = () => {
    disconnect()
    router.push("/menu")
  }

  return (
    <div
      className="min-h-screen bg-background text-foreground"
      style={
        { "--shell-sidebar-width": shellSidebarWidth } as React.CSSProperties
      }
    >
      <div className="tanko-surface-grid pointer-events-none fixed inset-0" />

      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            className="fixed inset-0 z-40 bg-background/70 backdrop-blur-md lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      <motion.aside
        animate={isCollapsed ? "collapsed" : "expanded"}
        variants={sidebarVariants}
        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          "tanko-glass fixed inset-y-3 left-3 z-50 flex w-72 flex-col overflow-hidden rounded-lg",
          "transition-transform duration-300 ease-fluid lg:translate-x-0",
          isSidebarOpen ? "translate-x-0" : "-translate-x-[calc(100%+1rem)]",
        )}
      >
        <div className="flex h-[4.25rem] items-center justify-between border-b border-sidebar-border px-4">
          <Link
            href="/dashboard"
            className="flex min-w-0 items-center gap-3"
            onClick={() => setIsSidebarOpen(false)}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-primary/30 bg-primary/10 shadow-glow-blue">
              <TankoLogoMinimal size={22} className="text-primary" />
            </div>
            <AnimatePresence initial={false}>
              {!isCollapsed && (
                <motion.div
                  className="min-w-0"
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                >
                  <p className="text-title font-black tracking-[0.18em] text-white">
                    TANKO
                  </p>
                  <p className="text-micro uppercase tracking-[0.28em] text-muted-foreground">
                    Stellar Ops
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </Link>

          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="hidden text-muted-foreground hover:bg-white/10 hover:text-white lg:inline-flex"
              onClick={() => setIsCollapsed((value) => !value)}
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? (
                <PanelLeftOpen className="h-4 w-4" />
              ) : (
                <PanelLeftClose className="h-4 w-4" />
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground hover:bg-white/10 hover:text-white lg:hidden"
              onClick={() => setIsSidebarOpen(false)}
              aria-label="Close navigation"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="px-3 py-4">
          <div
            className={cn(
              "rounded-lg border border-primary/15 bg-primary/10 p-3",
              isCollapsed && "px-2",
            )}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <ShieldCheck className="h-4 w-4" />
              </div>
              {!isCollapsed && (
                <div className="min-w-0">
                  <p className="text-caption font-semibold text-white">
                    Escrow network
                  </p>
                  <p className="truncate text-micro uppercase tracking-[0.2em] text-muted-foreground">
                    Soroban verified
                  </p>
                </div>
              )}
  // Filter nav items to only those the current role can see
  const navigation = NAV_ITEMS.filter(
    (item) => item.roles.length === 0 || item.roles.includes(role),
  );

  const handleDisconnect = () => {
    disconnect();
    router.push("/menu");
  };

  const roleLabel = role === "CONDUCTOR" ? t("roles.driver") : t("roles.manager");

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
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          <button
            className="lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
            aria-label={t("nav.closeSidebar")}
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
                key={item.href}
                href={item.href}
                onClick={() => setIsSidebarOpen(false)}
                className={cn(
                  "group relative flex h-11 items-center gap-3 overflow-hidden rounded-md px-3 text-body-sm font-medium transition-all duration-200",
                style={isActive ? { backgroundColor: "#22c55e" } : undefined}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-glow-blue"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-white",
                  isCollapsed && "justify-center px-0",
                )}
                title={isCollapsed ? item.name : undefined}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!isCollapsed && (
                  <>
                    <span className="truncate">{item.name}</span>
                    <ChevronRight
                      className={cn(
                        "ml-auto h-4 w-4 opacity-0 transition-opacity group-hover:opacity-70",
                        isActive && "opacity-70",
                      )}
                    />
                  </>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-3 border-t border-sidebar-border p-3">
          <div
            className={cn(
              "rounded-lg border border-glass-border bg-glass p-3",
              isCollapsed && "px-2",
            )}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent/15 text-accent">
                <Activity className="h-4 w-4" />
              </div>
              {!isCollapsed && (
                <div className="min-w-0">
                  <p className="truncate text-caption font-medium text-white">
                    {role === "CONDUCTOR" ? "Driver" : "Fleet Manager"}
                  </p>
                  <p className="truncate font-mono text-micro text-muted-foreground">
                    {address?.slice(0, 8)}...{address?.slice(-8)}
                  </p>
                </div>
              )}
            </div>
          </div>

        {/* Disconnect */}
        <div
          style={{ borderTopColor: "rgba(255,255,255,0.08)" }}
          className="border-t p-3 space-y-0.5"
        >
          <button
            onClick={handleDisconnect}
            className={cn(
              "tanko-focus flex h-11 w-full items-center gap-3 rounded-md px-3 text-body-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive",
              isCollapsed && "justify-center px-0",
            )}
            title={isCollapsed ? "Disconnect" : undefined}
          >
            <LogOut className="h-5 w-5" />
            {!isCollapsed && <span>Disconnect</span>}
          </button>
        </div>
      </motion.aside>

      <motion.div
        className="relative flex min-h-screen flex-col lg:pl-[var(--shell-sidebar-width)]"
        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      >
        <header className="sticky top-0 z-30 border-b border-glass-border bg-background/65 px-4 backdrop-blur-2xl lg:px-6">
          <div className="flex h-[4.5rem] items-center gap-4">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:bg-white/10 hover:text-white lg:hidden"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Open navigation"
            >
              <Menu className="h-5 w-5" />
            </Button>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <p className="text-micro font-semibold uppercase tracking-[0.28em] text-primary">
                  Tanko Control Plane
                </p>
              </div>
              <p className="mt-1 truncate text-body-sm text-muted-foreground">
                Escrow-backed fuel operations on Stellar
      {/* Main content */}
      <div className="flex flex-1 flex-col lg:pl-64">
        {/* Top header */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-card px-4 lg:px-6">
          <button
            className="lg:hidden"
            onClick={() => setIsSidebarOpen(true)}
            aria-label={t("nav.openSidebar")}
          >
            <Menu className="h-6 w-6 text-foreground" />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <LanguageToggle />
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-foreground">{roleLabel}</p>
              <p className="text-xs text-muted-foreground font-mono">
                {address?.slice(0, 8)}...{address?.slice(-8)}
              </p>
            </div>

            <div className="ml-auto flex items-center gap-3">
              <div className="hidden rounded-md border border-success/20 bg-success/10 px-3 py-1.5 text-caption font-medium text-success sm:flex">
                Network online
              </div>
              <div className="flex items-center gap-3 rounded-lg border border-glass-border bg-glass px-2.5 py-2">
                <div className="hidden min-w-0 text-right sm:block">
                  <p className="text-caption font-medium text-white">
                    {role === "CONDUCTOR" ? "Driver" : "Fleet Manager"}
                  </p>
                  <p className="font-mono text-micro text-muted-foreground">
                    {address?.slice(0, 8)}...{address?.slice(-8)}
                  </p>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground text-caption font-bold shadow-glow-blue">
                  {address?.slice(0, 2)}
                </div>
              </div>
            </div>
          </div>
        </header>

        <AnimatePresence mode="wait">
          <motion.main
            key={pathname}
            variants={pageTransition}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="flex-1 p-4 lg:p-6"
          >
            {children}
          </motion.main>
        </AnimatePresence>
      </motion.div>
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
