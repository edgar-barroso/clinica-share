# Playbook 03 — Modelagem

## Quando usar este playbook
UML (casos de uso, classes, sequência, atividade), modelo de dados,
fluxos de processo, protótipos de tela.

## Mindset
Modo ABSTRAÇÃO. O objetivo é representar o domínio do Dr. Edson
com fidelidade e clareza suficientes para guiar a implementação, sem
virar arte ou sobre-engenharia.

## Pré-requisitos obrigatórios
Não entre nesta fase sem ter:
- Requisitos confirmados em `estado-requisitos-confirmados.md`
- MVP definido em `estado-decisoes-tomadas.md`

Se faltar qualquer um, pare e volte para o Playbook 01 ou 02.

## Separação obrigatória: Análise vs Projeto (Pressman)

| Aspecto | Modelagem de Análise (O QUÊ) | Modelagem de Projeto (O COMO) |
|---|---|---|
| **Foco** | Requisitos nos domínios da informação, funcional e comportamental | Dados, arquitetura, interfaces e componentes de software |
| **Abstração** | Alta — jargão do domínio de negócios | Baixa — detalhes técnicos para guiar codificação |
| **Diagramas** | Casos de uso, atividade, raias, DFD, classes de análise, pacotes, CRC, estado, sequência inicial | Classes de projeto (refinadas), colaboração detalhada, componentes, implantação, projeto de dados/BD, IGU |

### Modelagem de Análise — artefatos
- Casos de uso + diagrama de casos de uso
- Diagrama de classes conceitual (entidades do domínio, sem tipos de dado)
- Diagrama de atividade / raias (fluxo de negócio)
- Diagrama de estado (comportamento dirigido por eventos)
- Modelo CRC (Class-Responsibility-Collaborator)

### Modelagem de Projeto — artefatos
- Diagrama de classes detalhado (tipos, métodos, visibilidade, estereótipos)
- Diagrama de sequência técnico
- Diagrama de colaboração detalhado
- Diagrama de componentes (estrutura interna, interfaces "pirulito")
- Modelo ER físico (tipos de coluna, constraints)
- Diagrama de implantação (onde roda cada componente)
- Protótipo de tela / projeto de interface (IGU)

**Nunca misture análise e projeto no mesmo diagrama.**

## Referência rápida — Diagramas UML (conforme material)

| Diagrama | Fase | Elementos obrigatórios |
|---|---|---|
| **Casos de uso** | Análise | Atores (bonecos/quadrados), elipses (casos de uso), pacotes funcionais |
| **Atividade** | Análise | Retângulos arredondados, setas de fluxo, losangos de decisão, barras de paralelismo |
| **Raias (Swimlanes)** | Análise | Elementos de atividade + segmentos verticais dividindo responsabilidades por ator/classe |
| **Classe** | Análise/Projeto | Nome, atributos, operações, associações, multiplicidade, dependências, estereótipos |
| **Estado** | Análise | Retângulos arredondados (3 áreas: nome, variáveis, atividades), setas com eventos/guardas/ações |
| **Sequência** | Análise→Projeto | Eixo vertical (tempo), eixo horizontal (objetos/classes), setas (mensagens) |
| **Colaboração** | Projeto | Objetos, setas de mensagens, sintaxe detalhada das mensagens |
| **Componente** | Projeto | Caixa do componente, linhas pontilhadas (dependências), "pirulito" (interfaces) |
| **Implantação** | Projeto | Caixas 3-D (hardware/nós), subsistemas em seu interior |

## Sub-tarefas

### Casos de uso
- Um caso de uso por requisito funcional confirmado
- Usar `entregavel-template-caso-de-uso.md` (formato do professor: UC001, fluxos numerados, exceções com referência ao passo, aprovação)
- Atores identificados (Dr. Edson, profissional, recepção — conforme confirmado)
- Fluxo principal + fluxos alternativos + exceções
- Nunca inventar ator que não está em `estado-decisoes-tomadas.md`
- **Elementos obrigatórios:** atores, elipses, pacotes funcionais

### Diagrama de classes
- **Análise:** entidades do domínio (Profissional, Consultório, Consulta, Repasse, etc.) — sem tipos de dado, foco no domínio
- **Projeto:** refinamento com tipos, visibilidade (+/-/#), métodos, estereótipos de implementação
- Atributos apenas os necessários para o MVP
- Relacionamentos com cardinalidade explícita
- Métodos apenas quando a responsabilidade é clara

### Diagrama de estado
- Para classes/entidades com comportamento dirigido por eventos
- Candidato natural: entidade `Repasse` (estados: pendente → calculado → aprovado → pago)
- 3 áreas por estado: nome, variáveis de estado, atividades do estado

### Diagrama de sequência
- Um por caso de uso crítico (especialmente o de cálculo de repasse)
- Mostra interação entre ator, UI, serviço, domínio, persistência
- **Análise:** versão inicial, foco em fluxo de negócio
- **Projeto:** versão detalhada com mensagens técnicas

### Diagrama de colaboração
- Precursor da especificação de interfaces
- Mostra mensagens passadas entre objetos com sintaxe detalhada
- Produzir na fase de projeto, após diagrama de sequência

### Modelo de dados (ER)
- Baseado no DER de Peter Chen: objetos de dados, atributos, relacionamentos, cardinalidade, modalidade
- **Projeto arquitetural (nível alto):** arquitetura de BD, arquivos, data warehouse
- **Projeto em nível de componente:** estruturas de dados internas acessíveis por componentes
- Conceitual primeiro, depois lógico, só então físico
- Nunca misturar os níveis num diagrama só
- Valores monetários: coluna explicitamente marcada como `DECIMAL` ou `BIGINT` (centavos)
- **Conceitos obrigatórios:** objetos de dados, atributos, relacionamentos, cardinalidade (1:1, 1:N, M:N), modalidade (obrigatória/opcional)

### Diagrama de atividade / raias
- Ideal para o fluxo financeiro: consulta → registro → cálculo → repasse → confirmação
- Um por processo de negócio principal
- Mostrar decisões (branches) e paralelismo quando houver
- **Usar raias** quando múltiplos atores participam do mesmo fluxo

### Diagrama de componentes
- Após arquitetura definida, guia a construção
- Um componente por módulo funcional do sistema
- Interfaces ("pirulito") explícitas

### Diagrama de implantação
- Onde roda cada componente (servidor, banco, browser)
- Protocolos de comunicação (HTTP, WebSocket, etc.)
- Só produzir após stack decidida
- **Elementos:** caixas 3-D (hardware), nós, subsistemas internos

### Protótipo de tela
- Baixa fidelidade (wireframe) é suficiente no início
- Foco em fluxo, não em estética
- Uma tela por caso de uso principal
- Padrões de interface do material: preencher-os-espaços, tabela ordenável, manipulação direta, migalhas de pão, busca simples, wizard

## Armadilhas
- **Modelar antes de ter requisitos.** Se o diagrama "parece útil" mas nenhum
  requisito confirmado o exige, deleta.
- **Sobre-engenharia.** Herança profunda, padrões de projeto "porque sim",
  interfaces para classes com uma implementação só. Resistir.
- **Misturar conceitual com físico.** No DER conceitual, não colocar tipo
  de coluna; no físico, não esconder tipo.
- **Diagrama bonito sem legenda.** Sempre documentar o que cada símbolo
  significa; o professor vai avaliar.

## Ferramentas
- **Mermaid:** bom para sequência, classes, atividade, Gantt. Versiona com código.
- **Draw.io / diagrams.net:** melhor para casos de uso UML, DER com cardinalidade, implantação.
- **PlantUML:** alternativa textual para diagramas UML completos.
- **dbdiagram.io:** DER rápido e limpo.

Mermaid é preferência, mas quando não suportar a notação necessária, usar Draw.io.

## Padrões de projeto ensinados (conforme material)

### GoF (Gang of Four)
Referência ao livro "Design Patterns" de Gamma et al. Exemplos citados: Adapter, Singleton.
GRASP **não é mencionado** no material.

### Padrões arquiteturais (estilos)
| Estilo | Descrição |
|---|---|
| Centrado nos dados | Repositório / quadro-negro |
| Fluxo de dados | Tubos e filtros |
| Chamada e retorno | Programa principal / subprograma, RPC |
| Orientado a objetos | Comunicação via mensagens entre objetos |
| Em camadas | Camadas hierárquicas com interfaces definidas |
| **MVC** | Model-View-Controller (WebApps) |

### Padrões de interface / WebApps
Preencher-os-espaços, tabela ordenável, manipulação direta, migalhas de pão (breadcrumbs), edite-no-lugar, busca simples, wizard (perito).

## Métricas de modelagem (conforme material)

| Categoria | Métricas |
|---|---|
| **Arquitetural** | Tamanho/Profundidade/Largura do grafo, razão arco-nó, DSQI, complexidade estrutural (fan-out/fan-in) |
| **OO — Conjunto CK** | WMC, DIT, NOC, CBO, RFC, LCOM |
| **OO — Conjunto MOOD** | MIF (herança de métodos), CF (acoplamento) |
| **Componente convencional** | Coesão de módulo (data slices/tokens), acoplamento (global, dados, controle), **complexidade ciclomática** |
| **Análise** | Pontos por Função (FP), qualidade de especificação (especificidade, verificabilidade, completude) |
| **Interface** | LA — adequação de leiaute (custo de transição visual) |

## Outputs típicos
- Diagramas em Mermaid ou Draw.io (conforme necessidade)
- DER nos 2 níveis do material (arquitetural + componente) — na prática: conceitual, lógico, físico
- Diagrama de atividade/raias do fluxo de repasse
- Diagrama de estado para entidades com ciclo de vida (ex: Repasse)
- Diagrama de componentes (após arquitetura definida)
- Diagrama de implantação (após stack definida)
- Wireframes em ferramenta simples

## Critérios de saída desta fase
- [ ] Todos os requisitos confirmados têm caso de uso correspondente
- [ ] Diagrama de classes conceitual (análise) aprovado
- [ ] Diagrama de classes de projeto detalhado
- [ ] Diagrama de estado para entidades com ciclo de vida
- [ ] DER conceitual + lógico prontos
- [ ] Diagrama de atividade/raias do fluxo de repasse pronto
- [ ] Diagrama de sequência do caso de uso de repasse
- [ ] Protótipos das telas principais esboçados

## Metacomentário (obrigatório no output)
Ver §5 da instrução mestre.
