# Playbook 02 — Planejamento

## Quando usar este playbook
Escopo, backlog, sprints, estimativas, decisões de arquitetura e stack.

## Mindset
Modo PRIORIZAÇÃO E TRADE-OFF. Cada item que entra no backlog empurra
outro para fora. Cada decisão de arquitetura fecha portas. Explicite os
trade-offs; não esconda.

## Sub-tarefas
- Definir e defender o MVP (o mínimo que resolve o problema do Dr. Edson)
- Decompor o escopo em épicos → histórias → tarefas
- Priorizar com MoSCoW (Must / Should / Could / Won't)
- Estimar em 2 passes:
  - **1º passe (planejamento):** estimativa macro por decomposição de funções.
    Usar LOC 3 pontos ou FP simplificado para dimensionar. Suficiente para Gantt inicial.
  - **2º passe (pós-modelagem):** recalcular com técnica mais precisa quando
    os casos de uso estiverem classificados (simples/médio/complexo). Atualizar Gantt.
  - **Nunca apresentar estimativa baseada em casos de uso sem casos de uso prontos** —
    o professor sabe que é dependência.
  Ver técnicas detalhadas em `01-glossario-metodologia.md`
- Propor arquitetura (camadas, módulos, integrações)
- Decidir stack com ADR (Architecture Decision Record) registrado em
  `estado-decisoes-tomadas.md`

## Técnicas de Estimativa (conforme material — Pressman)

> **Nota:** T-shirt sizing e Planning Poker **não são ensinados no material**.
> O "jogo de planejamento" do XP é citado brevemente. Usar as técnicas abaixo.

| Técnica | Fórmula/Método | Quando usar |
|---|---|---|
| **LOC (3 pontos)** | S = (S_ot + 4×S_m + S_pess) / 6 | Decompor em funções e estimar tamanho em linhas com base em dados históricos |
| **Pontos por Função (FP)** | FP = contagem_total × [0,65 + 0,01 × Σ(Fi)] (14 fatores de ajuste) | Dimensionar por domínio de informação: entradas, saídas, consultas, arquivos, interfaces |
| **Estimativa com Casos de Uso** | Baseada em nº de cenários e páginas de cada caso de uso | Quando requisitos estão documentados em casos de uso estruturados |
| **Baseada em Processo** | Matriz funções × atividades → esforço (pessoas-mês) por cruzamento | Cross-check para comparar com LOC/FP |
| **COCOMO II** | NOP = pontos_por_objeto × [(100 − %reuso) / 100]; Esforço = NOP / PROD | Primeiros estágios — prototipagem de IGU e avaliação tecnológica |
| **Equação de Software** | E = [LOC × B^0.333 / P]³ × (1/t⁴) | Prever esforço e tempo considerando maturidade do processo |
| **Estimativa Ágil** | Estimar volume por cenário/história e somar para o incremento | Projetos iterativos curtos (3-6 semanas) com requisitos dinâmicos |

## Cronograma (conforme material)

| Conceito | Descrição |
|---|---|
| **Rede de tarefas** | Representação gráfica das atividades com interdependências (sequenciais/paralelas) |
| **Caminho crítico** | Cadeia de tarefas que determina duração total do projeto — atraso aqui = atraso no projeto |
| **Regra 40-20-40** | 40% análise+projeto, 20% codificação, 40% testes — usar como referência na distribuição |
| **Time-boxing** | Caixa de tempo em volta de cada tarefa; ao atingir limite, avança (~90% concluído, 10% adiados) |
| **Gantt** | Visualizar tarefas no tempo, dependências, caminho crítico |
| **PERT/CPM** | Identificar caminho crítico e janelas de tempo das tarefas |

## Gestão de Risco (conforme material — framework RMMM)

O material ensina o framework **RMMM (Risk Mitigation, Monitoring and Management)**.

### Tabela de Risco
- Listar todos os riscos, categorizar, atribuir **probabilidade (%)** e **impacto (1-4)**
- Impacto: 1=Catastrófico, 2=Crítico, 3=Marginal, 4=Negligível
- Ordenar por probabilidade × impacto; traçar **linha de corte** para priorização
- **Exposição ao Risco:** RE = P × C (probabilidade × custo financeiro do impacto)

### Formato CTC (Condição-Transição-Consequência)
*"Considerando que \<condição\> então há a preocupação de que (possivelmente) \<consequência\>"*

### Plano RMMM por risco
| Componente | O que fazer |
|---|---|
| **Atenuação** | Estratégias proativas para evitar o risco |
| **Monitoração** | Acompanhar fatores que indicam materialização |
| **Gestão/Contingência** | Plano de ação caso atenuação falhe |

Usar **Formulários de Informação de Risco (RIS)** quando necessário.
Manter `estado-riscos.md` atualizado com probabilidade, impacto, exposição e plano RMMM.

## Armadilhas
- **Inflação de escopo.** Se aceitar "só mais isso" 3 vezes, o MVP virou V2.
- **Estimativa sem referência.** Nunca estimar no vácuo; sempre comparar
  com alguma história já concluída ou conhecida.
- **Stack por modinha.** Escolher tecnologia pela hype, não pela aderência
  ao problema e à familiaridade da equipe de 4.
- **Decisão oral.** Se não está em `decisoes-tomadas.md`, a decisão não
  existe e vai ser re-debatida daqui a 2 semanas.

## Outputs típicos
- Documento de Visão (`entregavel-template-documento-visao.md`)
- Backlog priorizado com MoSCoW
- Sprint plan (objetivo, escopo, capacidade)
- ADR por decisão relevante
- Estimativa de ROI (`entregavel-template-roi.md`)
- **Cronograma em Gantt** (identificar dependências e caminho crítico)
- **Registro de riscos** inicial → `estado-riscos.md`
- **Divisão de trabalho da equipe** → `estado-equipe.md`

## Pré-requisitos para sair desta fase
- MVP definido e registrado
- Stack decidida e registrada
- Arquitetura macro desenhada (diagrama de componentes)
- Primeiro sprint planejado

## Critérios de saída desta fase
- [ ] MVP definido e registrado em `estado-decisoes-tomadas.md`
- [ ] Stack decidida e registrada
- [ ] Arquitetura macro desenhada (diagrama de componentes)
- [ ] Backlog priorizado (MoSCoW)
- [ ] Cronograma Gantt gerado
- [ ] `estado-riscos.md` populado com riscos iniciais
- [ ] `estado-equipe.md` com divisão de responsabilidades
- [ ] Primeiro sprint planejado

## Metacomentário (obrigatório no output)
Ver §5 da instrução mestre.
