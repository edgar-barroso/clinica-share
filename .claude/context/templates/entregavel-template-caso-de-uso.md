# Template de Caso de Uso — ClinicaShare

> **Baseado no:** template do professor (Caso de Uso — Saque no Banco 24h)
> **Formato:** um caso de uso = uma história na percepção do CLIENTE sobre o uso
> de uma parte do sistema. Como toda história, tem começo, meio e fim.

---

## Documento de Modelo de Caso de Uso

**Versão:** _(ex: 1.0)_

### Histórico da Revisão

| Data | Versão | Descrição | Autor |
|---|---|---|---|
| _(YYYY-MM-DD)_ | 1.0 | Primeira versão do Modelo de Caso de Uso | _(nomes + papéis)_ |

### Índice Analítico

1. Introdução
   1.1 Finalidade
   1.2 Referências
2. Modelo de Caso de Uso do Projeto ClinicaShare

### 1. Introdução

#### 1.1 Finalidade

Este documento tem como finalidade mostrar todos os casos de uso, dando aos desenvolvedores e outros envolvidos no projeto uma visão geral do sistema.

#### 1.2 Referências

- Documento de Visão
- Planilha de Precificação
- `estado-requisitos-confirmados.md`

### 2. Modelo de Caso de Uso do Projeto ClinicaShare

_(Inserir diagrama de casos de uso aqui — Mermaid ou imagem exportada do Draw.io)_

---

## Detalhamento dos Casos de Uso

_(Copiar o bloco abaixo para cada caso de uso)_

---

### UCXXX — _(Nome do caso de uso)_

| Campo | Valor |
|---|---|
| **NOME** | UCXXX — _(nome descritivo)_ |
| **DESCRIÇÃO** | _(Este caso de uso explica como é o processo de...)_ |
| **ATORES** | _(usuários e/ou outros sistemas que interagem com o caso de uso)_ |
| **PRÉ-CONDIÇÕES** | _(como deve estar o sistema para que o caso de uso possa ser executado)_ |
| **Requisitos cobertos** | RF-XXX, RF-YYY |

#### FLUXOS PRINCIPAIS

**_(Nome do fluxo principal)_**

1. O caso de uso se inicia quando _(ator)_ _(ação)_;
2. O sistema _(ação)_;
3. _(ator)_ _(ação)_;
4. O sistema _(ação)_;
5. ...

**_(Nome de outro fluxo principal, se houver)_**

1. ...
2. ...

#### FLUXOS DE EXCEÇÃO

**_(Nome da exceção — ex: "Profissional não encontrado")_**

- X(a) — O sistema verifica que _(condição de exceção)_ e emite mensagem _(mensagem)_;
- X+1(a) — _(ação de recuperação)_;
- ...

> **Nota:** a numeração das exceções referencia o passo do fluxo principal
> onde o desvio ocorre (ex: "3(a)" = exceção no passo 3).

#### PÓS-CONDIÇÕES

_(Como está o sistema depois que o caso de uso foi executado)_

#### APROVAÇÃO

| Campo | Assinatura |
|---|---|
| **Cliente** | ___________________________________ |
| **Gerente do Projeto** | ___________________________________ |
| **Data de aprovação** | _(YYYY-MM-DD)_ |
| **Data de validação** | _(YYYY-MM-DD)_ |

---

## Exemplo de referência (do professor)

> **UC001 — Sacar dinheiro do caixa eletrônico**
> - Ator: Cliente bancário
> - Pré-condição: cartão de banco cadastrado no Banco 24h
> - Fluxo: 20 passos numerados descrevendo a interação completa
> - Exceções: 3 cenários com referência ao passo que desviam (2a, 10a, 12a)
> - Pós-condição: sistema atualiza saldo disponível
> - Aprovação: cliente + gerente + datas
