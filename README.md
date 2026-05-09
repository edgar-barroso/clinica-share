# ClinicaShare

> Plataforma web para gestão de repasses financeiros em clínicas multiprofissionais.

Sistema em desenvolvimento para **Dr. Edson Andrade**, proprietário de clínica médica multiprofissional, no contexto da disciplina de Desenvolvimento de Software (DevsTech). O produto automatiza o cálculo e o acompanhamento dos repasses devidos ao dono da clínica sobre as consultas realizadas pelos profissionais que utilizam seus consultórios.

## Status

**MVP 100% implementado e testado** (2026-05-08). Todas as 8 fases do
[IMPLEMENTACAO-PLANO.md](IMPLEMENTACAO-PLANO.md) concluídas:

| | Métrica | Valor |
|---|---|---|
| ✅ | Testes Vitest | **152 verde** |
| ✅ | Specs Playwright E2E | **27 verde** |
| ✅ | Cobertura `_usecases/repasse/calculate.ts` | 100% lines / 93.75% branches (RNF-104) |
| ✅ | `tsc --noEmit` | verde |
| ✅ | `npm run build` | verde |
| ✅ | Mocks em código de produção | **0** |

**Próximo passo**: R2 com Dr. Edson para validar PEND-002/014/015/017/030/031/032/045
(todas implementadas com defaults documentados).

- **35 casos de uso** confirmados em R1 (06/04/2026)
- **5 perfis de usuário**: Administrador, Auxiliar Financeiro, Profissional, Atendente, Paciente

## Como rodar

```bash
# 1. Postgres em Docker (porta 5433)
npm run db:up

# 2. Migrations + admin inicial
npm run db:migrate
npm run db:seed   # cria admin a partir de ADMIN_EMAIL/ADMIN_PASSWORD em .env

# 3. Dev server
npm run dev      # http://localhost:3000

# Validação
npx tsc --noEmit
npm test         # Vitest (integration + unit)
npm run test:e2e # Playwright
npm run build
```

Após rodar `npm test` (que limpa o banco), rode `npm run db:seed` novamente para
recriar o admin.

## Problema

A clínica recebe um percentual sobre cada consulta realizada nos seus consultórios. Sem controle financeiro dedicado, o Dr. Edson não consegue responder com confiança:

- Quanto deveria receber em cada período?
- Qual o recebimento por profissional, por consultório?
- Quais repasses estão em aberto? Quais já foram pagos?

## Solução (MVP)

- Registro de consultas por profissional e consultório
- Cálculo automático do percentual de repasse
- Relatórios financeiros (período / profissional / consultório)
- Dashboard consolidado para o administrador
- Trilha de auditoria em toda alteração financeira

**Fora do MVP:** prontuário eletrônico, agendamento avançado, portal do paciente, armazenamento de dados clínicos (LGPD).

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | [Next.js 16.2.4](https://nextjs.org) (App Router) |
| Runtime UI | [React 19.2.4](https://react.dev) |
| Estilização | [Tailwind CSS v4](https://tailwindcss.com) |
| Biblioteca de componentes | [shadcn/ui](https://ui.shadcn.com) + [Radix](https://www.radix-ui.com) |
| Ícones | [lucide-react](https://lucide.dev) |
| Formulários | [react-hook-form](https://react-hook-form.com) + [Zod](https://zod.dev) |
| Datas | [date-fns](https://date-fns.org) (locale pt-BR) |
| Gráficos | [Recharts](https://recharts.org) |
| Notificações | [Sonner](https://sonner.emilkowal.ski) |
| Tipagem | TypeScript 5 |
| Lint | ESLint 9 |

## Começando

### Pré-requisitos

- Node.js 20+ (recomendado 22 LTS)
- npm, pnpm, yarn ou bun

### Instalação

```bash
git clone https://github.com/<seu-usuario>/clinica-share.git
cd clinica-share
npm install
```

### Rodar em desenvolvimento

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

### Outros scripts

```bash
npm run build   # build de produção
npm run start   # servir o build
npm run lint    # rodar ESLint
```

## Estrutura de pastas

```
.
├── app/                        # App Router
│   ├── (auth)/                 # rotas públicas: login, recuperação
│   ├── (app)/                  # rotas logadas: dashboard, agenda, financeiro…
│   ├── p/                      # patient shell (mobile/PWA)
│   ├── layout.tsx              # root layout + fontes
│   ├── page.tsx                # landing / redirect
│   └── globals.css             # tokens do design system (Tailwind v4)
├── components/
│   ├── layouts/                # AppShell, Sidebar, Topbar, PageHeader, PatientShell
│   ├── ui/                     # primitivos shadcn (Button, Card, Input, …)
│   ├── dashboard/              # MetricStat…
│   ├── appointments/           # AppointmentCard, WeekDayPicker, TimeSlotPicker
│   ├── consultorios/           # ConsultorioCard
│   └── financial/              # FinanceTable, RepasseStatusBadge
├── lib/
│   ├── utils.ts                # helper cn()
│   ├── format.ts               # formatBRL, formatDate (pt-BR)
│   └── mock/                   # dados mockados do protótipo
├── public/                     # estáticos
├── .claude/                    # base de conhecimento (ver abaixo)
│   ├── context/                # metodologia, playbooks, estado, templates
│   └── skills/                 # design system da aplicação
├── PROTOTIPO-PLANO.md          # plano e sitemap do protótipo
├── CLAUDE.md                   # entrypoint do Claude Code
└── AGENTS.md                   # convenções para agentes de IA
```

## Mapa de rotas (protótipo)

### Públicas
- `/` — redireciona para `/login` ou `/dashboard`
- `/login` — autenticação
- `/esqueci-senha` — recuperação

### Área administrativa / profissional (AppShell)
- `/dashboard` — visão geral financeira (RE01, CO04)
- `/agenda` — agenda do profissional; `/agenda/novo` (AG02)
- `/consultorios` — lista (CO01) + `novo/` + `[id]/` (CO04)
- `/profissionais` — lista + `novo/` + `[id]/` (contrato FI01/FI02, turnos AG03/AG04, aluguel FI08)
- `/atendimentos` — lista (AT01) + `novo/` (AT01+AT02+AT04+FI05+FI06) + `[id]/` (AT03 prontuário)
- `/financeiro` — hub
  - `/repasses` — lista (FI03, FI04, FI05); `/[id]/` marcar como pago
  - `/fechamento` — prestação de contas semanal (FI07)
- `/relatorios` — hub
  - `/financeiro` (RE02), `/consultorios` (RE03)
  - `/gratuitas-descontos` (RE04), `/cancelamentos` (RE05)
- `/configuracoes` — `/turnos` (AG03), `/integracoes` (AG07)
- `/auditoria` — trilha de alterações financeiras

### Paciente (PatientShell — mobile-first)
- `/p` — home
- `/p/consultas` + `/p/consultas/[id]` — minhas consultas (AG06 cancelar)
- `/p/agendar` — fluxo de agendamento em passos (AG01 + FI09 pagamento)
- `/p/perfil` — perfil do paciente

## Regras de produto (não negociáveis)

Mantidas em [.claude/context/base/02-regras-inegociaveis.md](.claude/context/base/02-regras-inegociaveis.md):

- Valores monetários: inteiro em centavos **ou** `Decimal`. Nunca `float`/`double`.
- Toda alteração financeira gera registro de auditoria.
- Cálculo de repasse sempre no servidor, nunca no front-end.
- Dados clínicos de pacientes **não** entram no MVP (redução de risco LGPD).
- Interfaces em pt-BR. Valores com `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`. Datas com `date-fns` + locale `ptBR`.

## Design system

O sistema visual está documentado como skill em [.claude/skills/clinicashare-design-system/](.claude/skills/clinicashare-design-system/). Princípios:

- **Trust before delight** — software operacional para gestão, não app de wellness
- **Uma ação primária por tela** (botão azul `bg-primary`)
- **Status é cidadão de primeira classe** — `PaymentStatusBadge`, `RepasseStatusBadge`
- **Mobile não é opcional** — todo componente define comportamento responsivo
- **Nunca hex hardcoded** — tokens resolvem via CSS vars em `globals.css`

## Equipe

Projeto conduzido por 4 alunos. Divisão de responsabilidades em [.claude/context/estado/estado-equipe.md](.claude/context/estado/estado-equipe.md).

Metodologia baseada em Pressman (6ª ed.), seguindo as 5 frentes (comunicação, planejamento, modelagem, codificação, implementação) e as 5 atividades guarda-chuva (risco, SQA, configuração, RTF, controle). Ver [.claude/context/base/](.claude/context/base/).

## Contribuindo

- Crie branches nomeadas como `feature/xxx`, `fix/xxx`, `docs/xxx`.
- Commits seguem [Conventional Commits](https://www.conventionalcommits.org).
- Toda PR passa por revisão cruzada antes de merge em `main`.
- Cálculos de repasse exigem teste unitário cobrindo o caso antes do merge.

## Licença

Projeto acadêmico. Direitos reservados aos autores e ao Dr. Edson Andrade (cliente da simulação).
