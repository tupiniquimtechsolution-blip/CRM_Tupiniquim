# Checkpoint — Fase 5: Clientes e retenção

## Entregas

- Visão 360º de clientes reunindo leads, oportunidades, propostas, contratos, atividades, receita, onboarding, tickets, saúde, renovação e upsells.
- Planos de onboarding com etapas ordenadas, progresso e estados de bloqueio/conclusão.
- Tickets com numeração por organização, prioridade, canal, SLA, primeira resposta e resolução.
- Health score determinístico `v1`, histórico de snapshots, componentes e fatores de risco explicáveis.
- Renovações com valor, data, probabilidade, negociação, renovação e churn com motivo obrigatório.
- Oportunidades de upsell com transições controladas e conversão idempotente em receita.
- Interface responsiva, operação por formulários nativos e navegação de Clientes.
- Seed sintético idempotente e migração SQL versionada, sem operações destrutivas.

## Segurança e isolamento

- Todas as entidades da fase carregam `organizationId` e índices iniciados pelo tenant.
- A matriz de autorização concede escrita pós-venda a proprietário, administrador, gerente, vendas e suporte; leitura continua disponível ao papel de auditoria.
- Server Actions são tratadas como entradas não confiáveis e revalidam as páginas somente após validação/autorização dos serviços.
- Teste integrado comprova que um tenant não lista cliente nem abre ticket para empresa de outro tenant.
- Churn, tickets, onboarding, health score, renovação e upsell geram auditoria nas mudanças críticas.
- Clientes com churn permanecem visíveis como contas inativas, preservando toda a jornada histórica.

## Critério de aceite

A rota `/clientes` apresenta a jornada comercial e pós-venda no mesmo contexto de conta, incluindo aquisição, implantação, atendimento, receita, renovação e expansão. Desktop e mobile compartilham ações acessíveis sem depender de drag-and-drop.

## Evidências de qualidade

- Prisma schema validado e cliente 7.9.1 gerado.
- Migração `20260812213000_phase_5_customer_retention` aplicada no banco local e em schema limpo temporário.
- Seed sintético executado duas vezes sem duplicar registros.
- 15 testes unitários aprovados em 6 arquivos.
- Teste integrado de leitura e escrita entre tenants aprovado para empresas, clientes, leads e tickets.
- TypeScript e ESLint aprovados sem erros.
- Build de produção aprovado com a rota dinâmica `/clientes`.
- 8 cenários E2E aprovados: dashboard, funil, formulário de lead e visão 360º em desktop e mobile.

## Pendências posteriores

- Gatilhos automáticos de health score e renovação pertencem à Fase 6.
- Relatórios consolidados e classificação assistida por IA pertencem à Fase 7.
- Configuração dos pesos por organização e políticas finais de retenção serão avaliadas nas fases de configuração/hardening.
