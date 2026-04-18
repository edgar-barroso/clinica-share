# ClinicaShare — Índice de Contexto

Base de conhecimento do projeto ClinicaShare, sistema web de gestão de repasses financeiros para a clínica multiprofissional do Dr. Edson Andrade. Este diretório contém toda a metodologia, regras, playbooks, estado atual e artefatos acadêmicos do projeto.

> **Ponto de entrada principal:** [INSTRUCAO-MESTRE.md](INSTRUCAO-MESTRE.md) — sempre leia primeiro. Define papel, roteamento por frente e protocolos de resposta.

## Reconciliação artefatos ↔ estado (2026-04-18)

Os arquivos `estado-*.md` foram reconciliados com os artefatos oficiais da R1 em 2026-04-18. **Verdade atual:** os artefatos e os `estado-*.md` dizem a mesma coisa. As decisões antigas DEC-001/002/003 (que diziam prontuário/agendamento-online/portal-paciente fora do MVP) foram anuladas por contradizer a ata-R1 — ver seção "Decisões revisadas" em [estado-decisoes-tomadas.md](estado/estado-decisoes-tomadas.md).

Resumo pós-reconciliação: **5 atores, 35 RF (29 oficiais + 6 de acesso), 10 RNF (4 oficiais + 6 regras internas), 14 riscos ativos, 18 pendências abertas (4 P0 + 13 P1 + 1 P2 a migrar)**.

## Mapa do diretório

```
.claude/context/
├── INSTRUCAO-MESTRE.md        ← ponto de entrada, roteamento por frente
├── base/                      ← fundação imutável: contexto, glossário, regras
├── playbooks/                 ← como trabalhar em cada uma das 5 frentes
├── estado/                    ← estado vivo do projeto (atualiza continuamente)
├── templates/                 ← modelos de entregáveis acadêmicos
├── reunioes/                  ← atas e requisitos (todos em .md)
└── visao-roi/                 ← documento de visão e planilhas de custo (todos em .md)
    └── arquivo/               ← versões antigas/obsoletas
```

## 1. Base — fundação do projeto

| Arquivo | Quando consultar |
|---|---|
| [base/00-contexto-projeto.md](base/00-contexto-projeto.md) | Briefing: cliente, problema, solução, não-escopo, riscos estruturais |
| [base/01-glossario-metodologia.md](base/01-glossario-metodologia.md) | Vocabulário Pressman da disciplina — usar termos do professor |
| [base/02-regras-inegociaveis.md](base/02-regras-inegociaveis.md) | Limites técnicos/metodológicos que nunca se quebram |
| [base/03-atividades-guarda-chuva.md](base/03-atividades-guarda-chuva.md) | Práticas contínuas obrigatórias (risco, SQA, configuração, RTF, controle) |

## 2. Playbooks — como executar cada frente

| Frente | Playbook | Cobre |
|---|---|---|
| Comunicação | [playbooks/playbook-01-comunicacao.md](playbooks/playbook-01-comunicacao.md) | Reuniões, atas, entrevistas, requisitos do cliente |
| Planejamento | [playbooks/playbook-02-planejamento.md](playbooks/playbook-02-planejamento.md) | Escopo, backlog, sprint, estimativa, stack |
| Modelagem | [playbooks/playbook-03-modelagem.md](playbooks/playbook-03-modelagem.md) | UML, modelo de dados, fluxos, protótipos |
| Codificação | [playbooks/playbook-04-codificacao.md](playbooks/playbook-04-codificacao.md) | Código, refatoração, padrões, testes |
| Implementação | [playbooks/playbook-05-implementacao.md](playbooks/playbook-05-implementacao.md) | Deploy, ambientes, CI, entrega |

## 3. Estado — vive e muda

> Consultar **antes** de qualquer resposta que dependa de contexto do cliente. Atualizar **sempre** que a conversa gerar informação persistível.

| Arquivo | Atualizar quando... | Status |
|---|---|---|
| [estado/estado-fase-atual.md](estado/estado-fase-atual.md) | Equipe muda de fase ou completa um marco | Modelagem + Prototipação |
| [estado/estado-requisitos-confirmados.md](estado/estado-requisitos-confirmados.md) | Requisito é confirmado, refinado ou removido | 35 RF + 10 RNF |
| [estado/estado-decisoes-tomadas.md](estado/estado-decisoes-tomadas.md) | Qualquer decisão é fechada (stack, escopo, processo) | 9 cliente + 3 escopo + 6 stack + 4 processo |
| [estado/estado-pendencias-cliente.md](estado/estado-pendencias-cliente.md) | Pendência é criada, resolvida ou re-priorizada | 4 P0 + 13 P1 abertas; R2 prevista |
| [estado/estado-riscos.md](estado/estado-riscos.md) | Risco novo surge, existente muda ou é encerrado | 14 ativos |
| [estado/estado-equipe.md](estado/estado-equipe.md) | Divisão de trabalho muda | 4 alunos, papéis RUP |
| [estado/estado-ata-reuniao-interna.md](estado/estado-ata-reuniao-interna.md) | Reunião interna acontece | — |

## 4. Templates — modelos de entregáveis

| Artefato | Template |
|---|---|
| Ata de reunião | [templates/entregavel-template-ata-reuniao.md](templates/entregavel-template-ata-reuniao.md) |
| Caso de uso | [templates/entregavel-template-caso-de-uso.md](templates/entregavel-template-caso-de-uso.md) |
| Checklist RTF | [templates/entregavel-template-checklist-rtf.md](templates/entregavel-template-checklist-rtf.md) |
| Documento de Visão | [templates/entregavel-template-documento-visao.md](templates/entregavel-template-documento-visao.md) |
| Glossário do Projeto | [templates/entregavel-template-glossario-projeto.md](templates/entregavel-template-glossario-projeto.md) |
| ROI | [templates/entregavel-template-roi.md](templates/entregavel-template-roi.md) |
| SRS | [templates/entregavel-template-srs.md](templates/entregavel-template-srs.md) |

## 5. Reuniões com o cliente — artefatos oficiais

### Reunião R1 — 06/04/2026 (documentada em 09/04)
| Arquivo | Conteúdo |
|---|---|
| [reunioes/R1/ata-R1.md](reunioes/R1/ata-R1.md) | Ata da reunião — contexto, situação atual, 7 decisões do cliente, 5 pontos em aberto |
| [reunioes/R1/requisitos-v1.md](reunioes/R1/requisitos-v1.md) | Documento de Requisitos v1.0 — 5 atores + 29 RF + 4 RNF + 5 riscos |

## 6. Visão e ROI

### Versões atuais (canônicas)
| Arquivo | Conteúdo |
|---|---|
| [visao-roi/visao-v1.md](visao-roi/visao-v1.md) | Documento de Visão — completo, revisão de 2026-04-16 |
| [visao-roi/planilha-custos-v2.md](visao-roi/planilha-custos-v2.md) | Planilha de custos v2 — **36 casos de uso** com estimativa em horas, custos, complexidade |

### Arquivo (obsoleto, preservado para histórico)
| Arquivo | Motivo |
|---|---|
| [visao-roi/arquivo/visao-ROI-v1-inicial.md](visao-roi/arquivo/visao-ROI-v1-inicial.md) | Primeira versão, substituída pela revisão de 16/abr |
| [visao-roi/arquivo/planilha-custos-v1.md](visao-roi/arquivo/planilha-custos-v1.md) | Planilha original (13/abr), superseded por v2 |

## Ligação com skills

- [../skills/clinicashare-design-system/](../skills/clinicashare-design-system/) — design system (Next.js + Tailwind + shadcn/ui) do ClinicaShare. Acionada automaticamente em tarefas de UI.

## Regra de ouro

Nunca terminar uma resposta que gere informação nova sem verificar se algum arquivo em `estado/` precisa ser atualizado. Se precisa, entregar a versão nova. Se não precisa, declarar explicitamente: *"Nenhum arquivo de estado afetado por esta resposta."*
