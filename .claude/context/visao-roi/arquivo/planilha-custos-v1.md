# Planilha de Custos — v1 (2026-04-13, obsoleto)


## Aba: CUSTOS

| ClinicaShare(Ficticio) |  |  |  |  |  |  |  |  |
|---|---|---|---|---|---|---|---|---|
| Sistema de Gestão para Clínica Multiprofissional |  |  |  |  |  |  |  |  |
| PLANILHA DE CUSTOS |  |  |  |  |  |  |  |  |
| Macro Requisitos (Casos de Uso) | Complexidade (A/M/B) | Gerente de Projetos | Analista | Desenvolvedor | Web Design | DBA | Custo Total |  |
| MÓDULO DE AGENDAMENTO |  |  |  |  |  |  |  |  |
| [AG01] Paciente agenda consulta online (portal web) | A | 2.0 | 2.0 | 5.0 | 2.0 | 2.0 | 1476.5625 |  |
| [AG02] Atendente agenda consulta em nome do paciente | M | 1.0 | 1.0 | 3.0 | 1.0 | 1.0 | 682.5 |  |
| [AG03] Configuração de turnos fixos e horários por profissional | M | 1.0 | 1.0 | 4.0 | 1.0 | 2.0 | 865.3125 |  |
| [AG04] Configuração de duração de consulta por profissional | B | 1.0 | 1.0 | 2.0 | 1.0 | 1.0 | 551.25 |  |
| [AG05] Bloqueio automático de conflito de horário e consultório | A | 1.0 | 1.0 | 5.0 | 1.0 | 3.0 | 1209.375 |  |
| [AG06] Cancelamento de consulta com registro obrigatório de motivo | B | 1.0 | 1.0 | 2.0 | 1.0 | 1.0 | 551.25 |  |
| [AG07] Envio de lembrete automático via WhatsApp por IA | A | 2.0 | 2.0 | 7.0 | 1.0 | 2.0 | 1603.125 |  |
| MÓDULO DE CONSULTÓRIOS |  |  |  |  |  |  |  |  |
| [CO01] Cadastro dos 12 consultórios com tipo e equipamentos | B | 1.0 | 1.0 | 2.0 | 2.0 | 1.0 | 607.5 |  |
| [CO02] Alocação de profissional por turno fixo | M | 1.0 | 2.0 | 4.0 | 1.0 | 2.0 | 938.4375 |  |
| [CO03] Profissional pode alocar múltiplos turnos em consultórios diferentes | M | 1.0 | 1.0 | 3.0 | 1.0 | 2.0 | 780 |  |
| [CO04] Dashboard de ocupação e receita por consultório | A | 2.0 | 2.0 | 5.0 | 4.0 | 2.0 | 1617.1875 |  |
| MÓDULO DE ATENDIMENTOS E PRONTUÁRIO |  |  |  |  |  |  |  |  |
| [AT01] Registro de atendimento realizado (data, profissional, consultório) | B | 1.0 | 1.0 | 3.0 | 2.0 | 2.0 | 776.25 |  |
| [AT02] Registro de procedimentos adicionais por atendimento | M | 1.0 | 2.0 | 4.0 | 2.0 | 2.0 | 999.375 |  |
| [AT03] Prontuário eletrônico integrado (campos a definir na R2) | A | 2.0 | 3.0 | 8.0 | 2.0 | 2.0 | 1856.25 |  |
| [AT04] Registro de ocorrência para profissionais com prontuário externo | B | 1.0 | 1.0 | 2.0 | 1.0 | 1.0 | 551.25 |  |
| MÓDULO FINANCEIRO |  |  |  |  |  |  |  |  |
| [FI01] Cadastro de contrato por profissional (aluguel ou percentual) | M | 1.0 | 2.0 | 4.0 | 1.0 | 3.0 | 1035.9375 |  |
| [FI02] Configuração de percentual individual por profissional | B | 1.0 | 1.0 | 2.0 | 1.0 | 2.0 | 641.25 |  |
| [FI03] Cálculo automático de repasse por profissional | A | 2.0 | 2.0 | 7.0 | 1.0 | 4.0 | 1828.125 |  |
| [FI04] Repasse inclui consultas e procedimentos extras registrados | A | 2.0 | 2.0 | 6.0 | 1.0 | 4.0 | 1729.6875 |  |
| [FI05] Registro de status de pagamento (pago, pendente, gratuito) | B | 1.0 | 1.0 | 3.0 | 1.0 | 2.0 | 720 |  |
| [FI06] Registro de descontos com justificativa | B | 1.0 | 1.0 | 2.0 | 1.0 | 1.0 | 551.25 |  |
| [FI07] Fechamento financeiro semanal com relatório de prestação de contas | M | 1.0 | 2.0 | 5.0 | 2.0 | 3.0 | 1182.1875 |  |
| [FI08] Registro de aluguel fixo por turno utilizado por profissional | M | 1.0 | 1.0 | 3.0 | 1.0 | 2.0 | 780 |  |
| [FI09] Pagamento online pelo paciente: Pix, cartão, boleto | A | 2.0 | 2.0 | 7.0 | 2.0 | 3.0 | 1785.9375 |  |
| MÓDULO DE RELATÓRIOS E DASHBOARD |  |  |  |  |  |  |  |  |
| [RE01] Dashboard admin: receita total, repasses em aberto e pagos | A | 2.0 | 2.0 | 6.0 | 2.0 | 2.0 | 1575 |  |
| [RE02] Relatório financeiro com filtros por profissional e período | M | 1.0 | 2.0 | 4.0 | 1.0 | 2.0 | 938.4375 |  |
| [RE03] Ranking de consultórios por receita gerada | M | 1.0 | 1.0 | 3.0 | 1.0 | 2.0 | 780 |  |
| [RE04] Relatório de consultas gratuitas e descontos | B | 1.0 | 1.0 | 2.0 | 1.0 | 1.0 | 551.25 |  |
| [RE05] Relatório de cancelamentos com motivos registrados | B | 1.0 | 1.0 | 2.0 | 1.0 | 1.0 | 551.25 |  |
| TOTAL DE HORAS TRABALHADAS |  | 37 | 43 | 115 | 40 | 58 | 29715.9375 | Custo do projeto para a empresa |
|  |  | 293 Horas |  |  |  |  |  |  |
|  |  |  |  | CUSTO TOTAL COM LUCRO DE 25% |  |  | 37144.92188 | Valor cobrado ao cliente |
| VALOR POR HORA TRABALHADA |  |  |  |  |  |  |  |  |
| Cargo | Normal (160h por mês) | Valores com acréscimo |  |  | Salário Mensal Base |  |  |  |
|  |  | Nível Baixo - 20% | Nível Médio - 30% | Nível Alto - 50% |  |  |  |  |
| Gerente de Projetos | 150 | 180 | 195 | 225 | 16000.0 |  |  |  |
| Analista de Sistemas | 56.25 | 67.5 | 73.125 | 84.375 | 6000.0 |  |  |  |
| Desenvolvedor | 65.625 | 78.75 | 85.3125 | 98.4375 | 7000.0 |  |  |  |
| Web Design | 46.875 | 56.25 | 60.9375 | 70.3125 | 5000.0 |  |  |  |
| Administrador de BD | 75 | 90 | 97.5 | 112.5 | 8000.0 |  |  |  |
| Valores em acordo com o salário base dos funcionários |  |  |  |  |  |  |  |  |
