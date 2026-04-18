# Documento de Visão ROI — v1 (2026-04-13, obsoleto)

Projeto ClinicaShare

Visão e Retorno sobre o Investimento (ROI)

Versão 1.0

Histórico da Revisão


| Data | Versão | Descrição | Autor |
|---|---|---|---|
| 12/04/2026 | 1.0 | Construção da primeira versão do documento, a partir dos dados colhidos com a reunião com o cliente. | David - Gerente de projetos; Guilherme - DBA; Edgar - Dev e Web Design; Leonardo - Analista. |

Índice Analítico

VISÃO

1.  Introdução

1. Finalidade

2.  Posicionamento

1. Descrição do Problema

2. Sentença de Posição do Produto

3.  Descrições dos Envolvidos e dos Usuários

1. Resumo dos Envolvidos

2. Resumo dos Usuários

3. Ambiente do Usuário

4. Principais Necessidades dos Usuários ou dos Envolvidos

5. Alternativas e Concorrência

4.  Visão Geral do Produto

1. Perspectiva do Produto

2. Custo e Preço

5.  Recursos do Produto

RETORNO SOBRE O INVESTIMENTO (ROI)

6.  Tabela de Gastos do Cliente

7.  Cálculo do ROI

Visão


## 1. Introdução

A finalidade deste documento é coletar, analisar e definir as características e necessidades de alto nível do sistema ClinicaShare — plataforma de gestão para clínica multiprofissional. Ele se concentra nos recursos necessários aos envolvidos e aos usuários-alvo e nas razões que levam a essas necessidades. Os detalhes de como o ClinicaShare atinge essas necessidades são descritos nos casos de uso e nas especificações suplementares.


## 1.1 Finalidade

A finalidade deste documento é definir os requisitos de alto nível em termos de necessidades dos usuários finais, apresentar o posicionamento do produto e demonstrar o retorno financeiro esperado sobre o investimento.


## 2. Posicionamento


## 2.1 Descrição do Problema


| O problema de | A gestão de repasses financeiros é feita manualmente, de forma descentralizada, sem rastreabilidade. Consultas e procedimentos podem ser realizados sem registro, impedindo o cálculo correto dos repasses devidos ao proprietário da clínica. |
|---|---|
| afeta | O Dr. Edson Andrade (proprietário), que não possui visibilidade real sobre receitas, repasses pagos, repasses em aberto e inadimplências. |
| cujo impacto é | Perda financeira não quantificada por ausência de registros; impossibilidade de auditar consultas e procedimentos realizados; dependência total da integridade do auxiliar financeiro; ausência de base de dados para decisões estratégicas. |
| uma boa solução seria | Um sistema centralizado onde todos os atendimentos, procedimentos e pagamentos são registrados, os repasses calculados automaticamente e o proprietário tenha visão financeira consolidada em tempo real. |


## 2.2 Sentença de Posição do Produto


| Para | Dr. Edson Andrade (proprietário da clínica) e os profissionais de saúde que utilizam os consultórios. |
|---|---|
| que | Precisam de controle financeiro preciso, rastreabilidade de atendimentos e visibilidade consolidada dos repasses devidos. |
| O ClinicaShare | É uma plataforma web de gestão multiprofissional que centraliza agendamentos, registros de atendimentos, cálculo automático de repasses e geração de relatórios financeiros. |
| que | Elimina o controle manual por planilhas, garante que nenhum atendimento ou procedimento fique sem registro e entrega ao proprietário visão financeira em tempo real. |
| Ao contrário de | Planilhas Excel gerenciadas manualmente por um auxiliar financeiro, sem padronização, sem rastreabilidade e sem alertas de inconsistências. |
| Nosso produto | Além de centralizar o agendamento e o registro de atendimentos, calcula automaticamente os repasses por profissional, consolida o fechamento financeiro semanal e gera relatórios gerenciais por consultório e período. |

3. Descrições dos Envolvidos e dos Usuários

A clínica do Dr. Edson é uma clínica multiprofissional com 12 consultórios, atendendo médicos, psicólogos, fisioterapeutas e outros profissionais autônomos. O Dr. Edson disponibiliza consultórios por duas modalidades: aluguel fixo por turno ou percentual sobre as consultas. O controle financeiro é hoje feito por um auxiliar administrativo via planilha Excel.


## 3.1 Resumo dos Envolvidos


| Nome | Descrição | Responsabilidade |
|---|---|---|
| Dr. Edson Andrade | Proprietário da clínica multiprofissional. | Aprovar funcionalidades, definir regras de negócio e validar entregas. |
| Auxiliar Financeiro | Responsável pelo fechamento financeiro atual via Excel. | Operar o módulo financeiro, registrar pagamentos e gerar relatórios semanais. |
| Equipe DevsTech | Equipe de desenvolvimento do sistema. | Levantar requisitos, desenvolver, testar e entregar o sistema em 3 meses. |


## 3.2 Resumo dos Usuários


| Nome | Descrição | Responsabilidades | Envolvido |
|---|---|---|---|
| Administrador (Dr. Edson) | Usuário com acesso total ao sistema. | Visualizar financeiro consolidado, configurar contratos e consultórios, acessar relatórios. | Auto-representado |
| Auxiliar Financeiro | Usuário do módulo financeiro. | Registrar pagamentos, confirmar repasses e gerar relatórios de fechamento semanal. | Auto-representado |
| Profissional de Saúde | Médico, psicólogo, fisioterapeuta ou outro. | Acessar agenda própria, registrar atendimentos e procedimentos realizados. | Auto-representado |
| Atendente do Profissional | Secretária vinculada a um ou mais profissionais. | Gerenciar agenda do profissional, agendar, confirmar e cancelar consultas. | Auto-representado |
| Paciente | Usuário final que agenda e utiliza os serviços da clínica. | Agendar consultas online, receber lembretes automáticos e cancelar com registro de motivo. | Auto-representado |


## 3.3 Ambiente do Usuário


### 3.3.1 Ambiente do Administrador

O Dr. Edson acessará o sistema preferencialmente via desktop para análise financeira. Necessita de visão consolidada rápida ao iniciar o dia e relatório semanal de fechamento.


### 3.3.2 Ambiente do Auxiliar Financeiro

Usará o sistema diariamente em desktop para confirmar pagamentos e manter o financeiro atualizado. Atualmente opera via Excel sem padronização.


### 3.3.3 Ambiente dos Profissionais e Atendentes

Profissionais acessarão agenda e prontuário durante o atendimento via tablet ou notebook. Atendentes gerenciarão agendamentos via desktop ou smartphone, podendo ser compartilhados entre profissionais.


### 3.3.4 Ambiente do Paciente

Acesso exclusivo ao portal web de agendamento via smartphone ou computador, além de receber lembretes automáticos via WhatsApp.


## 3.4 Principais Necessidades dos Usuários ou dos Envolvidos


| Necessidade | Prioridade | Preocupações | Solução Atual | Soluções Propostas |
|---|---|---|---|---|
| Saber quanto cada profissional deve repassar e o que foi pago | Alta | Inadimplências sem controle | Planilha Excel manual | Dashboard financeiro com cálculo automático de repasses. |
| Garantir que todo atendimento e procedimento seja registrado | Alta | Procedimentos extras não registrados | Confiança total no auxiliar sem auditoria | Registro obrigatório vinculado ao cálculo de repasse. |
| Fechar o financeiro semanalmente de forma estruturada | Alta | Consolidação manual sujeita a erros | Consolidação manual Excel | Fechamento semanal automatizado com relatório exportável. |
| Agendar consultas de forma centralizada | Alta | Conflitos de horário e salas | WhatsApp, caderno e sistemas individuais | Portal de agendamento online + interface interna. |
| Identificar qual consultório gera mais receita | Média | Ausência de dado histórico | Nenhuma solução atual | Ranking de consultórios por receita no período. |


## 3.5 Alternativas e Concorrência

As principais alternativas disponíveis no mercado são sistemas como iClinic, Nuvem Saúde e Doctoralia. Contudo, esses sistemas são voltados para clínicas de único proprietário ou redes de grande porte, não atendendo ao modelo de coworking médico com múltiplas modalidades de contrato, aluguel fixo por turno e percentual variável negociado individualmente por profissional, que é o diferencial central do ClinicaShare.


## 4. Visão Geral do Produto


## 4.1 Perspectiva do Produto

O ClinicaShare é uma solução proprietária desenvolvida pela DevsTech para a clínica do Dr. Edson Andrade. O sistema centraliza e automatiza a gestão operacional e financeira da clínica, eliminando o controle por planilha e garantindo que nenhum atendimento ou procedimento fique sem registro. A plataforma atenderá cinco perfis de usuário com níveis de acesso distintos, operando em ambiente web responsivo (desktop, tablet e celular), sem necessidade de instalação local.


## 4.2 Custo e Preço

O sistema custará à clínica o valor de R$ 37.144,92, calculado a partir da planilha de custos da DevsTech (custo interno de R$ 29.715,94 acrescido de 25% de taxa de comissão), considerando 293 horas de trabalho distribuídas entre as funções de Gerente de Projetos (37h), Analista (43h), Desenvolvedor (115h), Web Design (40h) e DBA (58h).


## 5. Recursos do Produto

O ClinicaShare oferece um conjunto integrado de funcionalidades que suportam todo o ciclo operacional e financeiro da clínica.


## 5.1 Agendamento e Gestão de Consultas

Portal de agendamento online para pacientes com seleção de profissional, especialidade e horário disponível

Interface interna para atendentes agendarem em nome do paciente

Configuração de turno fixo, horário de início e duração de consulta por profissional

Bloqueio automático de conflitos de horário e consultório

Cancelamento de consulta com campo obrigatório de registro de motivo

Envio automático de lembretes via WhatsApp por IA: 2 dias antes, 1 dia antes e no dia da consulta


## 5.2 Controle de Consultórios

Cadastro dos 12 consultórios com tipo, equipamentos disponíveis e especialidades compatíveis

Alocação de profissional por turno fixo, com possibilidade de mais de um turno por dia

Profissional pode ocupar consultórios diferentes em turnos distintos dentro do mesmo dia

Dashboard de ocupação e receita por consultório e por período


## 5.3 Registro de Atendimentos e Prontuário

Registro obrigatório de cada atendimento realizado: data, paciente, profissional, consultório e status de pagamento

Campo para registro de procedimentos adicionais realizados na mesma sessão (ex.: ultrassom, exames)

Status de pagamento por atendimento: pago, pendente ou gratuito, com justificativa obrigatória

Prontuário eletrônico integrado (campos a definir na Reunião R2)


## 5.4 Gestão Financeira e Repasses

Cadastro de contrato por profissional: modalidade aluguel fixo por turno ou percentual negociado individualmente

Cálculo automático do repasse devido por profissional com base nos atendimentos e procedimentos registrados

Fechamento financeiro semanal com relatório de prestação de contas

Histórico de repasses pagos e em aberto, com rastreabilidade completa

Registro de pagamento: Pix, cartão ou boleto


## 5.5 Relatórios e Dashboard Gerencial

Dashboard do administrador com receita total, repasses em aberto e repasses pagos no período

Ranking de consultórios por receita gerada

Relatório de atendimentos com filtros por profissional, consultório e período

Relatório de consultas gratuitas e descontos concedidos

Relatório de cancelamentos com motivos registrados pelos pacientes

Retorno sobre o Investimento (ROI)

Nota importante: O Dr. Edson não possui controle financeiro atual que permita quantificar exatamente o valor perdido por falta de registro. As estimativas abaixo são conservadoras e baseadas nos dados coletados na Reunião R1. Os valores de custo do sistema são os valores reais calculados pela planilha de custos DevsTech.


## 6. Tabela de Gastos do Cliente

A tabela abaixo consolida os custos operacionais mensais identificados durante a Reunião R1 com o Dr. Edson Andrade. Esses valores representam o desperdício de recursos que o sistema se propõe a eliminar ou reduzir.


| Descrição | Valor Mensal |
|---|---|
| Custo do auxiliar financeiro em tarefas automatizáveis (30% do salário mensal) | R$ 750,00 |
| Perda estimada por atendimentos/procedimentos não registrados (3% da receita) | R$ 1.069,20 |
| Retrabalho de consolidação de planilhas e relatórios manuais | R$ 312,50 |
| Ausência de controle sobre descontos e consultas gratuitas concedidas | Não mensurável |
| Total mensurável | R$ 2.131,70 |

Essa tabela foi baseada na entrevista com o cliente na Reunião R1, onde foram identificados: o salário do auxiliar financeiro (R$ 2.500,00/mês), a ausência de controle sobre atendimentos extras realizados pelos profissionais, e o tempo gasto em consolidações manuais de planilhas.


## 7. Cálculo do ROI


## 7.1 Consolidação dos Benefícios Anuais


| Fonte de Benefício | Valor Anual (R$) |
|---|---|
| Ganho operacional — auxiliar financeiro | R$ 6.750,00 |
| Recuperação de receita — atendimentos não registrados | R$ 12.830,40 |
| Total de benefícios estimados (1º ano) | R$ 19.580,40 |


## 7.2 Resumo Financeiro (valores reais da planilha de custos)


| Função | Horas | Custo (R$) |
|---|---|---|
| Gerente de Projetos | 37h | * |
| Analista de Sistemas | 43h | * |
| Desenvolvedor | 115h | * |
| Web Design | 40h | * |
| DBA | 58h | * |
| Total — 293 horas | 293h | R$ 29.715,94 |
| Taxa de comissão DevsTech (25%) | — | R$ 7.428,98 |
| Valor final cobrado ao cliente | — | R$ 37.144,92 |

* Custos por função detalhados na Planilha de Custos DevsTech (ClinicaShare_Planilha_Custos.xlsx).


## 7.3 Fórmula e Resultado


| Métrica | Resultado |
|---|---|
| Investimento total (valor cobrado ao cliente) | R$ 37.144,92 |
| Benefício estimado no 1º ano | R$ 19.580,40 |
|  | -47.3% |
| Payback = Investimento / Benefício Anual |  |

Sendo o ROI calculado dessa forma, a clínica do Dr. Edson terá retorno sobre o investimento em aproximadamente 23 meses. O ROI negativo no primeiro ano é esperado dado o custo de desenvolvimento concentrado no início, a partir do segundo ano, o retorno acumulado supera integralmente o valor investido de R$ 37.144,92. Além disso, o sistema proporcionará gestão financeira completamente rastreável, eliminando a dependência de um único funcionário sem auditoria e gerando base histórica para decisões estratégicas como definição de modalidade de contrato por consultório.
