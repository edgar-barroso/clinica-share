# Playbook 04 — Codificação

## Quando usar este playbook
Escrita, revisão e refatoração de código; definição de estrutura de pastas,
padrões, testes.

## Mindset
Modo EXECUÇÃO DISCIPLINADA. Código só existe para concretizar um requisito
validado. Escrever código "por enquanto" gera dívida que paga juros.

## Pré-requisitos obrigatórios
Não entre nesta fase sem:
- Stack decidida e registrada em `estado-decisoes-tomadas.md`
- Casos de uso modelados para a funcionalidade em questão
- Modelo de dados definido para as entidades envolvidas

Se faltar qualquer um, pare e volte para o Playbook 02 ou 03.

## Ponte projeto ↔ IDE (Claude Code / outra IDE com IA)

A codificação acontece na IDE, não no chat do projeto. O chat do projeto é coach
metodológico; a IDE é executor de código. Para manter coerência entre os dois:

### Do projeto → repositório (antes de codar)
1. **Gerar `CLAUDE.md`** na raiz do repositório com:
   - Regras inegociáveis (Decimal, audit log, testes financeiros, sem float)
   - Convenções de código (Conventional Commits, branches, SOLID)
   - Stack decidida e padrões arquiteturais
   - Link/referência para requisitos e casos de uso
2. **Espelhar em `docs/estado/`** no repo os arquivos relevantes:
   - `requisitos-confirmados.md`, `decisoes-tomadas.md`, `riscos.md`
3. **Espelhar em `docs/diagramas/`** os diagramas Mermaid / exports de Draw.io

### Da IDE → projeto (depois de codar)
Ao finalizar uma sessão de codificação, trazer de volta para o chat do projeto:
- Decisões técnicas tomadas durante a implementação (ex: escolha de lib, mudança de modelo)
- Pendências ou dúvidas que surgiram
- Riscos novos identificados

O chat do projeto registra essas informações nos arquivos `estado-*.md`.

### Quando gerar o `CLAUDE.md`
Gerar na **transição para a fase de Construção**, após stack decidida e casos de uso
modelados. Se a stack mudar, regenerar. Pedir ao chat do projeto:
*"Gere o CLAUDE.md para o repositório com base no estado atual do KB."*

## Sub-tarefas
- Definir estrutura de pastas (camadas, módulos)
- Aplicar padrões de projeto quando justificados (não por ornamento)
- Escrever código que implementa casos de uso validados
- **Testes unitários obrigatórios para todo cálculo financeiro** (repasse,
  agregações, somas por período)
- Implementar audit log em toda alteração financeira
- Code review entre os 4 da equipe antes de merge
- **Endpoints de cálculo financeiro devem ser idempotentes** — chamar 2x
  não pode duplicar repasse. Validar contra race conditions.
- Garantir que o modelo de dados suporta audit log robusto (tabela
  `audit_logs` com `user_id, timestamp, entidade, campo, valor_antes,
  valor_depois, motivo`). Se o DER não prevê, voltar ao Playbook 03.

## Estratégia de Testes (conforme material — Pressman)

A abordagem é incremental: começa "no varejo" (componente) e progride para "atacado" (sistema inteiro).

### Níveis de teste

| Nível | O que verifica | Quando aplicar no ClinicaShare |
|---|---|---|
| **Unitário** | Menor unidade (componente/módulo): caminhos de controle, estruturas de dados locais | Todo cálculo financeiro **obrigatoriamente**. Demais módulos conforme viável |
| **Integração** | Erros de interface entre módulos (descendente, ascendente, sanduíche) | Quando módulos são conectados (ex: serviço de repasse → banco) |
| **Fumaça (Smoke)** | Sistema inteiro ponta-a-ponta, diário, expõe erros "bloqueadores" | A cada build/deploy — mecanismo de marca-passo |
| **Regressão** | Reexecução de testes existentes após modificação, garantir sem efeitos colaterais | A cada novo módulo adicionado ou modificação relevante |
| **Validação** | Software satisfaz todos os requisitos funcionais, comportamentais e de desempenho | Após integração — usar Critérios de Validação derivados dos requisitos |
| **Sistema** | Todos os elementos combinados (software + hardware + BD + pessoal); inclui recuperação, segurança, estresse, desempenho | Antes da entrega final |
| **Aceitação** | Conduzido pelo cliente (Dr. Edson / professor) para validar todos os requisitos | Demo final — pode ser informal ("volta de teste") ou sistemática |
| **Alfa** | No local do desenvolvedor, pelo cliente, ambiente controlado | Se o professor fizer demo presencial |
| **Beta** | No local do cliente, sem controle do desenvolvedor | Se aplicável (sistema web acessível externamente) |

### Técnicas de projeto de casos de teste

| Abordagem | Técnicas | Quando usar |
|---|---|---|
| **Caixa-branca** (caixa de vidro) | Caminho básico (complexidade ciclomática), teste de condição, fluxo de dados, teste de ciclo | Examinar caminhos lógicos internos — especialmente em lógica de cálculo de repasse |
| **Caixa-preta** (comportamental) | Grafo de objetos, particionamento de equivalência, análise de valor-limite (BVA), matriz ortogonal | Focalizar requisitos funcionais e domínio de entrada — telas, APIs, cenários do usuário |

### Especificação de Teste (documento esperado)

O material define 3 partes:

1. **Plano de Teste:**
   - Estratégia global de integração
   - Divisão em fases/construções (interação com usuário, manipulação de dados, geração de tela, gestão de BD)
   - Critérios: integridade da interface, validade funcional, conteúdo informacional, desempenho
   - Cronograma com datas, janelas de disponibilidade, ambiente e recursos

2. **Procedimento de Teste:**
   - Ordem de integração e testes correspondentes
   - Lista de todos os casos de teste (anotados) com resultados esperados

3. **Relatório de Teste:**
   - Histórico de resultados reais, problemas encontrados e peculiaridades para manutenção

## Armadilhas
- **Codar sem requisito.** Regra de ouro: se não está em `requisitos-confirmados.md`,
  não implementa.
- **Float em dinheiro.** `float`/`double` nunca. Sempre inteiro em centavos
  ou tipo Decimal.
- **Cálculo financeiro sem teste.** Regra inegociável (ver
  `02-regras-inegociaveis.md`). Sem teste, sem merge.
- **Audit log "pra depois".** Pra depois = nunca. Audit log entra junto
  com a feature financeira, não depois.
- **Misturar camadas.** Lógica de negócio em controller, SQL em view,
  regra de cálculo no front-end. Refatorar antes do merge.
- **Copy-paste de exemplo da internet.** Sempre entender antes de colar.

## Convenções de código
- **Commits:** Conventional Commits (`feat:`, `fix:`, `docs:`, `test:`, `refactor:`)
- **Branches:** `feature/xxx`, `fix/xxx`, `docs/xxx`
- **Main protegida:** merge só via PR com ao menos 1 review
- **SOLID:** aplicar quando natural, especialmente SRP e DIP. Ver `01-glossario-metodologia.md`
- **Coesão alta, acoplamento baixo:** cada módulo faz uma coisa bem feita

## Checklist de code review
- [ ] Implementa um requisito confirmado? Qual?
- [ ] Tem teste unitário? Especialmente se mexe com dinheiro.
- [ ] Tem audit log quando alteração financeira?
- [ ] Respeita a estrutura de pastas definida?
- [ ] Nomes claros? Sem abreviações obscuras?
- [ ] Funciona para casos de erro? (valor negativo, zero, null)
- [ ] Não usa float/double para dinheiro?
- [ ] Documentação inline em decisões não-óbvias?
- [ ] Respeita SRP? (uma classe, uma responsabilidade)
- [ ] Dependências invertidas onde aplicável? (DIP)
- [ ] Alta coesão, baixo acoplamento?

## Outputs típicos
- Código com testes
- Descrição de PR com link para o(s) requisito(s) que cumpre
- Checklist de review preenchido

## Critérios de saída desta fase
- [ ] Todo código implementa requisito rastreável
- [ ] Testes unitários passando (100% cobertura em cálculo financeiro)
- [ ] Audit log implementado em toda alteração financeira
- [ ] Code review feito por outro membro da equipe
- [ ] Sem float/double para valores monetários
- [ ] README do repositório atualizado (setup local, dependências)

## Metacomentário (obrigatório no output)
Ver §5 da instrução mestre.
