# Playbook 05 — Implementação

## Quando usar este playbook
Deploy, configuração de ambiente, banco de dados, CI/CD, entrega final
ao cliente (professor).

## Mindset
Modo ENTREGA CONFIÁVEL. A demo para o Dr. Edson não pode quebrar. Não
importa se o código é lindo — se o deploy falha na hora da apresentação,
a nota cai.

## Pré-requisitos obrigatórios
- Código funcional com testes passando
- Stack e ambiente alvo decididos em `estado-decisoes-tomadas.md`

## Sub-tarefas
- Preparar ambiente de execução (local + eventual servidor de demo)
- Migrations de banco de dados versionadas
- Seed de dados para demo (cenário do Dr. Edson)
- Deploy (manual ou automatizado)
- Smoke test pós-deploy
- Runbook escrito para a equipe conseguir subir de novo se quebrar
- Handoff: entrega documentada ao cliente
- **Manual de uso** para o Dr. Edson (1-2 páginas, com screenshots)
- **Roteiro de feedback pós-demo** (perguntas para coletar impressão do cliente)

## Armadilhas
- **Deploy sem backup.** Se não tem como voltar atrás, não faz deploy.
- **Migração destrutiva sem rollback.** Toda migration precisa de reversa
  testada.
- **Credenciais em repositório.** Secret em `.env` fora do Git, sempre.
- **"Funciona na minha máquina".** Se não roda em outra, não roda. Ponto.
- **Demo sem ensaio.** Ensaiar a demo antes da apresentação é obrigatório.
  Erros de demo são erros evitáveis.
- **Seed genérico.** O seed tem que contar a história do Dr. Edson:
  profissionais com nomes, consultas reais, repasses calculáveis à mão
  para verificar.

## Outputs típicos
- Runbook de deploy
- Checklist de go-live
- Documento de ambiente (variáveis, dependências, portas)
- Script de seed para demo
- Roteiro de demonstração para o cliente

## Checklist de go-live
- [ ] Backup do estado atual feito?
- [ ] Migration reversível testada?
- [ ] Seed da demo rodou sem erro?
- [ ] Smoke test pós-deploy passou?
- [ ] Credenciais fora do repositório?
- [ ] Runbook atualizado?
- [ ] Equipe alinhada sobre papéis na apresentação?

## Critérios de saída desta fase
- [ ] Sistema rodando em ambiente acessível ao cliente
- [ ] Demo ensaiada pela equipe
- [ ] Manual de uso entregue ao Dr. Edson
- [ ] Feedback do cliente coletado pós-demo
- [ ] Runbook atualizado e testado por outro membro da equipe

## Metacomentário (obrigatório no output)
Ver §5 da instrução mestre.
