# Playbook 01 — Comunicação com Cliente

## Quando usar este playbook
Sempre que a tarefa envolver: preparar reunião, processar gravação ou
anotações de reunião, gerar ata, montar questionário para próxima reunião,
levantar ou refinar requisitos, documentar decisões do cliente.

## Mindset
Você está em modo ELICITAÇÃO. Seu trabalho é ajudar a equipe a extrair do
cliente informação confiável, rastreável e completa. Erros comuns a evitar:
- Aceitar requisito vago sem refinar ("o sistema precisa ser rápido" → quão rápido?)
- Deixar ambiguidade viver ("às vezes o repasse é diferente" → quando? por quê?)
- Misturar desejo com requisito ("seria legal ter app mobile" → prioridade? MVP?)
- Ignorar silêncios (o que o cliente NÃO disse sobre um tópico é pendência)

## Sub-tarefas que este playbook cobre

### 1. Preparar roteiro de reunião
**Input:** objetivo da reunião + estado atual (`estado-pendencias-cliente.md`).
**Output:**
- Lista de objetivos da reunião (máximo 3)
- Perguntas priorizadas (P0 = bloqueia avanço, P1 = importante, P2 = nice-to-have)
- Perguntas abertas (explorar) e fechadas (confirmar) separadas
- Tempo estimado por bloco

### 2. Processar informação bagunçada pós-reunião
**Input:** transcrição bruta, áudio transcrito, ou anotações soltas.
**Output obrigatório (nesta ordem):**

1. **Ata estruturada** usando `entregavel-template-ata-reuniao.md`
2. **Diffs para `estado-requisitos-confirmados.md`** — cada requisito novo
   com ID, origem (reunião nº, data), fonte (quem disse), e redação formal
3. **Diffs para `estado-decisoes-tomadas.md`** — decisões fechadas
4. **Diffs para `estado-pendencias-cliente.md`** — o que ficou em aberto
5. **Rascunho de perguntas para a próxima reunião**, agrupadas por tópico
6. **Alertas** — contradições detectadas, requisitos vagos que precisam refino,
   áreas completamente não exploradas

Nunca pule nenhum dos 6. Se a informação de entrada não permitir gerar
um dos outputs, diga "seção X: nada a extrair" explicitamente.

### 3. Técnicas de elicitação (conforme material da disciplina)

O professor ensina 5 técnicas. Usar na ordem adequada à maturidade do projeto:

| Técnica | Quando usar | Cuidados |
|---|---|---|
| **Primeiras Questões (livres de contexto)** | Início (concepção). Identificar stakeholders, benefício econômico, objetivos globais | "Quebra o gelo" — usar nas primeiras reuniões |
| **Coleta Colaborativa (JAD/FAST)** | Levantar requisitos em equipe com facilitador. Desenvolvedores + clientes + interessados | Requer preparação e controle rígidos para não perder foco |
| **IFQ / QFD** | Transformar necessidades do cliente em requisitos técnicos (entrevistas, observação, dados históricos) | Maximiza satisfação — foca no que tem valor para o cliente |
| **Cenários de Usuário (Casos de Uso)** | Entender como funções serão usadas por diferentes atores na prática | Fornece descrição detalhada sob diferentes condições de operação |
| **Prototipagem** | Cliente define objetivos gerais mas não detalha requisitos de E/S, ou há insegurança técnica | **Risco:** desenvolvedor faz gambiarras; cliente pode exigir que protótipo vire produto final |

### 4. Refinar requisito vago
**Técnica padrão:** aplicar as 5 perguntas a cada requisito:
- **Quem?** (ator)
- **Quando?** (gatilho)
- **O quê?** (ação)
- **Como?** (critério de sucesso mensurável)
- **Por quê?** (valor de negócio)

Se alguma das 5 não tem resposta no material atual, é pendência para próxima reunião.

### 5. Documento de Visão / ROI / SRS / outros artefatos formais
Ver `entregavel-` para o template específico exigido pelo professor.
Nunca gerar artefato formal sem antes verificar:
- Existe template correspondente em `entregavel-`? Se não, pergunte o formato.
- Todos os requisitos citados estão em `estado-requisitos-confirmados.md`?
- As decisões citadas estão em `estado-decisoes-tomadas.md`?

## Armadilhas específicas desta fase
- **Cliente (professor) pode testar a equipe** pedindo coisas fora de escopo
  para ver se vocês sinalizam. Sempre sinalizar.
- **Silêncio do cliente sobre um tópico ≠ ausência de requisito.** Marcar
  como pendência explícita, não ignorar.
- **Não traduzir fala do cliente em técnica prematuramente.** "Ele quer ver
  quanto cada médico gerou" ≠ "precisa de um endpoint `GET /reports/doctor`".

### 6. Classificação IFQ pós-extração
Após extrair requisitos brutos de uma reunião, classifique cada um como:
- **Normal (N):** cliente espera, ficará insatisfeito se faltar
- **Esperado (E):** cliente não pede mas assume que existe
- **Excitante (X):** cliente não espera mas ficará encantado

Registrar a classificação na coluna IFQ de `estado-requisitos-confirmados.md`.

### 7. Gravação e transcrição
- A equipe grava reuniões em áudio. Usar transcrição (manual ou automática) como input.
- Ao receber transcrição: tratar como "informação bagunçada" (sub-tarefa 2).
- Nunca confiar apenas na memória — sempre referenciar a transcrição.

## Critérios de saída desta fase
- [ ] Ata da reunião gerada e revisada
- [ ] `estado-requisitos-confirmados.md` atualizado com novos requisitos
- [ ] `estado-decisoes-tomadas.md` atualizado
- [ ] `estado-pendencias-cliente.md` atualizado
- [ ] Roteiro da próxima reunião rascunhado (se houver próxima)
- [ ] Requisitos classificados com IFQ

## Metacomentário (obrigatório no output)
Ver §5 da instrução mestre: toda entrega fecha com **1 risco, 1 alternativa
descartada, 1 pendência**.
