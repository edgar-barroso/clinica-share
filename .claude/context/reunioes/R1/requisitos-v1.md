# Documento de Requisitos v1.0 — pós-R1

ClinicaShare

Documento de Requisitos Versão 1.0


| Versão | 1.0  Pós Reunião R1 |
|---|---|
| Data base | 09 de abril de 2026 |
| Status | Em levantamento, sujeito a alterações após R2 |


## 1. Visão Geral do Sistema

O ClinicaShare é uma plataforma web de gestão para clínicas multiprofissionais. Seu objetivo principal é centralizar o controle de agendamentos, registros de atendimentos, procedimentos e repasses financeiros, eliminando o controle manual por planilha e garantindo transparência para o proprietário da clínica.


## 2. Atores do Sistema


| Ator | Descrição | Nível de acesso esperado |
|---|---|---|
| Dr. Edson (Administrador) | Proprietário da clínica. Visão completa de financeiro, consultórios e profissionais | Total |
| Auxiliar Financeiro | Responsável pelo fechamento financeiro semanal e registro de pagamentos | Financeiro (restrito) |
| Profissional de Saúde (Médico / Psicólogo / etc.) | Acessa agenda própria, registra atendimentos e procedimentos | Próprios dados |
| Atendente do Profissional | Gerencia agenda do profissional vinculado, confirma consultas | Agenda do profissional vinculado |
| Paciente | Agenda consultas online, recebe lembretes, cancela agendamentos | Próprios agendamentos |


## 3. Requisitos Funcionais


## 3.1 Módulo de Agendamento


| ID | Requisito | Prioridade | Origem |
|---|---|---|---|
| AG01 | Paciente pode agendar consulta online via portal web | Alta | R1 |
| AG02 | Atendente pode agendar consulta em nome do paciente pelo sistema | Alta | R1 |
| AG03 | Sistema respeita turnos fixos e horários definidos por profissional | Alta | R1 |
| AG04 | Duração da consulta é configurável por profissional | Alta | R1 |
| AG05 | Sistema impede conflito de horário no mesmo consultório | Alta | R1 |
| AG06 | Paciente pode cancelar agendamento pelo sistema com registro de motivo | Média | R1 |
| AG07 | IA envia lembrete de consulta via WhatsApp: 2 dias antes, 1 dia antes e no dia | Média | R1 |


## 3.2 Módulo de Consultórios


| ID | Requisito | Prioridade | Origem |
|---|---|---|---|
| CO01 | Sistema cadastra os 12 consultórios com suas características (tipo, equipamentos) | Alta | R1 |
| CO02 | Cada consultório é vinculado a turnos específicos por profissional | Alta | R1 |
| CO03 | Profissional pode alocar mais de um turno por dia em consultórios diferentes | Alta | R1 |
| CO04 | Dashboard mostra ocupação de consultórios por período (qual gera mais receita) | Alta | R1 |


## 3.3 Módulo Financeiro


| ID | Requisito | Prioridade | Origem |
|---|---|---|---|
| FI01 | Sistema cadastra contrato por profissional (modalidade: aluguel fixo ou percentual) | Alta | R1 |
| FI02 | Percentual de repasse é configurável individualmente por profissional | Alta | R1 |
| FI03 | Sistema calcula automaticamente o repasse devido por profissional com base nos atendimentos registrados | Alta | R1 |
| FI04 | Repasse inclui consultas E procedimentos extras realizados no atendimento | Alta | R1 |
| FI05 | Sistema registra status de pagamento de cada atendimento (pago / pendente / gratuito) | Alta | R1 |
| FI06 | Descontos concedidos são registrados com justificativa e visíveis ao administrador | Alta | R1 |
| FI07 | Fechamento financeiro é semanal; sistema gera relatório de prestação de contas por período | Alta | R1 |
| FI08 | Sistema registra aluguel fixo por turno utilizado por profissional | Alta | R1 |
| FI09 | Paciente pode pagar via Pix, cartão ou boleto no momento do agendamento online | Média | R1 |


## 3.4 Módulo de Atendimentos e Prontuário


| ID | Requisito | Prioridade | Origem |
|---|---|---|---|
| AT01 | Cada atendimento realizado deve ser registrado no sistema (data, profissional, paciente, consultório) | Alta | R1 |
| AT02 | Procedimentos extras realizados no atendimento devem ser registrados individualmente | Alta | R1 |
| AT03 | Sistema possui prontuário eletrônico integrado (campos a definir em R2) | Alta | R1 |
| AT04 | Se profissional usar prontuário externo, o sistema registra a ocorrência do atendimento para fins financeiros | Média | R1 |


## 3.5 Módulo de Relatórios e Dashboard


| ID | Requisito | Prioridade | Origem |
|---|---|---|---|
| RE01 | Dashboard do administrador exibe receita total, repasses em aberto e repasses pagos | Alta | R1 |
| RE02 | Relatório financeiro filtrável por profissional, consultório e período | Alta | R1 |
| RE03 | Sistema exibe ranking de consultórios por receita gerada | Alta | R1 |
| RE04 | Relatório lista consultas gratuitas (desconto total) por período | Média | R1 |
| RE05 | Relatório de cancelamentos com motivos registrados pelos pacientes | Média | R1 |


## 4. Requisitos Não Funcionais


| ID | Categoria | Requisito |
|---|---|---|
| RNF01 | Responsividade | Sistema deve funcionar em desktop e dispositivos móveis (tablet e celular) |
| RNF02 | Segurança | Controle de acesso por perfil; dados de paciente protegidos conforme LGPD |
| RNF03 | Desempenho | Suportar os 12 consultórios operando simultaneamente sem degradação |
| RNF04 | Usabilidade | Interface intuitiva para usuários não técnicos (atendentes e pacientes) |


## 5. Riscos e Pontos de Atenção


| # | Risco | Nível | Mitigação sugerida |
|---|---|---|---|
| R1 | Médicos resistirem a registrar procedimentos no sistema (perda de controle sobre repasse) | Alto | Tornar o registro obrigatório para liberar o consultório no próximo turno |
| R2 | Integração com prontuários externos aumentar custo e prazo significativamente | Alto | Definir como fora do MVP; entregar prontuário próprio primeiro |
| R3 | Prontuário eletrônico sem definição de escopo pode travar o desenvolvimento | Médio | Definir campos mínimos na R2 antes de iniciar modelagem |
| R4 | Lembrete por IA via WhatsApp depende de API do WhatsApp Business (custo e aprovação) | Médio | Avaliar custo da API na proposta e apresentar ao cliente |
| R5 | Falta de padronização atual pode dificultar migração de dados históricos | Médio | Verificar existência e formato das planilhas atuais na R2 |
