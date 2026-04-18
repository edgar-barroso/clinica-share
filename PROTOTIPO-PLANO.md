# ClinicaShare — Plano do Protótipo Navegável

> **Status:** proposta aguardando aprovação (revisão após leitura dos artefatos de R1)
> **Escopo:** protótipo de descoberta/validação dos 36 casos de uso já levantados em R1
> **Última atualização:** 2026-04-18

## Aviso metodológico (leia antes de tudo)

### 1. Os arquivos `estado-*.md` estão desatualizados

Durante a construção deste plano descobri contradição entre o **doc de requisitos v1** ([.claude/context/reunioes/R1/requisitos-v1.docx](.claude/context/reunioes/R1/requisitos-v1.docx)), a **planilha de custos v2** ([.claude/context/visao-roi/planilha-custos-v2-2026-04-16.xlsx](.claude/context/visao-roi/planilha-custos-v2-2026-04-16.xlsx)), o **documento de visão** e os arquivos `estado-*.md`:

| Item | estado-*.md diz | Doc de R1 / Planilha / Visão dizem |
|---|---|---|
| Prontuário eletrônico | **Fora** do MVP (DEC-001) | **Dentro**: AT03 (Alta prioridade), campos a definir em R2 |
| Agendamento online (paciente) | **Fora** do MVP (DEC-002) | **Dentro**: AG01 (Alta prioridade), portal web |
| Portal do paciente | **Fora** do MVP (DEC-003) | **Dentro**: AG01, AG06, FI09 confirmados |
| Requisitos funcionais confirmados | Nenhum | **36 casos de uso** em 6 módulos, prioridade Alta/Média |
| Atores | Não listados | **5 atores** com níveis de acesso definidos |

**Origem da contradição:** os `estado-*.md` foram criados com base no briefing inicial, mas a R1 (06/04/2026) ampliou o escopo. Ninguém atualizou os arquivos de estado. Esta é uma falha de gestão de configuração (atividade guarda-chuva).

**Ação necessária (antes de executar o protótipo):** atualizar `estado-requisitos-confirmados.md`, `estado-decisoes-tomadas.md` e `estado-pendencias-cliente.md` para refletir a verdade pós-R1. Proponho fazer em um passo separado — posso gerar os diffs se você pedir.

### 2. Ainda assim, o protótipo é throwaway

Mesmo com 36 casos de uso, os detalhes (turnos exatos, campos de prontuário, regras de conflito, integração WhatsApp, etc.) seguem em aberto para R2. O protótipo é a ferramenta para destravar essas decisões — **mostrar ao Dr. Edson para validar visual e fluxo**. Dados mockados, sem autenticação real, sem backend.

## 1. Atores e shells

Baseado em [requisitos-v1.docx tabela de atores] + [design system actor matrix](.claude/skills/clinicashare-design-system/references/layouts-and-screens.md):

| Ator | Dispositivo | Shell | Módulos acessados |
|---|---|---|---|
| **Dr. Edson (Administrador)** | Desktop (+ mobile p/ consulta) | `AppShell` | Todos |
| **Auxiliar Financeiro** | Desktop | `AppShell` | Financeiro, Relatórios, Atendimentos (leitura) |
| **Profissional de Saúde** | Tablet/notebook | `AppShell` | Própria agenda, próprios atendimentos, próprio financeiro |
| **Atendente do Profissional** | Desktop/smartphone | `AppShell` compacto | Agenda do(s) profissional(is) vinculado(s) |
| **Paciente** | Smartphone/computador | `PatientShell` | Próprios agendamentos, pagamento |

No protótipo, vou simular troca de ator por um **seletor no topbar** (dev-only) — facilita demo sem precisar de login real por perfil.

## 2. Stack

### Já instalado
- Next.js **16.2.4** (App Router, React Server Components)
- React **19.2.4**
- Tailwind CSS **v4** (via `@tailwindcss/postcss`)
- TypeScript 5, ESLint 9
- Fonts Geist

### A adicionar

| Pacote | Uso | Casos de uso que justificam |
|---|---|---|
| `shadcn/ui` (via CLI, canary compatível com Tailwind v4) | Primitivos Button, Input, Select, Card, Dialog, Tabs, Badge, Avatar, Sheet, Table, Toast, Skeleton | Todos |
| `lucide-react` | Ícones do design system | Todos |
| `class-variance-authority` + `clsx` + `tailwind-merge` | Variantes + helper `cn()` | Todos |
| `date-fns` + pt-BR locale | Formatação de datas | AG01-07, AT01, FI07, RE02 |
| `react-hook-form` + `zod` + `@hookform/resolvers` | Formulários | Todo CRUD |
| `recharts` | Gráficos | RE01, RE03, CO04, Dashboard |
| `sonner` | Toasts (confirmação de pagamento, cancelamento, etc.) | FI05, FI06, AG06 |

## 3. Inventário de telas (mapeamento para casos de uso)

Total: **35 telas**, cobrindo os 36 casos de uso confirmados.

### 3.1 Públicas — sem shell (4)
| # | Rota | Caso(s) de uso | Fase |
|---|---|---|---|
| 1 | `/` | redireciona | F1 |
| 2 | `/login` | RF-021 | F1 |
| 3 | `/esqueci-senha` | RF-026 | F2 |
| 4 | `/redefinir-senha` | RF-026 | F2 |

### 3.2 AppShell — admin/auxiliar/profissional/atendente (22)

**Navegação principal (sidebar):**
| # | Rota | Caso(s) de uso | Fase |
|---|---|---|---|
| 5  | `/dashboard` | RE01, CO04 | F1 |
| 6  | `/agenda` | visão geral/por profissional | F1 |
| 7  | `/agenda/novo` | AG02 (atendente agenda em nome do paciente) | F1 |
| 8  | `/consultorios` | CO01 (lista) | F1 |
| 9  | `/consultorios/novo` | CO01 | F2 |
| 10 | `/consultorios/[id]` | CO01 + aba ocupação CO04 | F2 |
| 11 | `/profissionais` | lista | F1 |
| 12 | `/profissionais/novo` | cadastro base | F2 |
| 13 | `/profissionais/[id]` | dados + contrato FI01/FI02 + turnos AG03/AG04 + aluguel FI08 | F2 |
| 14 | `/atendimentos` | lista (AT01) | F1 |
| 15 | `/atendimentos/novo` | AT01 + AT02 + AT04 + FI05 + FI06 | F1 |
| 16 | `/atendimentos/[id]` | detalhe + prontuário AT03 | F2 |
| 17 | `/financeiro` | hub | F1 |
| 18 | `/financeiro/repasses` | FI03, FI04, FI05 | F1 |
| 19 | `/financeiro/repasses/[id]` | detalhe + marcar pago | F2 |
| 20 | `/financeiro/fechamento` | FI07 (semanal) | F1 |
| 21 | `/relatorios` | hub | F2 |
| 22 | `/relatorios/financeiro` | RE02 | F2 |
| 23 | `/relatorios/consultorios` | RE03 | F2 |
| 24 | `/relatorios/gratuitas-descontos` | RE04 | F2 |
| 25 | `/relatorios/cancelamentos` | RE05 | F2 |
| 26 | `/configuracoes` | geral | F2 |
| 27 | `/configuracoes/turnos` | turnos da clínica (AG03) | F2 |
| 28 | `/configuracoes/integracoes` | AG07 (WhatsApp IA) | F2 |
| 29 | `/auditoria` | RNF-002 / audit log | F2 |

### 3.3 PatientShell — paciente (5)
| # | Rota | Caso(s) de uso | Fase |
|---|---|---|---|
| 30 | `/p` | home (minhas consultas próximas) | F3 |
| 31 | `/p/consultas` | lista completa | F3 |
| 32 | `/p/agendar` | fluxo multi-step (escolher especialidade → profissional → data → horário → pagamento) | F3 |
| 33 | `/p/consultas/[id]` | detalhe + cancelar | F3 |
| 34 | `/p/perfil` | dados do paciente | F3 |

Casos de uso cobertos: **AG01, AG06, FI09**.

### 3.4 Utilitárias (2)
| # | Arquivo | Fase |
|---|---|---|
| 35a | `app/not-found.tsx` | F2 |
| 35b | `app/error.tsx` | F2 |

## 4. Faseamento sugerido

### F1 — Núcleo admin/profissional (15 telas)
**Foco:** mostrar ao Dr. Edson que o sistema "funciona" end-to-end no fluxo mais crítico: registrar atendimento → calcular repasse → fechar semana.

Telas: 1, 2, 5, 6, 7, 8, 11, 14, 15, 17, 18, 20, 29 (dashboard), e sidebar/topbar/layouts.

**Entregável:** navegação clicável pela sidebar, dados mockados consistentes (3 profissionais, 12 consultórios, ~30 atendimentos), responsivo até `md`.

### F2 — Completar CRUDs, relatórios, configurações (14 telas)
Telas: 3, 4, 9, 10, 12, 13, 16, 19, 21-28, utilitárias.

### F3 — Portal do paciente (5 telas)
Telas: 30-34. Executar somente se F1+F2 forem aprovados pelo cliente; depende de definição de gateway de pagamento (FI09 pendente).

### Fora do protótipo (mas listado na planilha)
- **AT03 (prontuário)**: escopo em aberto para R2. Mockar só a aba vazia em `/atendimentos/[id]` com mensagem "Campos a definir na R2".
- **AG05 (bloqueio de conflito)**: lógica pura, não gera tela dedicada. Aparece como validação no `/agenda/novo`.
- **AG07 (lembrete WhatsApp)**: fora do MVP do protótipo (depende de API externa paga). Só mostrar página `/configuracoes/integracoes` com status "não configurado".
- **RF-022/023/024/025**: lógica de autorização — simulada via selector de perfil no topbar do protótipo.

## 5. Decisões técnicas do protótipo (assumidas — sinalize se discordar)

1. **Sem autenticação real.** Selector de perfil no topbar alterna entre os 5 atores.
2. **Dados mockados em `lib/mock/*.ts`** — arrays tipados em TypeScript.
3. **Rotas com App Router e grupos:**
   - `app/(auth)/` — login, esqueci-senha, redefinir (layout sem shell)
   - `app/(app)/` — todas as telas com `AppShell`
   - `app/p/` — telas com `PatientShell`
4. **Server components por padrão**; `"use client"` só para: formulários, gráficos, interações, selector de perfil.
5. **Valores em BRL e datas em pt-BR** via helpers `lib/format.ts` (`formatBRL`, `formatDate`, `formatRelative`).
6. **Zero hex hardcoded** — tokens CSS vars em `globals.css` (Tailwind v4 usa `@theme` no CSS, não `tailwind.config.ts`).
7. **Banner "PROTÓTIPO"** fixo no topo da tela para não confundir o cliente.

## 6. Estrutura de pastas

```
app/
├── (auth)/
│   ├── login/page.tsx
│   ├── esqueci-senha/page.tsx
│   └── redefinir-senha/page.tsx
├── (app)/
│   ├── layout.tsx                  ← AppShell + banner protótipo
│   ├── dashboard/page.tsx
│   ├── agenda/
│   │   ├── page.tsx
│   │   └── novo/page.tsx
│   ├── consultorios/
│   │   ├── page.tsx
│   │   ├── novo/page.tsx
│   │   └── [id]/page.tsx
│   ├── profissionais/
│   │   ├── page.tsx
│   │   ├── novo/page.tsx
│   │   └── [id]/page.tsx
│   ├── atendimentos/
│   │   ├── page.tsx
│   │   ├── novo/page.tsx
│   │   └── [id]/page.tsx
│   ├── financeiro/
│   │   ├── page.tsx
│   │   ├── repasses/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   └── fechamento/page.tsx
│   ├── relatorios/
│   │   ├── page.tsx
│   │   ├── financeiro/page.tsx
│   │   ├── consultorios/page.tsx
│   │   ├── gratuitas-descontos/page.tsx
│   │   └── cancelamentos/page.tsx
│   ├── configuracoes/
│   │   ├── page.tsx
│   │   ├── turnos/page.tsx
│   │   └── integracoes/page.tsx
│   └── auditoria/page.tsx
├── p/
│   ├── layout.tsx                  ← PatientShell
│   ├── page.tsx
│   ├── consultas/
│   │   ├── page.tsx
│   │   └── [id]/page.tsx
│   ├── agendar/page.tsx
│   └── perfil/page.tsx
├── layout.tsx                      ← root (fontes, tema, contexto de perfil)
├── page.tsx                        ← redirect
├── not-found.tsx
├── error.tsx
└── globals.css                     ← @theme com tokens do design system

components/
├── layouts/
│   ├── AppShell.tsx
│   ├── Sidebar.tsx
│   ├── Topbar.tsx
│   ├── RoleSwitcher.tsx            ← seletor de perfil (protótipo-only)
│   ├── PrototypeBanner.tsx
│   ├── PageHeader.tsx
│   ├── PatientShell.tsx
│   └── PatientBottomNav.tsx
├── ui/                             ← shadcn primitivos
├── dashboard/                      ← MetricStat, ReceitaChart, etc.
├── agenda/                         ← AppointmentCard, WeekDayPicker, TimeSlotPicker
├── consultorios/                   ← ConsultorioCard, OcupacaoBar
├── profissionais/                  ← ProfessionalRow, ContratoForm
├── atendimentos/                   ← AtendimentoRow, ProcedimentoExtra
├── financial/                      ← FinanceTable, RepasseStatusBadge, PaymentStatusBadge
└── EmptyState.tsx

lib/
├── utils.ts                        ← cn()
├── format.ts                       ← formatBRL, formatDate (date-fns + ptBR)
├── role.tsx                        ← contexto React para ator simulado
└── mock/
    ├── profissionais.ts            ← 6 profissionais (médicos, psi, fisio) com contratos
    ├── consultorios.ts             ← 12 consultórios com especialidades
    ├── turnos.ts                   ← manhã, tarde, noite
    ├── pacientes.ts                ← 20 pacientes fictícios
    ├── atendimentos.ts             ← 50 atendimentos dos últimos 30 dias
    ├── procedimentos.ts            ← catálogo de procedimentos extras
    ├── repasses.ts                 ← repasses derivados dos atendimentos
    └── auditoria.ts                ← log de alterações
```

## 7. Ordem de execução dentro da F1

1. **Setup:** `globals.css` com tokens do design system (Tailwind v4 `@theme`), `lib/utils.ts`, `lib/format.ts`, `lib/role.tsx` (contexto de perfil), `lib/mock/*`.
2. **shadcn/ui:** `npx shadcn@canary init` e add dos primitivos (button, card, input, select, textarea, dialog, tabs, badge, avatar, sheet, table, skeleton, sonner, tooltip).
3. **Shell:** `AppShell`, `Sidebar`, `Topbar` (com `RoleSwitcher`), `PageHeader`, `PrototypeBanner`.
4. **Landing + Login** (redirect baseado em cookie/localStorage de "perfil atual").
5. **Dashboard** (RE01 + CO04).
6. **Consultórios** (lista CO01) → **Profissionais** (lista) → **Atendimentos** (lista AT01) → **Atendimentos > Novo** (AT01+AT02+FI05+FI06).
7. **Financeiro hub → Repasses** (FI03+FI05) → **Fechamento** (FI07).
8. **Agenda** (visão do profissional) → **Agenda > Novo** (AG02).
9. **Auditoria** (RNF-002) — read-only.
10. **Validação end-to-end:** navegar toda a sidebar, validar responsividade, gerar screenshots para apresentar na R2.

## 8. Critério de "pronto" da F1

- [ ] 15 telas F1 navegáveis e consistentes
- [ ] Selector de perfil funcional (alterna Admin/Aux/Prof/Atend/Paciente)
- [ ] Todos os valores formatados em BRL; todas as datas em pt-BR
- [ ] Banner "PROTÓTIPO" visível em todas as telas de `/app`
- [ ] Dados mockados: 12 consultórios + 6 profissionais + 20 pacientes + 50 atendimentos + repasses derivados
- [ ] `npm run build` passa sem erro
- [ ] README e PROTOTIPO-PLANO atualizados
- [ ] Screenshots das 15 telas gerados em `/docs/screenshots/` para anexar na R2

## 9. Risco / Alternativas / Pendências

**Risco:** a contradição entre `estado-*.md` e requisitos v1 pode gerar retrabalho se a equipe tomar decisões com base no estado-arquivo errado. Mitigação: atualizar `estado-*.md` ANTES de começar a codar (é o próximo passo que proponho).

**Alternativa descartada:** começar direto pela F3 (paciente) — seria mais visualmente impactante, mas o core do produto (RE01+FI03+FI07) é o que destrava o Dr. Edson. Paciente vem depois.

**Pendência:** confirmar com Dr. Edson em R2 antes de F3: FI09 (gateway de pagamento — Pix/cartão/boleto) exige integração externa. O protótipo pode mostrar as telas mas sem integração real.

## 10. Próximos passos (após sua aprovação)

1. **Atualizar `estado-*.md`** com a realidade pós-R1 (posso gerar os diffs).
2. Registrar a stack do protótipo em `estado-decisoes-tomadas.md` como DEC-005+.
3. Instalar deps e começar a F1 na ordem acima.
4. Commitar por tela (um commit = uma tela minimamente funcional).
5. Antes da R2, rodar RTF (revisão técnica formal) com a equipe sobre o protótipo.
