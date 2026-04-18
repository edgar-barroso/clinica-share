import Link from "next/link";
import {
  Bell,
  Calendar,
  ChevronRight,
  Clock,
  MessageCircle,
  Plus,
  Stethoscope,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  atendimentos,
  getConsultorio,
  getProfissional,
} from "@/lib/mock/data";
import { formatDateLong, formatRelative } from "@/lib/format";

const PACIENTE_ID = "pt01";

function initials(name: string) {
  const parts = name.split(" ").filter((p) => !["Dr.", "Dra."].includes(p));
  return (parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "");
}

export default function PatientHomePage() {
  const minhasConsultas = atendimentos.filter(
    (a) => a.pacienteId === PACIENTE_ID,
  );
  const futuras = minhasConsultas
    .filter((a) => a.status === "agendado" || a.status === "confirmado")
    .sort((a, b) => `${a.data}T${a.hora}`.localeCompare(`${b.data}T${b.hora}`));
  const proxima = futuras[0];
  const realizadas = minhasConsultas
    .filter((a) => a.status === "realizado")
    .sort((a, b) => `${b.data}T${b.hora}`.localeCompare(`${a.data}T${a.hora}`));

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Olá, 👋</p>
          <h1 className="text-xl font-bold">João Pereira</h1>
        </div>
        <button
          type="button"
          className="relative flex size-11 items-center justify-center rounded-full bg-card border border-border"
          aria-label="Notificações"
        >
          <Bell size={18} />
          <span className="absolute right-2.5 top-2.5 size-2 rounded-full bg-destructive" />
        </button>
      </div>

      {proxima ? (
        <Card className="mb-6 overflow-hidden border-0 bg-primary text-primary-foreground">
          <CardContent className="p-5">
            <p className="text-xs font-medium opacity-80">Sua próxima consulta</p>
            <p className="mt-2 text-2xl font-bold leading-tight">
              {formatDateLong(proxima.data)}
            </p>
            <p className="mt-0.5 text-lg font-semibold opacity-90 tabular-nums">
              {proxima.hora}
            </p>

            <div className="mt-5 flex items-center gap-3 rounded-2xl bg-white/10 p-3">
              <div className="flex size-12 items-center justify-center rounded-xl bg-white text-primary font-semibold">
                {initials(getProfissional(proxima.profissionalId)?.nome ?? "—")}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  {getProfissional(proxima.profissionalId)?.nome}
                </p>
                <p className="truncate text-xs opacity-80">
                  {getProfissional(proxima.profissionalId)?.especialidade} ·{" "}
                  {getConsultorio(proxima.consultorioId)?.nome}
                </p>
              </div>
            </div>

            <Link
              href={`/p/consultas/${proxima.id}`}
              className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-white"
            >
              Ver detalhes
              <ChevronRight size={14} />
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card className="mb-6 border-dashed p-6 text-center">
          <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Calendar size={22} />
          </div>
          <p className="font-semibold">Nenhuma consulta agendada</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Agende sua próxima visita com um dos nossos especialistas.
          </p>
          <Link href="/p/agendar" className={buttonVariants({ className: "mt-4" })}>
            <Plus size={16} />
            Agendar consulta
          </Link>
        </Card>
      )}

      <section className="mb-6 grid grid-cols-2 gap-3">
        <QuickAction href="/p/agendar" icon={Plus} label="Agendar" tone="primary" />
        <QuickAction
          href="/p/consultas"
          icon={Calendar}
          label={`${futuras.length} próximas`}
        />
        <QuickAction
          href="#"
          icon={MessageCircle}
          label="Mensagens"
          badge="2"
        />
        <QuickAction href="/p/perfil" icon={Stethoscope} label="Meu perfil" />
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold">Histórico recente</h2>
          <Link
            href="/p/consultas"
            className="text-xs font-medium text-primary hover:underline"
          >
            Ver tudo
          </Link>
        </div>

        <div className="space-y-3">
          {realizadas.slice(0, 3).map((a) => {
            const prof = getProfissional(a.profissionalId);
            return (
              <Link key={a.id} href={`/p/consultas/${a.id}`} className="block">
                <Card className="transition-colors hover:border-primary/30">
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-sm font-semibold text-primary">
                      {initials(prof?.nome ?? "—")}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{prof?.nome}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {prof?.especialidade}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
                        <Clock size={10} />
                        {formatRelative(a.data)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
          {realizadas.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Você ainda não tem consultas realizadas.
            </p>
          )}
        </div>
      </section>
    </>
  );
}

function QuickAction({
  href,
  icon: Icon,
  label,
  badge,
  tone,
}: {
  href: string;
  icon: typeof Plus;
  label: string;
  badge?: string;
  tone?: "primary";
}) {
  const primary = tone === "primary";
  return (
    <Link
      href={href}
      className={`relative flex items-center gap-2 rounded-2xl px-4 py-3.5 transition-colors ${
        primary
          ? "bg-primary text-primary-foreground"
          : "bg-card border border-border hover:border-primary/30"
      }`}
    >
      <div
        className={`flex size-9 items-center justify-center rounded-xl ${
          primary ? "bg-white/20" : "bg-primary/10 text-primary"
        }`}
      >
        <Icon size={16} />
      </div>
      <span className="text-sm font-medium">{label}</span>
      {badge && (
        <span className="absolute right-3 top-3 flex size-5 items-center justify-center rounded-full bg-destructive text-[10px] font-semibold text-destructive-foreground">
          {badge}
        </span>
      )}
    </Link>
  );
}
