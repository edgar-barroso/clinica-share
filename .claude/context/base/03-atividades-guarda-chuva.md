# Atividades Guarda-Chuva (Pressman)

> Atividades paralelas obrigatórias que atravessam TODAS as fases do projeto.
> Cada uma precisa de evidência mínima para demonstrar ao professor que foi aplicada.

## 1. Acompanhamento e Controle de Projeto
**O quê:** monitorar progresso real vs planejado, identificar desvios, agir.
**Artefato mínimo:**
- Board de tarefas (Trello, GitHub Projects, ou similar) atualizado
- Ata breve de reunião interna semanal (pode ser 5 linhas)
- Atualização de `estado-fase-atual.md` a cada transição de fase

**Quando verificar:** toda reunião interna da equipe.

## 2. Gestão de Risco
**O quê:** identificar riscos, avaliar probabilidade × impacto, planejar mitigação.
**Artefato mínimo:**
- `estado-riscos.md` — tabela de riscos atualizada a cada fase
- Revisão de riscos antes de cada reunião com o cliente
- Se um risco se materializar, registrar como incidente e ação corretiva

**Quando verificar:** antes de cada reunião com cliente e a cada transição de fase.

## 3. Garantia de Qualidade de Software (SQA)
**O quê:** "atividade guarda-chuva aplicada ao longo do processo de software" (Pressman).
**Artefato mínimo:**
- Checklists de review nos playbooks (já existem nos playbooks 04 e 05)
- Revisão cruzada: quem produz o artefato não o aprova sozinho
- Verificação de que requisitos são não-ambíguos, verificáveis, consistentes,
  rastreáveis, limitados e realizáveis (6 critérios em `01-glossario-metodologia.md`)

**Atividades do Grupo de SQA (conforme material):**
1. Preparar plano de SQA para o projeto
2. Participar no desenvolvimento da descrição do processo
3. Revisar atividades de engenharia para verificar satisfação do processo
4. Auditar os produtos do trabalho
5. Garantir que desvios sejam documentados e manipulados conforme procedimentos
6. Registrar não-satisfações e relatar à gerência

**SQA Estatística:** coleta de dados de defeitos, classificação por causa (princípio de Pareto), correções no processo (Seis Sigma).

**Quando verificar:** a cada entrega de artefato.

## 4. Gestão de Configuração
**O quê:** controlar versões de código e documentos, garantir rastreabilidade.
**Artefato mínimo:**
- Repositório Git com histórico limpo
- Convenção de commits (sugestão: Conventional Commits)
- Branch `main` protegida — merge só via PR com review
- Nomeação de branches: `feature/xxx`, `fix/xxx`, `docs/xxx`
- Versionamento de documentos: data no cabeçalho + "Última atualização"

**Quando verificar:** a cada commit / merge.

## 5. Revisões Técnicas Formais (FTR)
**O quê:** "o filtro mais efetivo de garantia da qualidade" (Pressman). Reunião conduzida por engenheiros para descobrir erros na função, lógica ou implementação.
**Artefato mínimo:**
- PR obrigatório antes de merge (code review)
- Checklist de review preenchido (ver `entregavel-template-checklist-rtf.md`)
- Para artefatos não-código (ata, documento de requisitos, UML):
  leitura cruzada por pelo menos 1 outro membro da equipe

**Tipos de revisão (conforme material):**
| Tipo | Descrição |
|---|---|
| **FTR (Revisão Técnica Formal)** | Reunião estruturada entre engenheiros — objetivo: descobrir erros |
| **Walkthroughs** | Classe de FTR — apresentação guiada pelo autor |
| **Inspeções** | Classe de FTR — revisão sistemática com checklist |
| **Revisão circular ("rodízio")** | Artefato circula entre membros para avaliação |
| **Revisão guiada por amostras** | Inspeção de fração dos produtos — foco nos mais propensos a erros |

**Quando verificar:** antes de cada merge e antes de cada entrega ao professor.

---

## Mapeamento para os Playbooks

| Guarda-chuva | Playbook que mais se beneficia | Evidência visível |
|---|---|---|
| Acompanhamento e controle | 02-Planejamento | Board, atas, fase-atual.md |
| Gestão de risco | 02-Planejamento + todos | estado-riscos.md |
| SQA | 04-Codificação + 03-Modelagem | Checklists, review cruzado |
| Gestão de configuração | 04-Codificação | Git limpo, CONTRIBUTING.md |
| Revisões técnicas formais | 04-Codificação + todos | PRs, leitura cruzada |

## Por que isso importa para a nota
O professor (Pressman) define o arcabouço genérico como 5 atividades de processo
+ 5 atividades guarda-chuva. Se ele verificar se vocês aplicaram o arcabouço
completo, vai procurar evidência dessas 5 práticas. Sem evidência = ponto perdido.
