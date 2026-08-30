# Checkpoint — Fase 6

Data: 2026-08-13

## Entregas concluídas

- Motor versionado de gatilho, condição e ação.
- Fila durável no PostgreSQL, retentativa limitada, backoff e logs por passo.
- Chaves de idempotência por evento e por ação.
- Webhooks autenticados por bearer token com segredo em hash, limite de payload e deduplicação.
- Formulários públicos de captura com conversão transacional em empresa, contato e lead.
- Adaptadores de e-mail, calendário, WhatsApp oficial e webhook em sandbox.
- Templates e aprovação humana antes de saídas externas.
- Tela responsiva `/automacoes` e formulário público `/captura/[publicId]`.

## Evidências de aceite

- O teste de integração despacha o mesmo evento duas vezes e confirma uma única execução e um log por passo.
- Consultas e escritas da fase usam `organizationId` e foram incluídas no teste de isolamento.
- A migração `20260813150000_phase_6_7_automations_reports_ai` cria restrições únicas no banco, não apenas em memória.
- Nenhum adaptador realiza envio de produção.

## Gates

- Prisma schema: válido.
- Migração no banco local: aplicada.
- Seed sintético: concluído.
- Testes unitários: aprovados.
- Teste de integração: aprovado.
- TypeScript e build de produção: aprovados.
- E2E desktop/mobile: 16 cenários aprovados no fechamento conjunto das Fases 6 e 7.
