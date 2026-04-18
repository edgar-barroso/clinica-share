# Core Components (Primitives)

These are the shadcn/ui primitives, configured for ClinicaShare's visual language. All components below assume the `tailwind-setup.md` install is complete and the files exist in `components/ui/`.

The job of this file is to (a) document which variants we use, (b) flag any deviations from shadcn defaults, and (c) show the canonical usage so you don't have to guess.

## Universal rules for primitives

- **Always import via `@/components/ui/<name>`.** Never re-implement.
- **Use `cn` from `@/lib/utils`** to merge classes when extending.
- **Use `cva` from `class-variance-authority`** to add new variants — never branch on `className` strings inline.
- **Prop-forward `...props` and `ref`** (use `React.forwardRef`) on any wrapper so refs and event handlers behave.

## 1. Button

The default shadcn Button matches our visual language with one tweak: round corners to `rounded-xl` instead of `rounded-md`. Apply this in `components/ui/button.tsx` by changing the base classes inside `buttonVariants`:

```ts
// components/ui/button.tsx — buttonVariants base
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/95",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        success: "bg-success text-success-foreground hover:bg-success/90",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-lg px-3",
        lg: "h-11 rounded-xl px-6 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);
```

### When to use each variant

| Variant | When |
| --- | --- |
| `default` | The single primary action on the screen ("Confirmar agendamento", "Salvar", "Continuar"). |
| `outline` | Secondary actions ("Cancelar", "Voltar", "Editar" on a detail page). |
| `ghost` | Tertiary, navigation-like ("Ver tudo", icon-only toolbar buttons). |
| `secondary` | Filled neutral when `outline` doesn't have enough weight against a busy background. |
| `destructive` | Irreversible: "Excluir paciente", "Cancelar consulta". Always pair with a confirmation dialog. |
| `success` | Reserved for explicit positive confirmation ("Marcar como pago"). Use sparingly. |
| `link` | Inline links inside text. |

### Loading state

```tsx
import { Loader2 } from "lucide-react";

<Button disabled={isLoading}>
  {isLoading && <Loader2 className="animate-spin" />}
  Salvar alterações
</Button>
```

Don't change the button width during loading — keep the label visible and the spinner before it. Replacing the entire label with just a spinner causes layout jumps.

## 2. Input + Label + Field

```tsx
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

<div className="space-y-1.5">
  <Label htmlFor="cpf">CPF</Label>
  <Input id="cpf" placeholder="000.000.000-00" />
</div>
```

For consistent form layouts with errors and helper text, use the **Field** wrapper (a domain pattern — see `patterns.md` section "Forms"). It handles the layout, error message, and aria-describedby wiring.

## 3. Card

shadcn's Card maps directly to our card style. Use it for every elevated surface.

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";

<Card>
  <CardHeader>
    <CardTitle>Receita da semana</CardTitle>
    <CardDescription>09 a 15 de abril</CardDescription>
  </CardHeader>
  <CardContent>
    <p className="text-3xl font-bold tabular-nums">R$ 12.450,00</p>
  </CardContent>
  <CardFooter className="text-sm text-muted-foreground">
    +8% em relação à semana anterior
  </CardFooter>
</Card>
```

Override `Card` base in `components/ui/card.tsx` to use `rounded-2xl` and a softer border:

```ts
const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-2xl border border-border bg-card text-card-foreground shadow-sm",
        className
      )}
      {...props}
    />
  )
);
Card.displayName = "Card";
```

## 4. Badge

For status pills throughout the app. We extend the variants to include our status colors.

```ts
// components/ui/badge.tsx — badgeVariants
const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary/10 text-primary",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        outline: "text-foreground",
        success: "border-transparent bg-emerald-100 text-emerald-700",
        warning: "border-transparent bg-amber-100 text-amber-700",
        danger:  "border-transparent bg-red-100 text-red-700",
        info:    "border-transparent bg-blue-100 text-blue-700",
        neutral: "border-transparent bg-gray-100 text-gray-700",
      },
    },
    defaultVariants: { variant: "default" },
  }
);
```

For payment/appointment statuses, prefer the domain `PaymentStatusBadge` and `AppointmentStatusBadge` (see `components-domain.md`) rather than calling Badge directly — they encode the mapping from business status → variant.

## 5. Avatar

```tsx
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

<Avatar>
  <AvatarImage src={professional.photoUrl} alt={professional.name} />
  <AvatarFallback>{getInitials(professional.name)}</AvatarFallback>
</Avatar>
```

`getInitials` lives in `lib/utils.ts`:

```ts
export function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");
}
```

Sizes are controlled with Tailwind: `<Avatar className="size-8" />`, `size-10`, `size-12`. Default is `size-10`.

## 6. Tabs

Use shadcn's Tabs as-is. The visual hierarchy in `Schedule` (Upcoming / Past) in the reference is exactly this component.

```tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

<Tabs defaultValue="upcoming">
  <TabsList>
    <TabsTrigger value="upcoming">Próximas</TabsTrigger>
    <TabsTrigger value="past">Anteriores</TabsTrigger>
  </TabsList>
  <TabsContent value="upcoming">{/* ... */}</TabsContent>
  <TabsContent value="past">{/* ... */}</TabsContent>
</Tabs>
```

For a more pill-shaped TabsList that matches the reference exactly, override the `TabsList` base classes:

```ts
// components/ui/tabs.tsx — TabsList
className={cn(
  "inline-flex h-10 items-center justify-center rounded-full bg-muted p-1 text-muted-foreground",
  className
)}
// And TabsTrigger:
className={cn(
  "inline-flex items-center justify-center whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm",
  className
)}
```

## 7. Dialog and Sheet

- **Dialog** for confirmations, short forms, and detail views on desktop.
- **Sheet** (slide-in panel) for the same purpose on mobile, or for any flow where the user needs to keep some context behind the panel (e.g., editing a single appointment from the calendar).

Both use the same composition pattern; consult shadcn docs if you need the full API. The override we apply: rounded `2xl`, max-width `max-w-md` for confirmations, `max-w-2xl` for forms.

## 8. Toast

Use `sonner` (shadcn ships an integration) — simpler API than the original toast.

```bash
pnpm dlx shadcn@latest add sonner
```

```tsx
// app/layout.tsx
import { Toaster } from "@/components/ui/sonner";
<body>{children}<Toaster richColors position="top-right" /></body>

// usage
import { toast } from "sonner";
toast.success("Agendamento confirmado");
toast.error("Não foi possível concluir o pagamento");
```

Copy guidelines for toast messages live in `patterns.md`.

## 9. Tooltip

```tsx
<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild><Button variant="ghost" size="icon"><Info /></Button></TooltipTrigger>
    <TooltipContent>Repasse calculado sobre consultas e procedimentos.</TooltipContent>
  </Tooltip>
</TooltipProvider>
```

Wrap the entire app in `<TooltipProvider>` once in `app/layout.tsx` — don't sprinkle it per-component.

## 10. Skeleton

```tsx
import { Skeleton } from "@/components/ui/skeleton";

<div className="space-y-3">
  <Skeleton className="h-4 w-1/3" />
  <Skeleton className="h-4 w-2/3" />
  <Skeleton className="h-32 w-full rounded-2xl" />
</div>
```

Use skeletons for any async load that takes longer than ~200ms. For shorter loads, no skeleton — flash of layout is worse than the wait.

## 11. Separator

```tsx
import { Separator } from "@/components/ui/separator";
<Separator className="my-6" />
```

Use sparingly. Spacing usually does the job; reach for a separator only when two visually similar blocks need a hard divide.

## 12. DropdownMenu

For row actions in tables, profile menus, "more options" buttons. shadcn's defaults are fine; the only style override is the trigger button typically being `<Button variant="ghost" size="icon">`.

```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="icon"><MoreVertical /></Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuItem>Ver detalhes</DropdownMenuItem>
    <DropdownMenuItem>Editar</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem className="text-destructive">Excluir</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

## 13. Select

shadcn's Select (built on Radix) is the standard. For combobox / search-in-select, use shadcn's Command + Popover composition (see their docs).

## 14. Checkbox and Switch

Both ship in shadcn. Use Checkbox in lists/forms, Switch for instant-toggle settings (e.g., "Ativar lembretes via WhatsApp").

```tsx
<div className="flex items-center gap-3">
  <Switch id="reminders" />
  <Label htmlFor="reminders">Enviar lembrete via WhatsApp</Label>
</div>
```

## 15. The "do not invent" list

The following primitives **must** come from shadcn — never hand-rolled:

- Button, Input, Textarea, Select, Checkbox, Switch, Radio
- Dialog, Sheet, Popover, DropdownMenu, Tooltip, Toast, Command
- Tabs, Accordion, Separator
- Avatar, Badge, Card, Skeleton

If you find yourself reaching for a `<button onClick=…>` directly, stop and import `Button` instead. Same for forms, modals, and tooltips. This is the contract that keeps the app accessible by default.
