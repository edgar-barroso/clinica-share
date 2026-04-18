# Patterns

This file covers behavior and copy — the cross-cutting concerns that most components touch but none own. Forms, error states, empty states, accessibility, LGPD, and the pt-BR voice.

## 1. Forms

Every form in ClinicaShare uses **react-hook-form + Zod**. No exceptions. This gives us typed values, async validation, and zero-flash error rendering for free.

### 1.1 The Field wrapper

Wrap every form input in a `Field` so layout, label, error, and helper text are consistent.

```tsx
// components/forms/Field.tsx
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface Props {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function Field({ label, htmlFor, error, hint, required, children, className }: Props) {
  const describedBy = [
    hint && `${htmlFor}-hint`,
    error && `${htmlFor}-error`,
  ].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={htmlFor}>
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </Label>
      <div aria-describedby={describedBy}>
        {children}
      </div>
      {hint && !error && (
        <p id={`${htmlFor}-hint`} className="text-xs text-muted-foreground">{hint}</p>
      )}
      {error && (
        <p id={`${htmlFor}-error`} className="text-xs font-medium text-destructive">{error}</p>
      )}
    </div>
  );
}
```

### 1.2 Standard form skeleton

```tsx
"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Field } from "@/components/forms/Field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const schema = z.object({
  name:  z.string().min(2, "Informe o nome completo"),
  email: z.string().email("E-mail inválido"),
});

type Values = z.infer<typeof schema>;

export function PatientForm({ onSubmit }: { onSubmit: (v: Values) => Promise<void> }) {
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "" },
  });

  const submit = form.handleSubmit(async (values) => {
    try {
      await onSubmit(values);
      toast.success("Paciente cadastrado");
    } catch (err) {
      toast.error("Não foi possível cadastrar. Tente novamente.");
    }
  });

  return (
    <form onSubmit={submit} className="space-y-5">
      <Field label="Nome completo" htmlFor="name" required error={form.formState.errors.name?.message}>
        <Input id="name" {...form.register("name")} />
      </Field>

      <Field label="E-mail" htmlFor="email" required error={form.formState.errors.email?.message}>
        <Input id="email" type="email" {...form.register("email")} />
      </Field>

      <Button type="submit" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting && <Loader2 className="animate-spin" />}
        Salvar
      </Button>
    </form>
  );
}
```

### 1.3 Validation copy guidelines (pt-BR)

- **Be specific.** "E-mail inválido" not "Campo inválido".
- **Imperative when fixable by the user.** "Informe o CPF" not "CPF é obrigatório".
- **Don't repeat the field name in the message.** Field is "CPF", error is "Informe o CPF" — but if the message would require the field name for context, use it.
- **One sentence, no period at the end.** Errors are short — they don't need terminal punctuation.

| Bad | Good |
| --- | --- |
| "Campo obrigatório" | "Informe o nome completo" |
| "Erro de formato" | "Use o formato 000.000.000-00" |
| "Senha inválida" | "A senha deve ter ao menos 8 caracteres" |
| "Data inválida." | "Escolha uma data futura" |

### 1.4 Common Zod schemas

Centralize in `lib/validation.ts`:

```ts
import { z } from "zod";

export const cpfSchema = z.string()
  .regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, "Use o formato 000.000.000-00");

export const phoneBR = z.string()
  .regex(/^\(\d{2}\) \d{4,5}-\d{4}$/, "Use o formato (00) 00000-0000");

export const futureDate = z.date().refine(d => d > new Date(), {
  message: "Escolha uma data futura",
});
```

## 2. Empty states

Every list, table, and dashboard has an empty state. Use the `EmptyState` component (`components-domain.md` section 11).

### Copy formula

> [What is missing in plain language]. [Optional: why it might be missing or what to do next].

| Context | Title | Description |
| --- | --- | --- |
| Patient — no upcoming appointments | "Nenhuma consulta marcada" | "Quando você agendar uma consulta, ela aparecerá aqui." |
| Professional — no appointments today | "Nenhum atendimento neste dia" | "Aproveite para revisar prontuários ou ajustar a agenda." |
| Admin — no professionals registered | "Nenhum profissional cadastrado" | "Adicione o primeiro profissional para começar a controlar agenda e repasses." |
| Filter returns nothing | "Nenhum resultado encontrado" | "Tente ajustar os filtros ou o período selecionado." |

Don't write "Nada por aqui" or other cute placeholders. Keep it functional.

## 3. Loading states

| Wait | Treatment |
| --- | --- |
| < 200ms | Nothing — flash of skeleton looks worse than the wait. |
| 200ms – 2s | Skeleton placeholder matching the shape of the real content. |
| 2s – 10s | Skeleton + a `<p className="text-sm text-muted-foreground">Carregando…</p>` after 2s. |
| > 10s | Investigate. This is too long for normal data fetches; consider pagination, lazy load, or a background job. |

Never block the entire screen with a centered spinner unless the user has just submitted an action and the next state is not yet known.

## 4. Toasts

Use `sonner`. Three flavors:

```ts
toast.success("Agendamento confirmado");
toast.error("Não foi possível salvar. Tente novamente.");
toast("Repasse marcado como pago", { description: "Lançado em 12 de abril às 14:32." });
```

Rules:

- **Success** for completed user actions only ("Salvo", "Confirmado", "Cancelado com sucesso"). Never for passive events.
- **Error** when the user's action failed. Always tell them what to try ("Tente novamente", "Verifique sua conexão").
- **Default** for system events the user didn't trigger themselves (e.g., "Novo agendamento recebido").
- Auto-dismiss after 4s for success, 6s for error. Sonner handles this.
- Never stack more than 3 toasts. Sonner limits this by default — don't override.

## 5. Confirmation dialogs

Required for any destructive action: cancel an appointment, delete a patient, refund a payment, archive a professional.

```tsx
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";

<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive">Cancelar consulta</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Cancelar esta consulta?</AlertDialogTitle>
      <AlertDialogDescription>
        O paciente será notificado e o horário voltará a ficar disponível na agenda.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Voltar</AlertDialogCancel>
      <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
        Cancelar consulta
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

Copy:
- **Title is a question.** "Cancelar esta consulta?" not "Cancelar consulta".
- **Description explains the consequence**, not the action.
- **Confirm label repeats the action verb** — "Cancelar consulta", not "Sim" or "Confirmar". This protects against accidental double-clicks on muscle memory.

## 6. Accessibility

The shadcn/ui primitives handle the majority — focus rings, ARIA roles, keyboard navigation. Your job:

1. **Always provide labels.** `<Label htmlFor>` for inputs, `aria-label` for icon-only buttons. Never rely on placeholder text alone.
2. **Color is not the only signal.** Status badges have both color and text. Required fields have both an asterisk and `aria-required`.
3. **Keep focus visible.** Don't override `:focus-visible` styles. The ring color matches `--ring` (primary).
4. **Tab order follows visual order.** If you reorder visually with Flexbox, set `tabindex` to keep tab order matching the reading order.
5. **All actions reachable by keyboard.** Click handlers on `<div>` are forbidden — use `Button` (or `Link`) which already have keyboard handling.
6. **Form errors announced.** The `Field` wrapper sets `aria-describedby` to the error element so screen readers read the error after the input value.
7. **Live regions for async updates.** When a list updates without navigation (e.g., new appointment arrives via WebSocket), the list container gets `aria-live="polite"`.

## 7. LGPD (data masking)

Patient data is sensitive. Two masking helpers live in `lib/lgpd.ts`:

```ts
// lib/lgpd.ts
export function maskCPF(cpf: string): string {
  // 123.456.789-00 → 123.***.***-00
  if (cpf.length < 14) return cpf;
  return cpf.slice(0, 4) + "***.***" + cpf.slice(11);
}

export function maskPhone(phone: string): string {
  // (11) 91234-5678 → (11) 9****-5678
  return phone.replace(/(\(\d{2}\) \d)\d{3,4}(-\d{4})/, "$1****$2");
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain || local.length <= 2) return email;
  return local[0] + "***" + local[local.length - 1] + "@" + domain;
}
```

When to mask (the `redact` prop on data display components):

- **Always** in lists / tables seen by users who don't need full data (e.g., a receptionist viewing the queue sees the full name and phone, not CPF).
- **Always** in printed / exported reports unless the user explicitly clicks "ver dados completos" with a logged audit event.
- **Never** on the patient's own data — they own it.
- **Toggle by role** in admin/financial views — Dr. Edson sees full data; financial assistant sees only what's needed for closing.

Audit log: any unmask click should call `logAudit({ event: 'pii_unmasked', subject: patientId, actor: userId })` — implementation lives in `lib/audit.ts`.

## 8. pt-BR voice and copy guidelines

- **Use "você", never "tu" or "o senhor".** Conversational and respectful for both patient and admin contexts.
- **Active voice.** "Cancelar consulta" not "Consulta a ser cancelada".
- **Numbers below 10 in words** in body copy ("três consultas hoje"); **numerals in UI labels** ("3 consultas hoje" in a badge or stat). Money and dates always numerical.
- **Date format:** "09 de abril de 2026" in long form; "09/04/2026" in tables; "09 abr" in compact rows.
- **Time format:** 24h, "08:00 – 08:30". No "AM/PM".
- **Currency:** "R$ 1.250,00" with `Intl.NumberFormat`. Never abbreviate as "R$1,25k".

### Section header tone (admin/financial)

Direct and specific. "Receita da semana", "Repasses em aberto", "Consultórios por receita". Avoid marketing-y words ("Maximize sua receita!").

### Section header tone (patient)

Slightly warmer but still functional. "Sua próxima consulta", "Como você está se sentindo hoje?", "Profissionais disponíveis". Avoid emojis in headers.

## 9. Date and time inputs

Use `react-day-picker` (already a dependency of shadcn's Calendar component). Wrap in a Popover for the date picker UX:

```tsx
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

<Popover>
  <PopoverTrigger asChild>
    <Button variant="outline" className="w-full justify-start font-normal">
      <CalendarIcon size={16} className="mr-2" />
      {date ? format(date, "PPP", { locale: ptBR }) : "Selecione a data"}
    </Button>
  </PopoverTrigger>
  <PopoverContent align="start" className="w-auto p-0">
    <Calendar mode="single" selected={date} onSelect={setDate} locale={ptBR} />
  </PopoverContent>
</Popover>
```

Always pass `locale={ptBR}` to the Calendar — otherwise weekday headers come in English.

## 10. Optimistic updates

For high-frequency interactions (toggling repasse status as paid, confirming an appointment), use TanStack Query's `useMutation` with `onMutate` to update the cache before the network call returns. Roll back on error.

```ts
const mutation = useMutation({
  mutationFn: markAsPaid,
  onMutate: async (id) => {
    await qc.cancelQueries({ queryKey: ["repasses"] });
    const prev = qc.getQueryData(["repasses"]);
    qc.setQueryData(["repasses"], (old: any) =>
      old.map((r: any) => r.id === id ? { ...r, status: "pago" } : r)
    );
    return { prev };
  },
  onError: (_err, _id, ctx) => {
    qc.setQueryData(["repasses"], ctx?.prev);
    toast.error("Não foi possível atualizar. Tente novamente.");
  },
  onSettled: () => qc.invalidateQueries({ queryKey: ["repasses"] }),
});
```

Reserve this for actions that are very likely to succeed and where the latency matters. For risky actions (cancel an appointment), use a normal mutation with a loading state.

## 11. Performance hygiene

- **Server components by default.** Add `"use client"` only when you need interactivity.
- **Don't ship date-fns wholesale.** Import individually: `import { format } from "date-fns"` — Next bundler tree-shakes.
- **Lazy-load heavy charts.** `dynamic(() => import("./RevenueChart"), { ssr: false })` for any recharts component on a non-critical page.
- **Skeleton tracks the real shape.** Don't show a generic spinner box for a complex layout — match the cards.
- **Images via `next/image`.** Always. Set `priority` on the LCP image (usually the dashboard hero or patient header).

## 12. The copy-paste tax

When in doubt about copy, layout, or interaction, look at how an adjacent screen handles it and copy that. Inconsistency is the slow-burn enemy of design systems. If a pattern doesn't exist yet and won't repeat, just inline it. If it might repeat, propose extracting it as a domain component before merging.
