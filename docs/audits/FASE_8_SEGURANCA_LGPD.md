# Auditoria de segurança e LGPD — Fase 8

**Data:** 2026-08-13  
**Escopo:** aplicação, autenticação, rotas públicas, isolamento multiempresa, dependências, backups, IA, solicitações de titulares e incidentes.

## Resultado técnico

Nenhuma falha crítica ou alta conhecida permanece aberta no código ou nas dependências. A auditoria `pnpm audit --prod --audit-level high` não encontrou vulnerabilidades após substituir SheetJS 0.18.5 pela versão oficial 0.20.3. Lint, tipos, unitários, integração, build, E2E, acessibilidade e restauração fazem parte do gate final.

## Controles verificados

| Risco | Controle | Evidência |
|---|---|---|
| Acesso entre organizações | filtros por `organizationId`, permissões no servidor e testes negativos | `test:integration` |
| Força bruta/abuso | bucket persistente por identificador HMAC; limites em login, captura e webhook | `RateLimitBucket` |
| Vazamento de IP | impressão digital HMAC; nenhum IP bruto persistido | `requesterHash` |
| XSS/clickjacking/MIME | CSP com nonce, `frame-ancestors`, `nosniff`, referrer e permissions policy | `proxy.ts`, `next.config.ts` |
| Segredos | `.env*` ignorados, chave de IA apenas no servidor, logs sem valores de ambiente | `.gitignore`, runtime validator |
| IA autônoma | contexto minimizado, organização/permissão e revisão humana; aprovação não envia | módulo `ai` |
| Repetição externa | idempotência em webhook, captura e automações | constraints e testes |
| Perda/corrupção | backup consistente, migrações em schema limpo e checksum após restauração | `ops:backup`, `ops:restore-drill` |
| Direitos LGPD | protocolos, identidade pendente, prazos, resolução e auditoria por organização | `PrivacyRequest` |
| Consentimento | finalidade, base legal, versão do aviso, data e digest de evidência | `PrivacyConsent`, captura pública |
| Retenção | política por organização e execução separada de dry-run; incidentes mínimo de cinco anos | `DataRetentionPolicy` |
| Incidentes | gravidade, dados pessoais, risco relevante, prazo de três dias úteis e datas de comunicação | `SecurityIncident` |
| Observabilidade | liveness, readiness, status autenticado, request ID, logs estruturados e logs duráveis de jobs | `/api/health`, `/api/ready`, `/api/ops/status` |

## Limites e aprovações externas

- Este documento registra controles técnicos; não constitui parecer jurídico nem certificação de conformidade.
- Antes da produção, o controlador/encarregado deve aprovar aviso, bases legais, retenção, operadores/suboperadores e canal de atendimento.
- MFA, WAF/proxy reverso, TLS, PostgreSQL gerenciado com PITR e monitoramento externo dependem do provedor escolhido.
- O envio por WhatsApp permanece somente em adaptador sandbox até existir canal oficial/BSP e política de opt-out aprovada.
- A migração final real permanece bloqueada sem arquivo-fonte e mapeamento formalmente aprovados.

## Referências oficiais

- Lei nº 13.709/2018 (LGPD), texto compilado: https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm
- Direitos dos titulares, ANPD: https://www.gov.br/anpd/pt-br/assuntos/titular-de-dados-1/direito-dos-titulares
- Guia de segurança para agentes de pequeno porte, ANPD: https://www.gov.br/anpd/pt-br/assuntos/noticias/anpd-publica-guia-de-seguranca-para-agentes-de-tratamento-de-pequeno-porte
- Comunicação de incidentes, ANPD: https://www.gov.br/anpd/pt-br/canais_atendimento/agente-de-tratamento/comunicado-de-incidente-de-seguranca-cis
