# CRM Tupiniquim

> [!TIP]
> **Apresentação do projeto:** [abrir PDF](docs/APRESENTACAO_PROJETO.pdf)  
> **Qualidade e segurança:** [auditoria Tupiniquim Toolbox](docs/TOOLBOX_AUDIT_2026-09-08.md)


CRM comercial multiempresa da TUPINIQUIM TECH SOLUTIONS. A aplicação cobre os fluxos das Fases 1–8: operação comercial, retenção, automações idempotentes, integrações em sandbox, relatórios conciliáveis, IA assistiva com revisão humana e controles de hardening/LGPD.

## Stack

- Next.js 16, React 19, TypeScript e App Router.
- Tailwind CSS 4 e componentes acessíveis próprios.
- PostgreSQL com Prisma ORM 7 e migrações versionadas.
- Auth.js com credenciais, sessão JWT curta e autorização por organização/papel.
- Zod nos limites de entrada.
- Vitest para domínio/integração e Playwright para fluxos críticos responsivos.
- OpenAI Responses API com Structured Outputs; a chave permanece no servidor e fora do Git.

## Desenvolvimento local

Use exclusivamente `F:\CODEX\CRM TUPINIQUIM`.

1. Instale as dependências com `pnpm install`.
2. Gere o cliente com `pnpm prisma:generate`.
3. Inicie o PostgreSQL local com `pnpm db:local` e copie a URL TCP exibida para `.env.local`.
4. Aplique as migrações com `pnpm db:deploy`.
5. Execute o seed sintético com `pnpm db:seed`.
6. Inicie a aplicação com `pnpm dev` e abra `http://localhost:3000`.

No Windows, o inicializador `CRM Tupiniquim - Iniciar.bat` criado na Área de Trabalho prepara o ambiente em F:, inicia o banco, publica o servidor na rede local e exibe o IP de acesso.

O banco local oficial do Prisma não requer Docker. A configuração atual usa a porta TCP `51214`. O modo `DEMO_MODE=true` funciona somente fora de produção; em produção, autenticação e banco são obrigatórios.

Usuário sintético após o seed:

- E-mail: `admin@tupiniquim.local`
- Senha padrão: `Tupiniquim!2026`, substituível por `SEED_ADMIN_PASSWORD`

Nunca use a senha sintética ou os segredos de desenvolvimento em produção.

## Automações, relatórios e IA

- `/automacoes`: versões, fila, retentativas, logs, webhooks, captura, conectores sandbox, templates e aprovações.
- `/relatorios`: executivo, vendedores, segmentos, conversão, forecast, SLA, origem, perdas, MRR, projetos e upsells.
- `/assistente`: resumos, classificações e rascunhos. Aprovar um rascunho nunca envia uma mensagem.
- `AI_PROVIDER=simulated` desativa chamadas externas em testes; com `OPENAI_API_KEY` configurada, o padrão é OpenAI.

## Segurança, privacidade e operação

- `/privacidade`: aviso público e canal para exercício de direitos.
- `/configuracoes/privacidade`: solicitações de titulares, consentimentos, retenção e incidentes, isolados por organização.
- `/api/health`: liveness sem dependências; `/api/ready`: prontidão de configuração e banco.
- Formulários e webhooks públicos têm limite persistente de requisições e não armazenam IP em texto puro.
- `pnpm ops:backup` cria backup lógico comprimido e exclusivo dentro de `.backups/`.
- `pnpm ops:restore-drill` restaura o último backup em schema temporário, compara checksums e remove o ensaio.
- `pnpm test:load` mede erro e p50/p95/p99 contra o servidor local.
- `pnpm ops:production-check` verifica configuração, build, backup/restauração, migrações e vulnerabilidades.

Os runbooks de produção, backup, incidentes, migração final e rollback ficam em `docs/runbooks/`. A política de privacidade e os prazos de retenção precisam de aprovação do controlador/encarregado e assessoria jurídica antes do go-live.

## Qualidade

- `pnpm lint`: análise estática.
- `pnpm typecheck`: tipos TypeScript.
- `pnpm test`: testes unitários de domínio.
- `pnpm test:integration`: isolamento entre tenants, conciliação e idempotência no banco local.
- `pnpm test:e2e`: fluxos críticos em desktop e mobile.
- `pnpm test:a11y`: auditoria WCAG 2.2 AA automatizada nas superfícies críticas.
- `pnpm test:load`: smoke de carga com limite de erro e p95.
- `pnpm build`: build otimizado de produção.
- `pnpm check`: lint, tipos, unitários e build.

## Documentação

- Planejamento mestre: `PLANEJAMENTO_MESTRE_CRM_TUPINIQUIM_CODEX.md`.
- Baseline: `docs/diagnosticos/FASE_0_BASELINE.md`.
- Decisões: `docs/adrs/`.
- Checkpoints de implementação: `docs/checkpoints/`.
