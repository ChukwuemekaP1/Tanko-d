"use client";

import { UserCircle, Wallet } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/providers/auth-provider";

export default function PerfilPage() {
  const { address, role } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Mi Perfil</h1>
        <p className="text-muted-foreground">
          Información de tu cuenta y wallet
        </p>
      </div>

      <Card className="max-w-lg">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <UserCircle className="h-8 w-8 text-primary" />
            </div>
            <div>
              <CardTitle>Conductor</CardTitle>
              <CardDescription>
                {role === "CONDUCTOR" ? "Conductor de flota" : (role ?? "—")}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <div className="flex items-center gap-2 mb-1">
              <Wallet className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">
                Wallet Stellar
              </span>
            </div>
            <code className="text-xs font-mono text-muted-foreground break-all">
              {address ?? "—"}
            </code>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
