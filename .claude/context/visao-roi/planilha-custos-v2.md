# Planilha de Custos — v2 (2026-04-16)

> **Atualização 2026-05-07:** FI09 marcado como **REMOVIDO PROPOSTO** via DEC-E09 — pagamento online (PIX/cartão/boleto) sai do escopo, substituído por pagamento exclusivamente presencial. Pendente confirmação do cliente em R2 (PEND-045). Totais abaixo **não foram recalculados** — aguardam aprovação. Se aprovado: −19h totais (−R$ 2.053,125 custo, −R$ 2.566,41 com lucro), totalizando 299h e R$ 35.657,81 ao cliente.

## Aba: CUSTOS

| ClinicaShare |  |  |  |  |  |  |  |  |
|---|---|---|---|---|---|---|---|---|
| Sistema de Gestão para Clínica Multiprofissional |  |  |  |  |  |  |  |  |
| PLANILHA DE CUSTOS |  |  |  |  |  |  |  |  |
| Macro Requisitos (Casos de Uso) | Complexidade (A/M/B) | Gerente de Projetos | Analista | Desenvolvedor | Web Design | DBA | Custo Total | Observação de Reuso |
| MÓDULO DE AGENDAMENTO |  |  |  |  |  |  |  |  |
| [AG01] Paciente agenda consulta online (portal web) | A | 2.0 | 4.0 | 10.0 | 4.0 | 2.0 | 2278.125 | Base do módulo — custo cheio |
| [AG02] Atendente agenda consulta em nome do paciente | B | 1.0 | 1.0 | 2.0 | 1.0 | 0.0 | 461.25 | Reusa UI e lógica de AG01 |
| [AG03] Configuração de turnos fixos e horários por profissional | M | 1.0 | 2.0 | 7.0 | 2.0 | 1.0 | 1157.8125 | CRUD novo |
| [AG04] Configuração de duração de consulta por profissional | B | 0.0 | 1.0 | 1.0 | 0.0 | 0.0 | 146.25 | Campo extra no CRUD de AG03 |
| [AG05] Bloqueio automático de conflito de horário e consultório | A | 1.0 | 2.0 | 8.0 | 0.0 | 2.0 | 1406.25 | Lógica crítica — sem reuso |
| [AG06] Cancelamento de consulta com registro obrigatório de motivo | B | 0.0 | 1.0 | 2.0 | 1.0 | 0.0 | 281.25 | Extensão de AG01 |
| [AG07] Envio de lembrete automático via WhatsApp por IA | A | 2.0 | 3.0 | 10.0 | 1.0 | 1.0 | 1870.3125 | Integração API externa |
| MÓDULO DE CONSULTÓRIOS |  |  |  |  |  |  |  |  |
| [CO01] Cadastro dos 12 consultórios com tipo e equipamentos | B | 1.0 | 1.0 | 3.0 | 2.0 | 1.0 | 686.25 | CRUD reusa padrão de AG03 |
| [CO02] Alocação de profissional por turno fixo | M | 1.0 | 2.0 | 7.0 | 1.0 | 2.0 | 1194.375 | Lógica de vínculo nova |
| [CO03] Profissional pode alocar múltiplos turnos em consultórios dif. | B | 0.0 | 1.0 | 1.0 | 0.0 | 1.0 | 236.25 | Extensão de CO02 |
| [CO04] Dashboard de ocupação e receita por consultório | M | 1.0 | 2.0 | 8.0 | 3.0 | 1.0 | 1304.0625 | Componentes visuais reusáveis |
| MÓDULO DE ATENDIMENTOS E PRONTUÁRIO |  |  |  |  |  |  |  |  |
| [AT01] Registro de atendimento realizado (data, profissional, consul.) | M | 1.0 | 2.0 | 5.0 | 2.0 | 2.0 | 1084.6875 | Formulário novo c/ lógica financeira |
| [AT02] Registro de procedimentos adicionais por atendimento | B | 0.0 | 1.0 | 2.0 | 1.0 | 1.0 | 371.25 | Campo extra no form de AT01 |
| [AT03] Prontuário eletrônico integrado (campos a definir na R2) | A | 2.0 | 4.0 | 12.0 | 3.0 | 3.0 | 2517.1875 | Escopo indefinido — estimativa conservadora |
| [AT04] Registro de ocorrência para profissionais com prontuário ext. | B | 0.0 | 1.0 | 1.0 | 0.0 | 0.0 | 146.25 | Campo flag no form de AT01 |
| MÓDULO FINANCEIRO |  |  |  |  |  |  |  |  |
| [FI01] Cadastro de contrato por profissional (aluguel ou percentual) | M | 1.0 | 2.0 | 5.0 | 1.0 | 2.0 | 1023.75 | Novo domínio financeiro |
| [FI02] Configuração de percentual individual por profissional | B | 0.0 | 1.0 | 1.0 | 0.0 | 0.0 | 146.25 | Campo no CRUD de FI01 |
| [FI03] Cálculo automático de repasse por profissional | A | 2.0 | 4.0 | 12.0 | 0.0 | 3.0 | 2306.25 | Core do sistema — sem atalho |
| [FI04] Repasse inclui consultas e procedimentos extras registrados | M | 1.0 | 2.0 | 4.0 | 0.0 | 1.0 | 780 | Extensão da lógica de FI03 |
| [FI05] Registro de status de pagamento (pago, pendente, gratuito) | B | 0.0 | 1.0 | 1.0 | 0.0 | 1.0 | 236.25 | Campo + lógica em AT01/FI03 |
| [FI06] Registro de descontos com justificativa | B | 0.0 | 1.0 | 2.0 | 0.0 | 0.0 | 225 | Campo + validação no AT01 |
| [FI07] Fechamento financeiro semanal com relatório de prestação de c. | M | 1.0 | 2.0 | 8.0 | 2.0 | 2.0 | 1340.625 | Agregação + relatório |
| [FI08] Registro de aluguel fixo por turno utilizado por profissional | B | 0.0 | 1.0 | 1.0 | 0.0 | 1.0 | 236.25 | Variação do modelo de FI01 |
| ~~[FI09] Pagamento online pelo paciente: Pix, cartão, boleto~~ | ~~A~~ | ~~2.0~~ | ~~3.0~~ | ~~10.0~~ | ~~2.0~~ | ~~2.0~~ | ~~2053.125~~ | **REMOVIDO PROPOSTO (DEC-E09) — pendente PEND-045** |
| MÓDULO DE RELATÓRIOS E DASHBOARD |  |  |  |  |  |  |  |  |
| [RE01] Dashboard admin: receita total, repasses em aberto e pagos | A | 2.0 | 3.0 | 8.0 | 4.0 | 1.0 | 1884.375 | Componentes visuais base |
| [RE02] Relatório financeiro com filtros por profissional e período | M | 1.0 | 2.0 | 4.0 | 2.0 | 1.0 | 901.875 | Reusa componentes de RE01 |
| [RE03] Ranking de consultórios por receita gerada | B | 0.0 | 1.0 | 1.0 | 1.0 | 1.0 | 292.5 | Query nova, visual reutilizado |
| [RE04] Relatório de consultas gratuitas e descontos | B | 0.0 | 1.0 | 1.0 | 1.0 | 0.0 | 202.5 | Filtro no relatório de RE02 |
| [RE05] Relatório de cancelamentos com motivos registrados | B | 0.0 | 1.0 | 1.0 | 1.0 | 0.0 | 202.5 | Mesma estrutura de RE04 |
| MÓDULO DE AUTENTICAÇÃO E CONTROLE DE ACESSO |  |  |  |  |  |  |  |  |
| [RF-021] Autenticação de usuário com e-mail e senha | M | 1.0 | 2.0 | 6.0 | 2.0 | 0.0 | 975 | Base do módulo — custo cheio |
| [RF-022] Controle de acesso por perfil (Adm, Aux, Profissional, Atendente, Paciente) | A | 2.0 | 3.0 | 8.0 | 1.0 | 1.0 | 1673.4375 | Lógica de autorização nova |
| [RF-023] Profissional não acessa dados ou agenda de outro profissional | M | 1.0 | 2.0 | 2.0 | 0.0 | 1.0 | 609.375 | Filtro por user_id nas queries |
| [RF-024] Encerramento automático de sessão após inatividade | B | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0 | Config no middleware de auth |
| [RF-025] Registro do user_id autenticado em todo audit log financeiro | B | 0.0 | 1.0 | 0.0 | 0.0 | 0.0 | 67.5 | Já previsto na regra inegociável |
| [RF-026] Recuperação de senha via e-mail | B | 0.0 | 1.0 | 2.0 | 1.0 | 0.0 | 281.25 | Reusa estrutura de RF-021 |
| TOTAL DE HORAS TRABALHADAS |  | 27 | 62 | 156 | 39 | 34 | 30579.375 | Custo do projeto para a empresa |
|  |  | 318 Horas |  |  |  |  |  |  |
|  |  |  |  | CUSTO TOTAL COM LUCRO DE 25% |  |  | 38224.21875 | Valor cobrado ao cliente |
| VALOR POR HORA TRABALHADA |  |  |  |  |  |  |  |  |
| Cargo | Normal (160h por mês) | Valores com acréscimo |  |  | Salário Mensal Base |  |  |  |
|  |  | Nível Baixo - 20% | Nível Médio - 30% | Nível Alto - 50% |  |  |  |  |
| Gerente de Projetos | 150 | 180 | 195 | 225 | 16000.0 |  |  |  |
| Analista de Sistemas | 56.25 | 67.5 | 73.125 | 84.375 | 6000.0 |  |  |  |
| Desenvolvedor | 65.625 | 78.75 | 85.3125 | 98.4375 | 7000.0 |  |  |  |
| Web Design | 46.875 | 56.25 | 60.9375 | 70.3125 | 5000.0 |  |  |  |
| Administrador de BD | 75 | 90 | 97.5 | 112.5 | 8000.0 |  |  |  |
| Valores em acordo com o salário base dos funcionários |  |  |  |  |  |  |  |  |
