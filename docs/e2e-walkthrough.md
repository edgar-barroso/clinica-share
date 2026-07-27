# ClinicaShare — documentação funcional em vídeo

Cada vídeo é uma jornada completa de um perfil de usuário, gravada na aplicação
real. Foram feitos para serem assistidos **sem áudio e sem contexto**: a persona
fica identificada no topo o tempo todo, cada passo aparece legendado embaixo, e
o vídeo abre e fecha com um cartão dizendo o objetivo e o resultado.

16 de 16 jornadas verdes · 33 dos 34 requisitos cobertos · 1 fora de escopo.

> Este arquivo é **gerado** por `node scripts/publicar-docs-e2e.mjs`. Persona,
> objetivo, IDs, pré-condições, passos e resultado vêm do que cada jornada
> declarou em tempo de execução — o texto não consegue divergir do vídeo.

## Jornadas

| # | Persona | Jornada | IDs | Objetivo | Pré-condições | Vídeo | Trace |
|---|---|---|---|---|---|---|---|
| 01 | ADMINISTRADOR · Roberto Lima | 01 — Administrador configura a clínica ✅ | `CO01` `CO02` `CO03` `AG03` `AG04` `FI01` `FI02` `FI08` | Roberto prepara a clínica para operar: confere as salas, os contratos, a duração das consultas e quem ocupa qual sala em cada turno. | As salas da clínica já foram cadastradas; Os profissionais já têm contrato e agenda semanal; Roberto é o administrador — só ele mexe em contrato e turno | [assistir](videos/01-admin-configura-clinica.mp4) | [trace](traces/01-admin-configura-clinica.zip) |
| 02 | PACIENTE · Maria Silva | 02 — Paciente agenda consulta online ✅ | `AG01` | Maria quer marcar uma consulta sozinha, pela internet, sem ligar para a clínica. | Maria já tem cadastro e senha no portal do paciente; A clínica já tem profissionais com agenda semanal definida | [assistir](videos/02-paciente-agenda-consulta.mp4) | [trace](traces/02-paciente-agenda-consulta.zip) |
| 03 | ATENDENTE · Júlia Nunes | 03 — Atendente agenda consulta em nome do paciente ✅ | `AG02` | Um paciente ligou na recepção pedindo consulta. Júlia marca por ele, direto no sistema da clínica. | Júlia é atendente e tem login próprio; O paciente já está cadastrado na clínica; A profissional escolhida já tem turnos fixos, com sala definida | [assistir](videos/03-atendente-agenda-para-paciente.mp4) | [trace](traces/03-atendente-agenda-para-paciente.zip) |
| 04 | ATENDENTE · Júlia Nunes | 04 — Sistema bloqueia conflito de sala e sala fora do turno fixo ✅ | `AG05` `AG03` | Júlia tenta marcar duas consultas que não podem existir. O resultado ESPERADO deste vídeo é o sistema recusar as duas — nada está com defeito. | Júlia é atendente e tem login próprio; Cada profissional tem turnos fixos que definem dia, período e sala; O banco não permite duas consultas na mesma sala, no mesmo dia e hora | [assistir](videos/04-atendente-tenta-conflito.mp4) | [trace](traces/04-atendente-tenta-conflito.zip) |
| 05 | SISTEMA · Rotina automática diária | 05 — Sistema avisa quem tem consulta amanhã ✅ | `AG07` | Todo dia à noite, sem ninguém operando o sistema, o ClinicaShare avisa cada paciente que tem consulta no dia seguinte. | O agendador (cron) é configurado para chamar a rotina uma vez por dia; A rotina só é aceita com a chave secreta do agendador; Cada consulta guarda a marca de quando o lembrete foi enviado | [assistir](videos/05-sistema-envia-lembrete.mp4) | [trace](traces/05-sistema-envia-lembrete.zip) |
| 06 | PACIENTE · Maria Silva | 06 — Paciente cancela a própria consulta ✅ | `AG06` | Maria precisa desmarcar uma consulta que já está marcada — e a clínica precisa saber o motivo. | Maria já tem cadastro e senha no portal do paciente; Maria tem uma consulta futura marcada, ainda não realizada | [assistir](videos/06-paciente-cancela-consulta.mp4) | [trace](traces/06-paciente-cancela-consulta.zip) |
| 07 | PROFISSIONAL · Dra. Helena Braga | 07 — Profissional registra o atendimento com procedimentos extras ✅ | `AT01` `AT02` `AT04` | A Dra. Helena atendeu a paciente e agora precisa registrar a sessão, os procedimentos extras e onde ficou o prontuário. | Dra. Helena Braga é profissional ativa, de Psicologia, com agenda semanal fixa; Ela tem uma consulta agendada na própria agenda; O prontuário clínico dela é mantido no sistema próprio, fora do ClinicaShare | [assistir](videos/07-profissional-registra-atendimento.mp4) | [trace](traces/07-profissional-registra-atendimento.zip) |
| 08 | PROFISSIONAL · Dra. Nirmala Azalea | 08 — Profissional preenche o prontuário do atendimento ✅ | `AT03` | A Dra. Nirmala acabou de atender e precisa deixar o registro clínico gravado no prontuário da clínica. | Dra. Nirmala Azalea é profissional ativa, de Clínica geral, com agenda semanal fixa; Ela tem uma consulta agendada na própria agenda; O prontuário dela é o interno — o registro clínico fica dentro do ClinicaShare | [assistir](videos/08-profissional-preenche-prontuario.mp4) | [trace](traces/08-profissional-preenche-prontuario.zip) |
| 09 | AUXILIAR · Carla Nogueira | 09 — Auxiliar registra pagamento, desconto e gratuidade ✅ | `FI05` `FI06` | Carla precisa fechar as cobranças do dia: um atendimento pago, um com desconto e um gratuito — tudo lançado à mão, com justificativa onde a regra exige. | Carla Nogueira é auxiliar — é o papel que responde pelo financeiro da clínica; A clínica tem atendimentos agendados esperando para serem realizados e cobrados; O dinheiro é recebido na recepção: o sistema só registra o que aconteceu | [assistir](videos/09-auxiliar-registra-pagamento.mp4) | [trace](traces/09-auxiliar-registra-pagamento.zip) |
| 10 | ADMINISTRADOR · Roberto Lima | 10 — Administrador fecha a semana financeira ✅ | `FI07` `FI03` `FI04` | Roberto vai fechar a semana: conferir quanto cada profissional tem a receber e provar de onde saiu cada número. | As semanas anteriores já foram calculadas pelo servidor, toda segunda de manhã; Os contratos são diferentes: uns pagam percentual sobre o bruto, outros aluguel fixo por turno; Alguns atendimentos tiveram procedimentos extras além da consulta | [assistir](videos/10-admin-fecha-semana-financeira.mp4) | [trace](traces/10-admin-fecha-semana-financeira.zip) |
| 11 | ADMINISTRADOR · Roberto Lima | 11 — Administrador analisa os relatórios do período ✅ | `RE01` `CO04` `RE03` `RE02` `RE04` `RE05` | Roberto quer o retrato do período: quanto entrou, para onde foi, quais salas se pagam e o que a clínica deixou de faturar. | A clínica já tem semanas de atendimentos registrados, com repasses pagos e em aberto; Houve cancelamentos, faltas, cortesias e descontos — todos com motivo registrado | [assistir](videos/11-admin-analisa-relatorios.mp4) | [trace](traces/11-admin-analisa-relatorios.zip) |
| 12 | ADMINISTRADOR · Roberto Lima | 12 — Controle de acesso por perfil: o que cada um enxerga ✅ | `RF-022` | Mostrar, perfil por perfil, o que a clínica abre e o que ela fecha para cada tipo de usuário. | A clínica tem um usuário para cada perfil: administrador, auxiliar, profissional, atendente e paciente; Todos usam a mesma tela de login — quem decide o que aparece é o sistema, não o usuário | [assistir](videos/12-controle-de-acesso-por-perfil.mp4) | [trace](traces/12-controle-de-acesso-por-perfil.zip) |
| 13 | PROFISSIONAL · Dra. Nirmala Azalea | 13 — Profissional não alcança a agenda de outra profissional ✅ | `RF-023` | Dra. Nirmala vai tentar alcançar a agenda e o atendimento de outra profissional da clínica. O sistema deve recusar — é isso que este vídeo comprova. | Várias profissionais atendem na mesma clínica, na mesma base de dados; Dra. Renata Jacarandá (Ginecologia) já tem atendimentos registrados; Dra. Nirmala tem login próprio, com perfil PROFISSIONAL | [assistir](videos/13-profissional-tenta-agenda-de-outro.mp4) | [trace](traces/13-profissional-tenta-agenda-de-outro.zip) |
| 14 | PACIENTE · Maria Silva | 14 — Paciente recupera a senha esquecida ✅ | `RF-026` | Maria criou a conta dela no portal, esqueceu a senha e quer voltar a entrar sem depender de ninguém da clínica. | Maria é paciente e tem conta no portal, com este e-mail; A clínica não guarda a senha em texto: nem o suporte consegue lê-la para ela; A recuperação exige provar o acesso ao e-mail cadastrado | [assistir](videos/14-paciente-recupera-senha.mp4) | [trace](traces/14-paciente-recupera-senha.zip) |
| 15 | AUXILIAR · Carla Nogueira | 15 — Sessão encerrada: por decisão de Carla e por inatividade ✅ | `RF-024` | Mostrar que a sessão de Carla acaba de duas formas: quando ela clica em Sair e quando o computador dela fica sozinho tempo demais. | Carla é auxiliar financeira e trabalha num computador compartilhado da recepção; O painel dela mostra atendimento, valor cobrado e repasse de toda a clínica; A janela de inatividade configurada no sistema é de 30 minutos | [assistir](videos/15-sessao-expira-por-inatividade.mp4) | [trace](traces/15-sessao-expira-por-inatividade.zip) |
| 16 | AUXILIAR · Carla Nogueira | 16 — Auxiliar paga um repasse e a auditoria mostra quem fez ✅ | `RF-025` | Carla vai dar baixa num repasse — e o sistema tem que registrar que foi ela, com o valor antes e depois. | Existem repasses de semanas já fechadas aguardando pagamento; Carla é auxiliar administrativa: pode dar baixa em repasse e ler a trilha de auditoria | [assistir](videos/16-auxiliar-audita-alteracao-financeira.mp4) | [trace](traces/16-auxiliar-audita-alteracao-financeira.zip) |

## Cobertura dos requisitos

**Módulo de Agendamento**

| ID | Requisito | Situação | Onde |
|---|---|---|---|
| `AG01` | Paciente agenda consulta online (portal web) | ✅ COBERTO | `02-paciente-agenda-consulta` |
| `AG02` | Atendente agenda consulta em nome do paciente | ✅ COBERTO | `03-atendente-agenda-para-paciente` |
| `AG04` | Configuração de duração de consulta por profissional | ✅ COBERTO | `01-admin-configura-clinica` |
| `AG05` | Bloqueio automático de conflito de horário e consultório | ✅ COBERTO | `04-atendente-tenta-conflito` |
| `AG06` | Cancelamento de consulta com registro obrigatório de motivo | ✅ COBERTO | `06-paciente-cancela-consulta` |
| `AG07` | Envio de lembrete automático via Email | ✅ COBERTO | `05-sistema-envia-lembrete` |

**Módulo de Consultórios**

| ID | Requisito | Situação | Onde |
|---|---|---|---|
| `CO01` | Cadastro dos 12 consultórios com tipo e equipamentos | ✅ COBERTO | `01-admin-configura-clinica` |
| `CO02` | Configuração de turnos fixos e horários por profissional | ✅ COBERTO | `01-admin-configura-clinica` |
| `CO03` | Profissional pode alocar múltiplos turnos em consultórios dif. | ✅ COBERTO | `01-admin-configura-clinica` |
| `CO04` | Dashboard de ocupação e receita por consultório | ✅ COBERTO | `11-admin-analisa-relatorios` |

**Módulo de Atendimentos e Prontuário**

| ID | Requisito | Situação | Onde |
|---|---|---|---|
| `AT01` | Registro de atendimento realizado (data, profissional, consul.) | ✅ COBERTO | `07-profissional-registra-atendimento` |
| `AT02` | Registro de procedimentos adicionais por atendimento | ✅ COBERTO | `07-profissional-registra-atendimento` |
| `AT03` | Prontuário eletrônico integrado (campos a definir na R2) | ✅ COBERTO | `08-profissional-preenche-prontuario` |
| `AT04` | Registro de ocorrência para profissionais com prontuário ext. | ✅ COBERTO | `07-profissional-registra-atendimento` |

**Módulo Financeiro**

| ID | Requisito | Situação | Onde |
|---|---|---|---|
| `FI01` | Cadastro de contrato por profissional (aluguel ou percentual) | ✅ COBERTO | `01-admin-configura-clinica` |
| `FI02` | Configuração de percentual individual por profissional | ✅ COBERTO | `01-admin-configura-clinica` |
| `FI03` | Cálculo automático de repasse por profissional | ✅ COBERTO | `10-admin-fecha-semana-financeira` |
| `FI04` | Repasse inclui consultas e procedimentos extras registrados | ✅ COBERTO | `10-admin-fecha-semana-financeira` |
| `FI05` | Registro de status de pagamento (pago, pendente, gratuito) | ✅ COBERTO | `09-auxiliar-registra-pagamento` |
| `FI06` | Registro de descontos com justificativa | ✅ COBERTO | `09-auxiliar-registra-pagamento` |
| `FI07` | Fechamento financeiro semanal com relatório de prestação de c. | ✅ COBERTO | `10-admin-fecha-semana-financeira` |
| `FI08` | Registro de aluguel fixo por turno utilizado por profissional | ✅ COBERTO | `01-admin-configura-clinica` |
| `FI09` | Pagamento online pelo paciente: Pix, cartão | 🚫 FORA DE ESCOPO | REMOVIDO do escopo por DEC-E09 (IMPLEMENTACAO-PLANO.md:621). Pagamento é presencial; não existe gateway, checkout nem webhook no código. Nenhum vídeo exibe pagamento online. |

**Módulo de Relatórios e Dashboard**

| ID | Requisito | Situação | Onde |
|---|---|---|---|
| `RE01` | Dashboard admin: receita total, repasses em aberto e pagos | ✅ COBERTO | `11-admin-analisa-relatorios` |
| `RE02` | Relatório financeiro com filtros por profissional e período | ✅ COBERTO | `11-admin-analisa-relatorios` |
| `RE03` | Ranking de consultórios por receita gerada | ✅ COBERTO | `11-admin-analisa-relatorios` |
| `RE04` | Relatório de consultas gratuitas e descontos | ✅ COBERTO | `11-admin-analisa-relatorios` |
| `RE05` | Relatório de cancelamentos com motivos registrados | ✅ COBERTO | `11-admin-analisa-relatorios` |

**Módulo de Autenticação e Controle de Acesso**

| ID | Requisito | Situação | Onde |
|---|---|---|---|
| `RF-021` | Autenticação de usuário com e-mail e senha | ✅ COBERTO | `01-admin-configura-clinica`, `02-paciente-agenda-consulta`, `03-atendente-agenda-para-paciente`, `04-atendente-tenta-conflito`, `05-sistema-envia-lembrete`, `06-paciente-cancela-consulta`, `07-profissional-registra-atendimento`, `08-profissional-preenche-prontuario`, `09-auxiliar-registra-pagamento`, `10-admin-fecha-semana-financeira`, `11-admin-analisa-relatorios`, `12-controle-de-acesso-por-perfil`, `13-profissional-tenta-agenda-de-outro`, `15-sessao-expira-por-inatividade`, `16-auxiliar-audita-alteracao-financeira` |
| `RF-022` | Controle de acesso por perfil (Adm, Aux, Profissional, Atendente, Paciente) | ✅ COBERTO | `12-controle-de-acesso-por-perfil` |
| `RF-023` | Profissional não acessa dados ou agenda de outro profissional | ✅ COBERTO | `13-profissional-tenta-agenda-de-outro` |
| `RF-024` | Encerramento automático de sessão após inatividade | ✅ COBERTO | `15-sessao-expira-por-inatividade` |
| `RF-025` | Registro do user_id autenticado em todo audit log financeiro | ✅ COBERTO | `16-auxiliar-audita-alteracao-financeira` |
| `RF-026` | Recuperação de senha via e-mail | ✅ COBERTO | `14-paciente-recupera-senha` |

## Detalhamento das jornadas

### 01-admin-configura-clinica

**ADMINISTRADOR · Roberto Lima** — Roberto prepara a clínica para operar: confere as salas, os contratos, a duração das consultas e quem ocupa qual sala em cada turno.

IDs: `CO01` `CO02` `CO03` `AG03` `AG04` `FI01` `FI02` `FI08`

Pré-condições:
- As salas da clínica já foram cadastradas
- Os profissionais já têm contrato e agenda semanal
- Roberto é o administrador — só ele mexe em contrato e turno

Passos narrados:
1. [RF-021] Roberto Lima entra no sistema com e-mail e senha
2. [CO01] Roberto revisa as 12 salas da clínica, cada uma com tipo e equipamentos
3. [FI01][FI02] Roberto abre o contrato de Dra. Nirmala Azalea: repasse por percentual, com o percentual individual dela
4. [AG04] A consulta de Dra. Nirmala Azalea (Clínica geral) dura 30 minutos
5. [FI08] Roberto abre o contrato de Dra. Helena Braga: a outra modalidade, aluguel fixo por turno usado
6. [AG04] Já a consulta de Dra. Helena Braga dura 45 minutos — a duração é por profissional
7. [CO02] A agenda semanal de Dra. Helena Braga: cada turno fixo amarra dia, período e consultório
8. [CO03] Roberto aloca Dra. Helena Braga também na segunda-feira de manhã, em OUTRA sala
9. [AG03] Marcar consulta com Dra. Helena Braga só é possível nos dias desses turnos fixos — o resto do calendário fica bloqueado
10. [CO03] Roberto desfaz a alocação extra — ela foi criada só para mostrar o caso neste vídeo

**Resultado:** Clínica configurada: 12 consultórios (11 ativos), 5 profissionais e as duas modalidades de contrato — percentual (Dra. Nirmala Azalea, 30%) e aluguel fixo por turno (Dra. Helena Braga, R$ 250,00/turno)

---

### 02-paciente-agenda-consulta

**PACIENTE · Maria Silva** — Maria quer marcar uma consulta sozinha, pela internet, sem ligar para a clínica.

IDs: `AG01`

Pré-condições:
- Maria já tem cadastro e senha no portal do paciente
- A clínica já tem profissionais com agenda semanal definida

Passos narrados:
1. [RF-021] Maria Silva entra no sistema com e-mail e senha
2. Maria abre a tela de agendamento do portal
3. [AG01] Maria escolhe a especialidade que precisa: Psicologia
4. [AG01] Maria escolhe a profissional: Dra. Helena Braga
5. [AG01] Maria escolhe o dia 03/08/2026 — o calendário só libera os dias em que essa profissional atende
6. [AG01] Maria escolhe o horário — os intervalos seguem a duração de 45 minutos da consulta
7. [AG01] Maria confirma o agendamento
8. A consulta aparece na lista de consultas de Maria

**Resultado:** Consulta agendada para 03/08/2026 às 13:00 com Dra. Helena Braga (Psicologia)

---

### 03-atendente-agenda-para-paciente

**ATENDENTE · Júlia Nunes** — Um paciente ligou na recepção pedindo consulta. Júlia marca por ele, direto no sistema da clínica.

IDs: `AG02`

Pré-condições:
- Júlia é atendente e tem login próprio
- O paciente já está cadastrado na clínica
- A profissional escolhida já tem turnos fixos, com sala definida

Passos narrados:
1. [RF-021] Júlia Nunes entra no sistema com e-mail e senha
2. [AG02] Júlia atende o telefone e abre um novo agendamento na agenda da clínica
3. [AG02] Júlia procura o paciente que está na linha: Diego Ribeiro
4. [AG02] Júlia escolhe a profissional pedida: Dra. Helena Braga (Psicologia)
5. [AG02] Júlia escolhe o dia 03/08/2026 — o calendário só libera os dias em que Dra. Helena Braga atende
6. [AG02] Júlia lê para o paciente os horários vagos — intervalos de 45 minutos, a duração da consulta dela
7. [AG02] A sala não é escolhida pela atendente: o sistema resolve pelo turno fixo da profissional
8. [AG02] Júlia confirma a consulta de 03/08/2026 às 14:30
9. [AG02] Júlia confere na ficha de Diego Ribeiro: a consulta está lá

**Resultado:** Consulta marcada por telefone: Diego Ribeiro em 03/08/2026 às 14:30 com Dra. Helena Braga (Psicologia), no Consultório 04 — Psicologia — sala definida pelo turno fixo, não pela atendente

---

### 04-atendente-tenta-conflito

**ATENDENTE · Júlia Nunes** — Júlia tenta marcar duas consultas que não podem existir. O resultado ESPERADO deste vídeo é o sistema recusar as duas — nada está com defeito.

IDs: `AG05` `AG03`

Pré-condições:
- Júlia é atendente e tem login próprio
- Cada profissional tem turnos fixos que definem dia, período e sala
- O banco não permite duas consultas na mesma sala, no mesmo dia e hora

Passos narrados:
1. [RF-021] Júlia Nunes entra no sistema com e-mail e senha
2. [AG05] Júlia começa um agendamento para Aline Vieira com Dra. Helena Braga em 03/08/2026
3. Pré-condição: enquanto Júlia digitava, Ana Santos fechou por outro canal exatamente 03/08/2026 às 15:15 no Consultório 04 — Psicologia
4. [AG05] O sistema DEVE recusar: o Consultório 04 — Psicologia já tem consulta às 15:15 em 03/08/2026
5. [AG03] O sistema DEVE recusar: Consultório 01 — Clínica geral não é o turno fixo de Dra. Helena Braga nesse dia

**Resultado:** Os dois bloqueios são o resultado esperado: HTTP 409 para segunda consulta no Consultório 04 — Psicologia em 03/08/2026 às 15:15 (AG05) e HTTP 400 para consulta no Consultório 01 — Clínica geral, que não é o turno fixo de Dra. Helena Braga (AG03). Só a reserva legítima de Ana Santos ficou de pé — nenhuma duplicidade foi criada.

---

### 05-sistema-envia-lembrete

**SISTEMA · Rotina automática diária** — Todo dia à noite, sem ninguém operando o sistema, o ClinicaShare avisa cada paciente que tem consulta no dia seguinte.

IDs: `AG07`

Pré-condições:
- O agendador (cron) é configurado para chamar a rotina uma vez por dia
- A rotina só é aceita com a chave secreta do agendador
- Cada consulta guarda a marca de quando o lembrete foi enviado

Passos narrados:
1. [RF-021] Júlia Nunes entra no sistema com e-mail e senha
2. [AG07] A agenda de amanhã, 28/07/2026: são estas as pessoas que a rotina vai avisar
3. [AG07] Sem a chave secreta do agendador, o sistema recusa o disparo — ninguém dispara lembrete de fora
4. [AG07] Nenhum e-mail é enviado neste vídeo — o disparo de verdade acontece no servidor de produção

**Resultado:** Comprovado: a rotina automática de lembrete existe em /api/cron/lembretes-amanha, é protegida por chave secreta (401 sem ela) e as 3 consulta(s) de 28/07/2026 são as que ela avisaria. Nenhum e-mail foi enviado neste vídeo.

---

### 06-paciente-cancela-consulta

**PACIENTE · Maria Silva** — Maria precisa desmarcar uma consulta que já está marcada — e a clínica precisa saber o motivo.

IDs: `AG06`

Pré-condições:
- Maria já tem cadastro e senha no portal do paciente
- Maria tem uma consulta futura marcada, ainda não realizada

Passos narrados:
1. [RF-021] Maria Silva entra no sistema com e-mail e senha
2. [AG06] Maria abre a lista das próprias consultas no portal
3. [AG06] Maria abre os detalhes da consulta de 03/08/2026 às 13:00
4. [AG06] Maria pede para cancelar e o sistema abre a confirmação pedindo o motivo
5. [AG06] Sem motivo, o cancelamento é recusado — a consulta continua de pé
6. [AG06] Maria escreve a justificativa real — "Vou viajar a trabalho nessa semana" — e confirma
7. [AG06] A consulta fica cancelada e o motivo fica registrado na ficha

**Resultado:** Consulta de 03/08/2026 às 13:00 com Dra. Helena Braga cancelada pela própria paciente — status "Cancelado" e motivo "Vou viajar a trabalho nessa semana" gravados; o horário volta a ficar livre na agenda

---

### 07-profissional-registra-atendimento

**PROFISSIONAL · Dra. Helena Braga** — A Dra. Helena atendeu a paciente e agora precisa registrar a sessão, os procedimentos extras e onde ficou o prontuário.

IDs: `AT01` `AT02` `AT04`

Pré-condições:
- Dra. Helena Braga é profissional ativa, de Psicologia, com agenda semanal fixa
- Ela tem uma consulta agendada na própria agenda
- O prontuário clínico dela é mantido no sistema próprio, fora do ClinicaShare

Passos narrados:
1. [RF-021] Dra. Helena Braga entra no sistema com e-mail e senha
2. [AT01] Dra. Helena abre a própria agenda e vê os atendimentos que ainda precisa fazer
3. [AT01] Ela abre o atendimento de Henrique Macedo das 08:00 direto da agenda
4. [AT01] Dra. Helena inicia o atendimento — a consulta sai de Agendado e entra Em atendimento
5. [AT02] Terminada a sessão, ela abre a tela de finalização e confirma o valor da consulta: R$ 300,00
6. [AT02] Ela lança o 1º procedimento extra: Aplicação de escala de ansiedade — R$ 80,00
7. [AT02] E o 2º procedimento: Relatório psicológico — R$ 150,00
8. [AT04] Dra. Helena declara que o prontuário dela fica fora do sistema e informa onde o registro está
9. [AT02] Dra. Helena confirma a finalização do atendimento
10. [AT04] A ficha passa a mostrar que o prontuário é externo, com a referência salva
11. [AT02] Os dois procedimentos ficam individualizados no valor do atendimento

**Resultado:** Atendimento de Henrique Macedo (27/07/2026, 08:00) finalizado: consulta R$ 300,00 + Aplicação de escala de ansiedade R$ 80,00 + Relatório psicológico R$ 150,00 = R$ 530,00 na base do repasse da Dra. Helena, com prontuário externo em "Sistema próprio da Dra. Helena Braga — ficha 4821"

---

### 08-profissional-preenche-prontuario

**PROFISSIONAL · Dra. Nirmala Azalea** — A Dra. Nirmala acabou de atender e precisa deixar o registro clínico gravado no prontuário da clínica.

IDs: `AT03`

Pré-condições:
- Dra. Nirmala Azalea é profissional ativa, de Clínica geral, com agenda semanal fixa
- Ela tem uma consulta agendada na própria agenda
- O prontuário dela é o interno — o registro clínico fica dentro do ClinicaShare

Passos narrados:
1. [RF-021] Dra. Nirmala Azalea entra no sistema com e-mail e senha
2. [AT03] Dra. Nirmala abre a própria agenda e localiza Gabriel Ferreira, das 17:00
3. [AT03] Ela inicia o atendimento — sem consulta iniciada não existe prontuário para escrever
4. [AT03] Terminada a consulta, ela abre a finalização e confirma o prontuário interno (valor da consulta: R$ 220,00)
5. [AT03] Escopo de hoje, dito na cara: o prontuário são estes quatro campos livres — a estrutura definitiva fica para a R2
6. [AT03] Dra. Nirmala escreve a anamnese e a evolução da consulta
7. [AT03] E fecha com a conduta e o retorno
8. [AT03] Ela confirma a finalização e o prontuário é gravado
9. [AT03] O card “Prontuário registrado” relê o que foi escrito — o registro clínico ficou na ficha da paciente

**Resultado:** Atendimento de Gabriel Ferreira (27/07/2026, 17:00, R$ 220,00) finalizado com os 4 campos do prontuário interno gravados e relidos na tela: anamnese, evolução, conduta e retorno em 30 dias. A estrutura definitiva do prontuário será desenhada na R2.

---

### 09-auxiliar-registra-pagamento

**AUXILIAR · Carla Nogueira** — Carla precisa fechar as cobranças do dia: um atendimento pago, um com desconto e um gratuito — tudo lançado à mão, com justificativa onde a regra exige.

IDs: `FI05` `FI06`

Pré-condições:
- Carla Nogueira é auxiliar — é o papel que responde pelo financeiro da clínica
- A clínica tem atendimentos agendados esperando para serem realizados e cobrados
- O dinheiro é recebido na recepção: o sistema só registra o que aconteceu

Passos narrados:
1. [RF-021] Carla Nogueira entra no sistema com e-mail e senha
2. [FI05] Carla abre a lista de atendimentos da clínica
3. [FI05] Existem exatamente três situações de pagamento — e nenhuma delas é cobrança online
4. [FI05] Carla filtra só os gratuitos para conferir — o status é um filtro de verdade, não um enfeite
5. [FI05] Carla abre o atendimento de Gustavo Moreira para lançar a cobrança
6. [FI05] Ela registra R$ 300,00 recebido na recepção e marca o atendimento como PAGO
7. [FI06] Agora o atendimento de Daniela Castro, que sai com desconto
8. [FI06] A tabela do cadastro é R$ 240,00; Carla lança R$ 150,00 de valor cobrado
9. [FI06] Sem justificativa, o sistema não deixa concluir — desconto sem motivo não entra
10. [FI06] Com a justificativa "Desconto de retorno em 30 dias", a cobrança com desconto é aceita
11. [FI06] A ficha guarda os três dados juntos: valor de tabela, valor cobrado e o motivo do desconto
12. [FI06] Por último, o atendimento de Aline Vieira, que a clínica não vai cobrar
13. [FI06] Carla marca GRATUITO: tabela R$ 280,00, cobrado R$ 0,00 — e o campo de justificativa troca de nome
14. [FI06] Ela escreve o motivo da cortesia e conclui o atendimento gratuito

**Resultado:** Três cobranças fechadas à mão pela auxiliar: R$ 300,00 pago integralmente; R$ 150,00 cobrados sobre tabela de R$ 240,00 (desconto de R$ 90,00 justificado como "Desconto de retorno em 30 dias"); e 1 atendimento gratuito justificado. Nenhum valor entra sozinho — a clínica registra o que recebeu.

---

### 10-admin-fecha-semana-financeira

**ADMINISTRADOR · Roberto Lima** — Roberto vai fechar a semana: conferir quanto cada profissional tem a receber e provar de onde saiu cada número.

IDs: `FI07` `FI03` `FI04`

Pré-condições:
- As semanas anteriores já foram calculadas pelo servidor, toda segunda de manhã
- Os contratos são diferentes: uns pagam percentual sobre o bruto, outros aluguel fixo por turno
- Alguns atendimentos tiveram procedimentos extras além da consulta

Passos narrados:
1. [RF-021] Roberto Lima entra no sistema com e-mail e senha
2. [FI07] Roberto abre o fechamento semanal: 19 repasses agrupados em 4 semanas, de segunda a domingo
3. [FI03] A prestação de contas de Dra. Nirmala Azalea: receita bruta × 30% = valor do repasse
4. [FI04] O que entra na base: consulta + procedimentos extras — detalhamento de Dra. Sofia Pitanga
5. [FI03] O mesmo fechamento com outro contrato: Dra. Helena Braga paga aluguel fixo de R$ 250,00 por turno usado
6. [FI03] Roberto confere: o valor da tela é exatamente o que o servidor recalcula agora

**Resultado:** 19 repasses em 4 semanas · percentual: R$ 400,00 × 30% = R$ 120,00 · aluguel fixo: 5 turnos × R$ 250,00 = R$ 1.250,00 — todos conferidos contra o recálculo do servidor

---

### 11-admin-analisa-relatorios

**ADMINISTRADOR · Roberto Lima** — Roberto quer o retrato do período: quanto entrou, para onde foi, quais salas se pagam e o que a clínica deixou de faturar.

IDs: `RE01` `CO04` `RE03` `RE02` `RE04` `RE05`

Pré-condições:
- A clínica já tem semanas de atendimentos registrados, com repasses pagos e em aberto
- Houve cancelamentos, faltas, cortesias e descontos — todos com motivo registrado

Passos narrados:
1. [RF-021] Roberto Lima entra no sistema com e-mail e senha
2. [RE01] Roberto abre o painel da clínica: receita bruta, repasses em aberto e repasses pagos
3. [CO04][RE03] Ocupação e receita por consultório: o ranking mostra quais salas sustentam a clínica
4. [RE02] Da central de relatórios ao financeiro: receita, repasse estimado e margem por profissional
5. [RE02] Roberto filtra um profissional — Dr. Ricardo Ipê — e o relatório inteiro muda
6. [RE04] Gratuidades e descontos: quanto a clínica deixou de faturar, e por quê
7. [RE05] Cancelamentos e não comparecimentos: quantos foram e o motivo de cada um

**Resultado:** R$ 34.280,00 de receita em 147 atendimentos · R$ 5.513,50 de repasse em aberto e R$ 4.266,00 pagos · sala líder Consultório 06 — Cardiologia com R$ 4.550,00 · R$ 740,00 concedidos em 7 cortesias e 15 descontos · 37 cancelamentos e faltas

---

### 12-controle-de-acesso-por-perfil

**ADMINISTRADOR · Roberto Lima** — Mostrar, perfil por perfil, o que a clínica abre e o que ela fecha para cada tipo de usuário.

IDs: `RF-022`

Pré-condições:
- A clínica tem um usuário para cada perfil: administrador, auxiliar, profissional, atendente e paciente
- Todos usam a mesma tela de login — quem decide o que aparece é o sistema, não o usuário

Passos narrados:
1. [RF-021] Roberto Lima entra no sistema com e-mail e senha
2. [RF-022] O administrador é levado ao painel de gestão da clínica
3. [RF-022] O menu do administrador abre todas as áreas, inclusive dinheiro e auditoria
4. Encerra a sessão pelo menu do topo
5. [RF-021] Carla Nogueira entra no sistema com e-mail e senha
6. [RF-022] A auxiliar financeira também começa pelo painel
7. [RF-022] O menu da auxiliar tem Financeiro, Relatórios e Auditoria — e não tem os cadastros da clínica
8. Encerra a sessão pelo menu do topo
9. [RF-021] Dra. Helena Braga entra no sistema com e-mail e senha
10. [RF-022] A profissional entra e o sistema a leva direto para a agenda DELA
11. [RF-022] O menu da profissional abre só a agenda dela, os atendimentos dela e o perfil dela
12. [RF-022] Dra. Helena tenta abrir a trilha de auditoria da clínica
13. [RF-022] O servidor recusa em bom português: 403, acesso negado para este perfil
14. Encerra a sessão pelo menu do topo
15. [RF-021] Júlia Nunes entra no sistema com e-mail e senha
16. [RF-022] A atendente cai direto na Agenda, não no painel de gestão
17. [RF-022] O menu da atendente tem Agenda, Atendimentos e Pacientes — nada de dinheiro
18. Encerra a sessão pelo menu do topo
19. [RF-021] Maria Silva entra no sistema com e-mail e senha
20. [RF-022] A paciente é levada ao portal do paciente, que é outro sistema
21. [RF-022] O menu da paciente só tem as consultas dela e o cadastro dela
22. [RF-022] Maria tenta o relatório financeiro da clínica e o servidor recusa com 403
23. [RF-022] E ela continua logada: a mesma sessão responde 200 no que é dela
24. Encerra a sessão pelo menu do topo

**Resultado:** Mesma porta de entrada, cinco sistemas diferentes. ADMINISTRADOR: a clínica inteira, com cadastros, financeiro e auditoria. AUXILIAR: financeiro, relatórios e auditoria, sem os cadastros. PROFISSIONAL: só a agenda e os atendimentos dela. ATENDENTE: a agenda do dia, atendimentos e pacientes. PACIENTE: um portal com as próprias consultas. E quem está logado sem permissão recebe 403 — não vê o dado.

---

### 13-profissional-tenta-agenda-de-outro

**PROFISSIONAL · Dra. Nirmala Azalea** — Dra. Nirmala vai tentar alcançar a agenda e o atendimento de outra profissional da clínica. O sistema deve recusar — é isso que este vídeo comprova.

IDs: `RF-023`

Pré-condições:
- Várias profissionais atendem na mesma clínica, na mesma base de dados
- Dra. Renata Jacarandá (Ginecologia) já tem atendimentos registrados
- Dra. Nirmala tem login próprio, com perfil PROFISSIONAL

Passos narrados:
1. [RF-021] Dra. Nirmala Azalea entra no sistema com e-mail e senha
2. [RF-023] Dra. Nirmala abre a agenda dela, em Minha agenda
3. [RF-023] O sistema DEVE devolver só a agenda dela, mesmo ela pedindo a de Dra. Renata Jacarandá
4. [RF-023] O sistema DEVE recusar a abertura de um atendimento de Dra. Renata Jacarandá
5. [RF-023] O mesmo pedido, num atendimento dela, é liberado na hora
6. [RF-023] E a tela dela continua exatamente como estava: a agenda dela

**Resultado:** Os dois "nãos" são a proteção funcionando, não erro. Pedindo a agenda de Dra. Renata Jacarandá, Dra. Nirmala recebeu apenas os próprios atendimentos; abrindo um atendimento de Dra. Renata Jacarandá, recebeu 403. Na mesma sessão, o atendimento dela abriu normalmente (200). Cada profissional só alcança o próprio paciente, o próprio prontuário e o próprio dinheiro.

---

### 14-paciente-recupera-senha

**PACIENTE · Maria Silva** — Maria criou a conta dela no portal, esqueceu a senha e quer voltar a entrar sem depender de ninguém da clínica.

IDs: `RF-026`

Pré-condições:
- Maria é paciente e tem conta no portal, com este e-mail
- A clínica não guarda a senha em texto: nem o suporte consegue lê-la para ela
- A recuperação exige provar o acesso ao e-mail cadastrado

Passos narrados:
1. [RF-026] Maria abre a recuperação de senha a partir do login
2. [RF-026] Maria informa o e-mail cadastrado e pede as instruções
3. [RF-026] Maria abre o link que chegou no e-mail dela
4. [RF-026] Maria escolhe uma senha nova, dentro das regras da clínica
5. [RF-026] Maria confirma a nova senha
6. [RF-026] Maria entra no portal com a senha nova
7. [RF-026] Maria está de volta ao portal dela, por conta própria
8. [RF-026] A senha antiga foi invalidada e o link é de uso único

**Resultado:** Maria voltou a entrar no portal com uma senha escolhida por ela: pediu pela tela, provou o acesso ao e-mail, definiu a nova senha dentro das regras (8+ caracteres, 1 maiúscula, 1 número) e entrou. A senha antiga foi recusada com 401 e o link de recuperação, usado uma vez, deixou de valer.

---

### 15-sessao-expira-por-inatividade

**AUXILIAR · Carla Nogueira** — Mostrar que a sessão de Carla acaba de duas formas: quando ela clica em Sair e quando o computador dela fica sozinho tempo demais.

IDs: `RF-024`

Pré-condições:
- Carla é auxiliar financeira e trabalha num computador compartilhado da recepção
- O painel dela mostra atendimento, valor cobrado e repasse de toda a clínica
- A janela de inatividade configurada no sistema é de 30 minutos

Passos narrados:
1. [RF-021] Carla Nogueira entra no sistema com e-mail e senha
2. [RF-024] Carla está dentro do painel, com o financeiro da clínica na tela
3. Encerra a sessão pelo menu do topo
4. [RF-024] Voltar ao painel já não funciona — o sistema pede login de novo
5. [RF-024] E o encerramento foi no servidor, não só no navegador
6. [RF-021] Carla Nogueira entra no sistema com e-mail e senha
7. [RF-024] Carla entra de novo e é chamada na recepção, deixando o painel aberto
8. [RF-024] O tempo passa: ninguém toca no computador por mais de 30 minutos
9. [RF-024] A mesma sessão, no mesmo computador, passa a ser recusada
10. [RF-024] Quem chegar depois na recepção encontra a tela de login

**Resultado:** A sessão de Carla acaba das duas formas. Clicando em Sair, o cookie é invalidado no servidor e o painel exige login de novo. Sem ninguém mexer, a mesma sessão é recusada com 401 depois de 30 minutos parada. Prontuário e dinheiro não ficam abertos num computador sozinho.

---

### 16-auxiliar-audita-alteracao-financeira

**AUXILIAR · Carla Nogueira** — Carla vai dar baixa num repasse — e o sistema tem que registrar que foi ela, com o valor antes e depois.

IDs: `RF-025`

Pré-condições:
- Existem repasses de semanas já fechadas aguardando pagamento
- Carla é auxiliar administrativa: pode dar baixa em repasse e ler a trilha de auditoria

Passos narrados:
1. [RF-021] Carla Nogueira entra no sistema com e-mail e senha
2. [RF-025] Carla abre os 10 repasses em aberto e dá baixa em um deles
3. [RF-025] Na trilha de auditoria: o que mudou, de quanto para quanto, por quê — e o nome de quem fez
4. [RF-025] Pelo dado: o registro guarda o usuário que agiu, não um autor anônimo
5. [RF-025] Ressalva honesta: o fechamento automático das segundas ainda não deixa rastro na auditoria

**Resultado:** Repasse de Dra. Nirmala Azalea baixado: R$ 120,00 · a auditoria registra Carla Nogueira mudando o campo "status" de "aberto" para "pago", com data, hora e motivo

