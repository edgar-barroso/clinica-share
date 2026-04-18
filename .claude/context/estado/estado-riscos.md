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

### Legenda
- **Probabilidade:** Baixa / Média / Alta
- **Impacto:** Baixo / Médio / Alto / Crítico
- **Exposição:** Probabilidade × Impacto (Baixa / Média / Alta)

## Riscos Encerrados
| ID | Risco | Motivo de encerramento | Data |
|---|---|---|---|
| _(nenhum)_ | | | |

## Última atualização: 2026-04-18 (incorporação dos riscos R1 e riscos técnicos de stack)
