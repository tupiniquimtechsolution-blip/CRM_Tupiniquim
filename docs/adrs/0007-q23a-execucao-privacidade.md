# ADR 0007 — Execução técnica de acesso e portabilidade LGPD

## Contexto

O CRM já registrava `PrivacyRequest`, consentimentos e retenção, mas os tipos `CONFIRMATION_ACCESS` e `PORTABILITY` não executavam coleta de dados. Também era possível concluir solicitações sem uma evidência técnica explícita de verificação de identidade.

## Decisão

A Q2.3A implementa somente acesso e portabilidade, sem operações destrutivas.

Fluxo:

1. RECEIVED → IDENTITY_VERIFICATION.
2. IDENTITY_VERIFICATION → IN_PROGRESS registra `privacy.identity.verified`.
3. Operador gera preview de 15 minutos.
4. O preview é um token HMAC ligado a request, tenant, operador, `updatedAt` e digest do snapshot.
5. A execução recompõe os dados e exige o mesmo digest.
6. A conclusão usa compare-and-set e grava auditoria na mesma transação.
7. O pacote `privacy-subject-v1` é JSON, limitado a 1 MB e não é persistido em URL pública.

A coleta é allowlisted e limitada a 1.000 registros por categoria. Conteúdo livre, credenciais, secrets, hashes de evidência e contexto/output de IA não entram no pacote.

## Consequências

- Tokens de preview não podem ser reutilizados por outro tenant ou operador.
- Mudanças no pedido ou no snapshot invalidam o preview.
- JWT/sessionVersion e boundaries de autenticação permanecem inalterados.
- Correção, anonimização, bloqueio, exclusão, oposição transversal e retenção comercial permanecem fora desta fatia.
- `COMPLETED` significa geração técnica do pacote; entrega ao titular continua operacional/manual.

## Rollback

Sem migration. O rollback pode remover os módulos de execução/subject-data e restaurar o fluxo anterior, embora isso reintroduza a lacuna de identidade e não seja recomendado.
