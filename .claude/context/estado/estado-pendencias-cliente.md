# Pendências com o Cliente (Dr. Edson / Professor)

> Tudo que ficou em aberto após reuniões e precisa ser confirmado.
> Prioridade: **P0** = bloqueia avanço, **P1** = importante, **P2** = nice-to-have.
>
> **Reconciliação 2026-04-18** com artefatos de R1 ([ata-R1](../reunioes/R1/ata-R1.md), [requisitos-v1](../reunioes/R1/requisitos-v1.md), [visao-v1](../visao-roi/visao-v1.md)).

## Pendências Ativas

### P0 — bloqueiam avanço
| ID | Pendência | Origem | Data abertura | Status | Levar para |
|---|---|---|---|---|---|
| PEND-002 | Cálculo de repasse é sobre valor bruto ou líquido da consulta | R1 | 2026-04-13 | Aberta | R2 |
| PEND-014 | Quais turnos existem e seus horários exatos (ex: manhã 7-12, tarde 13-18, noite 18-22) | R1 ata §4 | 2026-04-09 | Aberta | R2 |
| PEND-015 | Como o consultório alocado por turno é definido para cada profissional | R1 ata §4 | 2026-04-09 | Aberta | R2 |
| PEND-017 | Campos mínimos que o prontuário eletrônico (AT03) deve ter | R1 ata §4 | 2026-04-09 | Aberta | R2 |

### P1 — importantes, não bloqueiam totalmente
| ID | Pendência | Origem | Data abertura | Status | Levar para |
|---|---|---|---|---|---|
| PEND-001 | % exatos de repasse praticados hoje (valores típicos / faixas) | R1 | 2026-04-13 | Parcialmente respondida — modalidade confirmada, valores pendentes | R2 |
| PEND-005 | Escopo detalhado do prontuário (ver PEND-017 para campos mínimos) | R1 | 2026-04-13 | Parcialmente respondida — inclusão confirmada (DEC-R1-05) | R2 |
| PEND-006 | Volume de consultas/mês e nº de profissionais ativos | R1 | 2026-04-13 | Parcialmente respondida — 12 consultórios; volume por profissional ainda aberto | R2 |
| PEND-007 | Armazenamento de dados pessoais de paciente (impacto LGPD: CPF, contato, endereço) | R1 | 2026-04-13 | Aberta | R2 |
| PEND-008 | Prazo final do projeto (orçamento R$ 38.224,22 já estimado em visao-v1) | R1 | 2026-04-13 | Parcialmente respondida — orçamento estimado, prazo pendente | R2 |
| PEND-010 | Emissão de recibo e/ou nota fiscal integrada | R1 | 2026-04-13 | Aberta | R2 |
| PEND-011 | Ponto de contato fixo do cliente durante desenvolvimento | R1 | 2026-04-13 | Aberta | R2 |
| PEND-013 | Integração com prontuários externos já utilizados pelos médicos (via API) | R1 ata §4 | 2026-04-09 | Aberta — decisão interna DEC-E02 declara fora do MVP, cliente precisa confirmar | R2 |
| PEND-016 | Dados históricos (planilhas) que precisam ser migrados para o novo sistema | R1 ata §4 | 2026-04-09 | Aberta | R2 |
| PEND-018 | Limites quantitativos do RNF03 (tempo de resposta, disponibilidade/SLA) | visao-v1 §7 | 2026-04-16 | Aberta | R2 |
| PEND-019 | Licenciamento do software (propriedade DevsTech ou cessão ao cliente?) | visao-v1 §4.4 | 2026-04-16 | Aberta | R2 |
| PEND-020 | Hospedagem: servidor DevsTech, cliente ou nuvem (AWS/Azure)? | visao-v1 §4.4 | 2026-04-16 | Aberta | R2 |
| PEND-021 | Contrato de manutenção pós-entrega (período e SLA) | visao-v1 §4.4 | 2026-04-16 | Aberta | R2 |
| PEND-022 | Custo da API WhatsApp Business para AG07 (quem paga, como aprovar) | visao-v1 §4.2 + risco R-011 | 2026-04-16 | Aberta | R2 |

### P2 — nice-to-have
| ID | Pendência | Origem | Data abertura | Status |
|---|---|---|---|---|
| PEND-009 | Mobile x desktop: preferência do Dr. Edson | R1 | 2026-04-13 | Resolvida (RNF01 exige ambos) — **mover para resolvidas** |

## Pendências Resolvidas

| ID | Pendência original | Resolução | Fonte | Data resolução |
|---|---|---|---|---|
| PEND-003 | Frequência de pagamento dos repasses | **Semanal** (DEC-R1-02) | ata-R1 §3 item 2 | 2026-04-06 |
| PEND-004 | Quem acessa o sistema | **5 atores** confirmados (Administrador, Auxiliar, Profissional, Atendente, Paciente) — ver requisitos-v1.md e estado-requisitos-confirmados.md | requisitos-v1 §2 | 2026-04-09 |
| PEND-012 | Como as consultas são registradas hoje | Processo manual descentralizado: WhatsApp + caderno + planilhas individuais (ver ata-R1 §2) | ata-R1 §2 | 2026-04-06 |
| PEND-009 | Mobile x desktop | RNF01 confirma que sistema deve funcionar em desktop, tablet e celular | requisitos-v1 §4 | 2026-04-09 |

## Última atualização: 2026-04-18 (reconciliação com artefatos R1 + visão)
