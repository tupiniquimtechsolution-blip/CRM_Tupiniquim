# Checkpoints — Fases 1 a 4

## Fase 1 — Fundação técnica

Implementados: aplicação Next.js/TypeScript, estrutura modular, PostgreSQL/Prisma, migrações, seed sintético, Auth.js, recuperação de acesso com token expirável, organizações, memberships, papéis, autorização, auditoria, layout responsivo, PWA manifest, health check e CI.

Aceite comprovado por teste de integração: um ator do tenant A não lista nem cria lead associado a empresa do tenant B.

## Fase 2 — CRM essencial

Implementados: empresas, contatos no modelo, leads, etiquetas, campos personalizados, busca/filtros na interface, validação obrigatória de empresa/origem, normalização de telefone, timeline/notas/anexos no modelo e preview validado de CSV/XLSX. Importações possuem entidade de job, mapeamento, resumo e estado de reversão.

O processamento assíncrono de grandes planilhas e armazenamento real de anexos permanecem para as fases de infraestrutura/integracões previstas no planejamento.

## Fase 3 — Funil e produtividade

Implementados: pipelines e etapas configuráveis, oportunidades, histórico de mudança, Kanban responsivo, ações acessíveis de avanço/retorno, motivos obrigatórios de perda, atividades, follow-ups, SLA e notificações internas.

## Fase 4 — Comercial e receita

Implementados: catálogo, preços, propostas versionadas, itens, descontos, aprovação humana, transições controladas, link temporário seguro, simulação auditável de envio, conversão idempotente em contrato/cliente e receitas MRR/projeto/upsell. A geração final de PDF e o envio por provedor real permanecem simulados, conforme a separação de integrações definida no planejamento.

## Evidências de qualidade

- Schema Prisma validado e cliente gerado.
- Migração inicial SQL gerada e aplicada em banco PostgreSQL local limpo.
- Seed sintético executado de forma idempotente.
- Lint direcionado sem erros.
- Typecheck sem erros.
- 11 testes unitários aprovados.
- Teste de integração multiempresa aprovado.
- Build de produção aprovado.
- 6 cenários E2E aprovados em Chromium: dashboard, funil e criação de lead em desktop e mobile, com autenticação real no build de produção.

## Decisões ainda abertas

Hospedagem, PostgreSQL gerenciado, política de backup/retenção, provedor de e-mail, armazenamento S3 e níveis finais de aprovação/desconto continuam desacoplados e devem ser definidos antes do uso produtivo correspondente.
