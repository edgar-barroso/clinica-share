# Registro de Riscos

> Atividade guarda-chuva obrigatória (Pressman). Atualizar a cada fase.
> Framework: **RMMM** (Risk Mitigation, Monitoring and Management).
> Fórmula de exposição: **RE = P × C** (probabilidade × custo do impacto).
> Impacto: 1=Catastrófico, 2=Crítico, 3=Marginal, 4=Negligível.
> Formato CTC para refinamento: "Considerando que \<condição\> então há preocupação de que \<consequência\>".

## Riscos Ativos

### Riscos originais (2026-04-13) — equipe
| ID | Risco | Probabilidade | Impacto | Exposição | Mitigação | Responsável | Status |
|---|---|---|---|---|---|---|---|
| R-001 | Erro no cálculo de repasse destrói confiança do cliente | Média | Crítico | Alta | Testes unitários obrigatórios + revisão cruzada | Equipe (codificação) | Aberto |
| R-002 | Profissionais não aderem ao registro de consultas | Alta | Alto | Alta | UX simples + demo convincente + obrigatoriedade para liberar próximo turno (ver R1 risco R1) | Equipe (comunicação) | Aberto |
| R-003 | Inflação de escopo (prontuário, agenda, portal) | Alta | Alto | Alta | MVP como lei + sinalização imediata ao cliente | Equipe (planejamento) | Aberto |
| R-004 | Retrabalho por comunicação falha na equipe de 4 | Média | Médio | Média | Board de tarefas + reunião semanal interna + atas | Equipe (todos) | Aberto |
| R-005 | Dr. Edson (professor) como gargalo de aprovação | Média | Médio | Média | Lista de pendências priorizadas + contato assíncrono | Equipe (comunicação) | Aberto |
| R-006 | Usar float para dinheiro (bug financeiro silencioso) | Baixa | Crítico | Média | Regra inegociável + code review | Equipe (codificação) | Aberto |
| R-007 | Codar antes de ter requisitos confirmados | Média | Alto | Alta | Regra de ordem: requisito → modelo → código | Equipe (todos) | Aberto |

### Riscos levantados em R1 (documento de requisitos v1)
| ID | Risco | Probabilidade | Impacto | Exposição | Mitigação | Responsável | Status |
|---|---|---|---|---|---|---|---|
| R-008 | Médicos resistirem a registrar procedimentos no sistema (perda de controle sobre repasse) | Alta | Alto | Alta | Tornar o registro obrigatório para liberar o consultório no próximo turno (regra de negócio a implementar) | Equipe (modelagem + comunicação com cliente) | Aberto |
| R-009 | Integração com prontuários externos aumentar custo e prazo significativamente | Média | Alto | Alta | DEC-E02 define integração fora do MVP; confirmar com cliente em R2 (PEND-013) | Equipe (planejamento) | Aberto |
| R-010 | Prontuário eletrônico sem definição de escopo pode travar o desenvolvimento | Média | Médio | Média | Definir campos mínimos do prontuário na R2 (PEND-017) antes de iniciar modelagem do módulo AT03 | Equipe (comunicação) | Aberto |
| R-011 | Lembrete por IA via WhatsApp (AG07) depende de API do WhatsApp Business (custo e aprovação) | Média | Médio | Média | Avaliar custo da API na proposta e apresentar ao cliente (PEND-022); AG07 é prioridade Média — adiável | Equipe (planejamento + implementação) | Aberto |
| R-012 | Falta de padronização atual pode dificultar migração de dados históricos | Média | Médio | Média | Verificar existência e formato das planilhas atuais na R2 (PEND-016); considerar script de importação dedicado | Equipe (modelagem + implementação) | Aberto |

### Riscos técnicos adicionados pós-decisão de stack (2026-04-18)
| ID | Risco | Probabilidade | Impacto | Exposição | Mitigação | Responsável | Status |
|---|---|---|---|---|---|---|---|
| R-013 | Next.js 16 + Tailwind v4 são versões recentes com documentação escassa e possíveis breaking changes | Média | Médio | Média | Consultar `node_modules/next/dist/docs/` antes de usar APIs novas; usar shadcn canary para compatibilidade com Tailwind v4 | Equipe (codificação) | Aberto |
| R-014 | Protótipo mockado pode ser confundido pelo Dr. Edson como sistema pronto | Média | Médio | Média | Banner "PROTÓTIPO" visível; introdução formal na R2 explicando escopo; dados visivelmente fictícios | Equipe (comunicação) | Aberto |

### Riscos decorrentes da auth separada do paciente + Google OAuth (2026-04-19) <!-- NOVO -->
| ID | Risco | Probabilidade | Impacto | Exposição | Mitigação | Responsável | Status |
|---|---|---|---|---|---|---|---|
| R-015 | Google OAuth compartilha dados do paciente (e-mail, nome, foto) com terceiro — impacto LGPD e dependência jurídica | Alta | Médio | Alta | Documentar na Política de Privacidade; exigir consentimento explícito no cadastro; confirmar decisão com cliente em R2 (PEND-024); avaliar manter e-mail/senha como alternativa sempre disponível | Equipe (modelagem + implementação) | Aberto |
| R-016 | Auto-cadastro sem validação prévia pode gerar contas duplicadas ou fake, conflitando com cadastros criados pela atendente via AG02 | Média | Médio | Média | Unificar por e-mail/CPF na criação; fluxo de "vincular conta existente" quando atendente já cadastrou; definir dados mínimos em PEND-025 | Equipe (modelagem) | Aberto |
| R-017 | Indisponibilidade do Google bloqueia o método de login mais usado pelo paciente | Baixa | Médio | Baixa | Manter e-mail/senha sempre disponível como fallback; exibir erro amigável se OAuth falhar | Equipe (implementação) | Aberto |
| R-018 | Oferecer "pagar na hora da consulta" (FI10) sem política de no-show aumenta faltas e ociosidade de consultório (relaciona com R-002) <!-- NOVO --> | Média | Médio | Média | Validar política em R2 via PEND-027; até lá, manter lembrete WhatsApp (AG07) como principal redutor de no-show; avaliar sinal de "reserva confirmada" com confirmação 1 dia antes | Equipe (comunicação + planejamento) | Aberto |

### Riscos do fluxo operacional mockado (2026-04-19) <!-- NOVO -->
| ID | Risco | Probabilidade | Impacto | Exposição | Mitigação | Responsável | Status |
|---|---|---|---|---|---|---|---|
| R-019 | Protótipo sem persistência entre páginas pode confundir Dr. Edson na demo — marcar "Chegou" e navegar desfaz a transição <!-- NOVO --> | Alta | Baixo | Média | Toasts claros por transição ("Registrado por X"); banner "protótipo sem persistência" visível; roteiro de demo executa todas as ações sem mudar de tela; README orienta | Equipe (comunicação) | Aberto |
| R-020 | Role simulado sem `profissionalId` real impede validação semântica — profissional é sempre `p01` (Dra. Nirmala) <!-- NOVO --> | Média | Baixo | Baixa | Nota no seletor de role; PEND-032 e implementação de auth real resolverão. Demo usa apenas o profissional mapeado | Equipe (implementação) | Aberto |

### Riscos da remoção proposta de FI09 (2026-05-07) <!-- NOVO -->
| ID | Risco | Probabilidade | Impacto | Exposição | Mitigação | Responsável | Status |
|---|---|---|---|---|---|---|---|
| R-021 | Dr. Edson rejeita a proposta DEC-E09 em R2 e exige FI09 reativado; equipe precisa retomar arquitetura Asaas (conta-mãe + walletId, split, estorno, tributário PEND-040) com prazo apertado <!-- NOVO --> | Média | Alto | Alta | Apresentar DEC-E09 em R2 com argumentação clara: foco no problema central de R1 (controle de repasse), redução LGPD/PCI, IFQ "Excitante" ≠ "Normal", economia de ~19h e ~R$ 2.566 (planilha-custos-v2); manter FI09 marcado como "removido proposto" e não "removido" para reverter rápido se rejeitado; ter rascunho de arquitetura Asaas pronto como fallback (já documentado em conversa com equipe) | Equipe (comunicação + planejamento) | Aberto |
| R-022 | Pagamento exclusivamente presencial pode aumentar taxa de no-show (paciente sem "skin in the game") e gerar inadimplência (paciente atendido sem pagar e sai sem cobrança) <!-- NOVO --> | Média | Médio | Média | Reforçar lembretes WhatsApp (AG07) como principal redutor de no-show; auxiliar marca status `pendente` no atendimento e cobra no fechamento semanal (FI07); PEND-027 endereça política de no-show; em última análise, se inadimplência for problema, FI09 pode voltar com sinal/caução parcial | Equipe (modelagem + comunicação) | Aberto |

### Legenda
- **Probabilidade:** Baixa / Média / Alta
- **Impacto:** Baixo / Médio / Alto / Crítico
- **Exposição:** Probabilidade × Impacto (Baixa / Média / Alta)

## Riscos Encerrados
| ID | Risco | Motivo de encerramento | Data |
|---|---|---|---|
| _(nenhum)_ | | | |

## Última atualização: 2026-05-07 (+R-021 cliente rejeitar remoção FI09; +R-022 no-show e inadimplência sem pagamento antecipado)
