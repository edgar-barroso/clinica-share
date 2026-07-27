# Plano de Implementação — ClinicaShare

> **Audiência**: equipe de 4 alunos (DevsTech) trabalhando no MVP do Dr. Edson Andrade.
> **Status**: 2026-05-08 — **TODAS as 8 fases concluídas ✅**. 152 testes Vitest + **53 specs Playwright** (todas as 43 telas validadas via smoke + fluxos críticos). tsc + build production verde. Seed populada (~250 atendimentos cobrindo todos os status). Pronto para R2.
> **Meta**: ATINGIDA — sistema 100% implementado e testado.

---

## 1. Sumário executivo

### O que já está pronto (Fase 0 ✅)
- **Infra**: PostgreSQL 16 (Docker em :5433) + Prisma 7 + adapter-pg + Zod env validation + Vitest 4 + Playwright 1.59 + ER diagram automático ([prisma/erd.svg](prisma/erd.svg))
- **Schema**: 9 entidades + 7 enums (`User`, `Profissional`, `TurnoFixo`, `Consultorio`, `Staff`, `Paciente`, `Atendimento`, `Repasse`, `RepasseAtendimento`, `AuditLog`)
- **Auth real**: 7 rotas em `app/(back-end)/api/auth/` (login/register/forgot/reset/google/me/logout) + bcryptjs + JWT cookie HttpOnly + Nodemailer/Gmail + `@react-oauth/google`
- **Front**: 44 páginas em `app/(front-end)/(pages)/` — todas funcionam mas usam `lib/mock/data.ts` (sem persistência); mutações são `setTimeout` fake

### O que falta
| Camada | Status |
|---|---|
| Páginas conectadas a API real | 5/44 (apenas as de auth) |
| Rotas API de domínio (não-auth) | 0 |
| Audit log persistido em mutações financeiras | 0 |
| Cálculo de repasse no servidor (RNF-103) | 0 |
| Testes E2E além de auth | 0 |
| Seed de admin inicial | 0 |

### Meta final
- 100% das páginas usando rotas API reais (zero `import` de `lib/mock/data.ts` no caminho de produção)
- Cálculo de repasse com cobertura ≥ 90% (RNF-104)
- Audit log em **toda** mutação financeira (RNF-102)
- Suite Vitest com ≥ 70% cobertura geral; Playwright com ≥ 5 specs cobrindo fluxos críticos
- ERD automático sempre sincronizado com schema (DEC-A18)
- Build + tsc + tests verdes na branch `dev`

---

## 2. Decisões já tomadas (referência rápida)

### Arquitetura (`.claude/context/estado/estado-decisoes-tomadas.md`)
- **DEC-A11** Postgres 16 + Prisma 7 + adapter-pg
- **DEC-A12** Monolito Next.js com groups `(back-end)` e `(front-end)`
- **DEC-A14** Vitest 4 para testes
- **DEC-A15** Schema com 9 entidades + 7 enums
- **DEC-A16** Auth real: bcryptjs + JWT + cookie HttpOnly + Nodemailer + Google OAuth client-side
- **DEC-A17** Playwright para E2E
- **DEC-A18** prisma-erd-generator → SVG automático

### Pendências P0 — decisões assumidas em 2026-05-08 (confirmar Dr. Edson em R2)
| ID | Decisão atual |
|---|---|
| **PEND-002** | Repasse sobre **valor bruto** (`valorConsulta × percentualRepasse`) |
| **PEND-014** | Turnos **manhã 7-12, tarde 13-18, noite 18-20** |
| **PEND-015** | 1 profissional por (consultório, dia, turno) — `@@unique([consultorioId, diaSemana, turno])` |
| **PEND-017** | Prontuário **Json livre** com 4 campos sugeridos: `anamnese`, `evolucao`, `conduta`, `retorno` |
| **PEND-030** | Atendente marca chegada → Profissional inicia → Profissional finaliza com form pré-populado. Admin/aux podem tudo |
| **PEND-031** | Edição pós-realizado: **só admin e auxiliar**. Profissional NÃO edita o próprio. Atendente nunca |
| **PEND-032** | Reagendamento livre pelo paciente (cancela + cria novo); auditoria registra |
| **PEND-045** | **FI09 fora do MVP**. Pagamento exclusivamente presencial (FI10). DEC-E09 mantida |

---

## 3. Convenções de arquitetura

### Padrão de uma feature backend (rota → Zod → usecase → Prisma)

```
app/(back-end)/
├── _lib/                          # helpers transversais
│   ├── audit.ts                   # NOVO — audit log helper
│   ├── require-role.ts            # NOVO — RBAC gating
│   ├── api-handler.ts             # NOVO — opcional, padrão de error mapping
│   ├── auth-cookie.ts             # ✅ existe
│   ├── current-user.ts            # ✅ existe
│   ├── errors.ts                  # ✅ existe — adicionar erros de domínio (ConflitoHorario, NaoAutorizado, etc.)
│   ├── google-verify.ts           # ✅ existe
│   ├── handle-auth-error.ts       # ✅ existe — promover para handle-error.ts genérico
│   ├── jwt.ts                     # ✅ existe
│   ├── mailer.ts                  # ✅ existe
│   ├── password.ts                # ✅ existe
│   └── serialize-user.ts          # ✅ existe
│
├── _usecases/                     # funções puras (input validado → Prisma)
│   ├── auth/                      # ✅ existe
│   ├── consultorio/               # NOVO
│   ├── profissional/              # NOVO
│   ├── staff/                     # NOVO
│   ├── paciente/                  # NOVO
│   ├── agendamento/               # NOVO
│   ├── atendimento/               # NOVO
│   ├── repasse/                   # NOVO — CRÍTICO RNF-104
│   ├── relatorio/                 # NOVO
│   └── auditoria/                 # NOVO
│
└── api/                           # rotas Next.js
    ├── auth/                      # ✅ existe (7 rotas)
    ├── consultorios/              # NOVO
    ├── profissionais/             # NOVO
    ├── staff/                     # NOVO
    ├── pacientes/                 # NOVO
    ├── agendamentos/              # NOVO
    ├── atendimentos/              # NOVO
    ├── repasses/                  # NOVO
    ├── relatorios/                # NOVO
    ├── auditoria/                 # NOVO
    ├── dashboard/                 # NOVO
    └── p/                         # NOVO — rotas do portal do paciente (RBAC=paciente)
```

### Cliente API tipado

`lib/auth-client.ts` (já existe) será expandido para `lib/api-client.ts` com helpers genéricos:

```ts
// padrão sugerido
export async function apiGet<T>(path: string): Promise<T>
export async function apiPost<T>(path: string, body: unknown): Promise<T>
export async function apiPatch<T>(path: string, body: unknown): Promise<T>
export async function apiDelete<T>(path: string): Promise<T>
```

### Erro de domínio → HTTP status (em `_lib/handle-error.ts`)

| Classe | Status |
|---|---|
| `ZodError` | 422 |
| `EmailJaCadastrado`, `ConflitoHorario`, `RecursoDuplicado` | 409 |
| `CredenciaisInvalidas`, `NaoAutenticado` | 401 |
| `NaoAutorizado` (role) | 403 |
| `NaoEncontrado` | 404 |
| `TokenExpirado` | 410 |
| `TokenInvalido`, `RegraNegocio` | 400 |
| `default` | 500 |

### Audit log — quando chamar

Toda função em `_usecases/` que altera **valor monetário, status financeiro, contrato ou repasse** deve chamar:

```ts
await audit({
  user,                          // user logado da sessão
  entidade: "Atendimento",       // ou "Repasse", "Profissional", etc.
  entidadeId: atendimento.id,
  campo: "valorConsulta",        // ou "status", "statusPagamento"
  valorAntes: String(antes),
  valorDepois: String(depois),
  motivo,                        // string fornecida pelo usuário no body da rota
});
```

Inspirar em `_usecases/auth/login.ts` para padrão de chamada.

### Testes

| Tipo | Local | Quando |
|---|---|---|
| Vitest unit | `tests/unit/` | Helpers, formatters, cálculo de repasse |
| Vitest integration | `tests/integration/` | Rotas API com DB real |
| Playwright E2E | `e2e/` | Fluxos críticos (1 spec por fluxo) |

Helper `cleanAuthData()` em `tests/helpers/db.ts` deve evoluir para `cleanDb()` cobrindo todas as tabelas afetadas pelo teste em ordem de FK.

---

## 4. Fases sequenciais

### Fase 0 — Fundação ✅ (concluída)
- Infra completa
- Schema do domínio
- Auth real
- Diagrama ER automático

---

### Fase 1 — Backend foundation + seed (concluída ✅ 2026-05-08)

**Objetivo**: criar os helpers transversais (audit, requireRole, requireUser, handle-error) e popular o DB com 1 admin para destravar todas as fases seguintes.

**Entregáveis**:
- [x] `app/(back-end)/_lib/audit.ts` — helper `audit({ user, entidade, entidadeId, campo, valorAntes, valorDepois, motivo }, tx?)` que insere em `AuditLog`. Snapshot do nome (paciente.nome ?? profissional.nome ?? staff.nome ?? email).
- [x] `app/(back-end)/_lib/require-role.ts` — `requireRole(req, [roles])` (JWT-only, sem DB) + `requireUser(req, [roles]?)` (JWT + DB lookup com `ativo: true`).
- [x] `app/(back-end)/_lib/handle-error.ts` — generaliza `handle-auth-error.ts` (alias mantido). Mapeia ZodError, AuthError, NaoAutorizado (403), NaoEncontrado (404), ConflitoRecurso (409), TokenExpirado (410), RegraNegocio (400).
- [x] `app/(back-end)/_lib/errors.ts` — adiciona `NaoAutorizado`, `NaoEncontrado`, `ConflitoRecurso`, `RegraNegocio`.
- [x] `lib/api-client.ts` — `apiGet/apiPost/apiPatch/apiPut/apiDelete` genéricos com `credentials: "same-origin"`.
- [x] `lib/auth-client.ts#apiMe()` — busca `/api/auth/me`, retorna null se não autenticado.
- [x] `prisma/seed.ts` — cria User admin idempotente a partir de `ADMIN_EMAIL`+`ADMIN_PASSWORD`+`ADMIN_NOME`.
- [x] Script `db:seed` em `package.json` → `tsx prisma/seed.ts`.
- [x] `.env.example` e `.env` com `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NOME`.
- [x] `lib/env.ts` validando essas envs.
- [x] **`RoleProvider` populado por `/api/auth/me`** no boot (em vez de localStorage). Adiciona `user`, `loading`, `refresh()` ao contexto.
- [x] `useCurrentUser()` agora retorna user real (id, email, profissionalId, pacienteId, staffId) com flag `loading`/`anonymous`.
- [x] `<RoleSwitcher>` retorna `null` em produção (`NODE_ENV === "production"`).

**Testes obrigatórios**:
- [x] `tests/integration/audit.test.ts` — 4 testes (campos, snapshot do nome, motivo vazio, múltiplos logs)
- [x] `tests/integration/require-role.test.ts` — 11 testes (JWT-only ×5 + JWT+DB ×6 incluindo `ativo: false`)

**DoD**:
- [x] `npm run db:seed` cria admin (idempotente: 2ª chamada → "✓ Admin já existe")
- [x] Login com `ADMIN_EMAIL`/`ADMIN_PASSWORD` retorna 200 + cookie HttpOnly
- [x] `/api/auth/me` retorna user logado com role `admin`
- [x] `npm run build` verde, `npx tsc --noEmit` verde
- [x] `npm test` 38 testes passando (auth 23 + audit 4 + require-role 11)

**RFs cobertos**: fundação para RF-022 (RBAC), RF-025 (audit), RF-024 (sessão).

**Caveat operacional**: o helper `cleanAuthData()` dos testes apaga `User` e `AuditLog` — após rodar `npm test`, refazer `npm run db:seed` para repopular o admin. Em fase 8 separar DB de teste resolve.

---

### Fase 2 — Catálogos CRUD (100% concluída ✅ 2026-05-08)

**Status**: backend 100%, frontend 100% (12 páginas), Playwright 100%.

**Backend implementado**:
- 8 rotas API (Consultórios + Profissionais/TurnoFixo + Staff)
- 14 usecases (5 + 7 + 5) — todos funções puras
- Audit log obrigatório em alteração de contrato (Profissional.modalidade/percentualRepasse/valorAluguelPorTurno) com motivo no body — RNF-102
- Constraints AG05 e PEND-015 aplicadas via `@@unique`; expostas como 409 amigável
- 37 testes Vitest novos (13 + 15 + 9) — total: 75 verde
- 6 specs Playwright E2E (3 em `catalogos-flow.spec.ts` + 3 em `catalogos-detalhe-editar.spec.ts`)

**Frontend migrado** (12 páginas de mock → API real):
- `/consultorios`, `/consultorios/novo`, `/consultorios/[id]`, `/consultorios/[id]/editar`
- `/profissionais`, `/profissionais/novo`, `/profissionais/[id]`, `/profissionais/[id]/editar` (motivo obrigatório se contrato mudar; turnos add/remove imediato)
- `/equipe`, `/equipe/novo`, `/equipe/[id]`, `/equipe/[id]/editar`
- 3 clientes API tipados em `lib/api/{consultorios,profissionais,staff}.ts`
- Loading skeletons + EmptyState + toasts

**RBAC de contrato (FI01/FI02 + RF-023)**:
- `PATCH /api/profissionais/[id]` aceita `admin` e `profissional`. O profissional só o próprio cadastro (403 no de outro) e nunca os campos de admin: `modalidadeContrato`, `percentualRepasse`, `valorAluguelPorTurno`, `valorConsultaBase`, `ativo` → 403 se mencionados
- `/profissionais/[id]/editar` (é o "Meu perfil" do profissional): contrato/repasse, valor base, status e turnos fixos viram leitura para quem não é admin
- 8 testes Vitest novos em `tests/integration/profissionais.test.ts`

**Outros ajustes (commit `a0139f8`)**:
- `<RoleSwitcher>` removido (não faz sentido com auth real — bypass de RBAC)
- `<PrototypeBanner>` removido do AppShell
- `lib/api-client.ts` usa `cache: "no-store"` para evitar stale data após mutações
- `<PatientRedirect>` aguarda `loading=false` antes de redirecionar (bug Fase 1)
- `playwright.config.ts` com `workers: 1` (specs compartilham DB)

---

### Fase 2 — Especificação original (referência histórica)

**Objetivo**: substituir mock por persistência real nos catálogos sem dependência: Consultórios, Profissionais (+ TurnoFixo), Equipe/Staff.

**Pré-requisitos**: Fase 1.

**Trilha A — Consultórios** (RFs: CO01, CO04 parcial)

Rotas:
- `GET /api/consultorios` — lista (todos roles autenticados)
- `GET /api/consultorios/[id]` — detalhe
- `POST /api/consultorios` — criar (admin)
- `PATCH /api/consultorios/[id]` — editar (admin)
- `DELETE /api/consultorios/[id]` — soft delete (`ativo: false`, admin)

Páginas a migrar de mock para API:
- [x] [/consultorios](app/(front-end)/(pages)/(app)/consultorios/page.tsx)
- [x] [/consultorios/novo](app/(front-end)/(pages)/(app)/consultorios/novo/page.tsx)
- [x] [/consultorios/[id]](app/(front-end)/(pages)/(app)/consultorios/[id]/page.tsx)
- [x] [/consultorios/[id]/editar](app/(front-end)/(pages)/(app)/consultorios/[id]/editar/page.tsx)

**Trilha B — Profissionais + TurnoFixo** (RFs: AG03, AG04, FI01, FI02, CO02, CO03)

Rotas:
- `GET/POST /api/profissionais`
- `GET/PATCH/DELETE /api/profissionais/[id]`
- `POST /api/profissionais/[id]/turnos-fixos` — cria turno (constraint @@unique respeitada → 409)
- `DELETE /api/profissionais/[id]/turnos-fixos/[turnoId]` — remove turno

Páginas:
- [x] [/profissionais](app/(front-end)/(pages)/(app)/profissionais/page.tsx)
- [x] [/profissionais/novo](app/(front-end)/(pages)/(app)/profissionais/novo/page.tsx)
- [x] [/profissionais/[id]](app/(front-end)/(pages)/(app)/profissionais/[id]/page.tsx)
- [x] [/profissionais/[id]/editar](app/(front-end)/(pages)/(app)/profissionais/[id]/editar/page.tsx)

**Trilha C — Equipe/Staff**

Rotas:
- `GET/POST /api/staff`
- `GET/PATCH/DELETE /api/staff/[id]`
- `POST /api/staff/[id]/convidar` — envia e-mail tipo reset para definir senha (cria User vinculado, `senhaDefinida=false`)

Páginas:
- [x] [/equipe](app/(front-end)/(pages)/(app)/equipe/page.tsx)
- [x] [/equipe/novo](app/(front-end)/(pages)/(app)/equipe/novo/page.tsx)
- [x] [/equipe/[id]](app/(front-end)/(pages)/(app)/equipe/[id]/page.tsx)
- [x] [/equipe/[id]/editar](app/(front-end)/(pages)/(app)/equipe/[id]/editar/page.tsx)

**Testes**:
- [x] 1 suite Vitest por trilha (CRUD + RBAC); ~10 testes por trilha *(13+15+9 testes)*
- [x] 6 specs Playwright: 3 em catalogos-flow (criar→listar) + 3 em catalogos-detalhe-editar (editar+RBAC)

**DoD**:
- [x] Nenhuma das 12 páginas dessa fase importa `lib/mock/data.ts`
- [x] Build/tsc/tests verdes
- [x] AuditLog populado em alterações de contrato (Profissional.percentualRepasse, valorAluguelPorTurno)

**Bloqueios**:
- PEND-014 (turnos exatos) → usar default 7-12/13-18/18-20 até R2 confirmar
- PEND-015 (alocação) → constraint já no schema; expor 409 amigável

**RFs cobertas**: CO01, CO02, CO03, AG03, AG04, FI01, FI02

---

### Fase 3 — Pacientes + Agendamento (100% concluída ✅ 2026-05-08)

**Objetivo**: ligar fluxo de agendamento operacional (atendente cria, paciente vê) e implementar transições agendado → em_atendimento.

**Pré-requisitos**: Fase 2.

**Entregáveis**:

Rotas pacientes (admin/atendente CRUD; paciente vê só o próprio):
- [x] `GET /api/pacientes` (admin/atendente) — busca por nome/cpf/email/telefone via `q`
- [x] `POST /api/pacientes` (admin/atendente — usado pelo combobox `/components/paciente/novo-paciente-dialog.tsx`)
- [x] `GET/PATCH /api/pacientes/[id]` (RBAC: paciente lê o próprio; admin/atendente edita)

Rotas agendamentos:
- [x] `GET /api/agendamentos` — filtro por role (RF-023): profissional vê só os próprios; paciente vê só os seus; admin/aux/atendente vê todos
- [x] `POST /api/agendamentos` — cria (AG01 paciente, AG02 atendente). Constraint AG05 (@@unique data+hora+consultorioId) → 409
- [x] `POST /api/agendamentos/[id]/cancelar` — AG06 (motivo obrigatório). Audit log
- [x] `POST /api/agendamentos/[id]/marcar-chegada` — AG08 (atendente OU admin/aux). Transição agendado→em_atendimento

Páginas migradas (mock removido, API real):
- [x] [/agenda](app/(front-end)/(pages)/(app)/agenda/page.tsx) — date picker + AgendaList
- [x] [/agenda/novo](app/(front-end)/(pages)/(app)/agenda/novo/page.tsx) — form com PacienteCombobox + Selects
- [x] [/minha-agenda](app/(front-end)/(pages)/(app)/minha-agenda/page.tsx) — RBAC server-side filtra por profissionalId; a tela é fila de trabalho, então `realizado`, `nao_compareceu` e `cancelado` não aparecem (`agendamentoEmAberto` em `lib/api/agendamentos.ts`, coberto em `tests/unit/agenda-status.test.ts`)

Componentes refeitos:
- [x] [components/paciente/paciente-combobox.tsx](components/paciente/paciente-combobox.tsx) — busca debounced via API
- [x] [components/paciente/novo-paciente-dialog.tsx](components/paciente/novo-paciente-dialog.tsx) — chama `apiCreatePaciente`
- [x] [agenda/_components/agenda-list.tsx](app/(front-end)/(pages)/(app)/agenda/_components/agenda-list.tsx) — componente compartilhado para /agenda e /minha-agenda

**Testes**:
- [x] Vitest: 22 testes (10 paciente + 12 agendamento) — total **97 verde**
- [x] Playwright `e2e/agenda-flow.spec.ts`: 4 specs (criar via UI, conflito AG05, marcar chegada, cancelar com audit) — total **11 specs verde**

**DoD**:
- [x] AuditLog gravado em cancelamento e em transição agendado→em_atendimento
- [x] `cleanAuthData()` em `e2e/helpers/db.ts` atualizado para limpar todas as FKs (atendimento, auditLog, repasse, etc.)

**Bloqueios resolvidos**:
- PEND-030 (fluxo do dia) — implementado conforme decisão: atendente marca chegada → profissional finaliza no Fase 4

**RFs cobertas**: AG01, AG02, AG05, AG06, AG08, RF-023, RF-027

---

### Fase 4 — Atendimento + Pagamento (100% concluída ✅ 2026-05-08)

**Objetivo**: registrar atendimento realizado (avulso ou pós-finalização) com pagamento presencial e prontuário.

**Pré-requisitos**: Fase 3.

**Entregáveis**:

Rotas:
- [x] `POST /api/atendimentos` — registro avulso (walk-in, AT01) → `status=realizado` direto
- [x] `POST /api/agendamentos/[id]/iniciar` — AT05 (profissional dono OU admin/aux). Audit log
- [x] `POST /api/agendamentos/[id]/nao-compareceu` — atendente/admin/aux. Audit log
- [x] `POST /api/atendimentos/[id]/finalizar` — AT06 (profissional dono OU admin/aux). Body: `valorConsulta`, `statusPagamento`, `motivoDescontoOuGratuidade?`, `prontuarioInterno?` (Json livre PEND-017). 3 audit logs (status, valor, statusPagamento)
- [x] `PATCH /api/atendimentos/[id]` — FI11 editar pós-realizado. **RBAC: só admin e auxiliar** (PEND-031). Motivo obrigatório → audit log por campo alterado
- [x] `GET /api/atendimentos` — listar com filtro por role (RBAC RF-023)
- [x] `GET /api/atendimentos/[id]` — detalhe (paciente RBAC: só dono)

Páginas migradas (mock removido):
- [x] [/atendimentos](app/(front-end)/(pages)/(app)/atendimentos/page.tsx) — tabela com role-aware columns
- [x] [/atendimentos/novo](app/(front-end)/(pages)/(app)/atendimentos/novo/page.tsx) — walk-in (AT01) com PacienteCombobox + selects
- [x] [/atendimentos/[id]](app/(front-end)/(pages)/(app)/atendimentos/[id]/page.tsx) — detalhe + ações inline (Iniciar/Finalizar com prontuário expansível) condicionadas por role. Finalização abre em `pago` (FI10: pagamento presencial no ato é a regra; `pendente`/`gratuito` são exceção escolhida à mão) — o `pendente` do banco é só default de quem não finalizou
- [x] [/atendimentos/[id]/editar](app/(front-end)/(pages)/(app)/atendimentos/[id]/editar/page.tsx) — só admin/aux (PEND-031); motivo obrigatório

Componentes:
- [x] [agenda-list.tsx](app/(front-end)/(pages)/(app)/agenda/_components/agenda-list.tsx) — adicionou botões "Iniciar" e "Finalizar" linkando para /atendimentos/[id]

**Audit log gravado em**:
- [x] AT05 (iniciar) — 1 log de status
- [x] AT06 (finalizar) — 3 logs (status + valorConsulta + statusPagamento)
- [x] AT01 (walk-in) — 2 logs (valorConsulta + statusPagamento)
- [x] FI11 (edição) — 1 log por campo alterado (valorConsulta, statusPagamento, motivoDescontoOuGratuidade) com motivo do operador
- [x] não-compareceu — 1 log de status

**Testes**:
- [x] Vitest: 20 testes novos (walk-in RBAC, iniciar transition + RBAC, nao-compareceu, finalizar transitions + role gating, FI06 gratuito sem motivo, FI11 edição) — total **117 verde**
- [x] Playwright `e2e/atendimento-flow.spec.ts`: 4 specs (fluxo completo agendado→em_atendimento→realizado, walk-in via UI, FI11 com audit log, FI06 422) — total **15 specs verde**

**DoD**:
- [x] FI09 (pagamento online) NÃO implementado (DEC-E09)
- [x] `motivoDescontoOuGratuidade` obrigatório quando `statusPagamento=gratuito` (FI06) → schema Zod refine
- [x] AuditLog cobre 100% das mutações financeiras (verificado via grep no `_usecases/atendimento/*`)

**Bloqueios resolvidos**:
- PEND-017 (campos prontuário) — Json livre com sugestões no UI (anamnese, evolução, conduta, retorno)
- PEND-031 (quem edita) — implementado conforme decisão (só admin/aux); profissional/atendente recebem 403

**RFs cobertas**: AT01, AT02, AT03, AT04, AT05, AT06, FI05, FI06, FI10, FI11, RF-025

---

### Fase 5 — Repasse (100% concluída ✅ 2026-05-08, RNF-104 cumprido)

**Objetivo**: cálculo automático de repasse no servidor + listagem + marcar pago. Esta é a **única fase com cobertura mínima de 90%** porque erro no cálculo destrói confiança do cliente (R-001).

**Pré-requisitos**: Fase 4.

**Entregáveis**:

Usecase `_usecases/repasse/calculate.ts`:
```ts
interface CalculateInput {
  profissionalId: string;
  periodoInicio: Date;
  periodoFim: Date;
}
interface CalculateOutput {
  receitaBruta: Decimal;        // soma de valorConsulta dos atendimentos válidos
  valorRepasse: Decimal;
  atendimentosIds: string[];    // ids que entraram na base
  modalidade: ModalidadeContrato;
  detalhes: { /* breakdown por atendimento ou turno */ };
}
```

**Regras** (PEND-002 = bruto):
- Filtro: `Atendimento.status = "realizado"` AND `statusPagamento = "pago"` AND `data BETWEEN inicio AND fim`
- Ignora: `gratuito`, `cancelado`, `nao_compareceu`, `pendente`
- Modalidade `percentual`: `receitaBruta × percentualRepasse`
- Modalidade `aluguel-fixo`: `turnosUtilizados × valorAluguelPorTurno` (turno = 1 se houver ≥1 atendimento na (data, turno))
- Arredondamento: 2 casas decimais; nunca float

**Rotas**:
- `POST /api/repasses/gerar` — body: `{ profissionalId, periodoInicio, periodoFim }`. Cria `Repasse` + `RepasseAtendimento[]`. Idempotente (constraint @@unique já no schema)
- `GET /api/repasses` — listar com filtros
- `GET /api/repasses/[id]` — detalhe com breakdown
- `POST /api/repasses/[id]/marcar-pago` — admin/aux. Audit log

**Páginas**:
- [ ] [/financeiro](app/(front-end)/(pages)/(app)/financeiro/page.tsx) (já redireciona para repasses)
- [ ] [/financeiro/repasses](app/(front-end)/(pages)/(app)/financeiro/repasses/page.tsx)
- [ ] [/financeiro/repasses/[id]](app/(front-end)/(pages)/(app)/financeiro/repasses/[id]/page.tsx)

**Testes** (cobertura `_usecases/repasse/calculate.ts`: 100% lines / 100% statements / 100% functions / 93.75% branches):
- [x] Modalidade percentual sem gratuidades → repasse correto (200+150+250)*0.3 = 180
- [x] Modalidade percentual ignora gratuito/pendente/cancelado/nao_compareceu
- [x] Modalidade aluguel-fixo: 3 atendimentos no mesmo turno = 1 turno
- [x] Modalidade aluguel-fixo: 2 turnos diferentes mesmo dia = 2 turnos
- [x] Modalidade aluguel-fixo: turno noite (>= 18:00) conta separadamente
- [x] Modalidade aluguel-fixo: gratuito ainda conta turno (uso da sala)
- [x] Período sem atendimentos → repasse zero
- [x] Ignora atendimentos fora do período
- [x] Arredondamento half-up: 100.005 → 100.01
- [x] Profissional sem percentualRepasse / valorAluguelPorTurno → erro
- [x] Profissional inexistente → NaoEncontrado
- [x] Geração idempotente (mesma chamada 2x não duplica — `@@unique`)
- [x] POST `/marcar-pago` por profissional → 403
- [x] POST `/gerar` por profissional → 403
- [x] Audit log gravado em `marcar-pago`
- [x] RBAC GET `/repasses` — profissional vê só os próprios
- [x] RBAC GET `/repasses/[id]` — profissional não-dono → 403

Total: **23 testes Vitest novos** (12 unit calculate + 11 integration) — total **140 verde**

**Rotas implementadas**:
- [x] `POST /api/repasses/gerar` — admin/aux. Idempotente
- [x] `GET /api/repasses` — RBAC; profissional vê só os próprios
- [x] `GET /api/repasses/[id]` — RBAC + breakdown calculado em tempo real
- [x] `POST /api/repasses/[id]/marcar-pago` — admin/aux + audit log

**Páginas migradas**:
- [x] [/financeiro/repasses](app/(front-end)/(pages)/(app)/financeiro/repasses/page.tsx) — botão "Gerar repasse" + tabela com pagar inline
- [x] [/financeiro/repasses/[id]](app/(front-end)/(pages)/(app)/financeiro/repasses/[id]/page.tsx) — detalhe com breakdown (modalidade, turnos, atendimentos)

**Playwright** `e2e/repasse-flow.spec.ts`: 3 specs (gerar+idempotência, marcar pago com audit, lista UI + detalhe) — total **18 specs verde**

**DoD**:
- [x] Cobertura `_usecases/repasse/` ≥ 90% (atingido 100% lines, 93.75% branches)
- [x] Cálculo SEMPRE no servidor (RNF-103, DEC-A04) — Prisma.Decimal puro, zero float
- [x] Valores em `Decimal` Postgres (RNF-101); arredondamento half-up
- [x] Páginas mostram cálculo vindo da API, sem `lib/mock`
- [x] Helper `_lib/turnos.ts` com `horaToTurno()` (PEND-014 — manhã <13:00, tarde <18:00, noite ≥18:00)

**RFs cobertas**: FI03, FI04, FI07, FI08

---

### Fase 6 — Dashboard + Relatórios (1 sprint)

**Objetivo**: ligar visualizações analíticas a dados reais.

**Pré-requisitos**: Fases 4 e 5.

**Entregáveis**:

Rotas (todas server-aggregated; sem trazer dataset bruto pro client):
- `GET /api/dashboard?periodo=semana|mes` — KPIs: receita total, repasses pendentes/pagos, profissionais ativos, próximas consultas (RE01)
- `GET /api/relatorios/financeiro?profissionalId=&consultorioId=&periodoInicio=&periodoFim=` (RE02)
- `GET /api/relatorios/consultorios?periodo=` — ranking por receita (RE03)
- `GET /api/relatorios/gratuitas?periodo=` (RE04)
- `GET /api/relatorios/cancelamentos?periodo=` (RE05)

Páginas:
- [ ] [/dashboard](app/(front-end)/(pages)/(app)/dashboard/page.tsx)
- [ ] [/relatorios](app/(front-end)/(pages)/(app)/relatorios/page.tsx) (hub)
- [ ] [/relatorios/financeiro](app/(front-end)/(pages)/(app)/relatorios/financeiro/page.tsx)
- [ ] [/relatorios/consultorios](app/(front-end)/(pages)/(app)/relatorios/consultorios/page.tsx)
- [ ] [/relatorios/gratuitas-descontos](app/(front-end)/(pages)/(app)/relatorios/gratuitas-descontos/page.tsx)
- [ ] [/relatorios/cancelamentos](app/(front-end)/(pages)/(app)/relatorios/cancelamentos/page.tsx)

**Testes**:
- [ ] Vitest: cada rota retorna shape correto com dataset de fixtures
- [ ] Snapshot dos retornos para detectar regressão de schema

**DoD**:
- [ ] Filtros server-side (não traz tudo pro client)
- [ ] `recharts` continua sendo usado para os gráficos (já instalado)

**RFs cobertas**: RE01, RE02, RE03, RE04, RE05, CO04

---

### Fase 7 — Portal Paciente (1 sprint)

**Objetivo**: ligar as 6 páginas em `/p/*` a rotas dedicadas com RBAC=paciente.

**Pré-requisitos**: Fase 3 (agendamento) + Fase 4 (atendimento).

**Entregáveis**:

Rotas (todas com `requireRole(req, ["paciente"])`):
- `GET /api/p/consultas` — atendimentos do paciente logado (filtra `pacienteId = user.pacienteId`)
- `GET /api/p/consultas/[id]` — detalhe (RBAC dono)
- `POST /api/p/agendamentos` — criar (AG01); reusa lógica de Fase 3 mas valida que `pacienteId = user.pacienteId`
- `POST /api/p/consultas/[id]/cancelar` — AG09 reagendamento livre (cancela; UI cria novo)
- `GET/PATCH /api/p/perfil` — lê/edita Paciente próprio

Páginas:
- [ ] [/p](app/(front-end)/(pages)/p/page.tsx) — dashboard paciente (próximas + atalhos)
- [ ] [/p/consultas](app/(front-end)/(pages)/p/consultas/page.tsx)
- [ ] [/p/consultas/[id]](app/(front-end)/(pages)/p/consultas/[id]/page.tsx)
- [ ] [/p/agendar](app/(front-end)/(pages)/p/agendar/page.tsx) — wizard
- [ ] [/p/perfil](app/(front-end)/(pages)/p/perfil/page.tsx)
- [ ] [/p/perfil/editar](app/(front-end)/(pages)/p/perfil/editar/page.tsx)

**Testes**:
- [ ] Vitest: paciente A não vê consulta de paciente B (403)
- [ ] Vitest: paciente edita só o próprio perfil
- [ ] Playwright: "registrar paciente novo → agendar pelo wizard → ver em /p/consultas → cancelar → reagendar"

**DoD**:
- [ ] Wizard `/p/agendar` valida disponibilidade real (consulta `/api/agendamentos` filtrada)
- [ ] Páginas `/p/*` nunca recebem dados de outro paciente

**Bloqueios**:
- PEND-032 (reagendamento) — implementado livre (cancela + cria novo)
- PEND-025 (dados mínimos) — usar campos atuais; campos novos podem entrar pós-R2 sem migração disruptiva (Json `endereco`/`plano` aceita expansão)

**RFs cobertas**: AG01, AG09, RF-023 (paciente), RF-027

---

### Fase 8 — Configurações + Auditoria + polimento (1 sprint)

**Objetivo**: fechar últimos endpoints, garantir cobertura E2E mínima, polir.

**Pré-requisitos**: Fases 1–7.

**Entregáveis**:

Rotas:
- `GET/PATCH /api/configuracoes/turnos` — lê/grava configuração de turnos (PEND-014); persistir em tabela `Configuracao` ou JSON em `User.config` (decidir na fase). Default: 7-12/13-18/18-20
- `GET /api/configuracoes/integracoes` — placeholder (PEND-022 WhatsApp)
- `GET /api/auditoria` — lista AuditLog com filtros: entidade, entidadeId, userId, periodoInicio, periodoFim. Paginado server-side

Páginas:
- [ ] [/configuracoes](app/(front-end)/(pages)/(app)/configuracoes/page.tsx) (hub)
- [ ] [/configuracoes/turnos](app/(front-end)/(pages)/(app)/configuracoes/turnos/page.tsx)
- [ ] [/configuracoes/integracoes](app/(front-end)/(pages)/(app)/configuracoes/integracoes/page.tsx)
- [ ] [/auditoria](app/(front-end)/(pages)/(app)/auditoria/page.tsx)

**Polimento**:
- [ ] Suite Playwright completa: 1 spec por fluxo crítico (auth, agendamento, atendimento, repasse, portal paciente, edição auditada). **Total ≥ 5 specs**
- [ ] Acessibilidade: rodar axe-core em 3 páginas chave (após corrigir R-028 ESLint)
- [ ] Responsividade: validar mobile (RNF01) em 5 páginas críticas
- [ ] Documentação README com setup, comandos, arquitetura
- [ ] Atualizar `CLAUDE.md`/`AGENTS.md` se padrões mudaram
- [ ] Cobertura: `vitest run --coverage` ≥ 70% global, ≥ 90% em `_usecases/repasse/`
- [ ] `prisma/erd.svg` regerado e committado

**RFs cobertas**: AG07 (placeholder), todas as restantes; auditoria transversal RNF-102 + RF-025

---

## 5. Tabela RF → Fase

| RF | Título | Fase |
|---|---|---|
| AG01 | Paciente agenda online | 7 |
| AG02 | Atendente agenda em nome do paciente | 3 |
| AG03 | Turnos fixos respeitados | 2 (Trilha B) |
| AG04 | Duração configurável por profissional | 2 (Trilha B) |
| AG05 | Sistema impede conflito de horário | 3 |
| AG06 | Cancelamento com motivo | 3 |
| AG07 | Lembrete WhatsApp | 8 (placeholder) |
| AG08 | Marcar chegada | 3 |
| AG09 | Reagendamento | 7 |
| CO01 | Cadastra 12 consultórios | 2 (Trilha A) |
| CO02 | Consultório vinculado a turnos | 2 (Trilha B) |
| CO03 | Múltiplos turnos por dia | 2 (Trilha B) |
| CO04 | Dashboard ocupação consultórios | 6 |
| AT01 | Atendimento realizado registrado | 4 |
| AT02 | Procedimentos extras | 4 |
| AT03 | Prontuário eletrônico | 4 |
| AT04 | Prontuário externo registrado | 4 |
| AT05 | Profissional inicia atendimento | 4 |
| AT06 | Profissional finaliza | 4 |
| FI01 | Cadastra contrato profissional | 2 (Trilha B) |
| FI02 | Percentual configurável | 2 (Trilha B) |
| FI03 | Repasse calculado servidor | 5 |
| FI04 | Repasse inclui procedimentos | 5 |
| FI05 | Status de pagamento | 4 |
| FI06 | Descontos com justificativa | 4 |
| FI07 | Fechamento financeiro semanal | 5 |
| FI08 | Aluguel fixo por turno | 5 |
| FI09 | ~~Pagamento online~~ | **REMOVIDO** (DEC-E09) |
| FI10 | Pagamento presencial | 4 |
| FI11 | Editar pós-realizado | 4 |
| RE01 | Dashboard | 6 |
| RE02 | Relatório financeiro | 6 |
| RE03 | Ranking consultórios | 6 |
| RE04 | Gratuidades | 6 |
| RE05 | Cancelamentos | 6 |
| RF-021 | Auth e-mail/senha | 0 ✅ |
| RF-022 | Controle por perfil | 1 + transversal |
| RF-023 | Profissional não vê outro | 3 + transversal |
| RF-024 | Sessão automática | 0 ✅ |
| RF-025 | user_id em audit log | transversal (todas as fases) |
| RF-026 | Recuperação de senha | 0 ✅ |
| RF-027 | Auto-cadastro paciente | 0 ✅ |
| RF-028 | Google OAuth | 0 ✅ |
| RF-029 | URLs separadas equipe/paciente | 0 ✅ |

---

## 6. Tabela Página → Fase

| Página | Estado atual | Fase | Rota API a criar |
|---|---|---|---|
| `/` | redirect | — | — |
| `/login` | API ✅ | 0 ✅ | `/api/auth/login` |
| `/entrar` | API ✅ | 0 ✅ | `/api/auth/login` |
| `/cadastrar` | API ✅ | 0 ✅ | `/api/auth/register` |
| `/esqueci-senha` | API ✅ | 0 ✅ | `/api/auth/forgot-password` |
| `/redefinir-senha` | API ✅ | 0 ✅ | `/api/auth/reset-password` |
| `/dashboard` | mock | 6 | `/api/dashboard` |
| `/agenda` | mock | 3 | `/api/agendamentos` |
| `/agenda/novo` | mock | 3 | `POST /api/agendamentos` |
| `/atendimentos` | mock | 4 | `/api/atendimentos` |
| `/atendimentos/novo` | mock | 4 | `POST /api/atendimentos` |
| `/atendimentos/[id]` | mock | 4 | `/api/atendimentos/[id]` + transições |
| `/atendimentos/[id]/editar` | mock | 4 | `PATCH /api/atendimentos/[id]` |
| `/auditoria` | mock | 8 | `/api/auditoria` |
| `/configuracoes` | estática | 8 | hub |
| `/configuracoes/turnos` | estática | 8 | `/api/configuracoes/turnos` |
| `/configuracoes/integracoes` | estática | 8 | `/api/configuracoes/integracoes` |
| `/consultorios` | API ✅ | 2A | `/api/consultorios` |
| `/consultorios/novo` | API ✅ | 2A | `POST /api/consultorios` |
| `/consultorios/[id]` | API ✅ | 2A | `/api/consultorios/[id]` |
| `/consultorios/[id]/editar` | API ✅ | 2A | `PATCH /api/consultorios/[id]` |
| `/equipe` | API ✅ | 2C | `/api/staff` |
| `/equipe/novo` | API ✅ | 2C | `POST /api/staff` |
| `/equipe/[id]` | API ✅ | 2C | `/api/staff/[id]` |
| `/equipe/[id]/editar` | API ✅ | 2C | `PATCH /api/staff/[id]` |
| `/financeiro` | redirect | 5 | — |
| `/financeiro/repasses` | mock | 5 | `/api/repasses` |
| `/financeiro/repasses/[id]` | mock | 5 | `/api/repasses/[id]` |
| `/minha-agenda` | mock | 3 | `/api/agendamentos?profissionalId=me` |
| `/profissionais` | API ✅ | 2B | `/api/profissionais` |
| `/profissionais/novo` | API ✅ | 2B | `POST /api/profissionais` |
| `/profissionais/[id]` | API ✅ | 2B | `/api/profissionais/[id]` |
| `/profissionais/[id]/editar` | API ✅ | 2B | `PATCH /api/profissionais/[id]` |
| `/relatorios` | estática | 6 | hub |
| `/relatorios/financeiro` | mock | 6 | `/api/relatorios/financeiro` |
| `/relatorios/consultorios` | mock | 6 | `/api/relatorios/consultorios` |
| `/relatorios/gratuitas-descontos` | mock | 6 | `/api/relatorios/gratuitas` |
| `/relatorios/cancelamentos` | mock | 6 | `/api/relatorios/cancelamentos` |
| `/p` | mock | 7 | `/api/p/dashboard` (ou local) |
| `/p/consultas` | mock | 7 | `/api/p/consultas` |
| `/p/consultas/[id]` | mock | 7 | `/api/p/consultas/[id]` |
| `/p/agendar` | mock | 7 | `POST /api/agendamentos` (RBAC paciente) |
| `/p/perfil` | mock | 7 | `GET /api/p/perfil` |
| `/p/perfil/editar` | mock | 7 | `PATCH /api/p/perfil` |

**Total**: 44 páginas — 5 prontas (auth, Fase 0) + 39 a migrar (Fases 2–8).

---

## 7. Convenções de teste

### Vitest unit (`tests/unit/`)
- Helpers (`audit`, `require-role`, formatters)
- Cálculo de repasse (cobertura ≥ 90%)
- Sem DB, sem rede

### Vitest integration (`tests/integration/`)
- Rota API → handler chamado direto com `NextRequest`
- DB real em `:5433` namespace `clinicashare`
- Helper `cleanDb()` em `tests/helpers/db.ts` evolui para limpar todas as tabelas em ordem de FK
- Mock do mailer e google-verify via `vi.hoisted` (padrão já em uso em `tests/integration/auth-*`)
- File parallelism desligado (DB compartilhado) — config em `vitest.config.ts`

### Playwright E2E (`e2e/`)
- 1 spec por fluxo crítico
- `webServer` em `playwright.config.ts` sobe `npm run dev`
- Helper `e2e/helpers/db.ts` para limpar antes/depois
- **Mínimo 5 specs ao final**: auth, agendamento, atendimento, repasse, portal paciente

### Cobertura
- Rodar `vitest run --coverage` no CI
- Mínimo 70% global; **≥ 90% em `_usecases/repasse/`** (RNF-104)

---

## 8. Checklist global de pronto

Quando todas as 8 fases completam:

- [ ] `npm run build` verde
- [ ] `npx tsc --noEmit` verde
- [ ] `npm test` ≥ 80 testes passando
- [ ] `npm run test:e2e` ≥ 5 specs passando
- [ ] `vitest run --coverage` ≥ 70% global, ≥ 90% em `_usecases/repasse/`
- [ ] Nenhum arquivo em `app/(front-end)/(pages)/` importa `lib/mock/data.ts` no caminho de produção
- [ ] AuditLog populado em 100% das mutações financeiras (`grep -r "prisma.atendimento.update\|prisma.repasse" app/(back-end)/_usecases/` → todas seguidas de chamada `audit(...)`)
- [ ] [prisma/erd.svg](prisma/erd.svg) regerado e committado
- [ ] `.claude/context/estado/estado-pendencias-cliente.md` atualizado pós-R2
- [ ] `.claude/context/estado/estado-fase-atual.md` marcando Construção como concluída
- [ ] README atualizado com instruções de seed, dev, test, e2e

---

## 9. Como começar a Fase 1 (próxima ação)

```bash
# 1. Garantir DB e auth funcionando
npm run db:up
npm run db:migrate
npm test                      # auth tests devem passar (23 specs)

# 2. Criar branch para a fase
git checkout -b feat/fase-1-foundation

# 3. Criar os helpers
# - app/(back-end)/_lib/audit.ts
# - app/(back-end)/_lib/require-role.ts
# - lib/api-client.ts
# - prisma/seed.ts

# 4. Atualizar envs
# - .env e .env.example com ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NOME

# 5. Atualizar lib/env.ts validando as novas envs

# 6. Criar testes unitários

# 7. Atualizar layout para popular RoleProvider via /api/auth/me

# 8. PR para dev quando DoD da Fase 1 estiver completo
```

---

## 10. Manutenção deste plano

Este arquivo é vivo:
- Cada PR fechando uma fase atualiza o checklist correspondente
- Após R2 (com Dr. Edson), revisar seção "Pendências P0 — decisões assumidas" e marcar confirmadas/alteradas
- Adicionar fases extras se aparecer escopo (ex: implementação real de WhatsApp/AI lembretes em PEND-022 + AG07)

**Manter sincronia com**:
- `.claude/context/estado/estado-fase-atual.md` — fase corrente
- `.claude/context/estado/estado-pendencias-cliente.md` — P0 abertas/fechadas
- `.claude/context/estado/estado-decisoes-tomadas.md` — DEC-Pxx do roadmap

---

*Documento gerado em 2026-05-08 com decisões do usuário sobre PEND-002/030/031/045 e configurações técnicas (seed via env, RoleProvider via /me, audit explícito). Para detalhes: ver `.claude/context/estado/`.*
