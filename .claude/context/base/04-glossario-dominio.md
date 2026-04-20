# Glossário de Domínio — ClinicaShare

Este glossário reconcilia três termos que o código e as telas tratam quase como sinônimos, mas que têm papéis distintos. Use-os com consistência em código, UI e artefatos acadêmicos.

## Os três termos

### Agendamento
Compromisso marcado, ainda não realizado. Representa a fase anterior ao atendimento em si.

- **Código:** nenhum tipo próprio — é um `Atendimento` com `status ∈ { "agendado", "em_atendimento" }`. A ausência de uma entidade separada é deliberada: o mesmo registro percorre todas as fases.
- **UI admin:** usar "Agendamento" em fluxos de criação antes da realização (ex.: página [`/agenda/novo`](../../../app/(app)/agenda/novo/page.tsx), botão "Novo agendamento" na [`/agenda`](../../../app/(app)/agenda/page.tsx)).
- **Status possíveis:** `agendado`, `em_atendimento`, `cancelado`, `nao_compareceu` — definidos em [`StatusAgendamento`](../../../lib/mock/types.ts) e operados pela máquina de estados [`lib/appointment-transitions.ts`](../../../lib/appointment-transitions.ts).
- **Requisitos RUP:** bloco AG01–AG07.

### Atendimento
O registro completo do compromisso, inclusive após realização. É a entidade persistida.

- **Código:** tipo [`Atendimento`](../../../lib/mock/types.ts). O campo `status: StatusAgendamento` parece inconsistente à primeira vista, mas é correto: um `Atendimento` começa com `status = "agendado"` e termina com `status ∈ { "realizado", "cancelado", "nao_compareceu" }`.
- **UI admin:** usar "Atendimento" em fluxos pós-realização — página [`/atendimentos`](../../../app/(app)/atendimentos/page.tsx), detalhe [`/atendimentos/[id]`](../../../app/(app)/atendimentos/[id]/page.tsx), formulário de registro.
- **Requisitos RUP:** bloco AT01–AT06.

### Consulta
Termo de interface para o paciente. É um atendimento/agendamento sob a ótica de quem recebe o serviço.

- **Código:** não existe como tipo. É apenas vocabulário de UI.
- **UI paciente:** usar "Consulta" exclusivamente em textos voltados ao paciente — todas as telas `/p/*`, e-mails, mensagens WhatsApp, toasts endereçados a ele.
- **Exemplo:** a mesma entidade aparece como "consulta #at-042" em [`/p/consultas`](../../../app/p/consultas/page.tsx) e como "atendimento #at-042" em [`/atendimentos`](../../../app/(app)/atendimentos/page.tsx).

## Regra prática

| Contexto | Termo preferido |
|---|---|
| Código (tipos, variáveis, tabelas) | `Atendimento` |
| UI admin / equipe | `Agendamento` antes da realização, `Atendimento` depois |
| UI paciente (`app/p/*`, WhatsApp, e-mail) | `Consulta` |
| Documentos acadêmicos | Usar o termo exato do bloco de requisitos (AG* → agendamento; AT* → atendimento) |

## Outros termos

### Motivo
Há dois campos de "motivo" no domínio, e os dois coexistem sem substituir um ao outro. **Nunca use o label genérico "Motivo" na UI** — sempre qualifique.

- `motivoCancelamento: string` — preenchido quando `status = "cancelado"`. Requisito AG06. Label correto: **"Motivo do cancelamento"**.
- `motivoDescontoOuGratuidade: string` — preenchido quando há desconto ou gratuidade no pagamento. Requisito AT01. Labels corretos: **"Justificativa da gratuidade"** (quando `statusPagamento = "gratuito"`) ou **"Observação sobre o pagamento"** (quando `statusPagamento = "pendente"`).

### Remarcação
Subcaso de cancelamento: a consulta original é cancelada com `motivoCancelamento = "Remarcado"` e uma nova é criada. Implementado em [`/p/agendar?remarcacao=ID`](../../../app/p/agendar/page.tsx). O paciente só pode remarcar consultas da própria agenda (validação por `pacienteId`).

### Repasse
Valor devido ao profissional sobre o atendimento realizado. Calculado por uma regra de negócio (porcentagem sobre o valor líquido). Visto apenas em rotas admin/auxiliar (`/financeiro/*`). Nunca exposto ao paciente.

## Vinculação com o projeto

- Tipos: [`lib/mock/types.ts`](../../../lib/mock/types.ts)
- Transições de status: [`lib/appointment-transitions.ts`](../../../lib/appointment-transitions.ts)
- Mock de dados: [`lib/mock/data.ts`](../../../lib/mock/data.ts)
- Requisitos oficiais: [`reunioes/R1/requisitos-v1.md`](../reunioes/R1/requisitos-v1.md)

## Uso obrigatório

Toda nova tela, componente, toast ou mensagem de domínio deve adotar o termo deste glossário. Revisões RTF devem conferir se o termo usado combina com o contexto (admin × paciente × código). Desvios precisam ser justificados na PR.
