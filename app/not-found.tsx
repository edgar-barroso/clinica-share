import Link from "next/link";
import { Compass } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4 py-12 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Compass size={28} />
      </div>
      <div className="space-y-2">
        <p className="text-5xl font-bold text-foreground tabular-nums">404</p>
        <h1 className="text-xl font-semibold">Página não encontrada</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          O endereço que você tentou acessar não existe no ClinicaShare. Pode ser que a
          funcionalidade esteja prevista para uma fase futura do protótipo.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Link href="/dashboard" className={buttonVariants()}>
          Voltar ao dashboard
        </Link>
        <Link href="/" className={buttonVariants({ variant: "outline" })}>
          Ir para o login
        </Link>
      </div>
    </div>
  );
}
