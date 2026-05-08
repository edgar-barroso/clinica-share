# Graph Report - .  (2026-05-08)

## Corpus Check
- Corpus is ~38,038 words - fits in a single context window. You may not need a graph.

## Summary
- 255 nodes · 200 edges · 12 communities detected
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 13 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Dashboard & Métricas|Dashboard & Métricas]]
- [[_COMMUNITY_Autenticação & Atendimento|Autenticação & Atendimento]]
- [[_COMMUNITY_Agenda & Transições|Agenda & Transições]]
- [[_COMMUNITY_Edição de Perfis|Edição de Perfis]]
- [[_COMMUNITY_Utilitários de Formatação|Utilitários de Formatação]]
- [[_COMMUNITY_Cadastro de Entidades|Cadastro de Entidades]]
- [[_COMMUNITY_Equipe & Financeiro|Equipe & Financeiro]]
- [[_COMMUNITY_Combobox de Paciente|Combobox de Paciente]]
- [[_COMMUNITY_Community 82|Community 82]]
- [[_COMMUNITY_Community 83|Community 83]]
- [[_COMMUNITY_Community 84|Community 84]]
- [[_COMMUNITY_Community 85|Community 85]]

## God Nodes (most connected - your core abstractions)
1. `useRole()` - 7 edges
2. `dayISO()` - 7 edges
3. `getSemanaContendo()` - 6 edges
4. `formatDate()` - 5 edges
5. `parseISO()` - 5 edges
6. `getMesContendo()` - 5 edges
7. `useCurrentUser()` - 4 edges
8. `fmtISO()` - 4 edges
9. `semanasDisponiveis()` - 4 edges
10. `mesesDisponiveis()` - 4 edges

## Surprising Connections (you probably didn't know these)
- `PatientSignUpPage()` --calls--> `useRole()`  [INFERRED]
  app\(front-end)\(pages)\(auth)\cadastrar\page.tsx → lib\role.tsx
- `PatientLoginPage()` --calls--> `useRole()`  [INFERRED]
  app\(front-end)\(pages)\(auth)\entrar\page.tsx → lib\role.tsx
- `LoginPage()` --calls--> `useRole()`  [INFERRED]
  app\(front-end)\(pages)\(auth)\login\page.tsx → lib\role.tsx
- `GoogleButton()` --calls--> `useRole()`  [INFERRED]
  components\auth\google-button.tsx → lib\role.tsx
- `PatientRedirect()` --calls--> `useRole()`  [INFERRED]
  components\layouts\patient-redirect.tsx → lib\role.tsx

## Communities

### Community 0 - "Dashboard & Métricas"
Cohesion: 0.13
Nodes (21): TopConsultoriosCard(), atendimentosRealizadosNoIntervalo(), atendimentosRealizadosSemana(), buildRepassesSemana(), calcularReceitaBruta(), dayISO(), fmtISO(), formatPeriodoLabel() (+13 more)

### Community 1 - "Autenticação & Atendimento"
Cohesion: 0.1
Nodes (9): EditAtendimentoButton(), GoogleButton(), PatientSignUpPage(), EditarAtendimentoPage(), PatientLoginPage(), PatientRedirect(), useCurrentUser(), useRole() (+1 more)

### Community 2 - "Agenda & Transições"
Cohesion: 0.2
Nodes (3): handleTransition(), toastMessage(), handleTransition()

### Community 3 - "Edição de Perfis"
Cohesion: 0.2
Nodes (1): handleSubmit()

### Community 4 - "Utilitários de Formatação"
Cohesion: 0.29
Nodes (5): formatDate(), formatDateLong(), formatDateTime(), formatTime(), formatWeekday()

### Community 5 - "Cadastro de Entidades"
Cohesion: 0.22
Nodes (1): handleSubmit()

### Community 6 - "Equipe & Financeiro"
Cohesion: 0.22
Nodes (4): EditarMembroPage(), initials(), StaffDetailPage(), getStaff()

### Community 8 - "Combobox de Paciente"
Cohesion: 0.32
Nodes (4): matches(), onlyDigits(), openDropdown(), toggleDropdown()

### Community 82 - "Community 82"
Cohesion: 1.0
Nodes (1): AGENTS

### Community 83 - "Community 83"
Cohesion: 1.0
Nodes (1): CLAUDE

### Community 84 - "Community 84"
Cohesion: 1.0
Nodes (1): PROTOTIPO-PLANO

### Community 85 - "Community 85"
Cohesion: 1.0
Nodes (1): README

## Knowledge Gaps
- **4 isolated node(s):** `AGENTS`, `CLAUDE`, `PROTOTIPO-PLANO`, `README`
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Edição de Perfis`** (10 nodes): `page.tsx`, `page.tsx`, `page.tsx`, `addEquipamento()`, `addTurno()`, `confirmarDelete()`, `handleSubmit()`, `removeTurno()`, `toggleEspecialidade()`, `updateTurno()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Cadastro de Entidades`** (9 nodes): `page.tsx`, `page.tsx`, `addEquipamento()`, `addTurno()`, `handleSubmit()`, `removeEquipamento()`, `removeTurno()`, `toggleEspecialidade()`, `updateTurno()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 82`** (1 nodes): `AGENTS`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 83`** (1 nodes): `CLAUDE`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 84`** (1 nodes): `PROTOTIPO-PLANO`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 85`** (1 nodes): `README`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `getStaff()` connect `Equipe & Financeiro` to `Dashboard & Métricas`?**
  _High betweenness centrality (0.007) - this node is a cross-community bridge._
- **Are the 6 inferred relationships involving `useRole()` (e.g. with `PatientSignUpPage()` and `PatientLoginPage()`) actually correct?**
  _`useRole()` has 6 INFERRED edges - model-reasoned connections that need verification._
- **What connects `AGENTS`, `CLAUDE`, `PROTOTIPO-PLANO` to the rest of the system?**
  _4 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Dashboard & Métricas` be split into smaller, more focused modules?**
  _Cohesion score 0.13 - nodes in this community are weakly interconnected._
- **Should `Autenticação & Atendimento` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._