# Ata de Reunião R1 — 06/04/2026

ClinicaShare

Ata de Reunião  Reunião Inicial (R1)


| Data | 09 de abril de 2026 |
|---|---|
| Local | Clínica do Dr. Edson Andrade |
| Participantes | Dr. Edson Andrade (cliente)  Equipe ClinicaShare (desenvolvimento) |
| Objetivo | Levantamento inicial de requisitos e entendimento do negócio |
| Responsável pela ata | Equipe ClinicaShare |


## 1. Contexto do Negócio

A clínica do Dr. Edson é uma clínica multiprofissional que disponibiliza consultórios para profissionais de saúde autônomos (médicos, psicólogos, fisioterapeutas e outros). O Dr. Edson atua como proprietário do espaço e não como médico gestor dos pacientes.


## 1.1 Estrutura Física

A clínica possui 12 consultórios

Consultórios possuem características diferentes (equipamentos, iluminação, layout) conforme a especialidade

Alguns consultórios são específicos para determinadas especialidades (ex: oftalmologia com equipamentos fixos)

O horário de funcionamento da clínica é das 7h às 19h/20h


## 1.2 Modelo de Negócio

Existem duas modalidades de contrato entre o Dr. Edson e os profissionais:


| Modalidade | Descrição | Observação |
|---|---|---|
| Aluguel fixo | Profissional paga valor fixo por turno utilizado | Receita previsível, menor valor |
| Percentual | Dr. Edson recebe % sobre cada consulta/procedimento realizado | Maior potencial, negociado individualmente por profissional |

A modalidade é definida por negociação individual com cada profissional. O percentual varia por profissional e é acordado no momento da contratação.

Um mesmo profissional pode alugar mais de um turno no mesmo dia, podendo ocupar consultórios diferentes entre os turnos. Os turnos são fixos (definidos pela clínica).


## 2. Situação Atual (Processo Manual)


## 2.1 Agendamento

Pacientes ligam para a clínica, para o médico ou para o atendente do médico (sem canal centralizado)

Secretária usa caderno e WhatsApp para registrar agendamentos

Alguns médicos usam planilha Excel própria, outros WhatsApp, outros sistemas externos


## 2.2 Financeiro

Controle financeiro é feito em planilha Excel por um auxiliar administrativo

Dr. Edson não tem visibilidade clara sobre quem pagou, quem está em aberto e o total de repasses devidos

Ele confia 100% no que o auxiliar registra, sem forma de validar

Suspeita que consultas e procedimentos extras (ex: ultrassom) podem ocorrer sem registro e sem repasse


## 2.3 Atendentes

Cada médico pode ter atendente próprio ou usar o atendente compartilhado da clínica

O atendente compartilhado também é um serviço remunerado (pago pelo profissional à clínica)

Não há padronização no fluxo de registro entre os profissionais


## 3. Decisões e Definições da Reunião


| # | Decisão / Definição | Status | Responsável |
|---|---|---|---|
| 1 | Sistema terá módulo de agendamento online para pacientes | Confirmado | Dr. Edson |
| 2 | Prestação de contas passará a ser semanal (hoje é mensal) | Confirmado | Dr. Edson |
| 3 | Sistema deve registrar consultas E procedimentos extras (ultrassom, exames) | Confirmado | Dr. Edson |
| 4 | Auxiliar financeiro será integrado ao sistema (não eliminado) | Confirmado | Dr. Edson |
| 5 | Prontuário eletrônico será incluído no sistema; modelo ainda a definir | Em aberto | Dr. Edson |
| 6 | IA para envio de lembretes de consulta (WhatsApp) é funcionalidade desejada | Confirmado | Dr. Edson |
| 7 | Cancelamento não terá taxa; sistema registrará motivo do cancelamento | Confirmado | Dr. Edson |


## 4. Pontos em Aberto: A Confirmar


| # | Questão em aberto | Impacto no sistema |
|---|---|---|
| 1 | Quais campos mínimos o prontuário eletrônico deve ter | Modelagem do banco de dados e escopo do módulo clínico |
| 2 | Quais turnos existem e seus horários exatos | Regra de agendamento e controle de ocupação de consultórios |
| 3 | Como será definido o consultório alocado por turno para cada profissional | Lógica de alocação e conflito de salas |
| 4 | Integração com prontuários externos já utilizados pelos médicos (via API) | Aumenta escopo e custo; decisão crítica para o orçamento |
| 5 | Há dados existentes (planilhas) que precisam ser migrados para o novo sistema | Necessidade de script de importação e validação de dados |
