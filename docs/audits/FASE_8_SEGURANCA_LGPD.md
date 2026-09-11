# Auditoria de segurança e LGPD — Fase 8

**Revalidação:** 2026-09-11  
**Escopo:** aplicação, autenticação, rotas públicas, isolamento multiempresa, dependências, backups/restauração, observabilidade, IA assistiva, direitos dos titulares, incidentes e gates de release.

## Resultado técnico

A Fase 8 possui gates técnicos reproduzíveis no GitHub Actions. O run `34606488493` passou instalação com lockfile congelado, auditoria de dependências em nível HIGH, migrations, seed sintético, lint, typecheck, testes unitários, integração multiempresa/LGPD, verificação de índices, backup, restore drill com checksum, build, load-smoke e E2E desktop/mobile com Axe.

O framework Next.js foi atualizado para `16.3.4` após revisão dos avisos críticos de agosto de 2026. A verificação `pnpm audit --prod --audit-level high` está verde no gate atual. CodeQL v4 e Dependabot também estão versionados para ampliar a cobertura de supply chain e análise estática no PR final.

## Controles verificados

| Risco | Controle | Evidência |
|---|---|---|
| Acesso entre organizações | filtros por `organizationId`, permissões server-side e testes negativos reais | `pnpm test:integration` |
| Sessão JWT após troca de senha | `User.sessionVersion` no JWT/sessão e comparação com valor atual do banco | `current-actor.test.ts`, `recovery.test.ts`, migration `add_user_session_version` |
| Força bruta/abuso | bucket persistente por identificador HMAC; limites em login, recuperação, captura e webhook | módulo `security`, testes e CI |
| Vazamento de IP | impressão digital HMAC; nenhum IP bruto persistido | `requesterHash` |
| XSS/clickjacking/MIME | CSP com nonce, `frame-ancestors`, `nosniff`, referrer e permissions policy | `src/proxy.ts`, `next.config.ts` |
| Segredos | `.env*` ignorados, validação de runtime e credenciais apenas no servidor | `.gitignore`, `runtime.ts` |
| Dependências vulneráveis | frozen lockfile, audit HIGH, patch de Next.js e automação CodeQL/Dependabot | CI, `package.json`, workflows |
| IA autônoma | contexto minimizado, organização/permissão e revisão humana | módulo `ai` |
| Repetição externa | idempotência em webhook, captura e automações | constraints e integração |
| Perda/corrupção | backup lógico, migrações em schema temporário e checksums após restauração | `ops:backup`, `ops:restore-drill`, CI |
| Índices críticos ausentes | verificação automática dos índices esperados | `ops:index-check`, CI |
| Regressão de desempenho básica | load-smoke no build de produção | `pnpm test:load`, CI |
| Acessibilidade responsiva | Playwright desktop/mobile + Axe; falha mobile real foi detectada e corrigida | run `34606488493`, commit `4aff076b` |
| Observabilidade | liveness, readiness, status autenticado e request ID | `/api/health`, `/api/ready`, `/api/ops/status` |

## Direitos LGPD — estado real

### Funcionais

- **Confirmação e acesso:** requer identidade verificada, preview assinado e gera pacote `privacy-subject-v1` para revisão/entrega manual.
- **Portabilidade:** usa o mesmo mecanismo tenant-safe de preview, digest, expiração e controle de concorrência.
- **Correção:** atua apenas em alvo explícito `Contact` ou `Company`, com campos allowlisted `name`, `email` e `phone`, validação estrita, preview assinado, optimistic locking e auditoria por digest.
- **Revogação do consentimento:** ao concluir o fluxo autorizado, revoga consentimentos ativos do titular dentro da organização e registra auditoria.
- **Oposição:** bloqueia a preparação e revalida antes da aprovação de mensagens nos canais outbound atualmente implementados em sandbox.

### Controlados, mas não automatizados

- **Anonimização, bloqueio e eliminação:** a conclusão genérica foi bloqueada; não existe exclusão massiva automática sem análise de relações, obrigação legal e impacto comercial.
- **Revisão de decisão automatizada:** a conclusão genérica também foi bloqueada até existir executor técnico/humano dedicado.
- **Retenção de dados comerciais:** `commercialDataDays` permanece parâmetro de governança, mas dados CRM relacionais não são apagados em lote apenas pelo prazo. A execução automática atual se limita às classes técnicas definidas no serviço de retenção.

Essa distinção evita que o sistema registre atendimento concluído sem efeito técnico correspondente.

## Segurança de sessão e recuperação

- A recuperação responde de modo genérico e é rate-limited.
- Tokens de recuperação são temporários, armazenados de forma derivada e invalidados após uso.
- O reset altera `passwordHash` e incrementa `sessionVersion` na mesma transação.
- Sessões JWT existentes são rejeitadas quando a versão não corresponde ao banco.
- JWTs legados sem `sessionVersion` exigem novo login.
- Membership, usuário e organização são revalidados contra o banco por `getCurrentActor()`.

## Operação e restauração

O gate de Fase 8 executa, em banco PostgreSQL efêmero:

1. migrations e seed sintético;
2. verificação de índices;
3. backup lógico;
4. restauração em schema temporário;
5. comparação de migrations e checksums de todas as tabelas do backup;
6. remoção do schema temporário;
7. build e load-smoke;
8. E2E desktop e mobile.

O run `34606488493` concluiu esse ciclo com sucesso.

## Limites e aprovações externas

- Este documento registra controles técnicos; não constitui parecer jurídico nem certificação de conformidade.
- `ops:production-check` deve ser executado somente no ambiente real, com URL HTTPS, configuração, canal de privacidade, build, backup/restauração e banco efetivos. Não deve ser satisfeito com valores fictícios.
- Antes do go-live, o controlador/encarregado deve aprovar aviso, bases legais, retenção, operadores/suboperadores e canal de atendimento.
- MFA, WAF/proxy reverso, TLS, PostgreSQL gerenciado com PITR e monitoramento externo dependem da infraestrutura escolhida.
- E-mail, WhatsApp, calendário e webhooks de saída permanecem em adapters sandbox enquanto não houver configuração oficial aprovada.
- A migração final real permanece bloqueada sem arquivo-fonte aprovado, mapeamento formal, backup restaurável e janela de mudança.
- A branch `main` deve receber proteção/ruleset exigindo PR e checks obrigatórios; essa configuração requer permissão administrativa fora do conector atual.

## Referências do projeto

- `AGENTS.md`
- `PLANEJAMENTO_MESTRE_CRM_TUPINIQUIM_CODEX.md`
- `docs/adrs/0007-q23a-execucao-privacidade.md`
- `docs/adrs/0008-q23b-correction-consent-opposition.md`
- `docs/TOOLBOX_AUDIT_2026-09-11.md`
- `.github/workflows/ci.yml`
- `.github/workflows/codeql.yml`
- `.github/dependabot.yml`

## Status da Fase 8

**GATES TÉCNICOS DE CÓDIGO E CI APROVADOS PARA PR FINAL.**

O go-live continua condicionado aos itens externos e administrativos listados acima.