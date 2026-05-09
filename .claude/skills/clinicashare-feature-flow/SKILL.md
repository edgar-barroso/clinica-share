---
name: clinicashare-feature-flow
description: Use sempre que for implementar uma feature, fase, rota, usecase, página ou regra de negócio no projeto ClinicaShare. Trigger em pedidos como "implementar Fase X do plano", "criar a rota /api/...", "fazer o CRUD de consultórios/profissionais/staff/pacientes/agendamentos/atendimentos/repasses", "ligar a página /agenda à API", "calcular repasse", "adicionar audit log", "RBAC", "transição de status", "registrar atendimento", "fechamento semanal", "marcar pago", "marcar chegada", "iniciar/finalizar atendimento", ou qualquer trabalho que avance o IMPLEMENTACAO-PLANO.md. Define o fluxo obrigatório (plano → schema → testes → impl → audit → coverage → checklist) com regras específicas para código financeiro (RNF-104 ≥90%) vs CRUD trivial. Sempre consultar antes de escrever código de domínio do ClinicaShare; pular esta skill é a forma mais comum de quebrar RNF-102 (audit log) e RNF-104 (cobertura).
---

# ClinicaShare — Feature Flow

Fluxo de execução para qualquer feature do ClinicaShare. Existe pra evitar três erros recorrentes: (1) implementar sem mapear o RF/fase do roadmap, (2) esquecer audit log em mutações financeiras, (3) declarar pronto sem rodar coverage.

## Antes de começar (sempre)

1. **Identifique a fase no `/IMPLEMENTACAO-PLANO.md`** que cobre essa feature. Se não houver fase associada, pare e pergunte ao usuário se é fora do escopo planejado.
2. **Liste os RFs cobertos** (do `.claude/context/estado/estado-requisitos-confirmados.md`). Cole no comentário do PR/commit.
3. **Verifique pendências P0 bloqueantes** em `.claude/context/estado/estado-pendencias-cliente.md`. Se a feature depende de PEND não-decidida, pare e sinalize.
4. **Classifique a complexidade** (decide o rigor de testes):
   - **Financeiro / cálculo / transição de status / RBAC**: TDD estrito + cobertura ≥ 90% (RNF-104, DEC-A04)
   - **CRUD trivial / lookup / read-only**: testes depois (smoke + RBAC + casos de erro)
   - **UI / formulário sem regra de negócio**: 1 smoke E2E é suficiente

## Fluxo obrigatório por camada

### A. Backend (rota → zod → usecase → prisma)

Padrão da arquitetura simples (DEC-A12 + DEC-A16 — sem DDD). Ordem:

1. **Schema Zod** em `app/(back-end)/api/<recurso>/_schemas.ts`
   - Inputs validados, mensagens em pt-BR
   - Reutilizar enums do Prisma (`import type { Role } from "@prisma/client"`)

2. **Usecase** em `app/(back-end)/_usecases/<recurso>/<acao>.ts`
   - **Função pura**, não classe
   - Recebe input já validado
   - Throw erros de domínio de `_lib/errors.ts` (criar novos lá se faltar)
   - Mutação financeira → chamar `audit({...})` ANTES do return (RNF-102)

3. **TESTE** em `tests/integration/<recurso>-<acao>.test.ts` ou `tests/unit/...`
   - Para financeiro/cálculo: escrever testes ANTES da impl (TDD)
   - Para CRUD: escrever testes junto ou logo depois
   - Cobrir: happy path, erro de validação (422), RBAC negado (403), conflito (409), 401 sem cookie
   - Mock de mailer e google-verify via `vi.hoisted` (ver padrão em `tests/integration/auth-*.test.ts`)
   - Helper `cleanDb()` em `tests/helpers/db.ts` — estender se a feature toca tabela nova

4. **Rota** em `app/(back-end)/api/<recurso>/<acao>/route.ts`
   - try/catch + `handleAuthError(err)` (renomear para `handleError` quando for genérico)
   - `requireRole(req, [...allowed])` para RBAC
   - Setar/limpar cookie só em rotas auth

5. **Cliente** em `lib/api-client.ts` (ou expandir `lib/auth-client.ts`)
   - Função tipada `apiCriarConsultorio(input)` que retorna o tipo certo
   - Throw `AuthError` para chamador tratar

### B. Frontend (página)

1. Trocar `import { ... } from "@/lib/mock/data"` por chamadas à API via `lib/api-client.ts`
2. Estado de loading/error com toasts (sonner) — padrão de `entrar/page.tsx`
3. Validação Zod no submit (reaproveitar schema do backend se possível)
4. Após mutação bem-sucedida: `router.push(...)` + `router.refresh()` para revalidar RSC
5. Se a página depende de role: usar `useCurrentUser()` (não `useRole()` direto — `current-user` virá de `/api/auth/me` na Fase 1)

### C. Audit log (regra inegociável)

**Toda mutação que altera valor monetário, status financeiro, contrato ou repasse:**

```ts
await audit({
  user,
  entidade: "Atendimento",
  entidadeId: atendimento.id,
  campo: "valorConsulta",
  valorAntes: String(antes),
  valorDepois: String(depois),
  motivo: input.motivo,
});
```

Se você está alterando `Atendimento.valorConsulta`, `statusPagamento`, `motivoDescontoOuGratuidade`, `Repasse.status`, `Profissional.percentualRepasse`, `Profissional.valorAluguelPorTurno` — **audit é obrigatório**. Se não tem `motivo` no input, adicione no schema Zod.

## Definition of Done por feature

Antes de declarar pronto, verificar nesta ordem:

- [ ] `npx tsc --noEmit` verde
- [ ] `npm test` verde (todos os testes, não só os novos)
- [ ] Para feature financeira: `vitest run --coverage` — cobertura ≥ 90% no usecase de cálculo
- [ ] Páginas tocadas: `import` do `lib/mock/data.ts` removido
- [ ] AuditLog presente em toda mutação financeira (grep no usecase)
- [ ] RBAC testado: pelo menos 1 caso "role permitido" + 1 "role negado → 403"
- [ ] Para feature de fluxo crítico: 1 spec Playwright E2E em `e2e/`
- [ ] Checklist da fase em `IMPLEMENTACAO-PLANO.md` marcado
- [ ] Estado atualizado se houver decisão nova (`.claude/context/estado/estado-decisoes-tomadas.md`)
- [ ] `prisma/erd.svg` regerado se schema mudou (`npx prisma generate`)
- [ ] Commit com mensagem referenciando a fase + RFs cobertos

## Padrões a copiar

Quando travar, copie de algo que já funciona:

| Para... | Veja em |
|---|---|
| Estrutura de rota POST | `app/(back-end)/api/auth/login/route.ts` |
| Usecase com Prisma + audit em transação | `app/(back-end)/_usecases/auth/register-paciente.ts` |
| Schemas Zod centralizados | `app/(back-end)/api/auth/_schemas.ts` |
| Erros de domínio + status mapping | `app/(back-end)/_lib/errors.ts` + `_lib/handle-auth-error.ts` |
| Teste integration com DB real + mock | `tests/integration/auth-register.test.ts` |
| Teste com `vi.hoisted` para mock | `tests/integration/auth-google.test.ts` |
| Cliente API tipado | `lib/auth-client.ts` |
| Página chamando API real | `app/(front-end)/(pages)/(auth)/login/page.tsx` |
| Spec Playwright E2E | `e2e/auth-flow.spec.ts` |

## Regras inegociáveis (do CLAUDE.md)

- **Valor monetário em `Decimal` ou inteiro centavos** — nunca `float` (RNF-101, DEC-A03)
- **Cálculo de repasse SEMPRE no servidor** — nunca no client (RNF-103, DEC-A04)
- **Teste unitário antes de merge** para cálculo financeiro (RNF-104)
- **Audit log em toda alteração financeira** (RNF-102, RF-025)
- **Não codar antes de requisito confirmado** — se a feature não está na fase atual do plano, pare

## Anti-padrões (não faça)

- ❌ Implementar rota sem schema Zod ("vou validar depois")
- ❌ Mutação financeira sem audit log ("vou adicionar quando precisar")
- ❌ Cálculo de repasse no client/UI ("é mais rápido")
- ❌ Pular RBAC ("deixo pra Fase 8")
- ❌ Marcar pronto sem rodar coverage ("os testes passaram, deve estar bom")
- ❌ Adicionar campo no Prisma sem regenerar ERD ("ninguém olha esse SVG")
- ❌ Criar usecase em classe com herança/interfaces (DEC-A16 escolheu funções puras explicitamente)
- ❌ Importar `lib/mock/data.ts` em rota API ("é só temporário")
