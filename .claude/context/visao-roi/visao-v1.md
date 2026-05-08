# Documento de Visão ClinicaShare — v1 (revisão 2026-04-16)

Projeto ClinicaShare

Visão

Versão 1.0

Histórico da Revisão


| Data | Versão | Descrição | Autor |
|---|---|---|---|
| 09/04/2026 | 1.0 | Construção da primeira versão do documento, a partir dos dados colhidos na reunião com o cliente. | David Halan (Gerente de projetos) · Leonardo Albuquerque (Analista de Sistemas) · José Edgar (Dev/WD) · Guilherme Mesquita (DBA) |
| 07/05/2026 | 1.1 | Remoção de FI09 (pagamento online via PIX/cartão/boleto) do escopo proposto pela equipe (DEC-E09). Pagamento passa a ser exclusivamente presencial no atendimento (FI10 promovido). **Pendente confirmação do cliente em R2 — PEND-045.** | Equipe DevsTech |

Índice Analítico

1.  Introdução


### 1.1 Finalidade

2.  Posicionamento


### 2.1 Descrição do Problema


### 2.2 Sentença de Posição do Produto

3.  Descrições dos Envolvidos e dos Usuários


### 3.1 Resumo dos Envolvidos


### 3.2 Resumo dos Usuários


### 3.3 Ambiente do Usuário


### 3.4 Principais Necessidades dos Usuários ou dos Envolvidos


### 3.5 Alternativas e Concorrência

4.  Visão Geral do Produto


### 4.1 Perspectiva do Produto


### 4.2 Pressupostos e Dependências


### 4.3 Custo e Preço


### 4.4 Licenciamento e Instalação

5.  Recursos do Produto

6.  Restrições

7.  Requisitos de Qualidade

8.  Retorno de Investimento (ROI)


### 8.1 Tabela de Gastos Atuais do Cliente


### 8.2 Justificativa


### 8.3 Estimativa de Ganho com o Sistema


### 8.4 Cálculo do ROI


## 1. Introdução

A finalidade deste documento é coletar, analisar e definir as características e necessidades de alto nível do sistema ClinicaShare. Ele se concentra nos recursos necessários aos envolvidos e aos usuários-alvo e nas razões que levam a essas necessidades. Os detalhes de como o ClinicaShare atinge essas necessidades são descritos nos casos de uso e nas especificações suplementares.


## 1.1 Finalidade

A finalidade deste documento é definir os requisitos de alto nível em termos de necessidades dos usuários finais.


## 2. Posicionamento


## 2.1 Descrição do Problema


| O problema de | A clínica não possui controle confiável sobre os repasses financeiros devidos aos profissionais de saúde que alugam seus consultórios. Consultas e procedimentos são registrados de forma descentralizada — por caderno, WhatsApp e planilhas individuais de cada profissional — sem garantia de que todos os atendimentos realizados sejam capturados pelo financeiro da clínica. |
|---|---|
| afeta | O Dr. Edson Andrade (proprietário), que não sabe com precisão quanto deveria receber por período, por profissional e por consultório. Afeta também o auxiliar financeiro, que opera sem sistema e depende da boa-fé dos profissionais para registrar os atendimentos. |
| cujo impacto é | Perda financeira não quantificada decorrente de atendimentos e procedimentos não registrados; impossibilidade de auditar o que foi realizado versus o que foi repassado; dependência total de um único auxiliar sem mecanismo de verificação; ausência de dados históricos para tomada de decisões estratégicas sobre consultórios. |
| uma boa solução seria | Um sistema web centralizado onde todos os atendimentos, procedimentos e pagamentos são registrados, os repasses calculados automaticamente por profissional e consultório, e o proprietário tenha visão financeira consolidada em tempo real — com fechamento semanal estruturado. |


## 2.2 Sentença de Posição do Produto


| Para | Dr. Edson Andrade (proprietário da clínica) e os profissionais de saúde que utilizam os consultórios. |
|---|---|
| que | Necessita de controle financeiro preciso sobre os repasses de cada profissional por consultório e período, sem depender de registros manuais descentralizados. |
| O ClinicaShare | É uma plataforma web de gestão financeira e operacional para clínicas multiprofissionais. |
| que | Centraliza o registro de atendimentos e procedimentos, calcula automaticamente os repasses devidos, gera relatórios gerenciais e realiza fechamentos semanais — eliminando o controle por planilha. |
| Ao contrário de | Cadernos, planilhas Excel e registros individuais no WhatsApp de cada atendente, sem rastreabilidade, sem auditoria e sem visão consolidada. |
| Nosso produto | Permite ao proprietário saber, a qualquer momento, quanto cada profissional deve repassar, qual consultório gera mais receita e quais atendimentos foram realizados — com histórico auditável e fechamento semanal automatizado. |


## 3. Descrições dos Envolvidos e dos Usuários

A clínica do Dr. Edson é uma clínica multiprofissional com 12 consultórios, atendendo médicos, psicólogos, fisioterapeutas e outros profissionais autônomos. O Dr. Edson disponibiliza consultórios por duas modalidades: aluguel fixo por turno ou percentual sobre as consultas. O controle financeiro é hoje feito por um auxiliar administrativo via planilha Excel.


## 3.1 Resumo dos Envolvidos


| Nome | Descrição | Responsabilidade |
|---|---|---|
| Dr. Edson Andrade | Proprietário da clínica multiprofissional. Interpretado pelo professor na simulação da disciplina. | Validar requisitos, aprovar escopo e fornecer informações de negócio em cada reunião. |
| Auxiliar Financeiro | Funcionário responsável pelo controle financeiro atual via planilha Excel. | Será integrado ao sistema como operador do módulo financeiro. |
| Equipe DevsTech | David Halan (Gerente de projetos) · Leonardo Albuquerque (Analista de Sistemas) · José Edgar (Dev/WD) · Guilherme Mesquita (DBA) | Levantar requisitos, desenvolver, testar e entregar o sistema dentro do prazo. |


## 3.2 Resumo dos Usuários


| Nome | Descrição | Responsabilidades no sistema | Envolvido |
|---|---|---|---|
| Administrador (Dr. Edson) | Usuário com acesso total. Visualiza financeiro consolidado e relatórios gerenciais. | Consultar repasses, acessar dashboard, configurar contratos por profissional e gerar relatórios. | Auto-representado |
| Auxiliar Financeiro | Operador do módulo financeiro. Hoje controla tudo via Excel. | Registrar pagamentos recebidos, confirmar repasses realizados e gerar fechamento semanal. | Auto-representado |
| Profissional de Saúde | Médico, psicólogo, fisioterapeuta ou outro. Cada um tem horário e duração de consulta próprios. | Visualizar agenda própria e registrar atendimentos e procedimentos realizados na sessão. | Auto-representado |
| Atendente do Profissional | Secretária vinculada a um ou mais profissionais — própria ou compartilhada da clínica. | Gerenciar agenda do profissional, agendar, confirmar e cancelar consultas. | Auto-representado |
| Paciente | Usuário final que agenda e utiliza os serviços da clínica. | Agendar consultas via portal online, receber lembretes automáticos e cancelar com registro de motivo. | Auto-representado |


## 3.3 Ambiente do Usuário


### 3.3.1 Ambiente do Administrador

O Dr. Edson acessará o sistema preferencialmente via desktop para análise financeira e consulta de relatórios. Necessita de visão consolidada rápida — quanto cada profissional deve repassar, qual consultório está ocioso, quais repasses estão em aberto — e do relatório semanal de fechamento. Acesso também via smartphone para consultas rápidas.


### 3.3.2 Ambiente do Auxiliar Financeiro

Usará o sistema diariamente em desktop para registrar pagamentos e fechar o financeiro semanalmente. Hoje opera via planilha Excel sem padronização, realizando lançamentos manuais e consolidações sujeitas a erros. O sistema substitui essa planilha como ferramenta principal de trabalho.


### 3.3.3 Ambiente dos Profissionais de Saúde e Atendentes

Profissionais acessarão agenda e registro de atendimentos durante ou após a sessão, via tablet ou notebook dentro do consultório. Cada profissional possui horário e duração de consulta próprios, definidos por turno fixo (definição detalhada pendente — PEND-012). Atendentes gerenciarão agendamentos via desktop ou smartphone, podendo ser compartilhados entre mais de um profissional.


### 3.3.4 Ambiente do Paciente

Acesso exclusivo ao portal web de agendamento via smartphone ou computador, para agendar, visualizar e cancelar consultas. Receberá lembretes automáticos via WhatsApp: 2 dias antes, 1 dia antes e no dia da consulta.


## 3.4 Principais Necessidades dos Usuários ou dos Envolvidos


| Necessidade | Prioridade | Preocupações | Solução Atual | Solução Proposta |
|---|---|---|---|---|
| Saber quanto cada profissional deve repassar por período, com rastreabilidade completa | Alta | Perda financeira silenciosa por atendimentos não registrados | Planilha Excel manual, sem auditoria | Cálculo automático de repasse por profissional e consultório, com histórico auditável. |
| Garantir que todo atendimento e procedimento extra realizado seja registrado | Alta | Suspeita de consultas e procedimentos extras ocorrendo sem registro | Confiança total no auxiliar sem mecanismo de verificação | Registro obrigatório de cada atendimento e procedimento, vinculado ao cálculo de repasse. |
| Realizar o fechamento financeiro semanalmente de forma estruturada | Alta | Consolidação manual de múltiplas planilhas sujeita a erros e atrasos | Fechamento mensal manual via Excel | Módulo de fechamento semanal com relatório de prestação de contas exportável. |
| Centralizar os agendamentos, substituindo WhatsApp, caderno e sistemas individuais | Alta | Conflitos de horário, salas e atendimentos perdidos | Caderno, WhatsApp e sistemas externos de cada profissional | Portal de agendamento online para pacientes e interface interna para atendentes. |
| Identificar qual consultório e qual profissional geram mais receita | Alta | Ausência total de dado histórico para decisão estratégica | Nenhuma solução atual | Dashboard e relatório de ranking de consultórios por receita no período. |
| Receber lembretes automáticos de consulta para reduzir não-comparecimentos | Média | Pacientes esquecem consultas, gerando ociosidade de consultório | Nenhuma (confirmação informal pelo atendente) | IA envia lembretes automáticos via WhatsApp: 2 dias antes, 1 dia antes e no dia. |


## 3.5 Alternativas e Concorrência

As principais alternativas disponíveis no mercado são sistemas como iClinic, Nuvem Saúde e Doctoralia. Contudo, esses sistemas são voltados para clínicas de único proprietário ou para redes de grande porte, não atendendo ao modelo específico de coworking médico com múltiplas modalidades de contrato — aluguel fixo por turno e percentual variável negociado individualmente por profissional. Nenhum concorrente identificado trata o controle de repasse ao proprietário do espaço como funcionalidade central.


## 4. Visão Geral do Produto


## 4.1 Perspectiva do Produto

O ClinicaShare é uma solução proprietária desenvolvida pela DevsTech para a clínica do Dr. Edson Andrade. O sistema centraliza e automatiza a gestão operacional e financeira, eliminando o controle por planilha e garantindo que nenhum atendimento ou procedimento fique sem registro. Opera como aplicação web responsiva (desktop, tablet e celular), sem instalação local, atendendo cinco perfis de usuário com níveis de acesso distintos.


## 4.2 Pressupostos e Dependências

O sistema depende da adesão dos profissionais ao registro de atendimentos — sem isso, o cálculo de repasse continua impreciso.

Os atendentes (próprios ou compartilhados) precisam utilizar o sistema para agendamento, substituindo WhatsApp e caderno.

A prestação de contas semanal requer que o auxiliar financeiro opere o sistema ativamente.

A funcionalidade de lembretes via WhatsApp depende de API do WhatsApp Business — custo e aprovação a avaliar na R2.

Turnos fixos precisam ser definidos pelo Dr. Edson antes da modelagem do módulo de agendamento (PEND-012).


## 4.3 Custo e Preço

O software custará ao cliente o valor de R$ 38.224,22, estimado a partir da Planilha de Preços DevsTech (custo interno de R$ 30.579,38 acrescido de 25% de comissão). O cálculo considera 318 horas de trabalho distribuídas entre: Gerente de Projetos (27h), Analista de Sistemas (62h), Desenvolvedor (156h), Web Design (39h) e DBA (34h). Esse valor pode ser revisto conforme o escopo for refinado nas próximas reuniões.


## 4.4 Licenciamento e Instalação

A definir com o cliente. Pontos a confirmar na Reunião R2:

Propriedade do software: da DevsTech com licença de uso ao cliente, ou cessão total ao Dr. Edson?

Hospedagem: servidor contratado pela DevsTech, pela clínica ou solução em nuvem (ex.: AWS, Azure)?

Manutenção pós-entrega: há contrato de suporte? Por quanto tempo?

Custo de infraestrutura mensal (hospedagem, domínio, API WhatsApp) não está incluído no valor de desenvolvimento.


## 5. Recursos do Produto

O ClinicaShare oferece um conjunto integrado de funcionalidades que suportam o ciclo completo de operação e controle financeiro da clínica multiprofissional.


## 5.1 Módulo de Agendamento

Portal de agendamento online para pacientes, com seleção de profissional, especialidade e horário disponível

Interface interna para atendentes agendarem em nome do paciente

Configuração de turno fixo, horário de início e duração de consulta por profissional

Bloqueio automático de conflitos de horário e consultório

Cancelamento de consulta com campo obrigatório de registro de motivo

Envio automático de lembretes via WhatsApp por IA: 2 dias antes, 1 dia antes e no dia da consulta


## 5.2 Módulo de Consultórios

Cadastro dos 12 consultórios com tipo, equipamentos disponíveis e especialidades compatíveis

Alocação de profissional por turno fixo — um profissional pode ter mais de um turno por dia

Profissional pode ocupar consultórios diferentes em turnos distintos dentro do mesmo dia

Dashboard de ocupação e receita por consultório e por período


## 5.3 Módulo de Atendimentos e Procedimentos

Registro obrigatório de cada atendimento: data, profissional, paciente, consultório e status de pagamento

Registro de procedimentos adicionais realizados na mesma sessão (ex.: ultrassom, exames) — cada um gera repasse

Status de pagamento por atendimento: pago, pendente ou gratuito — com justificativa obrigatória em caso de gratuidade ou desconto

Histórico completo de atendimentos por paciente e por profissional


## 5.4 Módulo Financeiro e Repasses

Cadastro de contrato por profissional: modalidade aluguel fixo por turno ou percentual negociado individualmente

Percentual de repasse configurável individualmente por profissional (variável conforme contrato)

Cálculo automático do repasse devido por profissional com base nos atendimentos e procedimentos registrados

Fechamento financeiro semanal com relatório de prestação de contas

Histórico de repasses pagos e em aberto, com rastreabilidade completa de cada alteração

Pagamento da consulta é realizado exclusivamente de forma presencial no atendimento (dinheiro, Pix presencial ou cartão na maquininha do consultório). Sistema registra apenas o status `pago`/`pendente`/`gratuito` — não processa transações financeiras com o paciente. *(v1.1, DEC-E09, pendente confirmação cliente em PEND-045)*


## 5.5 Módulo de Relatórios e Dashboard

Dashboard do administrador: receita total, repasses em aberto e repasses pagos no período

Ranking de consultórios por receita gerada — insumo estratégico para decisão de modalidade de contrato

Relatório de atendimentos com filtros por profissional, consultório e período

Relatório de consultas gratuitas e descontos concedidos, com justificativas

Relatório de cancelamentos com motivos registrados pelos pacientes


## 6. Restrições

As restrições abaixo são inegociáveis e se aplicam a todo o desenvolvimento do sistema:

Valores monetários devem ser armazenados como inteiro em centavos ou tipo Decimal — nunca float ou double.

Toda alteração financeira deve gerar audit log com: usuário, timestamp, entidade, campo, valor antes, valor depois e motivo.

O cálculo de repasse deve ocorrer exclusivamente no servidor — nunca no front-end.

Todo cálculo financeiro deve ser coberto por teste unitário antes de qualquer merge de código.

Dados clínicos de pacientes não entram no MVP (redução de risco LGPD).

Dados pessoais mínimos (nome, CPF) somente com justificativa de requisito explícito — nunca coletar por precaução.

MVP não inclui: prontuário eletrônico completo, agendamento avançado, portal do paciente, ERP financeiro.

Nenhum requisito é assumido — se não está confirmado pelo cliente, não existe e não será implementado.


## 7. Requisitos de Qualidade

Nota: Os requisitos de qualidade abaixo foram definidos internamente pela equipe com base nas regras inegociáveis do projeto. Os limites quantitativos (ex.: tempo de resposta, disponibilidade) precisam ser confirmados com o Dr. Edson na Reunião R2.


| Categoria | Requisito | Status |
|---|---|---|
| Confiabilidade | Cálculos financeiros devem ser 100% precisos — valores em Decimal, sem arredondamento indevido. | Confirmado (regra inegociável) |
| Rastreabilidade | Toda alteração financeira deve ser auditável com registro de quem, quando, o quê e por quê. | Confirmado (regra inegociável) |
| Segurança / LGPD | Dados clínicos de pacientes não entram no MVP. Dados pessoais mínimos com consentimento registrado. | Confirmado (regra inegociável) |
| Disponibilidade | Sistema deve estar disponível no horário de funcionamento da clínica. SLA a definir. | A definir na R2 |
| Desempenho | Tempo de resposta das consultas financeiras: a definir. Suportar 12 consultórios simultâneos. | A definir na R2 |
| Usabilidade | Interface acessível para usuários não técnicos (atendentes, pacientes). Sistema deve funcionar em desktop e dispositivos móveis. | A definir na R2 |


## 8. Retorno de Investimento (ROI)

Nota sobre os dados: O Dr. Edson não possui controle financeiro atual que permita quantificar com precisão o valor perdido por falta de registro — justamente por isso ele quer o sistema. Os valores abaixo são estimativas conservadoras construídas a partir das informações coletadas na Reunião R1. Este documento será atualizado conforme dados mais precisos forem obtidos nas reuniões seguintes.


## 8.1 Tabela de Gastos Atuais do Cliente


| Descrição | Valor Mensal (R$) |
|---|---|
| Custo do auxiliar financeiro em tarefas automatizáveis (est. 30% do salário mensal de R$ 2.500,00) | R$ 750,00 |
| Perda estimada por atendimentos e procedimentos não registrados (est. 3% da receita mensal) | R$ 1.069,20 |
| Retrabalho de consolidação de planilhas e relatórios manuais (tempo administrativo) | R$ 312,50 |
| Perda por falta de controle sobre descontos e consultas gratuitas concedidas | Não mensurável |
| Total mensurável | R$ 2.131,70 |


## 8.2 Justificativa

Os valores da tabela acima foram estimados a partir das informações coletadas na Reunião R1 (06/04/2026) com o Dr. Edson Andrade. O salário do auxiliar financeiro foi estimado em R$ 2.500,00/mês — valor a confirmar. A perda por atendimentos não registrados foi calculada sobre uma receita mensal estimada de R$ 35.640,00 (12 consultórios × 3 atendimentos/dia × 22 dias × R$ 150,00 de consulta média × 30% de repasse médio), aplicando taxa conservadora de 3% de atendimentos sem registro. O Dr. Edson admitiu confiar integralmente no que o auxiliar repassa, sem auditoria — o que torna a perda real potencialmente maior do que o estimado.


## 8.3 Estimativa de Ganho com o Sistema


| Fonte de Ganho | Mensal (R$) | Anual (R$) |
|---|---|---|
| Economia de tempo do auxiliar financeiro (36h/mês × R$ 15,63/h) | R$ 562,50 | R$ 6.750,00 |
| Recuperação de receita por atendimentos não registrados (3% da receita) | R$ 1.069,20 | R$ 12.830,40 |
| Total estimado de ganho | R$ 1.631,70 | R$ 19.580,40 |


## 8.4 Cálculo do ROI

Investimento total (valor cobrado ao cliente): R$ 38.224,22

Ganho mensal estimado: R$ 1.631,70

ROI = Investimento Total / Ganho Mensal Estimado = R$ 38.224,22 / R$ 1.631,70 ≈ 23 meses

Sendo o ROI calculado dessa forma, a clínica do Dr. Edson terá retorno sobre o investimento em aproximadamente 23 meses. A partir desse ponto, o sistema passa a gerar economia líquida estimada de R$ 1.631,70 por mês. Além do retorno financeiro direto, o sistema entrega rastreabilidade total, auditabilidade e base histórica para decisões estratégicas — como definir qual consultório é mais rentável com aluguel fixo versus percentual — ativos que hoje o Dr. Edson simplesmente não possui.

Observação: Os valores acima serão revisados à medida que dados reais do cliente forem obtidos. Após os primeiros meses de uso do sistema, o ROI poderá ser recalculado com base nos registros efetivos de atendimentos — que é exatamente o dado que o sistema passará a fornecer.

ClinicaShare · Documento de Visão v1.0 · DevsTech · Abril de 2026

Referências: Planilha de Preços DevsTech · Ata de Reunião R1 (06/04/2026)
