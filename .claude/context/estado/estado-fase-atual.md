# Fase Atual do Projeto

## Status: Modelagem + Prototipação paralela (com entrada parcial em Construção — apenas infra)

**Data da última atualização:** 2026-05-08

### O que já aconteceu
- [x] 1ª reunião de levantamento de requisitos com o Dr. Edson (R1 — 06/04/2026)
- [x] Ata da R1 consolidada — [reunioes/R1/ata-R1.md](../reunioes/R1/ata-R1.md)
- [x] Documento de Requisitos v1.0 produzido — [reunioes/R1/requisitos-v1.md](../reunioes/R1/requisitos-v1.md): 5 atores, 29 RF, 4 RNF, 5 riscos
- [x] Planilha de Custos v2 — [visao-roi/planilha-custos-v2.md](../visao-roi/planilha-custos-v2.md): 36 macro-requisitos com estimativa de horas e custo por papel
- [x] Documento de Visão v1 — [visao-roi/visao-v1.md](../visao-roi/visao-v1.md): posicionamento, envolvidos, recursos, ROI
- [x] Requisitos, decisões e riscos consolidados neste diretório `estado/`
- [x] Plano de protótipo navegável escrito — [../../../PROTOTIPO-PLANO.md](../../../PROTOTIPO-PLANO.md)
- [x] **Infra de codificação montada (2026-05-08)** — separação back-end/front-end via App Router groups, Prisma 7 + PostgreSQL 16 em Docker, validação de envs com Zod, rota `GET /api/hello` validando conexão DB, Vitest 4 como framework de testes (DEC-A11 a DEC-A14)

### Em andamento
- [ ] Protótipo navegável (F1 — 15 telas core admin/profissional)
- [ ] Preparação da R2 com o Dr. Edson (roteiro baseado nas pendências P0 ainda abertas)

### Próximos passos imediatos
1. Implementar F1 do protótipo (setup + AppShell + 15 telas mockadas)
2. Gerar screenshots das telas para apresentar na R2
3. Preparar roteiro da R2 focando: PEND-002 (bruto/líquido), PEND-014 (turnos e horários), PEND-015 (alocação consultório/turno), PEND-017 (escopo prontuário)
4. Após R2 e validação do protótipo: iniciar Codificação real

### Fase seguinte (Codificação)
Entra quando:
- Protótipo aprovado pelo Dr. Edson em R2
- Campos mínimos do prontuário definidos (PEND-017)
- Turnos definidos (PEND-014)
- Modelo de dados (DER) aprovado em revisão técnica formal

### Histórico de transições
| Data | De | Para | Motivo |
|---|---|---|---|
| 2026-04-06 | — | Comunicação (R1) | Início do projeto; reunião inicial com cliente |
| 2026-04-09 | Comunicação | Modelagem + Prototipação | Documento de Requisitos v1 e Visão v1 publicados; pendências P0 dependem de artefato visual para destravar |
| 2026-05-08 | Modelagem + Prototipação | **+ Construção (parcial, apenas infra)** | Infra antecipada antes da R2 para reduzir risco de cronograma; entidades de domínio só entram pós-validação em R2 (DEC-A13) |
| 2026-05-08 | Construção (Fase 0 ✅) | **Construção (Fase 1 ✅)** | Backend foundation + seed: helpers `audit()`/`requireRole()`/`requireUser()`/`handle-error()`, cliente API, seed admin, RoleProvider via /me, RoleSwitcher dev-only. 11 testes novos require-role + 4 testes audit. Próximo: Fase 2 (catálogos CRUD em 3 trilhas paralelas) |
| 2026-05-08 | Construção (Fase 1 ✅) | **Construção (Fase 2 — 100% ✅)** | Catálogos CRUD completo: backend (8 rotas + 14 usecases + 37 testes Vitest) + frontend (12 páginas: listagem/criar/detalhe/editar das 3 trilhas) + 6 specs Playwright + RoleSwitcher removido (auth real) + cache:no-store no api-client. Total: 75 testes Vitest + 7 specs Playwright |
