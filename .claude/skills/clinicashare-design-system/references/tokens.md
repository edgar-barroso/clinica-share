# Design Tokens

Tokens are the **single source of truth** for every visual decision. They live in CSS variables (defined in `globals.css`) and are exposed through Tailwind via `tailwind.config.ts`. Components consume Tailwind utility classes — never raw hex values.

## 1. Color system

### 1.1 Brand

The primary brand color is a confident, slightly cool blue lifted from the reference visuals. It signals trust and is reserved for **the single primary action on a screen**, active navigation states, and links.

| Token | Hex | Use |
| --- | --- | --- |
| `--primary-50`  | `#EEF5FF` | Backgrounds for selected list rows, primary-tinted callouts |
| `--primary-100` | `#D9E8FF` | Hover backgrounds on tinted surfaces |
| `--primary-200` | `#B8D4FF` | Focus rings on primary-colored controls |
| `--primary-300` | `#8AB7FE` | Disabled primary buttons (with `text-white`) |
| `--primary-400` | `#5497FE` | Secondary brand accents |
| `--primary-500` | `#257CFD` | **Primary brand. Default button background.** |
| `--primary-600` | `#1A6BE8` | Primary button hover |
| `--primary-700` | `#1559C9` | Primary button pressed / active link |
| `--primary-800` | `#10449E` | Headings on primary-tinted backgrounds |
| `--primary-900` | `#0B3278` | High-emphasis brand text |

In Tailwind these map to `bg-primary` / `bg-primary-600` / etc. shadcn's `primary` semantic token equals `--primary-500`.

### 1.2 Neutrals (surfaces and text)

| Token | Hex | Use |
| --- | --- | --- |
| `--background`         | `#F5F7FA` | Page background |
| `--card`               | `#FFFFFF` | Card and elevated-surface background |
| `--popover`            | `#FFFFFF` | Popovers, dropdowns, dialogs |
| `--border`             | `#E5E9F0` | All borders, dividers |
| `--input`              | `#E5E9F0` | Input border (resting) |
| `--ring`               | `#257CFD` | Focus ring (matches primary) |
| `--foreground`         | `#0F172A` | Primary text (headings, body) |
| `--muted`              | `#F1F5F9` | Tinted neutral background (badges, hover rows) |
| `--muted-foreground`   | `#64748B` | Secondary text, labels, placeholder |
| `--accent`             | `#F1F5F9` | Hover background for ghost buttons / nav items |
| `--accent-foreground`  | `#0F172A` | Text on accent surfaces |

### 1.3 Status colors

Each status has a **foreground** (text/icon) and a **soft background** (badge fill). Always use the pair — never a status background without its corresponding foreground.

| Status | Foreground | Soft background | Use |
| --- | --- | --- | --- |
| Success / Pago | `#047857` | `#D1FAE5` | Confirmed payment, attendance done |
| Warning / Pendente | `#B45309` | `#FEF3C7` | Pending payment, action needed |
| Danger / Cancelado | `#B91C1C` | `#FEE2E2` | Errors, canceled appointments, overdue repasses |
| Info / Agendado | `#1D4ED8` | `#DBEAFE` | Scheduled appointments, informational notes |
| Neutral / Gratuito | `#374151` | `#F3F4F6` | Free consultations, archived items |

In Tailwind: `text-emerald-700 bg-emerald-100` etc. (the values above match Tailwind's `*-700` / `*-100` shades for emerald, amber, red, blue, gray).

### 1.4 Charts and data viz

When showing financial dashboards or occupancy charts, rotate through this palette in order. They are tuned to be distinguishable on white and to print well.

```
--chart-1: #257CFD   /* primary */
--chart-2: #10B981   /* emerald */
--chart-3: #F59E0B   /* amber */
--chart-4: #8B5CF6   /* violet */
--chart-5: #EC4899   /* pink */
```

## 2. Typography

### 2.1 Font family

**Inter** for everything. Load via `next/font/google` so it's self-hosted and zero-CLS.

```ts
// app/layout.tsx
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});
```

Then in `globals.css`:

```css
@layer base {
  html { font-family: var(--font-sans), ui-sans-serif, system-ui, sans-serif; }
}
```

### 2.2 Type scale

Use Tailwind's defaults. The full scale your app will need is below — do not introduce intermediate sizes.

| Class | Size / line-height | Weight | Use |
| --- | --- | --- | --- |
| `text-xs`   | 12 / 16 | 500 | Captions, helper text, table meta |
| `text-sm`   | 14 / 20 | 400/500 | Body in dense UIs (tables, forms, dashboards) |
| `text-base` | 16 / 24 | 400 | Body in patient-facing flows |
| `text-lg`   | 18 / 28 | 600 | Card titles |
| `text-xl`   | 20 / 28 | 600 | Section headers inside a page |
| `text-2xl`  | 24 / 32 | 700 | Page titles (mobile) |
| `text-3xl`  | 30 / 36 | 700 | Page titles (desktop) |
| `text-4xl`  | 36 / 40 | 700 | Hero numbers in dashboards (e.g., "R$ 12.450") |

### 2.3 Numeric data

Tabular numbers everywhere money or counts appear in a column:

```css
.tabular { font-variant-numeric: tabular-nums; }
```

Or the Tailwind utility `tabular-nums`.

## 3. Spacing

Stick to Tailwind's default 4px scale. The cheat sheet for ClinicaShare:

| Context | Value |
| --- | --- |
| Inside a chip / badge | `px-2 py-0.5` |
| Inside a button | `px-4 py-2` (default), `px-3 py-1.5` (sm), `px-6 py-3` (lg) |
| Card padding | `p-6` desktop, `p-4` mobile |
| Stack between siblings inside a card | `space-y-3` |
| Stack between cards | `space-y-6` (or `gap-6` on a grid) |
| Page horizontal padding | `px-6` desktop, `px-4` mobile |
| Page vertical padding | `py-8` desktop, `py-6` mobile |

## 4. Border radius

| Token | Value | Use |
| --- | --- | --- |
| `rounded-md`   | 6px  | Tags inside text |
| `rounded-lg`   | 8px  | Small chips, segmented controls |
| `rounded-xl`   | 12px | Inputs, buttons, small cards |
| `rounded-2xl`  | 16px | Cards, modals, sheets |
| `rounded-full` | 9999px | Avatars, pill badges, FABs |

The reference visuals lean heavily on `rounded-2xl` — that's what gives them their soft, modern feel. Don't drop below `rounded-xl` on interactive elements.

## 5. Shadows

The reference design avoids heavy shadows. We do the same — borders carry most of the elevation work.

| Token | Value | Use |
| --- | --- | --- |
| `shadow-none`     | none | Cards in lists (use border instead) |
| `shadow-sm`       | `0 1px 2px rgb(0 0 0 / 0.04)` | Floating cards, hovering buttons |
| `shadow-md`       | `0 4px 12px rgb(0 0 0 / 0.06)` | Dropdowns, popovers |
| `shadow-lg`       | `0 12px 24px rgb(0 0 0 / 0.08)` | Modals, sheets |

Define them as Tailwind extensions (see `tailwind-setup.md`) — don't override Tailwind defaults; they're too heavy.

## 6. Motion

Use Tailwind's transition utilities. Standardize on:

| Use | Class |
| --- | --- |
| Hover color/background changes | `transition-colors duration-150` |
| Transform (scale, translate) | `transition-transform duration-200 ease-out` |
| Opening dialogs/sheets | shadcn defaults (handled by Radix) |
| Page transitions | None by default. Add per-flow only if the user asks. |

Avoid bounce easings. Healthcare UI should feel calm.

## 7. Iconography

Use **lucide-react** exclusively. Default size `16` inside text and `20` inside buttons. Stroke width `1.75` for visual weight closer to the reference.

```tsx
import { Calendar } from "lucide-react";
<Calendar size={20} strokeWidth={1.75} className="text-muted-foreground" />
```

Never mix icon libraries.

## 8. Formatting helpers

Money and dates are formatting decisions, not visual ones, but they belong here because they're tokens of consistency.

```ts
// lib/format.ts
import { format as fmtDate, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export const formatBRL = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);

export const formatPercent = (value: number, fractionDigits = 1) =>
  new Intl.NumberFormat("pt-BR", {
    style: "percent",
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);

export const formatDate = (date: Date | string, pattern = "dd 'de' MMM yyyy") =>
  fmtDate(typeof date === "string" ? new Date(date) : date, pattern, {
    locale: ptBR,
  });

export const formatTime = (date: Date | string) =>
  fmtDate(typeof date === "string" ? new Date(date) : date, "HH:mm", {
    locale: ptBR,
  });

export const formatRelative = (date: Date | string) =>
  formatDistanceToNow(typeof date === "string" ? new Date(date) : date, {
    locale: ptBR,
    addSuffix: true,
  });
```

Always import from `@/lib/format`. Don't inline `Intl.NumberFormat` calls in components.

## 9. Dark mode

Out of scope for the MVP. The CSS variable structure (see `tailwind-setup.md`) supports it — keep using semantic tokens (`bg-card`, `text-foreground`) so dark mode can be added later by swapping the variable values inside a `.dark` selector. Never hardcode `bg-white` or `text-black` in components.
