# Checklist de Revisão Técnica Formal (RTF)

> Atividade guarda-chuva obrigatória (Pressman). Aplica-se a TODO artefato
> relevante: diagramas UML, modelo de dados, documento de requisitos, código.
> Diferente do code review — este é para artefatos de design/análise também.

## Informações da Revisão

| Campo | Valor |
|---|---|
| **Artefato revisado** | _(ex: Diagrama de Classes v1, DER conceitual, SRS)_ |
| **Autor** | _(quem produziu)_ |
| **Revisor(es)** | _(quem inspecionou — nunca o próprio autor)_ |
| **Data da revisão** | _(YYYY-MM-DD)_ |
| **Tipo** | _(Inspeção formal / Walkthrough / Revisão por pares)_ |

## Checklist Geral (todos os artefatos)

- [ ] O artefato atende ao objetivo declarado?
- [ ] É rastreável a requisito(s) confirmado(s) em `estado-requisitos-confirmados.md`?
- [ ] É consistente com outros artefatos já aprovados?
- [ ] Está completo ou tem lacunas sinalizadas como pendência?
- [ ] A nomenclatura segue o padrão definido pela equipe?
- [ ] Existe ambiguidade que permita mais de uma interpretação?

## Checklist Específico — Diagramas UML

- [ ] Atores correspondem aos confirmados pelo cliente?
- [ ] Todos os fluxos alternativos e exceções estão descritos?
- [ ] Cardinalidades estão explícitas nos relacionamentos?
- [ ] Separação análise vs projeto respeitada? (ver playbook-03)
- [ ] Legenda presente explicando simbologia?

## Checklist Específico — Modelo de Dados (DER)

- [ ] Nível correto? (conceitual sem tipos / lógico com tipos / físico com constraints)
- [ ] Valores monetários como DECIMAL ou BIGINT (centavos)?
- [ ] Tabela de audit_logs prevista para alterações financeiras?
- [ ] Chaves estrangeiras e cardinalidades explícitas?

## Checklist Específico — Documento de Requisitos (SRS)

- [ ] Todo requisito é não-ambíguo, verificável, consistente, rastreável e com fonte?
- [ ] Classificação IFQ (Normal/Esperado/Excitante) presente?
- [ ] Requisitos não-funcionais com métrica mensurável?

## Defeitos Encontrados

| # | Descrição | Severidade (Alta/Média/Baixa) | Ação | Responsável | Resolvido? |
|---|---|---|---|---|---|
| 1 | | | | | |

## Resultado

- [ ] **Aprovado** — sem defeitos críticos
- [ ] **Aprovado com ressalvas** — defeitos menores, corrigir antes do próximo passo
- [ ] **Reprovado** — defeitos graves, refazer e submeter nova revisão

## Assinaturas

| Papel | Nome | Data |
|---|---|---|
| Autor | | |
| Revisor 1 | | |
| Revisor 2 (se houver) | | |
