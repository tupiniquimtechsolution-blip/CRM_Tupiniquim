# Tupiniquim Toolbox Audit — 2026-09-11

## Escopo

Revalidação de fechamento técnico do CRM Tupiniquim sobre a branch `arena/q2-3b-correction-consent-opposition`, obedecendo `AGENTS.md`, `PLANEJAMENTO_MESTRE_CRM_TUPINIQUIM_CODEX.md` e o Tupiniquim Toolbox. Esta auditoria complementa e não apaga `TOOLBOX_AUDIT_2026-09-08.md`.

## Estado Git verificado

- `main`: `5eee5306dcd4f61ec5940f4acb63362dc6839fdd`.
- A documentação exclusiva da `main` foi reconciliada por merge commit `44a4c4498387e79f896a3a0b45bfcb9ef43ea888`.
- Após a reconciliação, a branch de fechamento ficou `43` commits à frente e `0` atrás de `main`.
- `main` não foi alterada nem recebeu merge durante esta auditoria.
- A proteção administrativa da `main` continua ausente e não pode ser ativada pelo conector GitHub utilizado nesta execução.

## Segurança e supply chain

- Next.js foi atualizado de `16.3.0` para `16.3.4` após revisão dos avisos críticos publicados em agosto de 2026.
- `pnpm install --frozen-lockfile` é obrigatório no CI.
- `pnpm audit --prod --audit-level high` conclui sem vulnerabilidades conhecidas no gate atual.
- Prisma permanece em `7.10.0`; a atualização major para Prisma 8 não foi adotada sem planejamento de migração.
- CodeQL v4 foi versionado para JavaScript/TypeScript com `security-extended`.
- Dependabot foi versionado para dependências npm e GitHub Actions.
- `DATABASE_URL` falha fechado; não existe fallback de banco hardcoded na aplicação.
- Superfícies públicas de captura aplicam limite de tamanho, content type, validação e rate limiting persistente.

## Autenticação e autorização

- Sessões continuam em JWT, mas `User.sessionVersion` permite revogação imediata após troca/reset de senha.
- O `sessionVersion` é incrementado na mesma transação que altera `passwordHash`.
- `getCurrentActor()` revalida usuário, organização, membership, role e versão de sessão contra o banco.
- JWT legado sem versão, usuário inativo, organização inativa, membership inválida ou versão divergente são rejeitados.
- Isolamento multiempresa é exercitado por teste de integração contra PostgreSQL real do CI.

## LGPD — capacidade técnica comprovada

| Direito/controle | Estado técnico | Evidência principal |
|---|---|---|
| Confirmação/acesso | FUNCIONAL | preview assinado + pacote `privacy-subject-v1` + integração tenant-safe |
| Portabilidade | FUNCIONAL | pacote estruturado com digest e revisão humana |
| Correção | FUNCIONAL | alvo explícito, campos allowlisted, preview assinado, optimistic locking e auditoria por digest |
| Revogação de consentimento | FUNCIONAL | atualização tenant-safe de consentimentos ativos + audit log |
| Oposição a comunicação | FUNCIONAL no outbound implementado | validação antes de preparar e antes de aprovar saída sandbox |
| Anonimização/bloqueio/eliminação | NÃO AUTOMATIZADO | conclusão genérica bloqueada até existir executor específico e revisão legal |
| Revisão de decisão automatizada | NÃO AUTOMATIZADO | conclusão genérica bloqueada; requer fluxo técnico/humano dedicado |
| Retenção | PARCIAL/CONTROLADA | limpeza de classes técnicas configuradas; dados comerciais não são eliminados em lote sem análise individual |

Nenhum fluxo pendente é apresentado como concluído apenas por mudança de status.

## Gates de qualidade e operação

O run `34606488493` concluiu com sucesso no HEAD consolidado `44a4c4498387e79f896a3a0b45bfcb9ef43ea888`:

- instalação frozen;
- audit de produção em nível HIGH;
- Prisma generate, migrations e seed sintético;
- lint e typecheck;
- unitários;
- integração/isolamento/idempotência/LGPD;
- verificação dos índices operacionais;
- backup lógico;
- restore drill em schema temporário com verificação de checksum;
- build de produção;
- load-smoke;
- Playwright desktop;
- Playwright mobile;
- auditoria Axe/WCAG nas superfícies críticas.

O gate mobile revelou anteriormente uma falha real `summary-name` no disclosure da navegação. Ela foi corrigida em `4aff076b27d40dbcadd7cd5434b42c1bce0874ef` adicionando nome acessível ao `<summary>` e marcando o ícone como decorativo. O teste não foi enfraquecido.

## Limites externos de go-live

Os itens abaixo não devem ser simulados nem marcados como concluídos sem ambiente real:

- configuração de produção validada por `ops:production-check`;
- domínio/HTTPS/TLS e proxy/WAF do provedor escolhido;
- PostgreSQL de produção, política de backup/PITR e monitoramento externo;
- MFA, quando definido para o ambiente final;
- aprovação do controlador/encarregado para aviso, bases legais, retenção, operadores e canal de atendimento;
- integrações reais de e-mail/WhatsApp/calendário, hoje mantidas em sandbox;
- migração final de dados, bloqueada até existir fonte aprovada, mapeamento formal, backup restaurável e janela de mudança.

## Pendências administrativas

1. Abrir PR de fechamento para `main` e exigir CI + CodeQL verdes no contexto do PR.
2. Ativar proteção/ruleset da `main` exigindo PR e checks obrigatórios; esta ação requer permissão administrativa fora do conector atual.
3. Executar `ops:production-check` somente após existir configuração real de produção.

## Status

**APROVADO TECNICAMENTE PARA PR FINAL, COM BLOQUEIOS EXTERNOS DE GO-LIVE EXPLICITAMENTE REGISTRADOS.**

Este documento não é certificação jurídica de conformidade LGPD e não substitui pentest independente ou avaliação do ambiente de produção.