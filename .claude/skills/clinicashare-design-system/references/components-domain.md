# Domain Components

These are ClinicaShare-specific components. They compose the primitives from `components-core.md` and encode business rules from the requirements doc (Agendamento, Consultórios, Financeiro, Atendimentos, Relatórios).

The rule: if a UI pattern repeats in more than two places, it becomes a domain component. Don't copy-paste card layouts or status mappings between screens.

All components below live under `components/<domain>/`. For example:
- `components/appointments/AppointmentCard.tsx`
- `components/financial/RepasseStatus.tsx`
- `components/professionals/ProfessionalRow.tsx`

## 1. Status badges (the foundation of domain UI)

Status drives most of the screens — payment status, appointment status, repasse status. Centralize the mapping once.

### 1.1 PaymentStatusBadge

Maps the FI05 enum (`pago | pendente | gratuito`) to a Badge variant + pt-BR label.

```tsx
// components/financial/PaymentStatusBadge.tsx
import { Badge } from "@/components/ui/badge";

export type PaymentStatus = "pago" | "pendente" | "gratuito";

const config: Record<PaymentStatus, { label: string; variant: "success" | "warning" | "neutral" }> = {
  pago:      { label: "Pago",     variant: "success" },
  pendente:  { label: "Pendente", variant: "warning" },
  gratuito:  { label: "Gratuito", variant: "neutral" },
};

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const { label, variant } = config[status];
  return <Badge variant={variant}>{label}</Badge>;
}
```

### 1.2 AppointmentStatusBadge

```tsx
// components/appointments/AppointmentStatusBadge.tsx
import { Badge } from "@/components/ui/badge";

export type AppointmentStatus =
  | "agendado"
  | "confirmado"
  | "realizado"
  | "cancelado"
  | "faltou";

const config: Record<AppointmentStatus, { label: string; variant: "info" | "success" | "neutral" | "danger" | "warning" }> = {
  agendado:   { label: "Agendado",   variant: "info" },
  confirmado: { label: "Confirmado", variant: "success" },
  realizado:  { label: "Realizado",  variant: "neutral" },
  cancelado:  { label: "Cancelado",  variant: "danger" },
  faltou:     { label: "Faltou",     variant: "warning" },
};

export function AppointmentStatusBadge({ status }: { status: AppointmentStatus }) {
  const { label, variant } = config[status];
  return <Badge variant={variant}>{label}</Badge>;
}
```

### 1.3 RepasseStatusBadge

```tsx
// components/financial/RepasseStatusBadge.tsx
import { Badge } from "@/components/ui/badge";

export type RepasseStatus = "em_aberto" | "pago" | "atrasado";

const config = {
  em_aberto: { label: "Em aberto", variant: "info"    as const },
  pago:      { label: "Pago",      variant: "success" as const },
  atrasado:  { label: "Atrasado",  variant: "danger"  as const },
};

export function RepasseStatusBadge({ status }: { status: RepasseStatus }) {
  const { label, variant } = config[status];
  return <Badge variant={variant}>{label}</Badge>;
}
```

The pattern: **one config map, one component per business enum.** Never inline the mapping in a page or table cell.

## 2. AppointmentCard

The reference's "My Appointment" card, adapted to ClinicaShare. Used in the patient app, the professional's daily agenda, and the receptionist's queue.

```tsx
// components/appointments/AppointmentCard.tsx
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Calendar, Clock } from "lucide-react";
import { formatDate, formatTime } from "@/lib/format";
import { getInitials } from "@/lib/utils";
import { AppointmentStatusBadge, type AppointmentStatus } from "./AppointmentStatusBadge";

interface Appointment {
  id: string;
  date: string;            // ISO
  durationMinutes: number;
  status: AppointmentStatus;
  professional: { name: string; specialty: string; photoUrl?: string };
  consultorio?: { name: string };
}

interface Props {
  appointment: Appointment;
  onClick?: () => void;
}

export function AppointmentCard({ appointment, onClick }: Props) {
  const start = new Date(appointment.date);
  const end = new Date(start.getTime() + appointment.durationMinutes * 60_000);

  return (
    <Card
      onClick={onClick}
      className="p-4 hover:bg-muted/50 transition-colors cursor-pointer"
    >
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <Calendar size={16} />
        <span>{formatDate(start, "EEE, dd 'de' MMM")}</span>
        <Clock size={16} className="ml-2" />
        <span>{formatTime(start)} – {formatTime(end)}</span>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <Avatar className="size-10">
          <AvatarImage src={appointment.professional.photoUrl} />
          <AvatarFallback>{getInitials(appointment.professional.name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{appointment.professional.name}</p>
          <p className="truncate text-sm text-muted-foreground">
            {appointment.professional.specialty}
            {appointment.consultorio && ` • ${appointment.consultorio.name}`}
          </p>
        </div>
        <AppointmentStatusBadge status={appointment.status} />
      </div>
    </Card>
  );
}
```

Notes:
- The card is `Card` from shadcn — consistency is automatic.
- `truncate` on long names; the avatar size and badge anchor it.
- Status is always visible; clicking reveals details (handled by parent via `onClick`).

## 3. ConsultorioCard

For CO01 (cadastro de consultórios) and the dashboard ranking (CO04, RE03).

```tsx
// components/consultorios/ConsultorioCard.tsx
import { Card } from "@/components/ui/card";
import { Stethoscope, TrendingUp } from "lucide-react";
import { formatBRL, formatPercent } from "@/lib/format";

interface Props {
  name: string;
  specialty: string;
  weeklyRevenue: number;
  occupancy: number;          // 0..1
  highlight?: boolean;
}

export function ConsultorioCard({ name, specialty, weeklyRevenue, occupancy, highlight }: Props) {
  return (
    <Card className={`p-5 ${highlight ? "border-primary/40 bg-primary/5" : ""}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{specialty}</p>
          <h3 className="mt-1 text-lg font-semibold">{name}</h3>
        </div>
        <div className="rounded-full bg-primary/10 p-2 text-primary">
          <Stethoscope size={18} />
        </div>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-muted-foreground">Receita semanal</p>
          <p className="mt-0.5 text-xl font-bold tabular-nums">{formatBRL(weeklyRevenue)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Ocupação</p>
          <p className="mt-0.5 text-xl font-bold tabular-nums">{formatPercent(occupancy, 0)}</p>
        </div>
      </div>
    </Card>
  );
}
```

The `highlight` prop is for the "top consultório" callout in the dashboard.

## 4. ProfessionalRow

Used in the professionals list (admin view) and the receptionist's "select professional to schedule for" picker.

```tsx
// components/professionals/ProfessionalRow.tsx
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ChevronRight } from "lucide-react";
import { getInitials } from "@/lib/utils";
import { formatPercent, formatBRL } from "@/lib/format";

type Modality = "percentual" | "aluguel_fixo";

interface Props {
  name: string;
  specialty: string;
  photoUrl?: string;
  modality: Modality;
  /** percentual de repasse if modality === 'percentual', aluguel R$ if 'aluguel_fixo' */
  contractValue: number;
  onClick?: () => void;
}

export function ProfessionalRow({
  name, specialty, photoUrl, modality, contractValue, onClick,
}: Props) {
  const contractLabel = modality === "percentual"
    ? `${formatPercent(contractValue, 0)} de repasse`
    : `${formatBRL(contractValue)} / turno`;

  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-4 rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Avatar className="size-12">
        <AvatarImage src={photoUrl} />
        <AvatarFallback>{getInitials(name)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{name}</p>
        <p className="truncate text-sm text-muted-foreground">{specialty}</p>
      </div>
      <div className="hidden text-right sm:block">
        <Badge variant={modality === "percentual" ? "info" : "secondary"}>
          {modality === "percentual" ? "Percentual" : "Aluguel fixo"}
        </Badge>
        <p className="mt-1 text-sm tabular-nums text-muted-foreground">{contractLabel}</p>
      </div>
      <ChevronRight className="text-muted-foreground" size={18} />
    </button>
  );
}
```

## 5. MetricStat

The big numbers on the dashboard ("Receita total", "Repasses em aberto", "Repasses pagos" — RE01).

```tsx
// components/dashboard/MetricStat.tsx
import { Card } from "@/components/ui/card";
import { type LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  label: string;
  value: string;
  /** -1..1 trend, used for the small delta indicator */
  delta?: number;
  deltaLabel?: string;
  icon?: LucideIcon;
  tone?: "default" | "primary" | "success" | "warning";
}

export function MetricStat({ label, value, delta, deltaLabel, icon: Icon, tone = "default" }: Props) {
  const toneClasses: Record<NonNullable<Props["tone"]>, string> = {
    default: "bg-muted text-foreground",
    primary: "bg-primary/10 text-primary",
    success: "bg-emerald-100 text-emerald-700",
    warning: "bg-amber-100 text-amber-700",
  };

  const isUp = (delta ?? 0) >= 0;

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {Icon && (
          <div className={cn("rounded-full p-2", toneClasses[tone])}>
            <Icon size={18} />
          </div>
        )}
      </div>
      <p className="mt-3 text-3xl font-bold tabular-nums">{value}</p>
      {delta !== undefined && (
        <p className={cn("mt-2 inline-flex items-center gap-1 text-xs font-medium",
          isUp ? "text-emerald-700" : "text-red-700")}>
          {isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          {Math.abs(delta * 100).toFixed(1)}%
          {deltaLabel && <span className="text-muted-foreground font-normal">{deltaLabel}</span>}
        </p>
      )}
    </Card>
  );
}
```

## 6. TimeSlotPicker

Patient booking flow (AG01) — pick a time from the available slots. Mirrors the reference's "Select Schedule" panel.

```tsx
// components/appointments/TimeSlotPicker.tsx
import { cn } from "@/lib/utils";

interface Slot { time: string; available: boolean; }
interface Props {
  slots: Slot[];
  value?: string;
  onChange: (time: string) => void;
  /** Optional grouping (e.g., 'Manhã', 'Tarde', 'Noite') */
  label?: string;
}

export function TimeSlotPicker({ slots, value, onChange, label }: Props) {
  return (
    <div className="space-y-3">
      {label && <p className="text-sm font-medium text-muted-foreground">{label}</p>}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {slots.map((slot) => {
          const selected = value === slot.time;
          return (
            <button
              key={slot.time}
              type="button"
              disabled={!slot.available}
              onClick={() => onChange(slot.time)}
              className={cn(
                "rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                "disabled:opacity-40 disabled:cursor-not-allowed",
                selected
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground hover:bg-muted"
              )}
            >
              {slot.time}
            </button>
          );
        })}
      </div>
    </div>
  );
}
```

Group calls by part of day:

```tsx
<TimeSlotPicker label="Manhã" slots={morningSlots} value={time} onChange={setTime} />
<TimeSlotPicker label="Tarde" slots={afternoonSlots} value={time} onChange={setTime} />
```

## 7. WeekDayPicker

The horizontal day selector at the top of the booking flow (the "M T W T F S" row in the reference).

```tsx
// components/appointments/WeekDayPicker.tsx
import { addDays, isSameDay, format, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Props {
  value?: Date;
  onChange: (date: Date) => void;
  /** First date the picker shows; defaults to today's week start */
  startDate?: Date;
  /** Number of days shown; defaults to 7 */
  days?: number;
}

export function WeekDayPicker({ value, onChange, startDate, days = 7 }: Props) {
  const start = startDate ?? startOfWeek(new Date(), { locale: ptBR });
  const dates = Array.from({ length: days }, (_, i) => addDays(start, i));

  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {dates.map((date) => {
        const selected = value && isSameDay(value, date);
        return (
          <button
            key={date.toISOString()}
            type="button"
            onClick={() => onChange(date)}
            className={cn(
              "flex w-12 shrink-0 flex-col items-center gap-0.5 rounded-2xl py-2 text-sm transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              selected
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            <span className="text-xs font-medium uppercase">
              {format(date, "EEEEE", { locale: ptBR })}
            </span>
            <span className={cn("text-base font-semibold", selected && "text-primary-foreground")}>
              {format(date, "d")}
            </span>
          </button>
        );
      })}
    </div>
  );
}
```

## 8. FinanceTable

The shared structure for FI07 (prestação de contas semanal) and RE02 (relatório financeiro filtrável).

We use a thin wrapper over a plain semantic `<table>`. Don't pull in TanStack Table for v1 — overkill for our volume. Migrate later if reports grow huge.

```tsx
// components/financial/FinanceTable.tsx
import { cn } from "@/lib/utils";

interface Column<T> {
  key: keyof T | string;
  header: string;
  align?: "left" | "right" | "center";
  render?: (row: T) => React.ReactNode;
}

interface Props<T> {
  columns: Column<T>[];
  data: T[];
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
}

export function FinanceTable<T extends { id: string }>({
  columns, data, emptyMessage = "Nenhum registro neste período.", onRowClick,
}: Props<T>) {
  if (data.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <table className="w-full text-sm tabular-nums">
        <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
          <tr>
            {columns.map((col) => (
              <th
                key={String(col.key)}
                className={cn(
                  "px-4 py-3 font-medium",
                  col.align === "right" && "text-right",
                  col.align === "center" && "text-center",
                  (!col.align || col.align === "left") && "text-left"
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {data.map((row) => (
            <tr
              key={row.id}
              onClick={() => onRowClick?.(row)}
              className={cn(
                "transition-colors",
                onRowClick && "cursor-pointer hover:bg-muted/40"
              )}
            >
              {columns.map((col) => (
                <td
                  key={String(col.key)}
                  className={cn(
                    "px-4 py-3",
                    col.align === "right" && "text-right",
                    col.align === "center" && "text-center"
                  )}
                >
                  {col.render ? col.render(row) : (row as any)[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

Usage example for the weekly closing:

```tsx
<FinanceTable
  columns={[
    { key: "professional", header: "Profissional" },
    { key: "consultations", header: "Consultas", align: "right" },
    { key: "procedures", header: "Procedimentos", align: "right" },
    { key: "gross", header: "Bruto", align: "right",
      render: (r) => formatBRL(r.gross) },
    { key: "repasse", header: "Repasse", align: "right",
      render: (r) => <span className="font-semibold">{formatBRL(r.repasse)}</span> },
    { key: "status", header: "Status",
      render: (r) => <RepasseStatusBadge status={r.status} /> },
  ]}
  data={rows}
/>
```

## 9. ContractModalityCard

For displaying / picking the contract modality (FI01) — `aluguel_fixo` vs `percentual`.

```tsx
// components/financial/ContractModalityCard.tsx
import { Card } from "@/components/ui/card";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  modality: "aluguel_fixo" | "percentual";
  selected?: boolean;
  onSelect?: () => void;
}

const meta = {
  aluguel_fixo: {
    title: "Aluguel fixo",
    description: "Profissional paga valor fixo por turno utilizado.",
    pros: ["Receita previsível", "Fechamento simples"],
  },
  percentual: {
    title: "Percentual",
    description: "Clínica recebe % sobre cada consulta e procedimento.",
    pros: ["Maior potencial", "Acompanha o volume"],
  },
} as const;

export function ContractModalityCard({ modality, selected, onSelect }: Props) {
  const { title, description, pros } = meta[modality];
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "relative w-full rounded-2xl border p-5 text-left transition-all",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selected
          ? "border-primary bg-primary/5"
          : "border-border bg-card hover:border-foreground/20"
      )}
    >
      {selected && (
        <div className="absolute right-4 top-4 rounded-full bg-primary p-1 text-primary-foreground">
          <Check size={14} />
        </div>
      )}
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      <ul className="mt-4 space-y-1 text-sm">
        {pros.map((p) => (
          <li key={p} className="flex items-center gap-2 text-foreground">
            <Check size={14} className="text-primary" /> {p}
          </li>
        ))}
      </ul>
    </button>
  );
}
```

## 10. PatientInfoBlock

For showing patient info on the booking detail screen (LGPD-compliant — see `patterns.md` for masking rules).

```tsx
// components/patients/PatientInfoBlock.tsx
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { maskCPF, maskPhone } from "@/lib/lgpd";

interface Props {
  patient: { name: string; cpf?: string; phone?: string; photoUrl?: string };
  /** When true, masks CPF and phone. Default: false (full visibility). */
  redact?: boolean;
}

export function PatientInfoBlock({ patient, redact = false }: Props) {
  return (
    <div className="flex items-center gap-3">
      <Avatar className="size-12">
        <AvatarImage src={patient.photoUrl} />
        <AvatarFallback>{getInitials(patient.name)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{patient.name}</p>
        <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground tabular-nums">
          {patient.cpf  && <span>CPF: {redact ? maskCPF(patient.cpf) : patient.cpf}</span>}
          {patient.phone && <span>Tel: {redact ? maskPhone(patient.phone) : patient.phone}</span>}
        </div>
      </div>
    </div>
  );
}
```

`maskCPF` / `maskPhone` live in `lib/lgpd.ts` and are documented in `patterns.md` (LGPD section).

## 11. EmptyState

Used everywhere — no appointments, no professionals, no results in a filter.

```tsx
// components/EmptyState.tsx
import { type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}

export function EmptyState({ icon: Icon, title, description, action }: Props) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
      {Icon && (
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Icon size={22} />
        </div>
      )}
      <h3 className="text-base font-semibold">{title}</h3>
      {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      {action && (
        <Button onClick={action.onClick} className="mt-5">
          {action.label}
        </Button>
      )}
    </div>
  );
}
```

Empty-state copy guidelines live in `patterns.md`.

## 12. The composition rule

If a screen needs a UI element not listed here, ask first: "Is this composition or a new domain component?"

- **Composition** (90% of the time): combine existing core + domain components on the page itself.
- **New domain component** (10%): only when the same combination would repeat in 2+ places. Then add it to this file alongside the others.

Domain components are the layer where business logic touches presentation. Keep them small, typed, and documented here.
