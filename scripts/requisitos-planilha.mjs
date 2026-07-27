/**
 * Nomes dos requisitos exatamente como aparecem na coluna
 * "Macro Requisitos (Casos de Uso)" da `ClinicaShare_Planilha_Custos ✅ .xlsx`,
 * com a complexidade e o custo da mesma linha.
 *
 * Fonte única desses fatos: quem precisar do nome oficial de um requisito
 * importa daqui em vez de redigitar.
 *
 * As abreviações ("consul.", "dif.", "ext.") são da planilha original e foram
 * mantidas de propósito, para o nome do arquivo bater com a linha da planilha.
 */

/** Ordem dos módulos como na planilha. */
export const MODULOS = [
  { pasta: "1 - Agendamento", nome: "Módulo de Agendamento",
    codigos: ["AG01", "AG02", "AG04", "AG05", "AG06", "AG07"] },
  { pasta: "2 - Consultorios", nome: "Módulo de Consultórios",
    codigos: ["CO01", "CO02", "CO03", "CO04"] },
  { pasta: "3 - Atendimentos e Prontuario", nome: "Módulo de Atendimentos e Prontuário",
    codigos: ["AT01", "AT02", "AT03", "AT04"] },
  { pasta: "4 - Financeiro", nome: "Módulo Financeiro",
    codigos: ["FI01", "FI02", "FI03", "FI04", "FI05", "FI06", "FI07", "FI08", "FI09"] },
  { pasta: "5 - Relatorios e Dashboard", nome: "Módulo de Relatórios e Dashboard",
    codigos: ["RE01", "RE02", "RE03", "RE04", "RE05"] },
  { pasta: "6 - Autenticacao e Controle de Acesso", nome: "Módulo de Autenticação e Controle de Acesso",
    codigos: ["RF-021", "RF-022", "RF-023", "RF-024", "RF-025", "RF-026"] },
];

export const REQUISITOS = {
  AG01: { nome: "Paciente agenda consulta online (portal web)", complexidade: "A", custo: 2278.125 },
  AG02: { nome: "Atendente agenda consulta em nome do paciente", complexidade: "B", custo: 461.25 },
  AG04: { nome: "Configuração de duração de consulta por profissional", complexidade: "B", custo: 146.25 },
  AG05: { nome: "Bloqueio automático de conflito de horário e consultório", complexidade: "A", custo: 1406.25 },
  AG06: { nome: "Cancelamento de consulta com registro obrigatório de motivo", complexidade: "B", custo: 281.25 },
  AG07: { nome: "Envio de lembrete automático via Email", complexidade: "A", custo: 1870.3125 },

  CO01: { nome: "Cadastro dos 12 consultórios com tipo e equipamentos", complexidade: "B", custo: 686.25 },
  CO02: { nome: "Configuração de turnos fixos e horários por profissional", complexidade: "M", custo: 1194.375 },
  CO03: { nome: "Profissional pode alocar múltiplos turnos em consultórios dif.", complexidade: "B", custo: 236.25 },
  CO04: { nome: "Dashboard de ocupação e receita por consultório", complexidade: "M", custo: 1304.0625 },

  AT01: { nome: "Registro de atendimento realizado (data, profissional, consul.)", complexidade: "M", custo: 1084.6875 },
  AT02: { nome: "Registro de procedimentos adicionais por atendimento", complexidade: "B", custo: 371.25 },
  AT03: { nome: "Prontuário eletrônico integrado (campos a definir na R2)", complexidade: "A", custo: 2517.1875 },
  AT04: { nome: "Registro de ocorrência para profissionais com prontuário ext.", complexidade: "B", custo: 146.25 },

  FI01: { nome: "Cadastro de contrato por profissional (aluguel ou percentual)", complexidade: "M", custo: 1023.75 },
  FI02: { nome: "Configuração de percentual individual por profissional", complexidade: "B", custo: 146.25 },
  FI03: { nome: "Cálculo automático de repasse por profissional", complexidade: "A", custo: 2306.25 },
  FI04: { nome: "Repasse inclui consultas e procedimentos extras registrados", complexidade: "M", custo: 780 },
  FI05: { nome: "Registro de status de pagamento (pago, pendente, gratuito)", complexidade: "B", custo: 236.25 },
  FI06: { nome: "Registro de descontos com justificativa", complexidade: "B", custo: 225 },
  FI07: { nome: "Fechamento financeiro semanal com relatório de prestação de c.", complexidade: "M", custo: 1340.625 },
  FI08: { nome: "Registro de aluguel fixo por turno utilizado por profissional", complexidade: "B", custo: 236.25 },
  FI09: { nome: "Pagamento online pelo paciente: Pix, cartão", complexidade: "A", custo: 2053.125 },

  RE01: { nome: "Dashboard admin: receita total, repasses em aberto e pagos", complexidade: "A", custo: 1884.375 },
  RE02: { nome: "Relatório financeiro com filtros por profissional e período", complexidade: "M", custo: 901.875 },
  RE03: { nome: "Ranking de consultórios por receita gerada", complexidade: "B", custo: 292.5 },
  RE04: { nome: "Relatório de consultas gratuitas e descontos", complexidade: "B", custo: 202.5 },
  RE05: { nome: "Relatório de cancelamentos com motivos registrados", complexidade: "B", custo: 202.5 },

  "RF-021": { nome: "Autenticação de usuário com e-mail e senha", complexidade: "M", custo: 975 },
  "RF-022": { nome: "Controle de acesso por perfil (Adm, Aux, Profissional, Atendente, Paciente)", complexidade: "A", custo: 1673.4375 },
  "RF-023": { nome: "Profissional não acessa dados ou agenda de outro profissional", complexidade: "M", custo: 609.375 },
  "RF-024": { nome: "Encerramento automático de sessão após inatividade", complexidade: "B", custo: 0 },
  "RF-025": { nome: "Registro do user_id autenticado em todo audit log financeiro", complexidade: "B", custo: 67.5 },
  "RF-026": { nome: "Recuperação de senha via e-mail", complexidade: "B", custo: 281.25 },
};

/** Todos os códigos, na ordem da planilha. */
export const CODIGOS = MODULOS.flatMap((m) => m.codigos);

/**
 * Deixa o texto utilizável como nome de arquivo no macOS/Windows.
 * `:` e `/` são os que realmente quebram (o Finder mostra `:` como `/`).
 */
export function nomeSeguro(texto) {
  return texto
    .replace(/:/g, " -")
    .replace(/[/\\?%*|"<>]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}
