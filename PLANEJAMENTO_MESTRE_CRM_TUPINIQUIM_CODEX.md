# Planejamento Mestre — CRM Tupiniquim

**Produto:** CRM Tupiniquim — TUPINIQUIM TECH SOLUTIONS  
**Objetivo:** sistema CRM comercial completo, editável, responsivo e instalável como PWA, preparado para desktop e mobile.  
**Público principal:** operação comercial e atendimento a pequenas e médias empresas.  
**Estratégia de execução:** construção incremental pelo Codex, com checkpoints verificáveis, migrações versionadas e critérios de aceite por fase.

---

## 1. Visão executiva

O CRM será o sistema central de ação da TUPINIQUIM TECH SOLUTIONS. Ele deve organizar prospecção, qualificação, negociações, propostas, vendas, implantação, relacionamento, recorrência e oportunidades de upsell.

O produto será uma aplicação web responsiva, mobile-first e PWA. Desktop e mobile compartilharão a mesma base de código e banco de dados. A interface será adaptativa: visão ampla e produtiva no desktop; navegação simples, ações rápidas e formulários adequados ao toque no celular.

### 1.1 Princípios obrigatórios

- Dados e regras de negócio no servidor; a interface nunca será a única camada de validação.
- Regras determinísticas antes de inteligência artificial.
- Aprovação humana para propostas, mensagens em massa e ações externas relevantes.
- Permissões mínimas por função e por organização.
- Registro de auditoria de ações críticas.
- LGPD desde a modelagem: finalidade, consentimento ou base legal, origem, retenção, exportação e exclusão.
- WhatsApp apenas por Cloud API oficial da Meta ou provedor autorizado.
- Componentes, funis, campos, motivos, etiquetas, templates e automações editáveis sem alteração de código sempre que possível.
- Nenhum lead é considerado validado sem empresa identificada e fonte de validação.

### 1.2 Resultados esperados

- Uma visão 360º de cada empresa, contato, oportunidade e cliente.
- Controle de SLA e follow-ups, reduzindo leads esquecidos.
- Funil comercial mensurável da origem à retenção.
- Gestão de receita recorrente, projetos pontuais e upsells.
- Segmentação nativa para os 12 públicos atendidos.
- Operação segura por vários usuários, equipes e papéis.

---

## 2. Escopo funcional

### 2.1 Módulos do MVP operacional

1. Autenticação, organizações, usuários, equipes e permissões.
2. Dashboard executivo e dashboard do vendedor.
3. Empresas e contatos.
4. Leads e validação de origem.
5. Funil e oportunidades em Kanban e tabela.
6. Atividades, tarefas, agenda e follow-ups.
7. Histórico/timeline 360º.
8. Propostas comerciais e catálogo de produtos/serviços.
9. Conversão em cliente, contratos e receitas.
10. Segmentos, etiquetas, campos personalizados e configurações.
11. Importação e exportação CSV/XLSX.
12. Notificações internas.
13. Relatórios essenciais e auditoria.
14. PWA responsiva para desktop e mobile.

### 2.2 Módulos da versão completa

- Central de comunicação: e-mail e WhatsApp oficial.
- Templates e sequências de contato.
- Automações com gatilhos, condições, ações, testes e logs.
- Metas, forecast, comissão e produtividade.
- Tickets/pós-venda, onboarding e sucesso do cliente.
- MRR, churn, renovação, projetos e upsells.
- Formulários públicos de captura e webhooks.
- APIs e integrações.
- Assistente de IA com revisão humana, resumo, classificação e sugestões.
- Personalização visual e white-label básico.

### 2.3 Fora do primeiro ciclo

- Aplicativos Android e iOS nativos separados.
- Discador telefônico próprio.
- ERP, emissão fiscal e contabilidade completos.
- Gateway próprio de mensagens não oficial.
- Decisões autônomas de IA que enviem mensagens ou propostas sem aprovação.
- Marketplace público de extensões.

---

## 3. Segmentação comercial

O sistema deve oferecer os 12 segmentos iniciais, sem criar bancos ou módulos isolados para cada um:

1. Clínicas e saúde.
2. Contabilidade, advocacia e consultoria.
3. Varejo.
4. Restaurantes e alimentação.
5. Imobiliárias.
6. Academias e fitness.
7. Beleza e estética.
8. Escolas e educação.
9. Hotelaria e hospedagem.
10. Indústrias, oficinas e distribuidoras.
11. E-commerce.
12. Condomínios.

Cada segmento será uma classificação configurável. Dashboards, filtros, templates, campos personalizados, serviços sugeridos e relatórios poderão usar essa classificação. A experiência conceitual de “Prospecção + Clientes Ativos” será preservada como visões/filtros, e não como 24 tabelas físicas ou abas rígidas.

---

## 4. Funil e ciclo de vida

### 4.1 Etapas padrão

`Lead → Contato iniciado → Qualificado → Reunião agendada → Proposta enviada → Negociação → Ganho → Implantação → Retenção`

Etapas alternativas:

- Desqualificado.
- Perdido.
- Em nutrição.
- Pausado.

O administrador poderá criar múltiplos pipelines, reordenar etapas, definir probabilidades, SLA, campos obrigatórios e regras de entrada/saída.

### 4.2 Regras mínimas

- Lead novo recebe responsável, origem e prazo de primeiro contato.
- Mudança de etapa gera evento na timeline.
- Etapas podem exigir campos obrigatórios.
- “Proposta enviada” exige uma proposta registrada.
- “Ganho” exige valor, responsável, empresa e contato principal.
- “Perdido” exige motivo padronizado e comentário opcional.
- Follow-up vencido aparece em destaque e nos indicadores.
- Duplicidades devem ser detectadas por CNPJ, e-mail, telefone e domínio, com fusão manual auditada.
- Conversão não apaga o lead; preserva sua história e relações.

### 4.3 Motivos de perda iniciais

- Preço/orçamento.
- Sem prioridade.
- Sem resposta.
- Concorrente.
- Solução inadequada.
- Timing.
- Lead inválido/duplicado.
- Decisão interna.
- Outro, com justificativa.

---

## 5. Dados obrigatórios

### 5.1 Lead

- ID público imutável.
- Empresa e segmento.
- Cidade/UF.
- Nome do contato e cargo.
- WhatsApp/telefone e e-mail.
- Canal de entrada e origem detalhada.
- UTM source, medium, campaign, content e term quando disponíveis.
- Dor principal e interesse.
- Status, etapa, prioridade e temperatura.
- Responsável e equipe.
- Último contato, próximo follow-up e dias sem contato.
- Valor potencial e moeda.
- CNPJ, domínio e fonte de validação.
- Preferência de canal.
- Consentimento/base legal, data e evidência.
- Motivo de perda quando aplicável.

### 5.2 Empresa

- Razão social, nome fantasia, CNPJ, domínio e segmento.
- Porte, número estimado de funcionários e faturamento opcional.
- Endereços, cidade/UF e região.
- Site, redes sociais e canais.
- Situação comercial: prospect, cliente, inativo ou parceiro.
- Responsável pela conta.
- Contatos relacionados.
- Oportunidades, propostas, contratos, projetos e tickets.
- MRR, receita de projetos, saúde da conta e potencial de upsell.

### 5.3 Contato

- Nome, cargo, nível de decisão e empresa.
- E-mail, telefone, WhatsApp e preferência de contato.
- Consentimento/base legal e restrições de comunicação.
- Anotações, atividades e oportunidades relacionadas.

### 5.4 Oportunidade

- Pipeline, etapa, título, empresa, contato e responsável.
- Valor, probabilidade, previsão de fechamento e temperatura.
- Produtos/serviços, concorrentes e próximo passo.
- Origem, campanha e lead de origem.
- Motivo de ganho/perda.

---

## 6. Modelo de dados proposto

### 6.1 Entidades de identidade e segurança

- `Organization`
- `User`
- `Membership`
- `Team`
- `Role`
- `Permission`
- `Session`
- `AuditLog`

### 6.2 Entidades comerciais

- `Company`
- `Contact`
- `Lead`
- `Pipeline`
- `PipelineStage`
- `Opportunity`
- `OpportunityStageHistory`
- `LossReason`
- `Tag`
- `EntityTag`
- `CustomFieldDefinition`
- `CustomFieldValue`

### 6.3 Operação e comunicação

- `Activity`
- `Task`
- `CalendarEvent`
- `Note`
- `Attachment`
- `Notification`
- `MessageThread`
- `Message`
- `MessageTemplate`
- `CommunicationConsent`

### 6.4 Comercial e financeiro gerencial

- `CatalogItem`
- `PriceBook`
- `Proposal`
- `ProposalItem`
- `ProposalVersion`
- `Contract`
- `Subscription`
- `RevenueEntry`
- `Project`
- `UpsellOpportunity`

### 6.5 Automação e integração

- `Automation`
- `AutomationVersion`
- `AutomationRun`
- `AutomationActionLog`
- `WebhookEndpoint`
- `WebhookDelivery`
- `IntegrationConnection`
- `ImportJob`
- `ExportJob`

### 6.6 Pós-venda

- `OnboardingPlan`
- `OnboardingStep`
- `Ticket`
- `CustomerHealthScore`
- `Renewal`

### 6.7 Regras estruturais do banco

- PostgreSQL como banco principal.
- IDs internos UUID e IDs públicos não sequenciais.
- Todas as tabelas de negócio com `organization_id`.
- Datas armazenadas em UTC; apresentação no fuso do usuário.
- Exclusão lógica para dados comerciais recuperáveis.
- Índices para organização, responsável, etapa, datas, CNPJ normalizado, e-mail normalizado e telefone E.164.
- Restrições de unicidade por organização onde aplicável.
- Valores monetários em unidade mínima inteira ou decimal exato, nunca ponto flutuante.
- Migrações versionadas e seed idempotente.

---

## 7. Arquitetura recomendada

### 7.1 Stack

- **Frontend e backend web:** Next.js com TypeScript e App Router.
- **Interface:** Tailwind CSS + biblioteca acessível baseada em Radix/shadcn.
- **Banco:** PostgreSQL.
- **ORM:** Prisma.
- **Autenticação:** Auth.js ou solução equivalente madura, com sessões seguras.
- **Validação:** Zod compartilhado nos limites de entrada.
- **Formulários:** React Hook Form.
- **Consultas e cache cliente:** TanStack Query apenas onde o modelo do Next.js não bastar.
- **Filas e jobs:** Redis + BullMQ ou serviço equivalente; permitir modo local simplificado.
- **Arquivos:** armazenamento compatível com S3, com URLs assinadas.
- **E-mail:** provedor transacional por adaptador.
- **Testes:** Vitest, Testing Library e Playwright.
- **Observabilidade:** logs estruturados, rastreamento de erros e health checks.

### 7.2 Estrutura modular

```text
src/
  app/
  modules/
    auth/
    organizations/
    users/
    companies/
    contacts/
    leads/
    pipeline/
    activities/
    proposals/
    customers/
    reports/
    automations/
    integrations/
    settings/
  components/
  lib/
  server/
  styles/
prisma/
tests/
docs/
```

Cada módulo conterá domínio, schemas, serviços, consultas, ações/API e testes. Regras de negócio não devem ficar espalhadas em componentes visuais.

### 7.3 Multiempresa

O MVP será multi-tenant lógico: uma instalação pode conter organizações, e um usuário pode participar de uma ou mais delas. Toda leitura/escrita deve aplicar o contexto da organização no servidor. Testes de isolamento entre organizações são obrigatórios.

### 7.4 APIs

- Server Actions para interações internas simples quando apropriado.
- Route Handlers REST para integrações, webhooks, importações e clientes externos.
- OpenAPI para endpoints públicos.
- Idempotência em webhooks e operações financeiras/comunicacionais.
- Paginação por cursor nas listas grandes.
- Filtros validados, limite máximo e ordenação explícita.

---

## 8. Papéis e permissões

### 8.1 Papéis iniciais

- **Proprietário:** controle total, faturamento e exclusão da organização.
- **Administrador:** configura usuários, funis, campos, integrações e automações.
- **Gerente comercial:** acesso à equipe, metas, relatórios e redistribuição.
- **Vendedor/SDR:** leads e oportunidades próprios ou da equipe autorizada.
- **Atendimento/CS:** clientes, onboarding, tickets, renovações e upsells.
- **Financeiro:** propostas aprovadas, contratos e indicadores de receita.
- **Leitura/Auditoria:** acesso somente leitura conforme escopo.

### 8.2 Matriz de autorização

Permissões serão ações explícitas (`lead.read`, `lead.create`, `lead.update`, `proposal.approve`, `automation.publish`, etc.) combinadas com escopo:

- Próprios registros.
- Equipe.
- Toda a organização.

A interface pode esconder ações proibidas, mas o servidor sempre deve negar operações não autorizadas.

---

## 9. Experiência do usuário

### 9.1 Identidade visual

- Cores semânticas consistentes: azul para ação primária, verde para sucesso/ganho, amarelo para atenção, vermelho para atraso/perda/erro, cinzas para estrutura.
- Alto contraste e suporte a tema claro/escuro.
- Não depender somente da cor; usar ícones e texto.
- Tipografia legível, espaçamento consistente e estados de foco visíveis.
- Nome, logotipo, cores e moeda editáveis nas configurações.

### 9.2 Desktop

- Barra lateral recolhível.
- Cabeçalho com busca global, criação rápida, notificações e perfil.
- Tabelas densas configuráveis, filtros salvos e ações em lote.
- Kanban com drag-and-drop e alternativa acessível por menu.
- Painel lateral para visualizar/editar sem perder o contexto.

### 9.3 Mobile

- Navegação inferior com no máximo cinco destinos principais.
- Botão de ação rápida para lead, atividade, nota e oportunidade.
- Cards no lugar de tabelas largas; tabelas disponíveis com rolagem controlada quando indispensáveis.
- Alvos de toque mínimos, formulários em uma coluna e teclado apropriado ao campo.
- Kanban com seletor de etapa e listas verticais, evitando drag-and-drop obrigatório.
- Ações críticas com confirmação e feedback imediato.

### 9.4 Navegação proposta

- Início.
- CRM: Leads, Empresas, Contatos e Oportunidades.
- Atividades: Tarefas, Agenda e Follow-ups.
- Comercial: Propostas, Catálogo, Contratos e Receitas.
- Clientes: Onboarding, Tickets, Renovações e Upsells.
- Relatórios.
- Automações.
- Configurações.

### 9.5 Acessibilidade

- Meta WCAG 2.2 AA.
- Operação por teclado.
- Labels, mensagens de erro e landmarks semânticos.
- Contraste verificado.
- Respeito a redução de movimento.
- Testes com leitor de tela nos fluxos críticos.

---

## 10. Dashboard e indicadores

### 10.1 Indicadores obrigatórios

- Prospects.
- Leads novos no período.
- Em negociação.
- Follow-ups vencidos.
- Clientes ativos.
- MRR em reais.
- Receita de projetos em reais.
- Upsells abertos.
- Conversão por etapa.
- Ciclo médio de vendas.
- Ticket médio.
- Ganhos e perdas por período.
- Forecast ponderado.
- SLA de primeiro contato.

### 10.2 Filtros globais

- Período.
- Segmento.
- Pipeline/etapa.
- Responsável/equipe.
- Origem/campanha.
- Região.
- Produto/serviço.

As métricas devem ter definição única documentada. O card e o relatório detalhado precisam usar a mesma regra de cálculo.

---

## 11. Propostas e catálogo

- Catálogo editável de serviços, planos, adicionais e descontos permitidos.
- Proposta com dados do cliente, itens, impostos informativos, condições, validade e observações.
- Numeração por organização.
- Versionamento imutável após envio.
- Estados: rascunho, aguardando aprovação, aprovada, enviada, visualizada, aceita, recusada, expirada e cancelada.
- Aprovação obrigatória conforme valor, desconto ou papel.
- Geração de PDF e link público seguro.
- Aceite eletrônico simples com evidências; assinatura jurídica avançada por integração futura.
- Ao aceitar, permitir conversão em contrato, projeto e/ou assinatura recorrente.

---

## 12. Automações

### 12.1 Modelo

`Gatilho → Condições → Ações → Log de execução`

### 12.2 Gatilhos iniciais

- Lead criado/importado.
- Etapa alterada.
- Atividade concluída.
- Follow-up vencido.
- Proposta aceita/expirada.
- Cliente sem interação por período.
- Renovação próxima.
- Webhook recebido.
- Agenda programada.

### 12.3 Ações iniciais

- Criar tarefa.
- Atribuir responsável.
- Alterar prioridade/etapa/tag.
- Criar notificação.
- Preparar mensagem para aprovação.
- Enviar webhook.
- Aguardar intervalo controlado.

### 12.4 Segurança operacional

- Rascunho, teste e publicação versionada.
- Limite de execuções e proteção contra loops.
- Idempotência.
- Logs por passo, tentativas e erro.
- Fila de falhas e reprocessamento manual.
- Mensagens externas e propostas exigem política de aprovação.

---

## 13. Integrações

### 13.1 Prioridade

1. Importação CSV/XLSX.
2. E-mail transacional.
3. Calendário Google/Microsoft.
4. WhatsApp Cloud API oficial ou BSP autorizado.
5. Formulários e webhooks.
6. n8n, Make ou Zapier via API/webhook.
7. Armazenamento de arquivos.
8. Assinatura eletrônica e pagamentos, em fase posterior.

### 13.2 Requisitos comuns

- Credenciais criptografadas e nunca expostas ao cliente.
- Escopos mínimos.
- Estado de conexão e botão de revogação.
- Logs sem segredos nem conteúdo sensível desnecessário.
- Retry com backoff e idempotência.
- Webhooks autenticados, verificados e armazenados antes do processamento.

---

## 14. Inteligência artificial

A IA será assistiva, opcional e sempre rastreável.

### 14.1 Usos permitidos

- Resumir timeline e reuniões.
- Sugerir próximo passo.
- Classificar intenção, dor e temperatura.
- Auxiliar na deduplicação.
- Gerar rascunhos de e-mail, WhatsApp e proposta.
- Detectar risco de abandono ou renovação.
- Fazer perguntas em linguagem natural sobre indicadores autorizados.

### 14.2 Guardrails

- Nunca enviar conteúdo externo sem aprovação humana, salvo automação explicitamente autorizada e revogável.
- Não conceder acesso a dados além das permissões do usuário.
- Não usar dados de uma organização para responder sobre outra.
- Mostrar quando o conteúdo é gerado por IA.
- Registrar modelo, finalidade, usuário e resultado relevante sem registrar segredos.
- Permitir desativação por organização.
- Redigir/minimizar dados pessoais enviados a provedores quando possível.

---

## 15. Segurança, privacidade e LGPD

- Hash seguro de senha se houver credenciais locais.
- Cookies `HttpOnly`, `Secure` e `SameSite` adequados.
- Proteção contra CSRF, XSS, injeção, SSRF, upload malicioso e abuso de API.
- Rate limit em login, recuperação, formulários públicos, importações e webhooks.
- MFA para administradores na versão completa.
- Sessões revogáveis e registro de dispositivos.
- Criptografia em trânsito e proteção de segredos.
- Backup automatizado e restauração testada.
- Exportação dos dados do titular/organização.
- Fluxos de correção, anonimização e exclusão.
- Política de retenção configurável.
- Registro de base legal/consentimento e opt-out.
- Auditoria de login, exportação, exclusão, mudança de permissão, aprovação e integração.
- Dependências verificadas e atualizadas.

---

## 16. Importação dos dados existentes

O importador deve aceitar as planilhas atuais do CRM segmentado e da estrutura de leads.

### 16.1 Fluxo

1. Upload e leitura sem persistir registros finais.
2. Seleção da aba e mapeamento de colunas.
3. Normalização de telefone, e-mail, CNPJ, datas e valores.
4. Pré-visualização de erros e avisos.
5. Identificação de duplicidades.
6. Escolha: ignorar, atualizar ou criar.
7. Execução assíncrona em lotes.
8. Relatório final baixável.
9. Possibilidade de desfazer a importação quando não houver alterações posteriores conflitantes.

### 16.2 Mapeamento conceitual

- As 12 abas/segmentos de prospecção viram leads/empresas com `segment_id`.
- As abas de clientes ativos viram empresas com ciclo de vida “cliente”, preservando origem.
- Campos desconhecidos podem ser mapeados para campos personalizados.
- Empresa e fonte ausentes geram pendência; não geram lead validado.

---

## 17. Requisitos não funcionais

- Primeira carga útil em condições normais abaixo de 2,5 s nas páginas principais.
- Interações comuns com resposta visual em até 200 ms; jobs longos assíncronos.
- Paginação e virtualização para grandes volumes.
- PWA instalável, manifest válido e estratégia segura de cache.
- Interface funcional entre 360 px e telas desktop amplas.
- Suporte inicial aos navegadores modernos.
- Disponibilidade e RPO/RTO definidos antes da produção.
- Logs correlacionados por requisição/job.
- Health check de aplicação, banco, fila e integrações críticas.
- Português do Brasil como idioma inicial; textos preparados para internacionalização.
- Real brasileiro como moeda inicial; estrutura pronta para outras moedas.

---

## 18. Estratégia de testes

### 18.1 Pirâmide

- Unitários: cálculos, schemas, normalização e regras de domínio.
- Integração: banco, isolamento por organização, permissões, serviços e webhooks.
- Componentes: formulários, estados, acessibilidade e comportamento responsivo.
- E2E: fluxos críticos completos.
- Contrato: APIs e provedores externos simulados.

### 18.2 Fluxos E2E obrigatórios

1. Login e troca de organização.
2. Criar lead, validar origem e atribuir responsável.
3. Qualificar e mover no funil.
4. Registrar contato e follow-up.
5. Criar, aprovar e enviar proposta em ambiente simulado.
6. Marcar oportunidade como ganha e converter em cliente.
7. Registrar MRR/projeto/upsell.
8. Importar planilha com erros e duplicidades.
9. Bloquear usuário sem permissão.
10. Provar isolamento entre duas organizações.
11. Executar automação idempotente.
12. Usar os fluxos principais em viewport mobile.

### 18.3 Gates de qualidade

Nenhuma fase é concluída se falhar:

- `lint`
- typecheck
- testes unitários/de integração da fase
- testes E2E críticos afetados
- build de produção
- migração em banco limpo
- verificação básica de acessibilidade
- revisão de segurança para alterações sensíveis

---

## 19. Fases de execução pelo Codex

### Fase 0 — Descoberta do repositório e baseline

**Objetivo:** entender e preservar o que já foi criado no Replit.

Entregas:

- Inventário de arquivos, stack, scripts, rotas, dependências e estado do Git.
- Execução de instalação, lint, typecheck, testes e build sem alterar comportamento.
- Relatório de erros existentes.
- Mapa entre código existente e este planejamento.
- ADR inicial com decisões de manter, refatorar ou substituir.
- `.env.example` sem segredos e instruções locais.

**Checkpoint:** o Codex apresenta diagnóstico antes de reestruturar partes grandes.

### Fase 1 — Fundação técnica

Entregas:

- Estrutura modular.
- Banco PostgreSQL, Prisma, migrações e seed.
- Autenticação e recuperação de acesso.
- Organizações, memberships, papéis e autorização.
- Layout responsivo, tema e design tokens.
- Auditoria básica, tratamento de erro e logs.
- CI com gates mínimos.

**Aceite:** dois tenants não acessam dados um do outro; build e testes passam.

### Fase 2 — CRM essencial

Entregas:

- Empresas, contatos, leads e etiquetas.
- Busca, filtros, ordenação, paginação e filtros salvos.
- Deduplicação e validação de fonte.
- Timeline, notas, arquivos e atividades.
- Importador CSV/XLSX com preview.

**Aceite:** importar, localizar, editar e auditar leads sem perda de dados.

### Fase 3 — Funil e produtividade

Entregas:

- Pipelines configuráveis.
- Kanban desktop e fluxo mobile acessível.
- Oportunidades, histórico de etapa e motivos de perda.
- Tarefas, agenda, SLA e follow-ups vencidos.
- Notificações internas.

**Aceite:** ciclo Lead → oportunidade → ganho/perda funcionando ponta a ponta.

### Fase 4 — Comercial e receita

Entregas:

- Catálogo e preços.
- Propostas versionadas e aprovação.
- PDF/link seguro e simulação de envio.
- Contratos, assinaturas gerenciais, projetos e receita.
- MRR, upsells e indicadores essenciais.

**Aceite:** proposta aceita converte a oportunidade e alimenta receita sem duplicar registros.

### Fase 5 — Clientes e retenção

Entregas:

- Onboarding.
- Tickets e histórico de atendimento.
- Saúde do cliente.
- Renovação, churn e oportunidades de upsell.

**Aceite:** visão 360º mostra toda a jornada da prospecção à retenção.

### Fase 6 — Automações e integrações

Entregas:

- Motor versionado de gatilho/condição/ação.
- Fila, retry, idempotência e logs.
- Webhooks e formulários de captura.
- E-mail/calendário por adaptadores.
- WhatsApp oficial em sandbox, com templates e aprovação.

**Aceite:** automações são testáveis, auditáveis e não repetem ações externas.

### Fase 7 — Relatórios e IA assistiva

Entregas:

- Dashboard executivo, vendedor e segmentos.
- Conversão, forecast, SLA, origem, perdas, MRR, projetos e upsells.
- Exportações autorizadas.
- Resumos, classificação e rascunhos por IA com revisão humana.

**Aceite:** números conciliam com os registros detalhados e a IA respeita permissões.

### Fase 8 — Hardening e lançamento

Entregas:

- Auditoria de segurança e LGPD.
- Teste de restauração de backup.
- Carga/performance e índices.
- Acessibilidade e compatibilidade mobile/desktop.
- Runbooks, monitoramento e plano de rollback.
- Migração final dos dados.

**Aceite:** checklist de produção aprovado, sem falhas críticas ou altas abertas.

---

## 20. Método de trabalho obrigatório para o Codex

Para cada fase:

1. Ler `AGENTS.md`, README, documentação, Git e código afetado.
2. Registrar baseline e não sobrescrever alterações do usuário.
3. Apresentar um plano curto da fase com arquivos e migrações previstos.
4. Implementar em fatias verticais pequenas.
5. Criar/ajustar testes junto com cada regra.
6. Executar gates de qualidade.
7. Revisar diff, migrações, permissões e impacto responsivo.
8. Atualizar documentação e changelog.
9. Entregar resumo, arquivos alterados, testes executados, pendências e próximo checkpoint.

### 20.1 Regras de segurança da execução

- Não apagar ou reescrever o projeto inteiro sem diagnóstico e aprovação.
- Não substituir decisões válidas apenas por preferência estética.
- Não usar dados reais nos seeds e testes.
- Não guardar credenciais no repositório.
- Não executar migrações destrutivas em produção automaticamente.
- Não integrar serviços pagos/reais antes de existir adaptador e modo sandbox.
- Não declarar a fase concluída com build, typecheck ou testes falhando.

---

## 21. Prompt inicial para o Codex

Use este texto no repositório importado do Replit:

> Você trabalhará no projeto CRM Tupiniquim da TUPINIQUIM TECH SOLUTIONS. Leia integralmente `PLANEJAMENTO_MESTRE_CRM_TUPINIQUIM_CODEX.md` e qualquer `AGENTS.md`. Comece somente pela Fase 0 — Descoberta do repositório e baseline. Inspecione o projeto existente, o Git, a arquitetura, as páginas, os dados e os scripts. Execute instalação, lint, typecheck, testes e build, registrando separadamente erros preexistentes. Não reescreva nem apague o projeto. Produza um diagnóstico mapeando o que já existe para os requisitos do planejamento, identifique riscos e proponha o plano detalhado da Fase 1. Faça apenas correções mínimas necessárias para permitir o diagnóstico, preservando alterações existentes. Ao terminar, apresente evidências dos comandos, arquivos alterados, riscos, decisões pendentes e critérios para iniciar a Fase 1.

### 21.1 Prompt padrão para iniciar cada fase seguinte

> Leia `PLANEJAMENTO_MESTRE_CRM_TUPINIQUIM_CODEX.md`, `AGENTS.md`, o diagnóstico da Fase 0, ADRs e o último checkpoint. Execute somente a Fase [N]. Antes de editar, confirme o estado do Git, rode o baseline relevante e apresente um plano curto. Implemente em fatias verticais com testes. Preserve o trabalho existente e não amplie o escopo silenciosamente. Ao final, rode lint, typecheck, testes, build e migrações aplicáveis; revise isolamento entre organizações, permissões, LGPD, acessibilidade e responsividade. Atualize documentação e entregue resumo, evidências, pendências e plano da próxima fase. Se uma decisão mudar banco, autenticação, integrações, custo ou escopo, pare e solicite decisão.

---

## 22. Critérios de conclusão do produto

O CRM completo somente será considerado pronto quando:

- Os fluxos críticos funcionarem em desktop e mobile.
- Todos os dados estiverem isolados por organização.
- Papéis e permissões forem aplicados no servidor.
- Importação das planilhas existentes tiver relatório e tratamento de duplicidade.
- Funil, follow-up, propostas, clientes, MRR, projetos e upsells forem conciliáveis.
- Automações e integrações tiverem logs, idempotência e modo seguro.
- WhatsApp usar canal oficial e respeitar opt-out/consentimento.
- IA for assistiva, auditável e sujeita a aprovação.
- Build, tipos, lint e suíte crítica passarem.
- Backup/restauração, observabilidade, LGPD e rollback estiverem documentados e testados.
- Não houver vulnerabilidades críticas ou altas conhecidas sem tratamento aprovado.

---

## 23. Decisões que devem ser tomadas durante a Fase 0/1

Estas decisões não bloqueiam o planejamento, mas devem ser resolvidas antes da implementação correspondente:

- Hospedagem e ambientes de homologação/produção.
- Provedor de autenticação e política de MFA.
- Provedor de PostgreSQL, Redis, arquivos e e-mail.
- Serviço oficial/BSP de WhatsApp.
- Política de retenção e backup.
- Regras de comissão e metas.
- Níveis de aprovação de propostas/descontos.
- Critério do health score de clientes.
- Quais integrações entram no primeiro lançamento.
- Domínio, logo final e paleta oficial.

O código deve usar adaptadores e configurações para adiar escolhas de fornecedor sem adiar regras centrais do domínio.

---

## 24. Backlog posterior

- Aplicativo nativo, se métricas demonstrarem necessidade além da PWA.
- Portal do cliente.
- Assinatura eletrônica avançada.
- Cobrança e conciliação por integração.
- Enriquecimento de leads por fontes autorizadas.
- Lead scoring configurável avançado.
- Telefonia e gravação consentida.
- Marketplace de integrações.
- White-label completo.
- Internacionalização adicional.

---

**Regra final:** este documento é a fonte central de escopo. Alterações relevantes devem ser registradas em ADR/changelog, com impacto em dados, segurança, custo, prazo e experiência do usuário.
