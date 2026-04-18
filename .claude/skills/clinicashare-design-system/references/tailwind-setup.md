# Tailwind + shadcn/ui Setup

This file is the recipe for setting up the styling foundation of a fresh ClinicaShare Next.js app, or for adding a new token to the existing one. Follow the steps **in order** — shadcn/ui assumes specific files exist before you run `init`.

## 1. Project assumptions

- Next.js 14+ with the **App Router** (`app/` directory).
- TypeScript strict mode.
- `pnpm` is the package manager (the team standard). If the user uses npm or yarn, swap commands accordingly.
- Path alias `@/*` configured in `tsconfig.json` pointing to `./src/*` (or `./` if the user prefers a flat layout).

## 2. Install order

```bash
# 1. Tailwind + PostCSS
pnpm add -D tailwindcss@latest postcss autoprefixer
pnpm dlx tailwindcss init -p

# 2. shadcn/ui CLI + utilities
pnpm dlx shadcn@latest init

# 3. Class utilities (shadcn pulls these in but state explicitly for clarity)
pnpm add class-variance-authority clsx tailwind-merge tailwindcss-animate

# 4. Icons
pnpm add lucide-react

# 5. Forms (used heavily — see patterns.md)
pnpm add react-hook-form zod @hookform/resolvers

# 6. Dates and i18n
pnpm add date-fns

# 7. Charts (for the dashboard)
pnpm add recharts
```

When the `shadcn init` wizard runs, answer:
- Style: **Default**
- Base color: **Slate** (we override the palette anyway)
- CSS variables: **Yes**
- Tailwind config: accept the default path
- Components alias: `@/components`
- Utils alias: `@/lib/utils`
- React Server Components: **Yes**

## 3. `globals.css`

Replace the file shadcn generates with this. The variables encode every token from `tokens.md`. Components reference these via Tailwind semantic classes (`bg-primary`, `text-foreground`).

```css
/* app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* Surfaces */
    --background: 210 33% 97%;        /* #F5F7FA */
    --foreground: 222 47% 11%;        /* #0F172A */
    --card: 0 0% 100%;                /* #FFFFFF */
    --card-foreground: 222 47% 11%;
    --popover: 0 0% 100%;
    --popover-foreground: 222 47% 11%;

    /* Brand */
    --primary: 217 98% 57%;           /* #257CFD */
    --primary-foreground: 0 0% 100%;

    /* Neutrals */
    --secondary: 210 40% 96%;         /* #F1F5F9 */
    --secondary-foreground: 222 47% 11%;
    --muted: 210 40% 96%;
    --muted-foreground: 215 16% 47%;  /* #64748B */
    --accent: 210 40% 96%;
    --accent-foreground: 222 47% 11%;

    /* Status (also exposed as Tailwind colors below) */
    --destructive: 0 72% 51%;         /* #EF4444 */
    --destructive-foreground: 0 0% 100%;
    --success: 160 84% 39%;           /* #10B981 */
    --success-foreground: 0 0% 100%;
    --warning: 38 92% 50%;            /* #F59E0B */
    --warning-foreground: 0 0% 100%;

    /* Borders + focus */
    --border: 214 24% 92%;            /* #E5E9F0 */
    --input: 214 24% 92%;
    --ring: 217 98% 57%;              /* same as primary */

    --radius: 0.75rem;                /* 12px — base for shadcn radii */
  }

  /* Dark mode skeleton — not used in MVP, kept so we don't have to refactor later */
  .dark {
    --background: 222 47% 6%;
    --foreground: 210 40% 98%;
    --card: 222 47% 9%;
    --card-foreground: 210 40% 98%;
    --popover: 222 47% 9%;
    --popover-foreground: 210 40% 98%;
    --primary: 217 98% 60%;
    --primary-foreground: 222 47% 6%;
    --secondary: 217 33% 17%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217 33% 17%;
    --muted-foreground: 215 20% 65%;
    --accent: 217 33% 17%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 63% 41%;
    --destructive-foreground: 210 40% 98%;
    --border: 217 33% 17%;
    --input: 217 33% 17%;
    --ring: 217 98% 60%;
  }
}

@layer base {
  * { @apply border-border; }
  body {
    @apply bg-background text-foreground antialiased;
    font-feature-settings: "rlig" 1, "calt" 1;
  }
  /* Tabular numbers in tables and dashboards */
  table, .tabular { font-variant-numeric: tabular-nums; }
}

/* Selection */
::selection { @apply bg-primary/20 text-foreground; }
```

## 4. `tailwind.config.ts`

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        "2xl": "1rem",
      },
      boxShadow: {
        // Lighter than Tailwind defaults; matches reference visuals
        sm: "0 1px 2px rgb(0 0 0 / 0.04)",
        DEFAULT: "0 2px 6px rgb(0 0 0 / 0.05)",
        md: "0 4px 12px rgb(0 0 0 / 0.06)",
        lg: "0 12px 24px rgb(0 0 0 / 0.08)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
```

## 5. `lib/utils.ts`

shadcn generates this automatically. Confirm it looks like this:

```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

`cn` is used in **every** component to merge default and consumer className overrides. Never use raw template strings to combine classes.

## 6. Adding shadcn components

Whenever you need a primitive, install it via the CLI rather than copying code by hand:

```bash
pnpm dlx shadcn@latest add button input label card badge dialog tabs select textarea toast tooltip dropdown-menu popover sheet skeleton separator avatar
```

This drops files in `components/ui/`. Treat that folder as **generated** — modify variants and styling, but don't add unrelated logic to it. Domain components (anything ClinicaShare-specific) live in `components/` (one level up) and **import** from `components/ui/`.

## 7. Adding a new token later

If the user asks to add a new token (e.g., a new status color):

1. Update `references/tokens.md` first — the token table is the source of truth.
2. Add the CSS variable in `globals.css` under `:root` (and `.dark`).
3. Expose it in `tailwind.config.ts` under `theme.extend.colors`.
4. Document any new component variants in the appropriate `components-*.md` file.

Never skip step 1 — undocumented tokens drift fast.

## 8. Sanity check

After setup, drop this into `app/page.tsx` to verify everything is wired:

```tsx
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="container py-12 space-y-6">
      <h1 className="text-3xl font-bold">ClinicaShare</h1>
      <p className="text-muted-foreground">Tipografia base e cor primária.</p>
      <div className="flex gap-3">
        <Button>Ação primária</Button>
        <Button variant="outline">Secundária</Button>
        <Button variant="ghost">Terciária</Button>
      </div>
    </main>
  );
}
```

You should see Inter font, the `#257CFD` blue button, a soft rounded shape, and `#F5F7FA` background. If anything looks off (sharp corners, wrong blue, serif fallback), recheck step 3.
