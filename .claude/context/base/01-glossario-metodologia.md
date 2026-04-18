# Glossário e Metodologia — Engenharia de Software

> Este arquivo consolida os termos, frameworks e práticas que o professor
> da disciplina ensina e espera ver aplicados. É a fonte autoritativa
> do vocabulário técnico a ser usado nas entregas.
>
> **Referência principal:** Pressman, R. S. — Engenharia de Software, 6ª edição.
> **Referências complementares:** Sommerville, Ambler, Tom DeMarco, Kent Beck,
> Martin Fowler, Robert C. Martin, Barbara Liskov, Ivar Jacobson/Booch/Rumbaugh.

## Arcabouço Genérico de Processo (Pressman)

### 5 Atividades de Processo (detalhamento conforme material)

| # | Fase | O que precisa ser feito |
|---|---|---|
| 1 | **Comunicação** | Diálogo e colaboração com cliente/interessados para levantamento de requisitos, necessidades de negócios e definição do escopo |
| 2 | **Planejamento** | Roteiro: estimativas de riscos, recursos (esforço/custo) e cronograma detalhado de tarefas |
| 3 | **Modelagem** | **Análise** (modelos do domínio: informação, função, comportamento) + **Projeto** (dados, arquitetura, interfaces, componentes) |
| 4 | **Construção** | Geração de código-fonte + testes para descobrir erros |
| 5 | **Implantação** | Entrega ao cliente, suporte, manutenção e obtenção de feedback |

Estas 5 fases são sempre acompanhadas pelas atividades guarda-chuva (ver abaixo), que ocorrem paralelamente do início ao fim.

### 5 Atividades Guarda-Chuva (paralelas a todas as fases)
1. Acompanhamento e controle de projeto
2. Gestão de risco
3. Garantia de qualidade de software (SQA)
4. Gestão de configuração (SCM)
5. Revisões técnicas formais (FTR)

Ver `03-atividades-guarda-chuva.md` para artefatos mínimos de cada uma.

### Camadas da Engenharia de Software (Pressman)
1. **Foco na qualidade** (base)
2. **Processo** — "o adesivo que mantém unidas as camadas de tecnologias"
3. **Métodos** — "a técnica de 'como fazer' para construir softwares"
4. **Ferramentas** — "apoio automatizado ou semi-automatizado para processos e métodos"

## Modelos de Processo Ensinados

| Modelo | Descrição (conforme material) | Posição do professor |
|---|---|---|
| **Cascata** | Modelo mais antigo, sequencial linear. Resultado de uma fase = entrada da outra | Recomendado como base conceitual, mas "projetos reais raramente seguem o fluxo sequencial" |
| **Incremental** | Parecido com cascata mas iterativo. 1º incremento = núcleo do produto (requisitos básicos) | Recomendado para equipes pequenas e prazos apertados |
| **RAD** | Sequencial linear com ciclo extremamente curto, baseado em componentes | Uso restrito a "sistemas de informação". Exige modularização |
| **Prototipagem** | Versão inicial para conhecer melhor problemas e soluções | Útil mas arriscado: cliente pode exigir que protótipo vire produto |
| **Espiral** | Combina iteração da prototipagem com controle do cascata. Versões cada vez mais completas | Problema com orçamento fixo: custo revisitado a cada circuito |
| **Processo Unificado (PU/RUP)** | Iterativo e adaptativo. Sistema grande tratado como vários pequenos. Guiado por casos de uso, centrado na arquitetura | Recomendado: "tentativa de apoiar-se nos melhores recursos dos modelos convencionais" |
| **XP** | Orientado a objetos, 4 atividades: planejamento, projeto, codificação, teste. Usa CRC, refatoração | Recomendado para contexto OO |
| **Scrum** | Padrões para projetos com prazos apertados e requisitos mutantes. Equipes pequenas | Recomendado: "maximizar comunicação, minimizar supervisão" |
| **FDD** | Orientado a características (features implementáveis em ≤2 semanas) | Recomendado: funcionalidades pequenas, fácil revisão |
| **Crystal** | Família de metodologias, cooperativo, recursos limitados | Equipes selecionam o membro mais apropriado da família |
| **Modelagem Ágil (AM)** | Valores, princípios e práticas de modelagem leve | "Modelos ágeis são apenas suficientemente bons, não precisam ser perfeitos" |

## Termos-Chave

| Termo | Definição (conforme material da disciplina) |
|---|---|
| **Engenharia de Software** | "Aplicação de uma abordagem sistemática, disciplinada e quantificável, para o desenvolvimento, operação e manutenção do software" |
| **Processo** | "O adesivo que mantém unidas as camadas de tecnologias e permite o desenvolvimento racional e oportuno de softwares" |
| **Arcabouço de Processo** | Conjunto de atividades que estabelece o alicerce para um processo de software, aplicáveis em todo o processo |
| **Padrão de Processo** | Conjunto de atividades, métodos, ferramentas e práticas utilizadas para construir um produto de software |
| **Requisitos** | "Capacidades que um usuário necessita para resolver um problema ou atingir um objetivo" (Thayer & Dorfman) |
| **Cenários de Usuário / Casos de Uso** | Conjunto de cenários para determinar uma linha de uso para o sistema, com descrição detalhada |
| **Padrões de Análise** | Repetições dentro/entre projetos de mesmo domínio que permitem reuso de modelos |
| **Componente (OO)** | Conjunto de classes colaborativas, cada classe com todos os atributos e operações para implementação |
| **Componente (Convencional)** | Elemento funcional de programa com lógica de processamento, estruturas de dados internas e interface |
| **Coesão** | "Indicação qualitativa do grau em que um módulo focaliza apenas uma coisa" |
| **Acoplamento** | "Indicação qualitativa do grau com que um módulo está conectado a outros módulos e ao mundo exterior" |
| **Sistema** | "Conjunto de elementos interrelacionados que interagem no desempenho de uma função" |
| **Refatoração** | "Processo de modificar um sistema de software de modo que não altere o comportamento externo do código" (Fowler) |
| **Elicitação** | Processo de extrair requisitos do cliente por entrevistas, observação, questionários |
| **Requisito funcional (RF)** | Descreve uma função que o sistema deve executar (ação, entrada, saída) |
| **Requisito não-funcional (RNF)** | Restrição de qualidade: desempenho, segurança, usabilidade, confiabilidade |
| **IFQ / QFD** | Implantação de Função de Qualidade. Classificação: Normal (espera), Esperado (assume), Excitante (surpreende) |
| **Modelagem de Análise** | Modela O QUÊ o sistema faz (domínio, requisitos). Independe de tecnologia |
| **Modelagem de Projeto** | Modela COMO o sistema faz (arquitetura, classes, sequência). Depende da stack |
| **Incremento** | Versão parcial funcional do software entregue ao final de uma iteração |
| **MVP** | Menor conjunto de funcionalidades que resolve o problema central do cliente |
| **ADR** | Architecture Decision Record — registro formal de decisão de arquitetura |
| **RMMM** | Risk Mitigation, Monitoring and Management — framework de gestão de risco do Pressman |
| **Exposição ao Risco (RE)** | RE = P × C (probabilidade × custo financeiro do impacto) |
| **Formato CTC** | Condição-Transição-Consequência: "Considerando que \<condição\> então há preocupação de que \<consequência\>" |
| **Time-boxing** | Caixa de tempo por tarefa; ao atingir limite, avança (~90% concluído, 10% adiados) |
| **Regra 40-20-40** | Distribuição de esforço: 40% análise+projeto, 20% codificação, 40% testes |

## Siglas do Material

| Sigla | Significado |
|---|---|
| CMMI | Capability Maturity Model Integration |
| SEI | Software Engineering Institute |
| MPS.BR | Melhoria de Processo do Software Brasileiro |
| PSP / TSP | Personal Software Process / Team Software Process |
| RAD | Rapid Application Development |
| PU / RUP | Processo Unificado / Rational Unified Process |
| UML | Unified Modeling Language |
| OO / AOO / POO | Orientado a Objetos / Análise OO / Projeto OO |
| FDD | Feature Driven Development |
| AM | Agile Modeling |
| IFQ / QFD | Implantação de Função de Qualidade / Quality Function Deployment |
| JAD / FAST | Coleta Colaborativa de Requisitos |
| LOC / KLOC | Linhas de Código / Milhares de linhas de código |
| FP | Function Points (Pontos de Função) |
| COCOMO | Constructive Cost Model (modelo empírico de estimativa) |
| RMMM | Risk Mitigation, Monitoring and Management |
| CTC | Condição-Transição-Consequência (refinamento de risco) |
| RIS | Risk Information Sheet (Formulário de Informação de Risco) |
| RE | Risk Exposure (Exposição ao Risco = P × C) |
| NOP | Net Object Points (pontos por objeto no COCOMO II) |
| COTS | Commercial off-the-shelf |
| CBSE / CBD | Engenharia / Desenvolvimento baseado em componentes |
| DFD | Diagrama de Fluxo de Dados |
| CRC | Class-Responsibility-Collaborator |
| DER | Diagrama Entidade-Relacionamento |
| SQA | Software Quality Assurance |
| FTR | Formal Technical Review (Revisão Técnica Formal) |
| SCM / SCI | Gestão de Configuração / Item de Configuração de Software |
| MTTF / MTTC | Tempo médio entre falhas / Tempo médio para modificação |

## Padrões de Projeto Ensinados (conforme material)

### GoF (Gang of Four)
Referência ao livro "Design Patterns" de Gamma et al. Exemplos citados: Adapter, Singleton.
**GRASP não é mencionado no material.**

### Estilos Arquiteturais
| Estilo | Descrição |
|---|---|
| Centrado nos dados | Repositório / quadro-negro |
| Fluxo de dados | Tubos e filtros |
| Chamada e retorno | Programa principal / subprograma, RPC |
| Orientado a objetos | Comunicação via mensagens entre objetos |
| Em camadas | Camadas hierárquicas com interfaces definidas |
| **MVC** | Model-View-Controller (para WebApps) |

### Padrões de Interface / WebApps (Hipermídia)
Preencher-os-espaços, tabela ordenável, manipulação direta, migalhas de pão (breadcrumbs), edite-no-lugar, busca simples, wizard (perito).

### Padrões de Domínio
Fachada de aplicação, Banco de dados, Motor computacional, Recursos para relatórios, Editor de aplicações.

## Princípios de Design (SOLID + coesão/acoplamento)

| Princípio | Resumo |
|---|---|
| **SRP** (Single Responsibility) | Uma classe, uma razão para mudar (Robert C. Martin) |
| **OCP** (Open/Closed) | Aberto para extensão, fechado para modificação |
| **LSP** (Liskov Substitution) | Subtipos substituem tipos base sem quebrar (Barbara Liskov) |
| **ISP** (Interface Segregation) | Interfaces específicas > interface gorda |
| **DIP** (Dependency Inversion) | Dependa de abstrações, não de implementações |
| **Alta coesão** | "Um módulo focaliza apenas uma coisa" |
| **Baixo acoplamento** | "Módulo conectado minimamente a outros módulos e ao mundo exterior" |

## Técnicas de Elicitação de Requisitos (conforme material)

| Técnica | Descrição |
|---|---|
| **Primeiras Questões (livres de contexto)** | Início da concepção — identificar stakeholders, benefício econômico, objetivos globais |
| **Coleta Colaborativa (JAD/FAST)** | Reunião facilitada com desenvolvedores + clientes + interessados; diferentes pontos de vista |
| **IFQ / QFD** | Transformar necessidades do cliente em requisitos técnicos via entrevistas, observação e dados históricos |
| **Cenários de Usuário (Casos de Uso)** | Entender como funções são usadas na prática por diferentes atores |
| **Prototipagem** | Quando cliente define objetivos gerais mas não detalha E/S — protótipo como mecanismo de definição |

## Estrutura do Documento de Requisitos (Pressman)

O material diz que "especificação significa coisas diferentes para pessoas diferentes" — pode ser documento escrito, modelo gráfico ou protótipo. Para a maioria dos sistemas, as seções obrigatórias dos **Produtos de Trabalho do Levantamento** são:

1. Declaração da necessidade e da viabilidade
2. Afirmação limitada do escopo do sistema/produto
3. Lista de clientes, usuários e outros interessados participantes
4. Descrição do ambiente técnico do sistema
5. Lista de requisitos (preferencialmente por função) e restrições de domínio
6. Conjunto de cenários de uso (informações sob diferentes condições de operação)
7. Quaisquer protótipos desenvolvidos

### Tabelas de Rastreamento obrigatórias
| Tabela | O que liga |
|---|---|
| **Rastreamento de características** | Requisitos → características do produto |
| **Rastreamento de fontes** | Requisitos → origem (quem/quando/onde) |
| **Rastreamento de dependência** | Requisitos → outros requisitos relacionados |
| **Rastreamento de subsistemas** | Requisitos → subsistema que governam |
| **Rastreamento de interface** | Requisitos → interfaces externas/internas |

## Técnicas de Estimativa (conforme material)

> **T-shirt sizing e Planning Poker NÃO são ensinados no material.**

| Técnica | Fórmula/Método | Quando usar |
|---|---|---|
| **LOC (3 pontos)** | S = (S_ot + 4×S_m + S_pess) / 6 | Decompor em funções, estimar tamanho em linhas com dados históricos |
| **Pontos por Função (FP)** | FP = contagem_total × [0,65 + 0,01 × Σ(Fi)] — 14 fatores de ajuste | Dimensionar por domínio de informação (entradas, saídas, consultas, arquivos, interfaces) |
| **Estimativa com Casos de Uso** | Baseada em nº de cenários e páginas | Requisitos documentados em casos de uso estruturados |
| **Baseada em Processo** | Matriz funções × atividades → esforço por cruzamento | Cross-check para comparar com LOC/FP |
| **COCOMO II** | NOP = pontos_por_objeto × [(100 − %reuso) / 100]; Esforço = NOP / PROD | Primeiros estágios — prototipagem, avaliação tecnológica |
| **Equação de Software** | E = [LOC × B^0.333 / P]³ × (1/t⁴) | Prever esforço/tempo considerando maturidade do processo |
| **Estimativa Ágil** | Volume por cenário/história, somar para incremento | Projetos iterativos curtos (3-6 semanas), requisitos dinâmicos |

## Cronograma (conforme material)

| Conceito | Descrição |
|---|---|
| **Gantt** | Visualizar tarefas no tempo, dependências, caminho crítico |
| **PERT/CPM** | Identificar caminho crítico e janelas de tempo |
| **Rede de tarefas** | Representação gráfica de atividades com interdependências |
| **Caminho crítico** | Cadeia que determina duração total — atraso aqui = atraso no projeto |
| **Regra 40-20-40** | 40% análise+projeto, 20% codificação, 40% testes |
| **Time-boxing** | Caixa de tempo por tarefa; ao atingir limite, avança (~90% concluído) |

## Testes (conforme material — abordagem incremental: "varejo" → "atacado")

### Níveis de teste
| Nível | O que verifica |
|---|---|
| **Unitário** | Menor unidade (componente/módulo): caminhos de controle, estruturas de dados locais |
| **Integração** | Erros de interface entre módulos (descendente, ascendente, sanduíche) |
| **Fumaça (Smoke)** | Sistema ponta-a-ponta diário — expõe erros bloqueadores |
| **Regressão** | Reexecução de testes existentes após modificação — sem efeitos colaterais |
| **Validação** | Software satisfaz requisitos funcionais, comportamentais e de desempenho |
| **Sistema** | Todos os elementos combinados; inclui recuperação, segurança, estresse, desempenho |
| **Aceitação** | Conduzido pelo cliente para validar todos os requisitos |
| **Alfa / Beta** | Alfa: local do dev, ambiente controlado. Beta: local do cliente, "ao vivo" |

### Técnicas de projeto de casos de teste
| Abordagem | Técnicas |
|---|---|
| **Caixa-branca** | Caminho básico (complexidade ciclomática), teste de condição, fluxo de dados, teste de ciclo |
| **Caixa-preta** | Grafo de objetos, particionamento de equivalência, análise de valor-limite (BVA), matriz ortogonal |

### Especificação de Teste (3 partes)
1. **Plano de Teste** — estratégia, fases, critérios (integridade de interface, validade funcional, desempenho), cronograma
2. **Procedimento de Teste** — ordem de integração, lista de casos de teste com resultados esperados
3. **Relatório de Teste** — resultados reais, problemas, peculiaridades para manutenção

## Métricas de Processo vs Métricas de Produto (Pressman)

| Tipo | O que mede | Exemplos |
|---|---|---|
| **Processo** | Eficiência da equipe e das práticas | Tempo em RTFs, taxa de defeitos em revisão, % retrabalho, MTTC |
| **Produto** | Qualidade do software entregue | LOC, FP, cobertura de testes, MTTF, complexidade ciclomática |

O professor valoriza métricas de processo para melhoria contínua. Registrar pelo
menos: tempo de revisão por artefato e defeitos encontrados antes vs depois do merge.

### Métricas de Modelagem (detalhamento conforme material)

| Categoria | Métricas | Propósito |
|---|---|---|
| **Arquitetural** | Tamanho/Profundidade/Largura, razão arco-nó, DSQI, fan-out/fan-in | Qualidade estrutural da arquitetura |
| **OO — Conjunto CK** | WMC (métodos ponderados), DIT (profundidade herança), NOC (nº filhos), CBO (acoplamento entre classes), RFC (resposta para classe), LCOM (falta de coesão) | Estrutura OO, complexidade, reusabilidade |
| **OO — Conjunto MOOD** | MIF (fator herança de métodos), CF (fator acoplamento) | Inter-relação e herança OO |
| **Lorenz e Kidd** | Tamanho da classe, NOA (operações adicionadas) | Volume e esforço de teste |
| **Componente convencional** | Coesão (data slices/tokens, aglutinação), Acoplamento (global, dados, controle, ambiental), Complexidade ciclomática | "3 Cs": coesão, acoplamento, complexidade |
| **Análise** | Pontos por Função (FP), qualidade de especificação (especificidade, verificabilidade, completude) | Tamanho do sistema, qualidade dos requisitos |
| **Interface** | LA (adequação de leiaute — custo de transição visual por frequência de uso) | Usabilidade da IGU |

## Formato Esperado dos Entregáveis

> Templates baseados nos modelos fornecidos pelo professor + exemplos de turmas anteriores.

| Entregável | Template | Fase |
|---|---|---|
| Ata de Reunião | `entregavel-template-ata-reuniao.md` | Comunicação (toda reunião) |
| Documento de Visão + ROI | `entregavel-template-documento-visao.md` | Planejamento |
| ROI (separado, se necessário) | `entregavel-template-roi.md` | Planejamento |
| Documento de Requisitos (SRS) | `entregavel-template-srs.md` | Comunicação → Planejamento |
| Modelo de Caso de Uso (documento + detalhamento) | `entregavel-template-caso-de-uso.md` | Modelagem (análise) |
| Glossário do Projeto | `entregavel-template-glossario-projeto.md` | Comunicação → todas |
| Diagrama de Casos de Uso | _(Draw.io — modelo do professor)_ | Modelagem (análise) |
| Diagrama de Classes | _(Draw.io — modelo do professor)_ | Modelagem (projeto) |
| Diagrama de Sequência | _(Draw.io — modelo do professor)_ | Modelagem (projeto) |
| Diagrama de Atividade / Raias | _(Mermaid / Draw.io)_ | Modelagem (análise) |
| Diagrama de Estado | _(Mermaid / Draw.io)_ | Modelagem (análise/projeto) |
| Diagrama de Componentes | _(Draw.io)_ | Modelagem (projeto) |
| Diagrama de Implantação | _(Draw.io / PlantUML)_ | Modelagem (projeto) |
| DER (níveis) | _(Draw.io / dbdiagram.io)_ | Modelagem (projeto) |
| DFD | _(Draw.io)_ | Modelagem (análise convencional) |
| Protótipo de tela | _(Figma / wireframe manual)_ | Modelagem |
| Planilha de Preços | _(Excel — modelo do professor)_ | Planejamento |
| Checklist RTF | `entregavel-template-checklist-rtf.md` | Todas (guarda-chuva) |

## Critérios de Qualidade de Requisito (conforme material)
Todo requisito confirmado deve ser:
1. **Não-ambíguo / Claro** — não permite más interpretações; declaração claramente estabelecida
2. **Verificável (Testável)** — é possível especificar testes (critérios de validação) para confirmá-lo
3. **Consistente** — não conflita com outros requisitos; alinhado ao objetivo global do sistema
4. **Rastreável e com fonte identificada** — origem conhecida (pessoa, regulamento, documento); relacionável a partes e modelos do sistema
5. **Limitado / Delimitado** — limitado em termos quantitativos e com nível de detalhe adequado
6. **Realizável (Atingível)** — possível de ser implementado dentro do ambiente técnico do sistema

Qualidade e validação verificadas via **revisões técnicas formais (RTF)** e **checklists**.

## Artefatos do Processo Unificado (conforme material do professor)

O material lista os seguintes artefatos por fase do PU/RUP. Usar como referência
para decidir quais entregáveis produzir no ClinicaShare:

| Fase PU | Artefato | Descrição |
|---|---|---|
| **Concepção** | Documento de visão | Visão global do projeto e necessidades do negócio |
| **Concepção** | Modelo inicial de caso de uso | Como atores interagem com o sistema (10-20% completo) |
| **Concepção** | Glossário do projeto | Vocabulário preliminar |
| **Concepção** | Caso de negócio / ROI | Justificativa de negócio para o software |
| **Concepção** | Avaliação inicial de risco | Riscos de negócio e de projeto |
| **Concepção/Elaboração** | Plano de projeto | Fases, iterações e cronograma |
| **Elaboração** | Protótipo arquitetural | Demonstra viabilidade da arquitetura |
| **Elaboração** | Modelo de análise | Domínio informacional, funcional e comportamental |
| **Elaboração** | Descrição da arquitetura | Subsistemas, funções e características |
| **Elaboração** | Modelo de projeto | Classes de projeto, subsistemas e interfaces |
| **Elaboração** | Manual preliminar do usuário | Documentação inicial para o usuário |
| **Construção** | Componentes de software | Código que concretiza o sistema |
| **Construção** | Plano e procedimento de teste | Estratégia de testes + casos de teste |
| **Construção** | Documentação de apoio | Manuais de usuário e instalação |
| **Transição** | Relatório de teste beta | Feedback e solicitações de modificação |

## Erros Clássicos de Projeto (conforme material)

Sinais de que o projeto está comprometido (John Reel, via Pressman):
1. Equipe não entende as necessidades do cliente
2. Escopo maldefinido
3. Modificações mal gerenciadas
4. Tecnologia escolhida sofre modificações
5. Necessidades do negócio mudam ou são maldefinidas
6. Prazos irreais
7. Usuários resistentes
8. Patrocínio perdido
9. Equipe sem aptidões adequadas
10. Gerentes evitam melhores práticas e lições adquiridas

**Erros específicos de requisitos:**
- Escopo: limite do sistema mal definido ou cliente especifica detalhes técnicos desnecessários
- Entendimento: clientes não estão completamente certos do que é necessário
- Volatilidade: requisitos mudam ao longo do tempo

**Regra do material:** "Uma definição inicial malfeita é a principal causa de esforços malsucedidos de software."

## Critérios de Avaliação Conhecidos

> **IMPORTANTE:** O material da disciplina é estritamente teórico (Pressman, Sommerville).
> Não contém rubrica, peso de nota, templates obrigatórios nem critérios explícitos
> de avaliação para o projeto dos alunos. Os templates e critérios usados neste KB
> são **decisão da equipe**, baseados nas boas práticas do material.
>
> **Ação necessária:** perguntar ao professor quais entregáveis são obrigatórios,
> em que formato, e qual a rubrica de avaliação. Registrar em `estado-decisoes-tomadas.md`
> quando obtido.

_(A preencher quando o professor explicitar)_
