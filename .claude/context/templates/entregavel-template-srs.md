# Documento de Requisitos de Software (SRS) — ClinicaShare

> **Baseado em:** Produtos de Trabalho do Levantamento (Pressman, 6ª ed.)
> **Versão:** _(ex: 1.0)_
> **Data:** _(YYYY-MM-DD)_
> **Autores:** _(nomes da equipe)_
> **Status:** Rascunho | Em Revisão | Aprovado

---

## 1. Declaração de Necessidade e Viabilidade

### 1.1 Necessidade
_(Qual problema este software resolve? Por que é necessário?)_

### 1.2 Viabilidade
_(O projeto é viável técnica, econômica e operacionalmente? Resumo.)_

---

## 2. Escopo do Sistema

_(Afirmação limitada do escopo. O que o sistema FAZ e o que NÃO FAZ.)_

**Dentro do escopo (MVP):**
- ...

**Fora do escopo:**
- ...

---

## 3. Stakeholders

| Nome/Papel | Tipo | Interesse/Responsabilidade |
|---|---|---|
| _(ex: Dr. Edson Andrade)_ | Cliente | _(descrever)_ |
| _(equipe dev)_ | Desenvolvedores | _(descrever)_ |
| _(secretária, profissionais)_ | Usuários finais | _(descrever)_ |

---

## 4. Ambiente Técnico

_(Descrição do ambiente técnico do sistema: infraestrutura, plataforma, integrações.)_

| Aspecto | Decisão | Referência |
|---|---|---|
| Stack | _(ver `estado-decisoes-tomadas.md`)_ | DEC-XXX |
| Banco de dados | ... | ... |
| Hospedagem | ... | ... |
| Navegadores suportados | ... | ... |

---

## 5. Requisitos Funcionais

> Organizados por função/módulo. Cada requisito deve atender aos 6 critérios
> de qualidade: não-ambíguo, verificável, consistente, rastreável, limitado, realizável.

| ID | Módulo | Descrição | Prioridade | IFQ | Fonte | Reunião |
|---|---|---|---|---|---|---|
| RF-001 | _(ex: Repasse)_ | _(descrição formal)_ | P0/P1/P2 | N/E/X | _(quem disse)_ | _(data)_ |

---

## 6. Requisitos Não-Funcionais

| ID | Categoria | Descrição | Métrica/Limite | Fonte |
|---|---|---|---|---|
| RNF-001 | _(ex: Segurança)_ | _(descrição)_ | _(ex: ≤ 200ms)_ | _(origem)_ |

---

## 7. Cenários de Uso (Casos de Uso resumidos)

> Cada cenário descreve como o sistema é usado sob diferentes condições de operação.

### CU-001: _(Nome do caso de uso)_
- **Ator principal:** ...
- **Pré-condições:** ...
- **Fluxo principal:** 1. ... 2. ... 3. ...
- **Fluxos alternativos:** ...
- **Pós-condições:** ...
- **Requisitos cobertos:** RF-XXX, RF-YYY

_(Repetir para cada caso de uso)_

---

## 8. Protótipos

_(Referência a protótipos desenvolvidos durante a elicitação, se houver.)_

| Protótipo | Descrição | Localização | Status |
|---|---|---|---|
| _(ex: Tela de repasse)_ | _(wireframe/mockup)_ | _(link ou caminho)_ | Descartável / Evolutivo |

---

## 9. Restrições de Domínio

_(Regras de negócio que restringem o comportamento do sistema.)_

| ID | Restrição | Origem |
|---|---|---|
| RD-001 | Valores monetários em centavos ou Decimal (nunca float) | `02-regras-inegociaveis.md` |
| RD-002 | Toda alteração financeira exige audit log | `02-regras-inegociaveis.md` |
| RD-003 | Dados clínicos de pacientes não entram no MVP (LGPD) | `02-regras-inegociaveis.md` |

---

## 10. Tabelas de Rastreamento

### 10.1 Rastreamento de Características
_(Liga requisitos a características/features do produto)_

| Requisito | Característica |
|---|---|
| RF-001 | _(ex: Cálculo automático de repasse)_ |

### 10.2 Rastreamento de Fontes
_(Liga requisitos à origem — quem pediu, quando, em qual reunião)_

| Requisito | Fonte | Reunião | Data |
|---|---|---|---|
| RF-001 | _(ex: Dr. Edson)_ | Reunião 1 | _(data)_ |

### 10.3 Rastreamento de Dependência
_(Indica como requisitos se relacionam entre si)_

| Requisito | Depende de | Tipo |
|---|---|---|
| RF-002 | RF-001 | _(ex: necessita cálculo de RF-001)_ |

### 10.4 Rastreamento de Subsistemas
_(Categoriza requisitos pelo subsistema que governam)_

| Requisito | Subsistema |
|---|---|
| RF-001 | _(ex: Módulo Financeiro)_ |

### 10.5 Rastreamento de Interface
_(Relaciona requisitos a interfaces externas/internas)_

| Requisito | Interface | Tipo |
|---|---|---|
| RF-001 | _(ex: API de pagamento)_ | Externa |

---

## Histórico de Revisões

| Versão | Data | Autor | Mudanças |
|---|---|---|---|
| 0.1 | _(data)_ | _(nome)_ | Versão inicial |
