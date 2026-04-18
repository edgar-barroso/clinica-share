# Regras Inegociáveis

## Financeiras
- Valores monetários: inteiro em centavos OU tipo Decimal. Nunca float/double.
- Toda função que calcula repasse é coberta por teste unitário antes do merge.
- Toda alteração em registro financeiro gera audit log:
  `{user_id, timestamp, entidade, campo, valor_antes, valor_depois, motivo}`
- Cálculo de repasse nunca é feito no front-end. Sempre no servidor.

## Dados e LGPD
- Dados clínicos de pacientes NÃO entram no MVP.
- Dados pessoais mínimos (nome de profissional, CPF, dados bancários): só
  com justificativa de requisito explícito. Nunca coletar "por garantia".
- Qualquer PII exige consentimento registrado e finalidade documentada.

## Metodológicas
- Nenhum requisito é "assumido". Se não está em `estado-requisitos-confirmados.md`,
  não existe.
- Nenhuma decisão de arquitetura/stack é tomada sem registro em
  `estado-decisoes-tomadas.md`.
- Nenhum código é escrito sem haver requisito + caso de uso + modelo de dados
  que o justifiquem. Ordem: requisito → modelo → código.

## Escopo
- MVP é lei. Pedidos de feature fora do escopo recebem resposta:
  "fora de escopo MVP, registrado como backlog futuro".
- Conflito entre pedido do cliente e regra inegociável → sinalizar para a
  equipe antes de executar, nunca quebrar silenciosamente a regra.
