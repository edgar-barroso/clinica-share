# ClinicaShare — Contexto do Projeto

## Cliente
Dr. Edson Andrade, proprietário de clínica médica multiprofissional.
Na simulação da disciplina, o cliente é interpretado pelo professor.

## Problema central
A clínica disponibiliza consultórios para profissionais de saúde e recebe
um percentual sobre cada consulta. Não existe controle financeiro sobre
esses repasses — o Dr. Edson não sabe, de forma confiável, quanto deveria
receber por período, por profissional, nem por consultório.

## Solução proposta (ClinicaShare)
Plataforma web para:
- Registrar consultas por profissional e consultório
- Calcular automaticamente o percentual de repasse devido ao Dr. Edson
- Gerar relatórios financeiros por período, profissional e consultório
- Oferecer dashboard com visão financeira consolidada

## Equipe
4 alunos. Responsabilidades distribuídas entre as 5 frentes
(comunicação, planejamento, modelagem, codificação, implementação).
Divisão específica por aluno: ver `estado-equipe.md`.

## Não-escopo (a ser formalizado no Documento de Visão antes de qualquer modelagem)
- Não é prontuário eletrônico completo
- Não é sistema de agendamento avançado
- Não substitui ERP financeiro
- Não armazena dados clínicos de pacientes no MVP

## Riscos estruturais conhecidos
1. Cálculo de repasse é o coração do sistema — erro destrói confiança do cliente
2. Adesão dos profissionais ao registro das consultas é o maior risco não-técnico
3. Inflação de escopo (prontuário, agenda, portal do paciente)
4. Comunicação interna da equipe de 4 sem divisão clara gera retrabalho
5. Dr. Edson como único ponto de contato pode virar gargalo

## Disciplina acadêmica
Projeto é entregue como trabalho de disciplina. A disciplina anterior
(Engenharia de Software) definiu o ferramental metodológico que deve
ser usado. Ver `01-glossario-metodologia.md` para termos e frameworks
que o professor valoriza.
