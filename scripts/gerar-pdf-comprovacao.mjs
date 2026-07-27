/**
 * Gera o PDF de comprovação que acompanha os vídeos: um capítulo por
 * requisito da `ClinicaShare_Planilha_Custos ✅ .xlsx`, dizendo o que
 * acontece no vídeo, como aquilo comprova o requisito, e o resultado nos
 * dois ambientes.
 *
 * Os metadados de requisito (nome, complexidade, custo) vêm da planilha.
 * Os resultados (passou/falhou/duração) vêm dos relatórios JSON reais das
 * execuções — não são digitados à mão, para o documento não poder divergir
 * do que de fato rodou.
 *
 * Uso: node scripts/gerar-pdf-comprovacao.mjs <local.json> <prod.json> <saida.pdf>
 */
import { readFileSync, existsSync } from "node:fs";
import { chromium } from "@playwright/test";

const [, , localPath, prodPath, saida] = process.argv;

// ---------------------------------------------------------------------------
// Metadados da planilha + roteiro de cada vídeo
// ---------------------------------------------------------------------------

const MODULOS = [
  ["Agendamento", ["AG01", "AG02", "AG04", "AG05", "AG06", "AG07"]],
  ["Consultórios", ["CO01", "CO02", "CO03", "CO04"]],
  ["Atendimentos e Prontuário", ["AT01", "AT02", "AT03", "AT04"]],
  ["Financeiro", ["FI01", "FI02", "FI03", "FI04", "FI05", "FI06", "FI07", "FI08", "FI09"]],
  ["Relatórios e Dashboard", ["RE01", "RE02", "RE03", "RE04", "RE05"]],
  ["Autenticação e Controle de Acesso", ["RF-021", "RF-022", "RF-023", "RF-024", "RF-025", "RF-026"]],
];

const REQ = {
  AG01: {
    nome: "Paciente agenda consulta online (portal web)",
    complexidade: "A", custo: 2278.125,
    situacao: "ja-existia",
    video: "Login como paciente, portal `/p/agendar`. Percorre as 4 etapas do wizard — especialidade, profissional, data no calendário e horário livre — e confirma o agendamento.",
    prova: "O POST /api/agendamentos retorna 201 e a consulta criada é relida na agenda do próprio paciente pela API.",
  },
  AG02: {
    nome: "Atendente agenda consulta em nome do paciente",
    complexidade: "B", custo: 461.25,
    situacao: "ja-existia",
    video: "Login como atendente (cai direto em `/agenda`), botão \"Novo agendamento\". Escolhe o paciente no combobox de busca, o profissional, o dia e o horário.",
    prova: "201 no POST com pacienteId de terceiro; a sala exibida no resumo vem do turno fixo do profissional. O horário é escolhido consultando os já ocupados no servidor, não só o que a tela habilita.",
  },
  AG04: {
    nome: "Configuração de duração de consulta por profissional",
    complexidade: "B", custo: 146.25,
    situacao: "ja-existia",
    video: "Abre a edição de dois profissionais diferentes e mostra o campo de duração com valores distintos (30 e 45 minutos).",
    prova: "GET /api/profissionais comprova que `duracaoConsultaMinutos` existe em todos e tem mais de um valor distinto; a grade de horários do agendamento é gerada a partir dele.",
  },
  AG05: {
    nome: "Bloqueio automático de conflito de horário e consultório",
    complexidade: "A", custo: 1406.25,
    situacao: "ja-existia",
    video: "Com a agenda na tela, tenta criar duas reservas no mesmo consultório, dia e horário; depois tenta uma sala fora do turno fixo do profissional.",
    prova: "1ª reserva 201, 2ª no mesmo slot 409 (conflito de horário/sala) e a fora de turno 400. Cobre as duas dimensões do requisito.",
    ressalva: "A validação de conflito é por igualdade exata de (data, hora, sala). Sobreposição por duração — 10:00 e 10:30 para consulta de 60min — só é barrada no cliente, não no servidor. Além disso o índice único não exclui cancelados, então um horário cancelado aparece livre na tela mas é recusado com 409 ao confirmar.",
  },
  AG06: {
    nome: "Cancelamento de consulta com registro obrigatório de motivo",
    complexidade: "B", custo: 281.25,
    situacao: "ja-existia",
    video: "Tenta cancelar sem motivo e com motivo curto demais; depois cancela com justificativa válida e mostra o motivo aparecendo no relatório de cancelamentos.",
    prova: "Motivo vazio e com 2 caracteres retornam 422 e o agendamento continua `agendado`; com motivo válido retorna 200, grava `motivoCancelamento` e gera AuditLog.",
  },
  AG07: {
    nome: "Envio de lembrete automático via Email",
    complexidade: "A", custo: 1870.3125,
    situacao: "ja-existia",
    video: "Não tem interface — é um cron. O vídeo mostra a chamada à rota do agendador.",
    prova: "POST /api/cron/lembretes-amanha sem o header de autorização retorna 401, provando que a rota existe e está protegida. O envio real usa nodemailer e é disparado pelo cron da Vercel (`0 21 * * *`), não pelo teste.",
    ressalva: "O teste não envia e-mail de verdade. Comprova a existência e a proteção do agendador, não a entrega na caixa do paciente.",
  },
  CO01: {
    nome: "Cadastro dos 12 consultórios com tipo e equipamentos",
    complexidade: "B", custo: 686.25,
    situacao: "corrigido",
    video: "Tela `/consultorios` com as salas cadastradas, mostrando tipo e equipamentos de cada uma.",
    prova: "GET /api/consultorios retorna exatamente 12 salas, todas com `tipo` preenchido e lista de equipamentos não vazia.",
    correcao: "A seed criava só 6 salas (5 ativas). Foi expandida para as 12 exigidas pela planilha — 11 ativas mais uma desativada em reforma.",
  },
  CO02: {
    nome: "Configuração de turnos fixos e horários por profissional",
    complexidade: "M", custo: 1194.375,
    situacao: "ja-existia",
    video: "Card \"Turnos fixos\" na edição do profissional (dia da semana, turno e sala) e a tela `/configuracoes/turnos`, onde o admin edita as faixas de horário de manhã, tarde e noite.",
    prova: "Os turnos alocados aparecem na listagem e as faixas HH:mm configuradas são exibidas; o agendamento recusa horário fora do turno fixo.",
    ressalva: "As faixas de horário são globais da clínica, não por profissional. A granularidade por profissional é o par (dia, turno) somado à duração da consulta.",
  },
  CO03: {
    nome: "Profissional pode alocar múltiplos turnos em consultórios diferentes",
    complexidade: "B", custo: 236.25,
    situacao: "ja-existia",
    video: "Mostra um profissional com mais de um turno fixo e cria um turno adicional em outra sala, evidenciando duas salas distintas para o mesmo profissional.",
    prova: "POST em turnos-fixos retorna 201 e a API passa a listar dois consultórios diferentes. O turno criado é removido ao final para devolver a seed ao estado original.",
  },
  CO04: {
    nome: "Dashboard de ocupação e receita por consultório",
    complexidade: "M", custo: 1304.0625,
    situacao: "ja-existia",
    video: "Seção \"Ocupação e receita por consultório\" do dashboard, com os indicadores, o ranking e o filtro por modalidade de contrato.",
    prova: "A resposta de /api/consultorios/dashboard traz receita e taxa de ocupação maiores que zero; a tabela exibe as duas métricas e o filtro refaz a consulta.",
    ressalva: "A ocupação é derivada de atendimentos realizados e pagos, não dos turnos fixos alocados — turno com atendimento cancelado conta como vazio. O denominador assume 3 turnos por dia útil para toda sala.",
  },
  AT01: {
    nome: "Registro de atendimento realizado (data, profissional, consultório)",
    complexidade: "M", custo: 1084.6875,
    situacao: "ja-existia",
    video: "Lista de atendimentos, abertura de um atendimento realizado exibindo data, profissional e consultório, e criação de um atendimento avulso.",
    prova: "O registro persistido carrega as três informações do requisito com chaves estrangeiras reais, e a criação gera AuditLog dentro da transação.",
  },
  AT02: {
    nome: "Registro de procedimentos adicionais por atendimento",
    complexidade: "B", custo: 371.25,
    situacao: "implementado-agora",
    video: "Cria um atendimento com dois procedimentos extras e relê o registro mostrando cada procedimento individualizado com seu valor; depois substitui a lista por outros dois.",
    prova: "GET /api/atendimentos/[id] devolve `procedimentos: [{id, descricao, valor}]` com os itens separados, e a listagem passa a expor `valorProcedimentos` e `valorTotal`.",
    correcao: "Não existia nada. Foi criado o model `ProcedimentoAtendimento` (tabela `appointment_procedures`, valor em Decimal(10,2) para ser somável no cálculo financeiro), a migration, a validação nos três endpoints de escrita e o AuditLog obrigatório em toda alteração da lista.",
    ressalva: "A captura ainda é por API: não há campo de procedimento nas telas de atendimento. O vídeo filma as telas ao redor e comprova a gravação pela API.",
  },
  AT03: {
    nome: "Prontuário eletrônico integrado",
    complexidade: "A", custo: 2517.1875,
    situacao: "ja-existia",
    video: "Inicia e finaliza um atendimento preenchendo anamnese, evolução, conduta e retorno, e mostra o card \"Prontuário registrado\" relendo o que foi gravado.",
    prova: "O conteúdo digitado é persistido em `prontuarioInterno` e reexibido na tela de detalhe.",
    ressalva: "Não é \"integrado\" no sentido pleno: não há visão de prontuário por paciente — o histórico do paciente mostra só data, profissional, valor e status. O campo é um Json sem esquema e alterações nele não geram trilha de auditoria.",
  },
  AT04: {
    nome: "Registro de ocorrência para profissional com prontuário externo",
    complexidade: "B", custo: 146.25,
    situacao: "parcial",
    video: "Mostra o seletor \"Prontuário externo\" com o campo de referência na tela de atendimento avulso, grava e relê o registro.",
    prova: "O texto de referência é persistido e relido.",
    ressalva: "Limitação real, deixada explícita no teste: o campo `usaProntuarioExterno` do banco é código morto — só recebe `false` e nenhuma rota o altera. O marcador fica dentro do Json do prontuário, o que o torna não consultável por SQL. Não existe entidade de \"ocorrência\" e nada disso alimenta o financeiro, que era o propósito declarado do requisito.",
  },
  FI01: {
    nome: "Cadastro de contrato por profissional (aluguel ou percentual)",
    complexidade: "M", custo: 1023.75,
    situacao: "ja-existia",
    video: "Alterna o seletor de modalidade no cadastro do profissional, mostrando o campo condicional mudar entre percentual e valor de aluguel por turno.",
    prova: "A API confirma as duas modalidades em uso na base, cada uma com seu campo de contrato preenchido; alterar contrato exige motivo e gera auditoria.",
  },
  FI02: {
    nome: "Configuração de percentual individual por profissional",
    complexidade: "B", custo: 146.25,
    situacao: "corrigido",
    video: "Mostra percentuais diferentes por profissional (30% e 25%) e a tentativa de alterar um contrato sem justificativa.",
    prova: "PATCH sem `motivo` é recusado e nada é gravado; com motivo, grava e audita.",
    correcao: "A tela de cadastro dizia \"percentual de repasse à clínica — ex: 30 = 30% do bruto vai para a clínica\", mas o motor de cálculo usa esse número como a fatia paga AO PROFISSIONAL, e a tela de edição usava um rótulo neutro que contradizia a de cadastro. Quem cadastrasse pelo texto da tela configuraria o inverso do pretendido. Os rótulos das duas telas foram alinhados à semântica real do cálculo; nenhuma fórmula foi alterada.",
  },
  FI03: {
    nome: "Cálculo automático de repasse por profissional",
    complexidade: "A", custo: 2306.25,
    situacao: "ja-existia",
    video: "Abre a prestação de contas de um repasse e mostra o bloco \"Cálculo\": receita bruta, percentual aplicado e valor final.",
    prova: "O valor da tela bate com o recálculo do servidor e com o total das linhas do detalhamento. O cálculo roda sempre no servidor, em Decimal com arredondamento half-up.",
    ressalva: "Fragilidades que permanecem: períodos sobrepostos podem contar o mesmo atendimento em dois repasses; editar um atendimento já vinculado a repasse pago não é bloqueado nem recalculado; e pagamento recebido depois do fechamento nunca entra em repasse algum.",
  },
  FI04: {
    nome: "Repasse inclui consultas e procedimentos extras registrados",
    complexidade: "M", custo: 780,
    situacao: "implementado-agora",
    video: "Percorre os repasses até achar um com procedimento extra e mostra a composição do valor por atendimento.",
    prova: "Para cada linha, `valorTotal` = valor da consulta + soma dos procedimentos, e a soma desses totais é exatamente a receita bruta do repasse — comprovadamente maior que a soma só das consultas.",
    correcao: "O cálculo somava apenas `valorConsulta`. Passou a somar consulta + procedimentos na base do repasse percentual, com 6 testes unitários escritos antes da implementação. Também foi corrigido um bug adjacente: o ramo de aluguel fixo classificava o turno ignorando os horários configurados pelo admin, o que alterava o número de turnos cobrados e, portanto, o valor.",
    ressalva: "A tela de prestação de contas ainda não exibe uma coluna de procedimentos; a composição é comprovada pela API.",
  },
  FI05: {
    nome: "Registro de status de pagamento (pago, pendente, gratuito)",
    complexidade: "B", custo: 236.25,
    situacao: "ja-existia",
    video: "Filtros de status na lista de atendimentos e a transição completa de um atendimento: agendado, em atendimento, realizado pendente e finalmente pago.",
    prova: "Os três status existem na base e cada transição gera AuditLog com valor anterior e posterior.",
  },
  FI06: {
    nome: "Registro de descontos com justificativa",
    complexidade: "B", custo: 225,
    situacao: "parcial",
    video: "Tenta finalizar um atendimento como gratuito sem justificativa e depois com justificativa válida.",
    prova: "Sem motivo retorna 422; com motivo grava e a justificativa aparece na tela.",
    ressalva: "Só gratuidade total está coberta. Desconto parcial não é registrável: o servidor descarta a justificativa sempre que o pagamento não é gratuito, e não existe campo de valor original — então cobrar 150 no lugar de 250 é indistinguível de um atendimento normal e nunca aparece no relatório de descontos. O teste comprova essa limitação em vez de escondê-la.",
  },
  FI07: {
    nome: "Fechamento financeiro semanal com relatório de prestação de contas",
    complexidade: "M", custo: 1340.625,
    situacao: "ja-existia",
    video: "Lista de repasses agrupada por semana e a prestação de contas de um repasse: modalidade, turnos cobrados, atendimentos e bloco de cálculo.",
    prova: "O cron semanal está protegido (401 sem credencial) e a geração por período é idempotente — chamar duas vezes devolve o mesmo repasse.",
    ressalva: "Não há gatilho manual na interface: se o cron falhar, não existe botão para refazer o fechamento. Também não há exportação da prestação de contas.",
  },
  FI08: {
    nome: "Registro de aluguel fixo por turno utilizado por profissional",
    complexidade: "B", custo: 236.25,
    situacao: "ja-existia",
    video: "Prestação de contas de um profissional com contrato de aluguel, mostrando os turnos cobrados.",
    prova: "Valor do repasse = número de turnos distintos (data, turno) × valor do aluguel por turno, batendo com o recálculo do servidor.",
    ressalva: "O uso do turno é inferido de atendimentos realizados — um turno reservado cuja agenda só teve cancelamentos não gera aluguel. Na listagem, valores de aluguel são somados junto com os percentuais em \"total de repasses\", embora o dinheiro corra em direção oposta.",
  },
  FI09: {
    nome: "Pagamento online pelo paciente: Pix, cartão",
    complexidade: "A", custo: 2053.125,
    situacao: "bloqueado",
    video: "Não há vídeo. Deliberadamente.",
    prova: "Nenhuma. Não existe gateway, checkout, webhook ou tabela de transação no projeto — a busca por Pix, Stripe, cartão e afins só encontra textos de motivo em dados de exemplo.",
    ressalva: "Está formalmente fora de escopo: o `IMPLEMENTACAO-PLANO.md` registra na linha 621 \"FI09 — Pagamento online — REMOVIDO (DEC-E09)\" e na linha 385 \"FI09 não implementado (DEC-E09)\", com a decisão de pagamento exclusivamente presencial pendente de confirmação do Dr. Edson. Implementar exigiria credenciais de merchant, webhook de confirmação e conformidade PCI. Optou-se por não gravar um vídeo de checkout simulado, que seria uma comprovação falsa.",
  },
  RE01: {
    nome: "Dashboard admin: receita total, repasses em aberto e pagos",
    complexidade: "A", custo: 1884.375,
    situacao: "ja-existia",
    video: "Dashboard do administrador com os indicadores e o gráfico de receita por dia, incluindo a troca do período de análise.",
    prova: "Receita bruta, repasses em aberto e repasses pagos exibidos na tela conferem com os valores retornados pela API para o mesmo período.",
  },
  RE02: {
    nome: "Relatório financeiro com filtros por profissional e período",
    complexidade: "M", custo: 901.875,
    situacao: "corrigido",
    video: "Relatório financeiro com as seis colunas, filtragem por período e depois por um profissional específico — a tabela se reduz a uma linha e o consolidado diminui.",
    prova: "O filtro aplicado muda de fato o resultado exibido e o total.",
    correcao: "A API já aceitava filtro por profissional, mas a tela só tinha os campos de data — o requisito não era exercitável pela interface. Foram adicionados os seletores de profissional e de consultório, com recarga automática.",
  },
  RE03: {
    nome: "Ranking de consultórios por receita gerada",
    complexidade: "B", custo: 292.5,
    situacao: "ja-existia",
    video: "Tabela \"Ranking por receita\" no dashboard, com posições numeradas e o detalhamento por sala.",
    prova: "As receitas lidas linha a linha na tela estão em ordem decrescente e conferem com a API.",
  },
  RE04: {
    nome: "Relatório de consultas gratuitas e descontos",
    complexidade: "B", custo: 202.5,
    situacao: "parcial",
    video: "Relatório de gratuidades listando data, profissional, paciente e o motivo de cada cortesia.",
    prova: "Todas as linhas listadas têm motivo preenchido e a contagem bate com o título do card.",
    ressalva: "Cobre gratuidades, não descontos. Como o modelo não tem valor de desconto nem valor original, desconto parcial não chega a este relatório — mesma limitação do FI06. A coluna \"Valor original\" mostra o valor cobrado, não o de tabela.",
  },
  RE05: {
    nome: "Relatório de cancelamentos com motivos registrados",
    complexidade: "B", custo: 202.5,
    situacao: "ja-existia",
    video: "Relatório de cancelamentos e não comparecimentos, com os indicadores e a coluna de motivo.",
    prova: "Os totais conferem com a API e todo cancelamento tem motivo preenchido.",
    ressalva: "Registros de \"não compareceu\" saem sem motivo, porque essa ação não coleta justificativa — o requisito fala de cancelamentos, que têm.",
  },
  "RF-021": {
    nome: "Autenticação de usuário com e-mail e senha",
    complexidade: "M", custo: 975,
    situacao: "ja-existia",
    video: "Tentativa de login com senha errada, mensagem de erro, e em seguida login bem-sucedido.",
    prova: "Credencial inválida retorna 401 com resposta idêntica para senha errada e e-mail inexistente, sem revelar qual dos dois falhou; login válido cria a sessão.",
  },
  "RF-022": {
    nome: "Controle de acesso por perfil (Adm, Aux, Profissional, Atendente, Paciente)",
    complexidade: "A", custo: 1673.4375,
    situacao: "ja-existia",
    video: "Os cinco perfis entram em sequência e cada um cai no destino correto; mostra também o menu diferente por perfil.",
    prova: "Perfis sem permissão recebem 403 em rota restrita — profissional na auditoria, paciente no relatório financeiro — enquanto continuam autenticados.",
    ressalva: "O bloqueio por perfil vive nas rotas de API. Uma página aberta diretamente pela URL renderiza para qualquer usuário autenticado; só os dados são negados. O perfil fica congelado no token até ele expirar.",
  },
  "RF-023": {
    nome: "Profissional não acessa dados ou agenda de outro profissional",
    complexidade: "M", custo: 609.375,
    situacao: "parcial",
    video: "Logado como um profissional, tenta consultar a agenda de outro passando o identificador dele na consulta.",
    prova: "O servidor sobrescreve o filtro e devolve apenas os próprios registros; um atendimento de outro profissional retorna 403.",
    ressalva: "O isolamento vale para agenda, atendimentos e repasses, mas não é completo: as rotas de profissionais expõem contratos e grade de turnos de todos, o dashboard devolve indicadores financeiros da clínica inteira e a lista de pacientes não é filtrada. Há ainda um caso de borda em que um usuário de perfil profissional sem vínculo enxerga tudo.",
  },
  "RF-024": {
    nome: "Encerramento automático de sessão após inatividade",
    complexidade: "B", custo: 0,
    situacao: "implementado-agora",
    video: "Sai pelo botão da barra superior e comprova que voltar para o painel exige login de novo; em seguida a sessão é envelhecida no banco e a mesma sessão passa a ser recusada.",
    prova: "Depois do logout, a rota de sessão responde 401 e a navegação para o painel redireciona para o login. Com o último acesso envelhecido além da janela, o mesmo cookie ainda válido passa a receber 401.",
    correcao: "Não existia nada além de um prazo absoluto de 7 dias, e o botão \"Sair\" era decorativo — limpava o armazenamento local mas nunca chamava a rota de logout, então o cookie continuava válido e voltar ao painel reautenticava. Foram implementados: logout de verdade no botão, janela de inatividade de 30 minutos configurável, renovação deslizante a cada requisição e validação do último acesso no servidor.",
  },
  "RF-025": {
    nome: "Registro do user_id autenticado em todo audit log financeiro",
    complexidade: "B", custo: 67.5,
    situacao: "parcial",
    video: "Marca um repasse como pago e mostra a trilha de auditoria resultante na tela de auditoria.",
    prova: "O registro gravado carrega o identificador do usuário autenticado, com valor anterior e posterior, e aparece filtrado na tela.",
    ressalva: "Não cobre todas as mutações financeiras: a geração de repasse e o fechamento automático semanal não gravam auditoria — e a rota de geração sequer repassa o usuário autenticado ao caso de uso. O cadastro inicial de contrato do profissional também não é auditado, embora a alteração seja.",
  },
  "RF-026": {
    nome: "Recuperação de senha via e-mail",
    complexidade: "B", custo: 281.25,
    situacao: "ja-existia",
    video: "Fluxo completo: pede a recuperação, abre o link com o token, define uma senha nova respeitando as regras e entra com ela.",
    prova: "O token é gerado com validade de 30 minutos, a nova senha funciona, o token é limpo depois do uso e a senha antiga passa a ser recusada. Usa uma conta descartável, sem afetar as contas de demonstração.",
    ressalva: "O token fica em texto puro no banco e sessões já abertas não são invalidadas após a troca.",
  },
};

const ROTULO_SITUACAO = {
  "ja-existia": ["Já atendido", "#1d6f42", "#e7f4ec"],
  "implementado-agora": ["Implementado nesta entrega", "#0b5cad", "#e6f0fa"],
  corrigido: ["Corrigido nesta entrega", "#8a5300", "#fdf1de"],
  parcial: ["Atendido com ressalva", "#8a5300", "#fdf1de"],
  bloqueado: ["Fora de escopo — sem vídeo", "#a12b2b", "#fbeaea"],
};

// ---------------------------------------------------------------------------
// Resultados reais das execuções
// ---------------------------------------------------------------------------

function lerResultados(caminho) {
  const rel = JSON.parse(readFileSync(caminho, "utf8"));
  const mapa = {};
  (function percorrer(suites) {
    for (const s of suites ?? []) {
      for (const sp of s.specs ?? []) {
        for (const t of sp.tests ?? []) {
          const codigo = sp.title.match(/^([A-Z]{2,3}-?\d{2,3})/)?.[1];
          if (!codigo) continue;
          const r = t.results?.[t.results.length - 1];
          mapa[codigo] = {
            status: t.status === "skipped" ? "skipped" : r?.status,
            duracao: r?.duration ?? 0,
            titulo: sp.title,
          };
        }
      }
      percorrer(s.suites);
    }
  })(rel.suites);
  return mapa;
}

const local = lerResultados(localPath);
const prod = lerResultados(prodPath);

const brl = (n) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const seg = (ms) => (ms ? `${(ms / 1000).toFixed(1)}s` : "—");

function selo(status) {
  if (status === "passed") return `<span class="ok">passou</span>`;
  if (status === "skipped") return `<span class="skip">não executado</span>`;
  return `<span class="fail">${status ?? "—"}</span>`;
}

// ---------------------------------------------------------------------------
// HTML
// ---------------------------------------------------------------------------

const codigos = MODULOS.flatMap(([, cs]) => cs);
const totalCusto = codigos.reduce((s, c) => s + REQ[c].custo, 0);
const nPassou = codigos.filter((c) => local[c]?.status === "passed").length;
const nBloq = codigos.filter((c) => REQ[c].situacao === "bloqueado").length;
const nNovos = codigos.filter((c) =>
  ["implementado-agora", "corrigido"].includes(REQ[c].situacao),
).length;
const nRessalva = codigos.filter((c) => REQ[c].ressalva).length;

const hoje = new Date().toLocaleDateString("pt-BR", {
  day: "2-digit", month: "long", year: "numeric",
});

const capitulos = MODULOS.map(([modulo, cs]) => {
  const itens = cs.map((c) => {
    const r = REQ[c];
    const [rotulo, cor, fundo] = ROTULO_SITUACAO[r.situacao];
    const arqLocal = local[c]?.titulo ? `${local[c].titulo.replace(/[/\\:]/g, "-")}.webm` : null;
    return `
    <section class="req">
      <div class="req-cab">
        <h3>${c} — ${r.nome}</h3>
        <span class="tag" style="color:${cor};background:${fundo};border-color:${cor}33">${rotulo}</span>
      </div>
      <table class="meta">
        <tr>
          <td><b>Complexidade</b><br>${r.complexidade}</td>
          <td><b>Custo na planilha</b><br>${brl(r.custo)}</td>
          <td><b>Local</b><br>${selo(local[c]?.status)} <span class="dur">${seg(local[c]?.duracao)}</span></td>
          <td><b>Produção (Neon)</b><br>${selo(prod[c]?.status)} <span class="dur">${seg(prod[c]?.duracao)}</span></td>
        </tr>
      </table>
      <p><b>O que o vídeo mostra.</b> ${r.video}</p>
      <p><b>Como comprova.</b> ${r.prova}</p>
      ${r.correcao ? `<p class="box fix"><b>O que foi feito nesta entrega.</b> ${r.correcao}</p>` : ""}
      ${r.ressalva ? `<p class="box warn"><b>Ressalva honesta.</b> ${r.ressalva}</p>` : ""}
      ${arqLocal ? `<p class="arq">Arquivo: <code>videos/local/${arqLocal}</code> e <code>videos/producao/${arqLocal}</code></p>` : `<p class="arq">Sem arquivo de vídeo.</p>`}
    </section>`;
  }).join("");
  return `<div class="modulo"><h2>${modulo}</h2>${itens}</div>`;
}).join("");

const linhasResumo = codigos.map((c) => {
  const r = REQ[c];
  const [rotulo] = ROTULO_SITUACAO[r.situacao];
  return `<tr>
    <td><code>${c}</code></td><td>${r.nome}</td>
    <td>${rotulo}</td>
    <td class="c">${selo(local[c]?.status)}</td>
    <td class="c">${selo(prod[c]?.status)}</td>
  </tr>`;
}).join("");

const html = `
<style>
  @page { size: A4; margin: 16mm 14mm; }
  * { box-sizing: border-box; }
  body { font: 10.5pt/1.5 -apple-system, "Segoe UI", Roboto, sans-serif; color: #1a1a1a; }
  h1 { font-size: 24pt; margin: 0 0 4px; letter-spacing: -0.4px; }
  h2 { font-size: 15pt; margin: 26px 0 10px; padding-bottom: 5px;
       border-bottom: 2px solid #1a1a1a; page-break-after: avoid; }
  h3 { font-size: 11.5pt; margin: 0; }
  .sub { color: #555; font-size: 11pt; margin-bottom: 22px; }
  .kpis { display: flex; gap: 8px; margin: 18px 0 22px; }
  .kpi { flex: 1; border: 1px solid #ddd; border-radius: 7px; padding: 10px 12px; }
  .kpi b { display: block; font-size: 19pt; line-height: 1.1; }
  .kpi span { font-size: 8.5pt; color: #666; text-transform: uppercase; letter-spacing: .4px; }
  table { width: 100%; border-collapse: collapse; }
  .resumo { font-size: 8.8pt; margin-top: 8px; }
  .resumo th { text-align: left; background: #f2f2f2; padding: 6px; border: 1px solid #ddd; }
  .resumo td { padding: 5px 6px; border: 1px solid #e4e4e4; vertical-align: top; }
  .resumo td.c { text-align: center; }
  .req { page-break-inside: avoid; border: 1px solid #e2e2e2; border-radius: 8px;
         padding: 12px 14px; margin-bottom: 11px; }
  .req-cab { display: flex; justify-content: space-between; align-items: baseline; gap: 10px; }
  .tag { font-size: 7.8pt; padding: 2px 8px; border-radius: 20px;
         border: 1px solid; white-space: nowrap; font-weight: 600; }
  .meta { margin: 9px 0; font-size: 8.6pt; }
  .meta td { border: 1px solid #eee; padding: 5px 7px; width: 25%; background: #fafafa; }
  .meta b { font-size: 7.6pt; color: #777; text-transform: uppercase; letter-spacing: .3px; }
  .req p { margin: 6px 0; }
  .box { padding: 8px 10px; border-radius: 6px; border-left: 3px solid; }
  .fix { background: #eef5fc; border-color: #0b5cad; }
  .warn { background: #fdf6ea; border-color: #b8791a; }
  .arq { font-size: 8.2pt; color: #777; margin-top: 8px; }
  code { font-family: ui-monospace, Menlo, monospace; font-size: 8.6pt;
         background: #f3f3f3; padding: 1px 4px; border-radius: 3px; }
  .ok { color: #1d6f42; font-weight: 700; }
  .fail { color: #a12b2b; font-weight: 700; }
  .skip { color: #8a5300; font-weight: 700; }
  .dur { color: #999; font-size: 8pt; }
  .nota { background: #fbeaea; border-left: 3px solid #a12b2b;
          padding: 11px 13px; border-radius: 6px; margin: 16px 0; }
  .metodo { background: #f7f7f7; border-radius: 7px; padding: 12px 14px; font-size: 9.4pt; }
  .metodo li { margin: 3px 0; }
  .quebra { page-break-before: always; }
</style>

<h1>ClinicaShare — Comprovação em vídeo</h1>
<div class="sub">
  Planilha de custos · ${codigos.length} requisitos · gerado em ${hoje}<br>
  Cada requisito tem um vídeo no ambiente local e outro em produção.
</div>

<div class="kpis">
  <div class="kpi"><b>${nPassou}/${codigos.length}</b><span>com vídeo aprovado</span></div>
  <div class="kpi"><b>${nNovos}</b><span>implementados ou corrigidos agora</span></div>
  <div class="kpi"><b>${nRessalva}</b><span>com ressalva registrada</span></div>
  <div class="kpi"><b>${nBloq}</b><span>fora de escopo</span></div>
</div>

<div class="nota">
  <b>Leia antes:</b> o requisito <b>FI09 (pagamento online por Pix e cartão)</b> não tem vídeo.
  Ele está formalmente removido do escopo pela decisão DEC-E09 registrada no plano de
  implementação do projeto, e não existe nenhum gateway de pagamento no código.
  Optou-se por declarar a ausência em vez de gravar um checkout simulado, que seria uma
  comprovação falsa. Os demais ${codigos.length - 1} requisitos foram gravados nos dois ambientes.
  Requisitos marcados como <b>“atendido com ressalva”</b> funcionam e têm vídeo, mas o
  capítulo correspondente descreve exatamente onde a implementação fica aquém do enunciado.
</div>

<div class="metodo">
  <b>Como as evidências foram produzidas</b>
  <ul>
    <li>Um teste automatizado por requisito, gravado em vídeo a 1280×720 com as ações
        desaceleradas para poderem ser acompanhadas por quem assiste.</li>
    <li>Antes de cada gravação o banco é recriado pela seed, então os dois ambientes
        partem do mesmo cenário: 12 consultórios, 5 profissionais, 30 pacientes,
        241 atendimentos e 4 semanas de repasses.</li>
    <li>Ambiente local: PostgreSQL 16 em Docker. Produção: banco Neon, com as mesmas
        migrações aplicadas.</li>
    <li>Os resultados desta tabela vêm dos relatórios de execução, não foram digitados —
        o documento não consegue divergir do que rodou de fato.</li>
    <li>Quando um requisito não é observável na tela (regra de servidor, agendador,
        isolamento entre perfis), o vídeo mostra a tela envolvida e a comprovação é feita
        pela verificação direta da resposta do servidor, o que está dito no capítulo.</li>
  </ul>
</div>

<h2>Resumo</h2>
<table class="resumo">
  <tr><th>Cód.</th><th>Requisito</th><th>Situação</th><th>Local</th><th>Produção</th></tr>
  ${linhasResumo}
</table>
<p class="arq">Custo total dos requisitos conforme a planilha: <b>${brl(totalCusto)}</b>.</p>

<h2>Detalhamento por requisito</h2>
${capitulos}
`;

const navegador = await chromium.launch();
const pagina = await navegador.newPage();
await pagina.setContent(html, { waitUntil: "load" });
await pagina.pdf({
  path: saida,
  format: "A4",
  printBackground: true,
  displayHeaderFooter: true,
  headerTemplate: `<div></div>`,
  footerTemplate: `<div style="width:100%;font-size:7.5pt;color:#999;padding:0 14mm;
    display:flex;justify-content:space-between;align-items:center">
    <span>ClinicaShare — comprovação em vídeo da planilha de custos</span>
    <span>página <span class="pageNumber"></span> de <span class="totalPages"></span></span>
    </div>`,
  margin: { top: "14mm", bottom: "16mm", left: "14mm", right: "14mm" },
});
await navegador.close();

console.log(`PDF gerado: ${saida}`);
console.log(`  ${nPassou}/${codigos.length} requisitos com vídeo aprovado`);
console.log(`  ${nBloq} fora de escopo (FI09)`);
if (!existsSync(saida)) process.exit(1);
