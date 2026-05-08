# Playbook 05 — Implementação

## Status atual (atualizado 2026-05-08)

> Esta seção rastreia o que foi entregue nas Fases 0–3 do
> [`/IMPLEMENTACAO-PLANO.md`](../../../IMPLEMENTACAO-PLANO.md). Os checkboxes
> abaixo (seções "Checklist de go-live" e "Critérios de saída") refletem o
> estado real do projeto.

**Entregue até agora**:
- ✅ **Ambiente local reproduzível**: `docker-compose.yml` (Postgres 16 :5433),
  `.env.example` versionado, `npm run db:up && db:migrate && db:seed`
- ✅ **Migrations versionadas** em `prisma/migrations/` (3 migrations: init +
  domain_models + auth_google_id)
- ✅ **Seed de admin** idempotente (`prisma/seed.ts` via `npm run db:seed`)
- ✅ **Smoke test** automático: 75+ testes Vitest (helpers, auth, audit,
  require-role, consultórios, profissionais, staff) + 7 specs Playwright E2E
  (auth-flow, catalogos-flow, catalogos-detalhe-editar)
- ✅ **Credenciais fora do repo**: `.gitignore` cobre `.env*` (mantido só
  `.env.example`)
- ✅ **Runbook** parcial em `IMPLEMENTACAO-PLANO.md` seção "Como começar"
- ✅ **ER diagram automático** em `prisma/erd.svg` regerado a cada
  `prisma generate` (DEC-A18)

**Pendente (entra em fases futuras)**:
- ⏳ Deploy em ambiente acessível ao Dr. Edson (Fase 8)
- ⏳ Seed de cenário de demo com profissionais/atendimentos da clínica
  (não admin) — depende de validação em R2
- ⏳ Manual de uso para o Dr. Edson (1-2 páginas com screenshots) — Fase 8
- ⏳ Roteiro de feedback pós-demo — Fase 8
- ⏳ Demo ensaiada pela equipe — Fase 8
- ⏳ CI/CD com testes automatizados em PR

---

## Quando usar este playbook
Deploy, configuração de ambiente, banco de dados, CI/CD, entrega final
ao cliente (professor).

## Mindset
Modo ENTREGA CONFIÁVEL. A demo para o Dr. Edson não pode quebrar. Não
importa se o código é lindo — se o deploy falha na hora da apresentação,
a nota cai.

## Pré-requisitos obrigatórios
- Código funcional com testes passando
- Stack e ambiente alvo decididos em `estado-decisoes-tomadas.md`

## Sub-tarefas
- Preparar ambiente de execução (local + eventual servidor de demo)
- Migrations de banco de dados versionadas
- Seed de dados para demo (cenário do Dr. Edson)
- Deploy (manual ou automatizado)
- Smoke test pós-deploy
- Runbook escrito para a equipe conseguir subir de novo se quebrar
- Handoff: entrega documentada ao cliente
- **Manual de uso** para o Dr. Edson (1-2 páginas, com screenshots)
- **Roteiro de feedback pós-demo** (perguntas para coletar impressão do cliente)

## Armadilhas
- **Deploy sem backup.** Se não tem como voltar atrás, não faz deploy.
- **Migração destrutiva sem rollback.** Toda migration precisa de reversa
  testada.
- **Credenciais em repositório.** Secret em `.env` fora do Git, sempre.
- **"Funciona na minha máquina".** Se não roda em outra, não roda. Ponto.
- **Demo sem ensaio.** Ensaiar a demo antes da apresentação é obrigatório.
  Erros de demo são erros evitáveis.
- **Seed genérico.** O seed tem que contar a história do Dr. Edson:
  profissionais com nomes, consultas reais, repasses calculáveis à mão
  para verificar.

## Outputs típicos
- Runbook de deploy
- Checklist de go-live
- Documento de ambiente (variáveis, dependências, portas)
- Script de seed para demo
- Roteiro de demonstração para o cliente

## Checklist de go-live
- [ ] Backup do estado atual feito?
- [ ] Migration reversível testada?
- [x] Seed da demo rodou sem erro? *(seed do admin via `npm run db:seed`; seed de cenário Dr. Edson pendente)*
- [x] Smoke test pós-deploy passou? *(Vitest + Playwright; pré-deploy local)*
- [x] Credenciais fora do repositório? *(`.gitignore` cobre `.env*`)*
- [x] Runbook atualizado? *(seção "Como começar" no `IMPLEMENTACAO-PLANO.md`)*
- [ ] Equipe alinhada sobre papéis na apresentação?

## Critérios de saída desta fase
- [ ] Sistema rodando em ambiente acessível ao cliente
- [ ] Demo ensaiada pela equipe
- [ ] Manual de uso entregue ao Dr. Edson
- [ ] Feedback do cliente coletado pós-demo
- [ ] Runbook atualizado e testado por outro membro da equipe

## Metacomentário (obrigatório no output)
Ver §5 da instrução mestre.
