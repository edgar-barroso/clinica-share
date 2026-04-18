---
name: clinicashare-design-system
description: Use whenever building, styling, or refactoring any UI for the ClinicaShare project (multi-professional clinic platform for Dr. Edson) on Next.js + Tailwind + shadcn/ui. Trigger on any request involving Next.js pages, React components, Tailwind classes, shadcn components, screen layouts, forms, dashboards, schedule/booking views, financial reports — even if "design system" is not said. Also trigger on "componentes", "telas", "UI", "estilo", "tema", "tokens", "cores", "responsivo", "mobile", "PWA", "shadcn", "Tailwind", "agendamento", "consultório", "dashboard financeiro", or any ClinicaShare module (Agendamento, Consultórios, Financeiro, Atendimentos, Prontuário, Relatórios). Provides design tokens, Tailwind/shadcn setup, healthcare-tailored component library, web + mobile screen recipes, and patterns for forms, empty states, loading, accessibility, LGPD, and pt-BR copy. Always consult before writing any ClinicaShare UI code.
---

# ClinicaShare Design System

A complete design system for the **ClinicaShare** Next.js + Tailwind + shadcn/ui application — covering responsive web and mobile (PWA) experiences for Dr. Edson's multi-professional clinic platform.

## When to read what

This SKILL.md is an **index**. Most requests need only one or two of the reference files below. Read them on demand instead of loading everything upfront.

| Reference file | Read it when you are about to... |
| --- | --- |
| `references/tokens.md` | Pick a color, font size, spacing, radius, or shadow. Define CSS variables. |
| `references/tailwind-setup.md` | Set up or modify `tailwind.config.ts`, `globals.css`, install shadcn/ui, configure dark mode, or add a new design token to Tailwind. |
| `references/components-core.md` | Build or restyle a primitive: Button, Input, Select, Textarea, Card, Badge, Avatar, Tabs, Dialog, Toast, Tooltip, Skeleton. |
| `references/components-domain.md` | Build a ClinicaShare-specific component: AppointmentCard, ConsultorioCard, ProfessionalRow, MetricStat, RepasseStatus, PaymentStatusBadge, TimeSlotPicker, WeeklyCalendar, FinanceTable. |
| `references/layouts-and-screens.md` | Lay out a full screen: web AppShell with sidebar, mobile BottomNav, login/onboarding, dashboard, schedule, booking flow, financial report. |
| `references/patterns.md` | Handle forms (RHF + Zod), validation messages, empty states, loading skeletons, error boundaries, toast notifications, accessibility (LGPD-aware), and i18n (pt-BR). |

## Design philosophy (read this every time)

ClinicaShare is a **healthcare management product**, not a consumer wellness app. The reference visuals (the ecare mockups) inform the *visual language* — clean, trustworthy, blue-led, generous whitespace — but the product itself is **operational software** used daily by clinic owners, financial assistants, healthcare professionals, receptionists, and patients. Keep these principles in mind:

1. **Trust before delight.** Healthcare and finance both demand a calm, predictable interface. Avoid playful illustrations in the admin/professional/financial flows. Reserve warmer, more illustrated treatments for the **patient-facing booking flow** (which mirrors the ecare consumer aesthetic most closely).
2. **Density depends on the actor.** The administrator (Dr. Edson) and the financial assistant need information density: tables, filters, dashboards. Patients need spacious, friendly layouts with one decision per screen. Professionals sit in between. Pick density based on who the screen is for — see the actor matrix in `references/layouts-and-screens.md`.
3. **Mobile is not optional.** RNF01 requires the app to work on tablet and phone. Every component must have a defined mobile behavior. Patients will primarily use mobile; Dr. Edson will use desktop. Design with this split in mind.
4. **One primary action per screen.** Schedule, confirm payment, register attendance, generate report. The blue primary button (`bg-primary`) belongs to that one action. Secondary actions go to outline/ghost variants.
5. **Status is a first-class citizen.** Payment status (paid/pending/free), appointment status (scheduled/confirmed/canceled/done), repasse status (open/paid) drive most of the UI. Use the `PaymentStatusBadge` and related components from `references/components-domain.md` instead of inventing new ones per screen.

## The ten-second snapshot

Before reading any reference file, here is the essential vocabulary so you can recognize the system at a glance:

- **Primary color:** `#257CFD` (a confident, slightly cool blue). Used for primary buttons, active tabs, links, and selected states. Hover variant `#1A6BE8`, pressed `#1559C9`.
- **Surfaces:** `#FFFFFF` cards on a `#F5F7FA` page background. Subtle `1px` border in `#E5E9F0` instead of heavy shadows.
- **Typography:** Inter (UI) with a single weight ramp (400/500/600/700). Numbers use `font-variant-numeric: tabular-nums` in tables and dashboards so columns align.
- **Radius:** `rounded-2xl` (16px) for cards, `rounded-xl` (12px) for inputs and buttons, `rounded-full` for avatars and pill badges.
- **Spacing:** 4px base. Use Tailwind's default scale; standardize on `gap-3` (12px) inside components, `gap-6` (24px) between components, `p-6` for card padding on desktop and `p-4` on mobile.
- **Status colors:** success `#10B981`, warning `#F59E0B`, danger `#EF4444`, info `#3B82F6`, neutral `#6B7280`. Always paired with a tinted background (e.g., `bg-emerald-50 text-emerald-700`) for badges.

For full token tables, color ramps, and code snippets, read `references/tokens.md`.

## Decision tree: what to do for a new UI request

Walk this top-down. Stop at the first match.

1. **Is the user setting up the project, adding Tailwind, or installing shadcn?** → Read `references/tailwind-setup.md` and follow the install order exactly. The CSS variables in `globals.css` are the source of truth for all colors — never hardcode hex values in components.
2. **Is the request about a single primitive (button, input, modal, etc.)?** → Read `references/components-core.md`. Use shadcn/ui as the base, then apply the variant patterns documented there. Do not roll your own primitive when shadcn ships one.
3. **Is the component clinic-specific (an appointment card, a consultório selector, a repasse row)?** → Read `references/components-domain.md`. These are composed from core primitives and encode business rules (e.g., a `PaymentStatusBadge` knows how to render `pago | pendente | gratuito`).
4. **Is it a full screen or layout?** → Read `references/layouts-and-screens.md`. Pick the shell (web AppShell vs. mobile patient flow) based on the actor, then assemble from documented blocks.
5. **Is it about behavior — forms, errors, empty states, loading, a11y, i18n?** → Read `references/patterns.md`. Validation copy, empty-state phrasing, and toast styles are standardized there.
6. **Are you composing several of the above?** → Read the relevant references in order and assemble. Do not improvise spacing, colors, or copy tone — every micro-decision is already covered.

## Hard rules (do not break)

- **Never** hardcode a color hex in a component. Always use a Tailwind token (`bg-primary`, `text-muted-foreground`) which resolves to a CSS variable defined in `globals.css`.
- **Never** introduce a new font family, radius value, or shadow without first updating `tokens.md` and `tailwind.config.ts`. Single source of truth.
- **Never** use a raw `<button>` or `<input>` in production code — always go through the shadcn/ui wrapper or a domain component built on top of it. This guarantees focus rings, disabled states, and a11y.
- **Never** put copy in English in user-facing surfaces. ClinicaShare is **pt-BR**. Error messages, empty states, and labels follow the conventions in `references/patterns.md`.
- **Never** show a monetary value without `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`. Never show a date without `date-fns/format` with the `ptBR` locale. Helpers live in `lib/format.ts` (see `tokens.md` for the snippet).
- **Always** wrap patient personal data (CPF, full name in lists, phone, address) in components that respect LGPD masking rules from `references/patterns.md`. Free text in screenshots is fine; production lists use the documented redaction helpers.

## Working with the user

ClinicaShare is being built by a small team using Claude Code. When implementing a request:

1. **State which reference files you are consulting** in one short line at the top of your response (e.g., "Consultando `tokens.md` e `components-domain.md`."). This keeps the user oriented without being noisy.
2. **Show the file tree of what you'll create or modify** before writing code, when more than two files are involved.
3. **Prefer editing existing files** over creating new ones. If a `Button` component already exists, extend its variants — don't add `Button2.tsx`.
4. **Default to TypeScript, function components, named exports.** Use `"use client"` only when the component actually needs interactivity (event handlers, hooks). Server components are the default in App Router.
5. **Co-locate component variants with `cva` (class-variance-authority)** — the pattern shadcn/ui uses. Examples in `components-core.md`.

That's the contract. Read the reference file you need, follow its patterns, and the app will stay coherent as it grows.
