"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[ClinicaShare] erro global:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4 py-12 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
        <AlertTriangle size={28} />
      </div>
      <div className="space-y-2">
        <h1 className="text-xl font-semibold">Algo deu errado</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Não foi possível carregar esta página. Tente novamente em alguns instantes ou
          volte ao dashboard.
        </p>
        {error.digest && (
          <p className="text-xs text-muted-foreground">
            Referência técnica:{" "}
            <code className="rounded bg-muted px-1.5 py-0.5">{error.digest}</code>
          </p>
        )}
      </div>
      <Button onClick={reset}>
        <RotateCcw size={16} />
        Tentar novamente
      </Button>
    </div>
  );
}
