# Pendências com o Cliente (Dr. Edson / Professor)

> Tudo que ficou em aberto após reuniões e precisa ser confirmado.
> Prioridade: **P0** = bloqueia avanço, **P1** = importante, **P2** = nice-to-have.
>
> **Reconciliação 2026-04-18** com artefatos de R1 ([ata-R1](../reunioes/R1/ata-R1.md), [requisitos-v1](../reunioes/R1/requisitos-v1.md), [visao-v1](../visao-roi/visao-v1.md)).
>
> **2026-05-08 — Decisões técnicas assumidas para destravar Construção (Fase 1+ do roadmap):** as pendências P0 abaixo (PEND-002/014/015/017/030/031/032/045) ganharam decisão técnica documentada para que a equipe possa avançar; **todas continuam abertas** até confirmação do Dr. Edson em R2. Detalhes em [`/IMPLEMENTACAO-PLANO.md`](../../../IMPLEMENTACAO-PLANO.md) seção 2.

## Pendências Ativas

### P0 — bloqueiam avanço
| ID | Pendência | Origem | Data abertura | Status | Levar para |
|---|---|---|---|---|---|
| PEND-002 | Cálculo de repasse é sobre valor bruto ou líquido da consulta | R1 | 2026-04-13 | Aberta — **decisão técnica 2026-05-08: BRUTO** (`valorConsulta × percentualRepasse`); confirmar Dr. Edson | R2 |
| PEND-014 | Quais turnos existem e seus horários exatos (ex: manhã 7-12, tarde 13-18, noite 18-22) | R1 ata §4 | 2026-04-09 | Aberta — **decisão técnica 2026-05-08: manhã 7-12, tarde 13-18, noite 18-20** (default no código); confirmar Dr. Edson | R2 |
| PEND-015 | Como o consultório alocado por turno é definido para cada profissional | R1 ata §4 | 2026-04-09 | Aberta — **decisão técnica 2026-05-08: 1 profissional por (consultório, dia, turno)** via constraint `@@unique([consultorioId, diaSemana, turno])` (DEC-A15); confirmar Dr. Edson | R2 |
| PEND-017 | Campos mínimos que o prontuário eletrônico (AT03) deve ter | R1 ata §4 | 2026-04-09 | Aberta — **decisão técnica 2026-05-08: Json livre** com 4 sugestões UI (anamnese, evolução, conduta, retorno); confirmar Dr. Edson | R2 |
| PEND-030 | Fluxo do dia do atendimento — consolida: (a) atendente marca chegada? (b) profissional registra durante ou após? (c) tolerância antes de `nao_compareceu`? (d) pagamento presencial (FI10) é registrado quando? <!-- NOVO --> | Equipe (AG08/AT05/AT06/FI10) | 2026-04-19 | Aberta — **decisão técnica 2026-05-08: atendente marca chegada → profissional inicia → profissional finaliza com form pré-populado**. Admin/aux podem qualquer transição. Confirmar Dr. Edson | R2 |
| PEND-045 | **Dr. Edson aprova a remoção de FI09 (pagamento online via PIX/cartão/boleto) do MVP?** Equipe propõe, via DEC-E09, que pagamentos sejam exclusivamente presenciais no atendimento. Justificativa: redução de risco LGPD/PCI, eliminação da complexidade de gateway/split/estorno/tributário, foco no problema central de controle de repasse. FI09 era classificado como "Excitante" no IFQ — não "Normal". Sem aprovação, FI09 volta como confirmado e arquitetura Asaas precisa ser planejada. <!-- NOVO --> | Equipe (DEC-E09) | 2026-05-07 | Aberta — **decisão técnica 2026-05-08: SIM, FI09 fora do MVP** (Fase 4 do roadmap não implementa gateway). Confirmar Dr. Edson | **R2 — apresentar como decisão de escopo proposta** |

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
| PEND-023 | Paciente pode se auto-cadastrar pelo portal, ou cadastro é sempre iniciado pela clínica/atendente? <!-- NOVO --> | Equipe (DEC-E04, RF-027) | 2026-04-19 | Aberta | R2 |
| PEND-024 | Sistema aceita Google como provedor de login do paciente? Outros provedores (Apple, Facebook)? <!-- NOVO --> | Equipe (DEC-A08, RF-028) | 2026-04-19 | Aberta | R2 |
| PEND-025 | Dados mínimos obrigatórios no auto-cadastro do paciente: CPF obrigatório? Data de nascimento? Endereço? (relaciona com PEND-007 LGPD) <!-- NOVO --> | Equipe (RF-027) | 2026-04-19 | Aberta | R2 |
| PEND-026 | Todos os profissionais aceitam pagamento exclusivamente presencial (FI10 promovido via DEC-E09)? Algum exigia antecipação que agora fica inviável? <!-- ALTERADO: dependente de PEND-045 --> | Equipe (FI10, DEC-E09) | 2026-04-19 | Aberta | R2 (depende de PEND-045) |
| PEND-027 | Se paciente não comparece (no-show), há cobrança? Política agora é mais sensível porque não há sinal/cobrança antecipada; relaciona com DEC-R1-07 (cancelamento sem taxa) e R-022 (risco de no-show com pagamento 100% presencial) <!-- ALTERADO: criticidade aumenta após DEC-E09 --> | Equipe (FI10, DEC-E09, R-022) | 2026-04-19 | Aberta | R2 (depende de PEND-045) |
| PEND-028 | Forma de pagamento no local é livre no momento do atendimento (dinheiro/cartão na maquininha do profissional/Pix com chave do profissional) ou clínica define um padrão? <!-- ALTERADO --> | Equipe (FI10, DEC-E09) | 2026-04-19 | Aberta | R2 (depende de PEND-045) |
| PEND-031 | Quem pode editar atendimento após status `realizado`? Há janela de tempo? (admin só? auxiliar também? profissional?) <!-- NOVO --> | Equipe (FI11) | 2026-04-19 | Aberta — **decisão técnica 2026-05-08: SÓ admin e auxiliar**. Profissional não edita o próprio (precisa pedir ao financeiro); atendente nunca. Confirmar Dr. Edson | R2 |
| PEND-032 | Paciente reagenda livremente pelo portal, ou cada reagendamento precisa aprovação da atendente? <!-- NOVO --> | Equipe (AG09) | 2026-04-19 | Aberta — **decisão técnica 2026-05-08: livre** (cancela + cria novo); auditoria registra. Confirmar Dr. Edson | R2 |
| PEND-033 | Notificações cross-actor (atendente vê cancelamento do paciente, profissional vê novo agendamento) são requisito explícito ou expectativa implícita? <!-- NOVO --> | Equipe | 2026-04-19 | Aberta | R2 |

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

## Última atualização: 2026-05-08 (decisões técnicas 2026-05-08 documentadas em PEND-002/014/015/017/030/031/032/045 para destravar IMPLEMENTACAO-PLANO.md; todas continuam abertas até R2)
