# ClinicaShare — Documento de Visão

> **Baseado no:** template do professor (Visão + ROI — estrutura RUP)
> **Referência:** exemplos de turmas anteriores (FindRoom, Pizza Express, TECinside, J²BDev)

**Versão:** _(ex: 1.0)_

## Histórico da Revisão

| Data | Versão | Descrição | Autor |
|---|---|---|---|
| _(YYYY-MM-DD)_ | 1.0 | Construção da primeira versão, a partir dos dados colhidos na reunião com o cliente | _(nomes da equipe + papéis)_ |

## Índice Analítico

1. Introdução
   1.1 Finalidade
2. Posicionamento
   2.1 Descrição do Problema
   2.2 Sentença de Posição do Produto
3. Descrições dos Envolvidos e dos Usuários
   3.1 Resumo dos envolvidos
   3.2 Resumo dos Usuários
   3.3 Ambiente do usuário
   3.4 Principais Necessidades dos Usuários ou dos Envolvidos
   3.5 Alternativas e Concorrência
4. Visão geral do produto
   4.1 Perspectiva do produto
   4.2 Pressupostos e Dependências
   4.3 Custo e Preço
   4.4 Licenciamento e Instalação
5. Recursos do Produto
6. Restrições
7. Requisitos de Qualidade
8. Retorno de Investimento (ROI)

---

## 1. Introdução

A finalidade deste documento é coletar, analisar e definir as características e necessidades de alto nível do sistema ClinicaShare. Ele se concentra nos recursos necessários aos envolvidos e aos usuários-alvo e nas razões que levam a essas necessidades. Os detalhes de como o ClinicaShare atinge essas necessidades são descritos no caso de uso e nas especificações suplementares.

### 1.1 Finalidade

A finalidade deste documento é definir os requisitos de alto nível em termos de necessidades dos usuários finais.

---

## 2. Posicionamento

### 2.1 Descrição do Problema

| Campo | Descrição |
|---|---|
| **O problema de** | _(descrever o problema central do Dr. Edson)_ |
| **afeta** | _(quem é afetado)_ |
| **cujo impacto é** | _(consequências do problema)_ |
| **uma boa solução seria** | _(resumo da solução proposta)_ |

### 2.2 Sentença de Posição do Produto

| Campo | Descrição |
|---|---|
| **Para** | _(público-alvo)_ |
| **que** | _(necessidade que o público tem)_ |
| **O ClinicaShare** | _(o que é o produto)_ |
| **que** | _(benefício principal)_ |
| **Ao contrário de** | _(situação atual / alternativas)_ |
| **Nosso produto** | _(diferencial)_ |

---

## 3. Descrições dos Envolvidos e dos Usuários

_(Descrição contextual de quem são os envolvidos e como interagem com o sistema)_

### 3.1 Resumo dos envolvidos

| Nome | Descrição | Responsabilidade |
|---|---|---|
| _(ex: Dr. Edson Andrade)_ | _(papel)_ | _(responsabilidade no projeto)_ |

### 3.2 Resumo dos Usuários

| Nome | Descrição | Responsabilidades | Envolvido |
|---|---|---|---|
| _(ex: Administrador)_ | _(papel no sistema)_ | _(o que faz no sistema)_ | _(quem representa)_ |
| _(ex: Profissional)_ | ... | ... | ... |
| _(ex: Recepcionista)_ | ... | ... | ... |

### 3.3 Ambiente do usuário

_(Descrever o ambiente de cada tipo de usuário: como acessam, dispositivos, contexto de uso)_

### 3.4 Principais Necessidades dos Usuários ou dos Envolvidos

| Necessidade | Prioridade | Preocupações | Solução Atual | Soluções Propostas |
|---|---|---|---|---|
| _(descrever)_ | Alta/Média/Baixa | _(riscos, medos)_ | _(como resolve hoje)_ | _(o que o sistema oferece)_ |

### 3.5 Alternativas e Concorrência

_(Existem sistemas similares? Planilhas? Processos manuais? Descrever o cenário competitivo)_

---

## 4. Visão geral do produto

### 4.1 Perspectiva do produto

_(Descrição de como o produto melhora a situação atual do cliente)_

### 4.2 Pressupostos e Dependências

_(De que o sistema depende para funcionar: dados atualizados, adesão dos profissionais, etc.)_

### 4.3 Custo e Preço

O software custará ao cliente o valor de R$ _(valor)_, estimado a partir de dados contidos na Planilha de Preços.

### 4.4 Licenciamento e Instalação

_(Quem é dono do software? Onde será instalado/hospedado? Há custo de licença?)_

---

## 5. Recursos do Produto

_(Listar os recursos/funcionalidades principais que o sistema terá. Manter em alto nível — detalhes vão para os casos de uso)_

- ...
- ...

---

## 6. Restrições

_(Restrições técnicas, de negócio, regulatórias. Referenciar `02-regras-inegociaveis.md`)_

- Valores monetários em centavos ou Decimal (nunca float)
- Audit log obrigatório em toda alteração financeira
- Dados clínicos de pacientes não entram no MVP (LGPD)
- ...

---

## 7. Requisitos de Qualidade

_(Limites de qualidade: desempenho, disponibilidade, usabilidade. Se não especificados ainda, indicar "A definir com o cliente")_

---

## 8. Retorno de Investimento (ROI)

### 8.1 Tabela de Gastos Atuais do Cliente

| Descrição | Valor Mensal (R$) |
|---|---|
| _(ex: Tempo gasto em cálculos manuais de repasse)_ | _(valor estimado)_ |
| _(ex: Erros em repasses que geram retrabalho)_ | _(valor estimado)_ |
| _(ex: Perda de produtividade)_ | _(valor estimado)_ |
| **Total** | **_(soma)_** |

### 8.2 Justificativa

_(Descrever como os valores foram obtidos — perguntas ao cliente, estimativas baseadas em reunião, etc.)_

### 8.3 Estimativa de Ganho com o Sistema

_(Quanto o cliente economiza/ganha por mês com o sistema implantado)_

### 8.4 Cálculo do ROI

```
ROI = Investimento Total / Ganho Mensal Estimado = X meses
```

_(Explicar o cálculo e o prazo de retorno)_

---

## Referências

- Consultar o documento Glossário (`entregavel-template-glossario-projeto.md`)
- Planilha de Preços
- `estado-requisitos-confirmados.md`
- `estado-decisoes-tomadas.md`
