# ADR 0001 — Início greenfield

- **Status:** aceito
- **Data:** 2026-08-11

## Contexto

A Fase 0 encontrou um repositório Git recém-inicializado, sem commits, aplicação, dependências, scripts, rotas, banco, testes ou artefatos importados do Replit. O único arquivo funcional é o planejamento mestre.

## Decisão

Tratar o CRM Tupiniquim como projeto greenfield. Não existe implementação a manter, refatorar ou substituir. A Fase 1 deverá criar a fundação a partir da arquitetura recomendada no planejamento mestre: aplicação web TypeScript modular, PostgreSQL, Prisma, autenticação madura e validação no servidor.

Escolhas de fornecedores permanecerão atrás de adaptadores até que hospedagem, autenticação, arquivos, e-mail, filas e integrações sejam decididos.

## Consequências

- Não há dívida ou compatibilidade com código legado nesta etapa.
- O primeiro baseline executável será estabelecido na Fase 1.
- Toda mudança deverá preservar isolamento multiempresa, autorização no servidor, LGPD e auditabilidade desde a modelagem inicial.
- Alterações que definam custo, fornecedor ou hospedagem exigem decisão explícita antes da integração real.
