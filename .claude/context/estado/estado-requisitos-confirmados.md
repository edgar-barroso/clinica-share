# Requisitos Confirmados

> Nenhum requisito é "assumido". Se não está neste arquivo, não existe.
> Cada requisito tem ID, origem rastreável (reunião, data, quem disse) e classificação IFQ (Normal / Esperado / Excitante).
>
> **Fontes oficiais desta versão:** [ata-R1.md](../reunioes/R1/ata-R1.md), [requisitos-v1.md](../reunioes/R1/requisitos-v1.md), [visao-v1.md](../visao-roi/visao-v1.md), [planilha-custos-v2.md](../visao-roi/planilha-custos-v2.md).

## Atores do Sistema

| Ator | Descrição | Nível de acesso |
|---|---|---|
| Administrador (Dr. Edson) | Proprietário da clínica. Visão completa de financeiro, consultórios e profissionais. | Total |
| Auxiliar Financeiro | Responsável pelo fechamento financeiro semanal e registro de pagamentos. | Financeiro (restrito) |
| Profissional de Saúde | Médico/psicólogo/fisioterapeuta. Acessa agenda própria, registra atendimentos e procedimentos. | Próprios dados |
| Atendente do Profissional | Gerencia agenda do(s) profissional(is) vinculado(s); pode ser próprio ou compartilhado. | Agenda do(s) vinculado(s) |
| Paciente | Agenda consultas online, recebe lembretes, cancela agendamentos. | Próprios agendamentos |

## Requisitos Funcionais

### Módulo de Agendamento (AG)
| ID | Descrição | Prioridade | Complexidade | Origem | IFQ | Status |
|---|---|---|---|---|---|---|
| AG01 | Paciente pode agendar consulta online via portal web | Alta | A | R1 | N | Confirmado |
| AG02 | Atendente pode agendar consulta em nome do paciente pelo sistema | Alta | B | R1 | N | Confirmado |
| AG03 | Sistema respeita turnos fixos e horários definidos por profissional | Alta | M | R1 | E | Confirmado |
| AG04 | Duração da consulta é configurável por profissional | Alta | B | R1 | E | Confirmado |
| AG05 | Sistema impede conflito de horário no mesmo consultório | Alta | A | R1 | E | Confirmado |
| AG06 | Paciente/atendente pode cancelar agendamento com registro obrigatório de motivo | Média | B | R1 | N | Confirmado |
| AG07 | IA envia lembrete de consulta via WhatsApp: 2 dias antes, 1 dia antes e no dia | Média | A | R1 | X | Confirmado |
| AG08 | Atendente marca chegada do paciente no dia (transição `agendado → em_atendimento`) <!-- NOVO --> | Alta | B | Equipe | E | **Proposto — validar em R2 (PEND-030)** |
| AG09 | Paciente pode reagendar consulta sem refazer wizard do zero (cancela original + abre agendamento novo) <!-- NOVO --> | Média | M | Equipe | E | **Proposto — validar em R2 (PEND-032)** |

### Módulo de Consultórios (CO)
| ID | Descrição | Prioridade | Complexidade | Origem | IFQ | Status |
|---|---|---|---|---|---|---|
| CO01 | Sistema cadastra os 12 consultórios com características (tipo, equipamentos) | Alta | B | R1 | N | Confirmado |
| CO02 | Cada consultório é vinculado a turnos específicos por profissional | Alta | M | R1 | N | Confirmado |
| CO03 | Profissional pode alocar mais de um turno por dia em consultórios diferentes | Alta | B | R1 | E | Confirmado |
| CO04 | Dashboard mostra ocupação de consultórios por período (qual gera mais receita) | Alta | M | R1 | X | Confirmado |

### Módulo de Atendimentos e Prontuário (AT)
| ID | Descrição | Prioridade | Complexidade | Origem | IFQ | Status |
|---|---|---|---|---|---|---|
| AT01 | Cada atendimento realizado é registrado (data, profissional, paciente, consultório) | Alta | M | R1 | N | Confirmado |
| AT02 | Procedimentos extras realizados no atendimento são registrados individualmente | Alta | B | R1 | N | Confirmado |
| AT03 | Sistema possui prontuário eletrônico integrado (campos a definir na R2) | Alta | A | R1 | N | Confirmado (escopo aberto) |
| AT04 | Se profissional usar prontuário externo, sistema registra a ocorrência para fins financeiros | Média | B | R1 | E | Confirmado |
| AT05 | Profissional inicia atendimento (transição `agendado → em_atendimento`) <!-- NOVO --> | Alta | B | Equipe | E | **Proposto — validar em R2 (PEND-030)** |
| AT06 | Profissional finaliza atendimento abrindo formulário de registro pré-populado a partir do agendamento original (transição `em_atendimento → realizado`) <!-- NOVO --> | Alta | M | Equipe | E | **Proposto — validar em R2 (PEND-030)** |

### Módulo Financeiro (FI)
| ID | Descrição | Prioridade | Complexidade | Origem | IFQ | Status |
|---|---|---|---|---|---|---|
| FI01 | Sistema cadastra contrato por profissional (modalidade: aluguel fixo ou percentual) | Alta | M | R1 | N | Confirmado |
| FI02 | Percentual de repasse é configurável individualmente por profissional | Alta | B | R1 | N | Confirmado |
| FI03 | Sistema calcula automaticamente o repasse devido por profissional com base nos atendimentos | Alta | A | R1 | N | Confirmado |
| FI04 | Repasse inclui consultas E procedimentos extras realizados no atendimento | Alta | M | R1 | N | Confirmado |
| FI05 | Sistema registra status de pagamento por atendimento (pago / pendente / gratuito) | Alta | B | R1 | N | Confirmado |
| FI06 | Descontos concedidos são registrados com justificativa e visíveis ao administrador | Alta | B | R1 | N | Confirmado |
| FI07 | Fechamento financeiro é semanal; sistema gera relatório de prestação de contas por período | Alta | M | R1 | N | Confirmado |
| FI08 | Sistema registra aluguel fixo por turno utilizado por profissional | Alta | B | R1 | N | Confirmado |
| ~~FI09~~ | ~~Paciente pode pagar via Pix, cartão ou boleto no momento do agendamento online~~ <!-- ALTERADO: removido proposto, ver DEC-E09 --> | ~~Média~~ | ~~A~~ | R1 | ~~X~~ | **REMOVIDO proposto (DEC-E09) — validar em R2 via PEND-045** |
| FI10 | Sistema registra pagamento **exclusivamente presencial** no momento do atendimento (dinheiro, Pix presencial via QR estático/dinâmico do profissional, cartão na maquininha do consultório). Estado de pagamento (`pago`/`pendente`/`gratuito`) é registrado pelo profissional ou pelo auxiliar financeiro <!-- ALTERADO: promovido a único modelo após remoção de FI09 (DEC-E09) --> | Alta | B | Equipe | N | **Proposto — único modelo de pagamento; validar em R2 (PEND-026/027/028)** |
| FI11 | Auxiliar/admin pode editar valor, procedimentos e status de pagamento de atendimento após registro (corrige erros operacionais) <!-- NOVO --> | Alta | B | Equipe | N | **Proposto — validar em R2 (PEND-031)** |

### Módulo de Relatórios e Dashboard (RE)
| ID | Descrição | Prioridade | Complexidade | Origem | IFQ | Status |
|---|---|---|---|---|---|---|
| RE01 | Dashboard do administrador exibe receita total, repasses em aberto e pagos | Alta | A | R1 | N | Confirmado |
| RE02 | Relatório financeiro filtrável por profissional, consultório e período | Alta | M | R1 | N | Confirmado |
| RE03 | Sistema exibe ranking de consultórios por receita gerada | Alta | B | R1 | E | Confirmado |
| RE04 | Relatório lista consultas gratuitas (desconto total) por período | Média | B | R1 | N | Confirmado |
| RE05 | Relatório de cancelamentos com motivos registrados pelos pacientes | Média | B | R1 | E | Confirmado |

### Módulo de Autenticação e Controle de Acesso (RF-02x)
Derivados da planilha v2 (adicionados pós-revisão da equipe como infraestrutura necessária ao RNF02).

| ID | Descrição | Prioridade | Complexidade | Origem | IFQ | Status |
|---|---|---|---|---|---|---|
| RF-021 | Autenticação de usuário com e-mail e senha | Alta | M | Equipe | E | Confirmado |
| RF-022 | Controle de acesso por perfil (Adm, Aux, Profissional, Atendente, Paciente) | Alta | A | Equipe | E | Confirmado |
| RF-023 | Profissional não acessa dados ou agenda de outro profissional | Alta | M | Equipe | E | Confirmado |
| RF-024 | Encerramento automático de sessão após inatividade | Média | B | Equipe | E | Confirmado |
| RF-025 | Registro do user_id autenticado em todo audit log financeiro | Alta | B | Regra inegociável | N | Confirmado |
| RF-026 | Recuperação de senha via e-mail | Média | B | Equipe | N | Confirmado |
| RF-027 | Paciente pode se auto-cadastrar pelo portal fornecendo dados mínimos <!-- NOVO --> | Alta | M | Equipe | E | **Proposto — validar em R2 (PEND-023)** |
| RF-028 | Paciente pode autenticar via Google OAuth (SSO) <!-- NOVO --> | Média | M | Equipe | X | **Proposto — validar em R2 (PEND-024)** |
| RF-029 | URLs/fluxos distintos para login da equipe interna (`/login`) e login do paciente (`/entrar`, `/cadastrar`) <!-- NOVO --> | Média | B | Equipe | E | **Proposto — decisão interna (DEC-A07)** |

### Legenda IFQ (Kano / QFD)
- **Normal (N):** o cliente espera e ficará insatisfeito se faltar
- **Esperado (E):** o cliente não pede explicitamente mas assume que existe
- **Excitante (X):** o cliente não espera mas ficará encantado se tiver

### Legenda Complexidade
- **A (Alta)** / **M (Média)** / **B (Baixa)** — ver [planilha-custos-v2.md](../visao-roi/planilha-custos-v2.md) para estimativa de horas por papel.

## Requisitos Não-Funcionais

### De R1 (requisitos-v1.md)
| ID | Categoria | Descrição | Origem | Status |
|---|---|---|---|---|
| RNF01 | Responsividade | Sistema deve funcionar em desktop e dispositivos móveis (tablet e celular) | R1 | Confirmado |
| RNF02 | Segurança | Controle de acesso por perfil; dados de paciente protegidos conforme LGPD | R1 | Confirmado |
| RNF03 | Desempenho | Suportar os 12 consultórios operando simultaneamente sem degradação | R1 | Confirmado (limites quantitativos a definir em R2) |
| RNF04 | Usabilidade | Interface intuitiva para usuários não técnicos (atendentes e pacientes) | R1 | Confirmado |

### Regras inegociáveis (internas, aplicam-se como RNF)
| ID | Descrição | Categoria | Origem | Status |
|---|---|---|---|---|
| RNF-101 | Valores monetários em inteiro de centavos OU Decimal — nunca float/double | Confiabilidade | Regra interna | Confirmado |
| RNF-102 | Audit log em toda alteração financeira (user_id, timestamp, entidade, campo, valor antes/depois, motivo) | Rastreabilidade | Regra interna | Confirmado |
| RNF-103 | Cálculo de repasse exclusivamente no servidor; nunca no front-end | Segurança | Regra interna | Confirmado |
| RNF-104 | Todo cálculo financeiro coberto por teste unitário antes de merge | Qualidade | Regra interna | Confirmado |
| RNF-105 | Dados clínicos de pacientes fora do MVP (redução de risco LGPD) | LGPD | Regra interna | Confirmado |
| RNF-106 | Dados pessoais mínimos apenas com justificativa de requisito explícito | LGPD | Regra interna | Confirmado |

## Critérios de qualidade de cada requisito
Todo requisito deve ser: **não-ambíguo, verificável, consistente, rastreável e com fonte identificada.**
Se qualquer critério falhar, o requisito volta como pendência para a próxima reunião.

## Resumo
- **5 atores** confirmados
- **28 RF oficiais** (R1, sem FI09) + **6 RF de controle de acesso** (equipe) + **3 RF propostos de auth paciente (RF-027/028/029)** + **1 RF proposto de pagamento presencial promovido (FI10)** + **5 RF propostos de fluxo operacional (AG08, AG09, AT05, AT06, FI11)** = **34 confirmados + 9 propostos** (FI09 marcado como removido proposto, pendente confirmação cliente)
- **4 RNF oficiais** + **6 RNF internos (regras inegociáveis)** = **10 RNF**
- Limites quantitativos de RNF03 (tempo de resposta, disponibilidade) **pendentes — R2**
- Campos do prontuário (AT03) **pendentes — R2**
- Auto-cadastro e Google OAuth do paciente **propostos — validar em R2** (PEND-023, PEND-024, PEND-025)
- **FI09 (pagamento online)** removido proposto (DEC-E09) — pendente confirmação cliente em R2 (PEND-045). FI10 promovido a único modelo de pagamento.

## Última atualização: 2026-05-07 (FI09 removido proposto via DEC-E09; FI10 promovido a único modelo de pagamento)
