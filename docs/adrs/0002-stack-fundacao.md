# ADR 0002 — Stack e segurança da fundação

- **Status:** aceito
- **Data:** 2026-08-11

## Decisão

Adotar Next.js 16 com App Router, React 19, TypeScript, Tailwind CSS 4, PostgreSQL e Prisma ORM 7. A autenticação usa Auth.js com credenciais e estratégia JWT; os usuários e memberships permanecem no banco e o contexto do tenant é inserido na sessão.

Durante o desenvolvimento, o PostgreSQL local oficial do Prisma é usado sem Docker. Provedores de produção continuam indefinidos e devem ser conectados por configuração/adaptadores.

O modo demonstrativo é permitido apenas quando `NODE_ENV` não é `production`. O proxy e a resolução do usuário bloqueiam qualquer tentativa de usar esse bypass no build de produção.

## Consequências

- Toda entidade comercial possui `organizationId` e índices iniciados pelo tenant.
- Serviços verificam permissão e escopo antes de ler ou alterar dados.
- Migrações são independentes do fornecedor PostgreSQL escolhido para produção.
- Envio externo de proposta permanece simulado até a fase de integrações.
