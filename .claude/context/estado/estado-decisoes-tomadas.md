# Decisões Tomadas

> Nenhuma decisão existe se não está neste arquivo.
> Formato: decisão, justificativa, data, quem decidiu, alternativas descartadas.
>
> **Reconciliação 2026-04-18:** as decisões originais DEC-001/002/003 (prontuário, agendamento online, portal do paciente "fora do MVP") foram **anuladas** por contradizer a ata da R1 — ver seção "Decisões revisadas/anuladas" ao final.

## Decisões de Escopo (confirmadas pelo cliente em R1 — 06/04/2026)

| ID | Decisão | Justificativa | Data | Quem | Alternativas descartadas |
|---|---|---|---|---|---|
| DEC-R1-01 | Sistema **terá** módulo de agendamento online para pacientes | Dr. Edson quer substituir WhatsApp/caderno por canal centralizado | 2026-04-06 | Dr. Edson | Manter canais atuais (rejeitado — problema core do cliente) |
| DEC-R1-02 | Prestação de contas será **semanal** (hoje é mensal) | Reduzir perda silenciosa por atendimentos não registrados | 2026-04-06 | Dr. Edson | Mensal (atual, rejeitado) / Quinzenal |
| DEC-R1-03 | Sistema registra **consultas E procedimentos extras** (ultrassom, exames) | Capturar toda receita sujeita a repasse | 2026-04-06 | Dr. Edson | Apenas consultas (rejeitado — perde receita) |
| DEC-R1-04 | Auxiliar financeiro **integrado** ao sistema (não eliminado) | Conhecimento do processo atual e aderência organizacional | 2026-04-06 | Dr. Edson | Eliminar função (rejeitado) |
| DEC-R1-05 | Prontuário eletrônico **incluído** no sistema; campos a definir em R2 | Dr. Edson quer centralizar operação na plataforma | 2026-04-06 | Dr. Edson | Sem prontuário (rejeitado) / Integrar prontuários externos (em aberto) |
| DEC-R1-06 | IA envia lembretes de consulta via **WhatsApp** (2 dias / 1 dia / dia da consulta) | Reduzir não-comparecimento e ociosidade de consultórios | 2026-04-06 | Dr. Edson | SMS / E-mail (descartados por baixa conversão) |
| DEC-R1-07 | Cancelamento **não terá taxa**; sistema registra motivo | Transparência e base para relatório RE05 | 2026-04-06 | Dr. Edson | Cobrar taxa (rejeitado) |
| DEC-R1-08 | Modalidades de contrato: **aluguel fixo por turno** OU **percentual** sobre consultas | Modelo de negócio atual da clínica | 2026-04-06 | Dr. Edson (contexto de negócio) | Modelo híbrido obrigatório (rejeitado) |
| DEC-R1-09 | Percentual de repasse varia **por profissional**, negociado individualmente | Prática atual do Dr. Edson com cada profissional | 2026-04-06 | Dr. Edson | Percentual único por especialidade (rejeitado) |

## Decisões de Escopo (internas — equipe)

| ID | Decisão | Justificativa | Data | Quem | Alternativas descartadas |
|---|---|---|---|---|---|
| DEC-E01 | Dados clínicos de pacientes **fora do MVP** | Redução de risco LGPD | 2026-04-13 | Equipe | Armazenar com criptografia (descartado por complexidade e risco regulatório) |
| DEC-E02 | Integração com prontuários externos **fora do MVP** | Aumenta escopo e custo; validar com cliente em R2 | 2026-04-09 | Equipe (risco R-009) | Incluir no MVP (descartado por estimativa conservadora) |
| DEC-E03 | Controle de acesso por perfil tratado como requisito de infra (RF-021 a RF-026) | Garantir RNF02 (segurança) e aderência LGPD | 2026-04-16 | Equipe | Assumir implícito (rejeitado — precisa estar nos requisitos) |

## Decisões de Arquitetura / Stack

| ID | Decisão | Justificativa | Data | Quem | Alternativas descartadas |
|---|---|---|---|---|---|
| DEC-A01 | Stack web: **Next.js 16 + React 19 + Tailwind v4 + shadcn/ui** | Já instalado no repositório; permite SSR, App Router e PWA para paciente | 2026-04-18 | Equipe (Dev/WD) | Vue + Nuxt (descartado por menor familiaridade); Plain React + Vite (descartado por precisar de SSR) |
| DEC-A02 | TypeScript como linguagem padrão do front | Tipagem forte reduz bugs, especialmente em valores financeiros | 2026-04-18 | Equipe | JS puro (rejeitado por risco financeiro) |
| DEC-A03 | Valores monetários: inteiro em centavos OU `Decimal` | Regra inegociável RNF-101 aplicada à implementação | 2026-04-13 | Equipe | `float`/`double` (proibido) |
| DEC-A04 | Cálculo de repasse **sempre no servidor** | Regra inegociável RNF-103; integridade e auditabilidade | 2026-04-13 | Equipe | Cálculo client-side (proibido) |
| DEC-A05 | Datas em pt-BR via `date-fns` + locale `ptBR` | Padronização pt-BR (RNF04) | 2026-04-18 | Equipe | `Intl.DateTimeFormat` puro (possível, mas `date-fns` ganha em composição) |
| DEC-A06 | Formulários via `react-hook-form` + `zod` | Validação tipada + performance; padrão do design system | 2026-04-18 | Equipe | Formik (legado); HTML form puro (descartado para formulários complexos) |

## Decisões de Processo

| ID | Decisão | Justificativa | Data | Quem | Alternativas descartadas |
|---|---|---|---|---|---|
| DEC-P01 | Ordem obrigatória: **requisito → modelo → código** | Evitar retrabalho e código sem justificativa | 2026-04-13 | Equipe | — |
| DEC-P02 | Protótipo navegável construído **antes da R2** para destravar pendências | Apresentar telas ao Dr. Edson é mais eficaz que conversa abstrata | 2026-04-18 | Equipe | Seguir só com documento (rejeitado — perde oportunidade de validação visual) |
| DEC-P03 | Commit por tela durante a construção do protótipo | Rastreabilidade e possibilidade de rollback por tela | 2026-04-18 | Equipe | Commit monolítico (rejeitado) |
| DEC-P04 | Conventional Commits como padrão | Histórico legível e automatização de changelog | 2026-04-13 | Equipe | Mensagens livres (rejeitado) |

## Decisões revisadas / anuladas

| ID antigo | Decisão original | Motivo da anulação | Substituída por |
|---|---|---|---|
| DEC-001 | MVP não inclui prontuário eletrônico | Contradiz [ata-R1 §3 item 5](../reunioes/R1/ata-R1.md): Dr. Edson pediu inclusão | DEC-R1-05 |
| DEC-002 | MVP não inclui agendamento avançado | Contradiz [ata-R1 §3 item 1](../reunioes/R1/ata-R1.md): agendamento online confirmado | DEC-R1-01 |
| DEC-003 | MVP não inclui portal do paciente | Contradiz AG01, AG06, FI09 em requisitos-v1 | DEC-R1-01 |
| DEC-004 | Dados clínicos fora do MVP | Mantida, mas renumerada como decisão de equipe | DEC-E01 |

Essas decisões foram tomadas pela equipe em 13/04 na expectativa de conter escopo — **antes** dos artefatos de R1 (09/04) estarem consolidados no diretório `estado/`. Com a reconciliação de 18/04, prevalecem as decisões do cliente.

## Última atualização: 2026-04-18
