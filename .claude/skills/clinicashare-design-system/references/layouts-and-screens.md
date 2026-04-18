# Layouts and Screen Recipes

This file covers full-page composition: the app shells, navigation, and the canonical layout for each major screen. Use these as starting points — copy the JSX, swap content, keep spacing.

## 1. Actor matrix (who uses what shell)

| Actor | Primary device | Shell | Density |
| --- | --- | --- | --- |
| Dr. Edson (Administrador) | Desktop | `AppShell` (sidebar + topbar) | High |
| Auxiliar Financeiro       | Desktop | `AppShell` (restrito ao Financeiro) | High |
| Profissional de Saúde     | Desktop / tablet | `AppShell` (módulos próprios) | Medium |
| Atendente do Profissional | Tablet  | `AppShell` (compacto) | Medium |
| Paciente                  | Mobile  | `PatientShell` (BottomNav) | Low |

Shells live in `components/layouts/`.

## 2. AppShell (web — admin / professional / receptionist)

```tsx
// components/layouts/AppShell.tsx
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 px-6 py-8 lg:px-10">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
```

### Sidebar

```tsx
// components/layouts/Sidebar.tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, DoorOpen, Wallet, Users, BarChart3, Settings, Stethoscope } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/dashboard",     label: "Dashboard",     icon: BarChart3 },
  { href: "/agenda",        label: "Agenda",        icon: Calendar },
  { href: "/consultorios",  label: "Consultórios",  icon: DoorOpen },
  { href: "/profissionais", label: "Profissionais", icon: Users },
  { href: "/financeiro",    label: "Financeiro",    icon: Wallet },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden w-60 shrink-0 border-r border-border bg-card lg:flex lg:flex-col">
      <div className="flex h-16 items-center gap-2 px-6">
        <div className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Stethoscope size={18} />
        </div>
        <span className="font-semibold">ClinicaShare</span>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
```

### Topbar

```tsx
// components/layouts/Topbar.tsx
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Bell, Search } from "lucide-react";

export function Topbar() {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-card/80 px-6 backdrop-blur lg:px-10">
      <div className="relative flex-1 max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          placeholder="Buscar paciente, profissional…"
          className="h-9 w-full rounded-xl border border-input bg-background pl-9 pr-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>
      <Button variant="ghost" size="icon" aria-label="Notificações">
        <Bell size={18} />
      </Button>
      <Avatar className="size-9">
        <AvatarImage src="/me.jpg" />
        <AvatarFallback>EA</AvatarFallback>
      </Avatar>
    </header>
  );
}
```

### Visibility rules per actor

Use the user's role (from session) to filter `nav`:

```ts
const navByRole: Record<Role, typeof nav> = {
  admin:        nav,                          // tudo
  financial:    nav.filter(n => ["/dashboard", "/financeiro"].includes(n.href)),
  professional: nav.filter(n => ["/agenda", "/financeiro"].includes(n.href)),
  receptionist: nav.filter(n => ["/agenda"].includes(n.href)),
};
```

## 3. PatientShell (mobile — patient app / PWA)

The patient experience matches the reference visuals most closely: hero cards, BottomNav with a central FAB, generous spacing.

```tsx
// components/layouts/PatientShell.tsx
import { PatientBottomNav } from "./PatientBottomNav";

export function PatientShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-background">
      <main className="flex-1 px-4 pb-24 pt-6">{children}</main>
      <PatientBottomNav />
    </div>
  );
}
```

### PatientBottomNav

```tsx
// components/layouts/PatientBottomNav.tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Calendar, MessageCircle, User, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/p",            label: "Início",     icon: Home },
  { href: "/p/agendar",    label: "Agenda",     icon: Calendar },
  { href: "/p/mensagens",  label: "Mensagens",  icon: MessageCircle },
  { href: "/p/perfil",     label: "Perfil",     icon: User },
];

export function PatientBottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md border-t border-border bg-card">
      <div className="relative grid grid-cols-5">
        {items.slice(0, 2).map(({ href, label, icon: Icon }) => (
          <NavItem key={href} href={href} label={label} icon={Icon} active={pathname === href} />
        ))}
        <div className="flex items-center justify-center">
          <Link
            href="/p/agendar/novo"
            className="-mt-6 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-transform active:scale-95"
            aria-label="Novo agendamento"
          >
            <Plus size={24} />
          </Link>
        </div>
        {items.slice(2).map(({ href, label, icon: Icon }) => (
          <NavItem key={href} href={href} label={label} icon={Icon} active={pathname === href} />
        ))}
      </div>
    </nav>
  );
}

function NavItem({ href, label, icon: Icon, active }: { href: string; label: string; icon: any; active: boolean }) {
  return (
    <Link href={href} className="flex flex-col items-center gap-0.5 py-3 text-xs">
      <Icon size={20} className={active ? "text-primary" : "text-muted-foreground"} />
      <span className={active ? "font-medium text-primary" : "text-muted-foreground"}>{label}</span>
    </Link>
  );
}
```

## 4. PageHeader (web)

Every page in `AppShell` starts with this. Don't reinvent the title / actions row.

```tsx
// components/layouts/PageHeader.tsx
interface Props {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, description, actions }: Props) {
  return (
    <div className="mb-8 flex items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold lg:text-3xl">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
    </div>
  );
}
```

## 5. Screen recipes

### 5.1 Admin Dashboard (Dr. Edson home)

```tsx
// app/(app)/dashboard/page.tsx
import { AppShell } from "@/components/layouts/AppShell";
import { PageHeader } from "@/components/layouts/PageHeader";
import { MetricStat } from "@/components/dashboard/MetricStat";
import { ConsultorioCard } from "@/components/consultorios/ConsultorioCard";
import { Wallet, Clock, CheckCircle2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default async function Dashboard() {
  // const data = await getDashboardData();   // server-side fetch
  return (
    <AppShell>
      <PageHeader
        title="Dashboard"
        description="Visão geral da clínica  semana de 09 a 15 de abril"
        actions={<Button variant="outline">Exportar relatório</Button>}
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricStat label="Receita total"      value="R$ 18.420,00" delta={0.08}  deltaLabel="vs semana anterior" icon={Wallet}        tone="primary" />
        <MetricStat label="Repasses em aberto" value="R$ 6.310,00"  delta={-0.03} deltaLabel="vs semana anterior" icon={Clock}         tone="warning" />
        <MetricStat label="Repasses pagos"     value="R$ 12.110,00" delta={0.12}  deltaLabel="vs semana anterior" icon={CheckCircle2}  tone="success" />
        <MetricStat label="Profissionais ativos" value="14"          icon={Users} />
      </section>

      <section className="mt-10 space-y-4">
        <div className="flex items-end justify-between">
          <h2 className="text-xl font-semibold">Consultórios por receita</h2>
          <Button variant="link">Ver todos</Button>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <ConsultorioCard name="Sala 03" specialty="Oftalmologia"  weeklyRevenue={4280} occupancy={0.92} highlight />
          <ConsultorioCard name="Sala 07" specialty="Cardiologia"   weeklyRevenue={3110} occupancy={0.78} />
          <ConsultorioCard name="Sala 01" specialty="Clínica geral" weeklyRevenue={2640} occupancy={0.71} />
        </div>
      </section>

      {/* Add: weekly revenue chart (recharts), recent activity feed, etc. */}
    </AppShell>
  );
}
```

### 5.2 Agenda (professional's day)

Two-column layout: day picker + appointment list on the left, selected-appointment detail on the right (desktop only — mobile uses a Sheet).

```tsx
// app/(app)/agenda/page.tsx
import { AppShell } from "@/components/layouts/AppShell";
import { PageHeader } from "@/components/layouts/PageHeader";
import { WeekDayPicker } from "@/components/appointments/WeekDayPicker";
import { AppointmentCard } from "@/components/appointments/AppointmentCard";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/EmptyState";
import { Calendar } from "lucide-react";

export default function AgendaPage() {
  // client-side state for selected day, fetch via SWR/TanStack Query
  return (
    <AppShell>
      <PageHeader title="Minha agenda" description="Quinta-feira, 09 de abril" />

      <div className="mb-6">
        <WeekDayPicker value={new Date()} onChange={() => {}} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          {appointments.length === 0 ? (
            <EmptyState icon={Calendar} title="Nenhum atendimento neste dia" description="Aproveite para revisar prontuários ou ajustar a agenda." />
          ) : appointments.map(a => <AppointmentCard key={a.id} appointment={a} />)}
        </div>

        <Card className="hidden p-6 lg:block">
          {/* Selected appointment detail */}
        </Card>
      </div>
    </AppShell>
  );
}
```

### 5.3 Booking flow (patient — mobile)

Multi-step: choose specialty → choose professional → choose date → choose time → review → pay. Use a step indicator and one decision per screen.

```tsx
// app/p/agendar/novo/page.tsx
"use client";
import { useState } from "react";
import { PatientShell } from "@/components/layouts/PatientShell";
import { Button } from "@/components/ui/button";
import { WeekDayPicker } from "@/components/appointments/WeekDayPicker";
import { TimeSlotPicker } from "@/components/appointments/TimeSlotPicker";

export default function NewBookingPage() {
  const [step, setStep] = useState(1);
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState<string>();

  return (
    <PatientShell>
      <div className="mb-6">
        <p className="text-xs font-medium text-primary">Etapa {step} de 5</p>
        <h1 className="mt-1 text-2xl font-bold">Escolha um horário</h1>
      </div>

      <div className="mb-6">
        <WeekDayPicker value={date} onChange={setDate} />
      </div>

      <TimeSlotPicker
        label="Manhã"
        slots={[
          { time: "08:00", available: true  },
          { time: "08:30", available: false },
          { time: "09:00", available: true  },
          { time: "09:30", available: true  },
          { time: "10:00", available: false },
          { time: "10:30", available: true  },
        ]}
        value={time}
        onChange={setTime}
      />

      <div className="fixed inset-x-0 bottom-20 mx-auto max-w-md px-4">
        <Button className="w-full" size="lg" disabled={!date || !time} onClick={() => setStep(s => s + 1)}>
          Continuar
        </Button>
      </div>
    </PatientShell>
  );
}
```

Reference contract for these flows:
- One H1 per step.
- Step indicator above the H1, in primary color, small.
- Primary CTA fixed at the bottom (above the BottomNav), full-width.
- Disabled CTA until the user has made the required choice.

### 5.4 Booking detail (read-only confirmation)

Mirrors the reference's "Booking Detail" screen. Use this for the patient's "Minhas consultas → ver detalhes" view.

```tsx
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, User, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";

<PatientShell>
  <h1 className="mb-6 text-2xl font-bold">Detalhes da consulta</h1>

  <Card className="space-y-5 p-5">
    <div className="flex items-center justify-between">
      <p className="text-sm font-medium text-muted-foreground">Booking info</p>
      <Badge variant="success">Confirmado</Badge>
    </div>

    <InfoRow icon={Calendar} label="Data e horário" value="Quinta, 09 de abril • 08:00" />
    <InfoRow icon={Stethoscope} label="Tipo" value="Presencial" />
    <InfoRow icon={MapPin} label="Endereço" value="Rua Example, 200  Sala 03" />
    <InfoRow icon={User} label="Profissional" value="Dr. Nirmala Azalea  Oftalmologia" />
  </Card>

  <Card className="mt-4 p-5">
    <p className="text-sm font-medium text-muted-foreground">Pagamento</p>
    <div className="mt-3 space-y-2 text-sm tabular-nums">
      <div className="flex justify-between"><span>Consulta</span><span>R$ 250,00</span></div>
      <div className="flex justify-between text-muted-foreground"><span>Taxa</span><span>R$ 0,00</span></div>
      <div className="mt-2 flex justify-between border-t border-border pt-2 text-base font-semibold">
        <span>Total</span><span>R$ 250,00</span>
      </div>
    </div>
  </Card>

  <Button variant="outline" className="mt-6 w-full">Cancelar consulta</Button>
</PatientShell>
```

`InfoRow` is a tiny helper:

```tsx
function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="rounded-lg bg-muted p-2 text-muted-foreground"><Icon size={16} /></div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}
```

### 5.5 Financial closing (auxiliar / admin)

Page-level structure for FI07 (prestação de contas semanal):

```tsx
import { AppShell } from "@/components/layouts/AppShell";
import { PageHeader } from "@/components/layouts/PageHeader";
import { FinanceTable } from "@/components/financial/FinanceTable";
import { Button } from "@/components/ui/button";
import { RepasseStatusBadge } from "@/components/financial/RepasseStatusBadge";
import { formatBRL } from "@/lib/format";

export default async function ClosingPage() {
  return (
    <AppShell>
      <PageHeader
        title="Fechamento semanal"
        description="09 a 15 de abril de 2026"
        actions={<>
          <Button variant="outline">Exportar PDF</Button>
          <Button>Marcar tudo como pago</Button>
        </>}
      />

      <FinanceTable
        columns={[
          { key: "professional", header: "Profissional" },
          { key: "modality",     header: "Modalidade" },
          { key: "consultations",header: "Consultas",     align: "right" },
          { key: "procedures",   header: "Procedimentos", align: "right" },
          { key: "gross",        header: "Bruto",         align: "right",
            render: r => formatBRL(r.gross) },
          { key: "repasse",      header: "Repasse",       align: "right",
            render: r => <span className="font-semibold">{formatBRL(r.repasse)}</span> },
          { key: "status",       header: "",
            render: r => <RepasseStatusBadge status={r.status} /> },
        ]}
        data={rows}
      />
    </AppShell>
  );
}
```

## 6. Responsive behavior

The big rules:

- **`AppShell` Sidebar** collapses to an icon-only rail at `md` (768px) and to a Sheet behind a hamburger at `sm` (640px). For v1, just hide it below `lg` (1024px) and add a hamburger trigger; full collapsing comes later.
- **Tables** become card lists below `md`. Don't try to scroll horizontally — the table won't be readable. Convert each row to a stacked card with the same data via a `useMediaQuery` hook (or `display: hidden md:table-row`).
- **Forms** stack labels above inputs always. Two-column form layouts (`grid grid-cols-2`) collapse to one column below `md`.
- **Patient screens** are designed mobile-first; on desktop, center within `max-w-md`. We are not building a desktop patient experience for v1.

## 7. Loading and skeleton screens

For App Router, use `loading.tsx` next to `page.tsx`. Compose skeletons using the `Skeleton` primitive — never spinners on full-page loads (jarring).

```tsx
// app/(app)/dashboard/loading.tsx
import { Skeleton } from "@/components/ui/skeleton";
import { AppShell } from "@/components/layouts/AppShell";

export default function Loading() {
  return (
    <AppShell>
      <Skeleton className="h-8 w-64" />
      <Skeleton className="mt-3 h-4 w-96" />
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-2xl" />
        ))}
      </div>
    </AppShell>
  );
}
```

## 8. Error boundaries

Same idea — `error.tsx` next to `page.tsx`. Use a friendly message, never the raw stack trace in production.

```tsx
// app/(app)/error.tsx
"use client";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="mb-4 rounded-full bg-red-100 p-3 text-red-700">
        <AlertTriangle size={24} />
      </div>
      <h2 className="text-xl font-semibold">Algo deu errado</h2>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        Não foi possível carregar esta página. Tente novamente em alguns instantes.
      </p>
      <Button onClick={reset} className="mt-6">Tentar novamente</Button>
    </div>
  );
}
```
