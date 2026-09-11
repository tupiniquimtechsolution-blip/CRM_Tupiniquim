# ADR 0008 — Q2.3B: correção, revogação e oposição

## Contexto

A Q2.3A tornou acesso e portabilidade executáveis, mas `CORRECTION` ainda era apenas um tipo de solicitação. A revogação de consentimento alterava `PrivacyConsent`, porém o fluxo de outbound não revalidava a preferência. `OPPOSITION` podia ser marcada como concluída sem efeito técnico. Os adaptadores de integração atuais permanecem exclusivamente em modo `SANDBOX`.

## Decisão

A Q2.3B é implementada sem migration.

### Correção

- somente `Contact` e `Company` cujo e-mail corresponda ao titular dentro da organização ativa são elegíveis;
- somente `name`, `email` e `phone` podem ser alterados;
- o input usa schema Zod estrito, sem mass assignment;
- a identidade precisa ter sido verificada e o pedido estar `IN_PROGRESS`;
- toda correção exige preview de 15 minutos assinado por HMAC;
- o preview fica em cookie HttpOnly/SameSite=Strict, não em query string;
- request, tenant, operador, alvo e `updatedAt` do pedido/alvo ficam vinculados ao preview;
- a execução usa optimistic locking (`updateMany` + `updatedAt`) e conclui o pedido na mesma transação;
- o audit log grava apenas campos alterados e digests SHA-256 dos valores before/after, não a PII completa.

### Consentimento e oposição

- revogação continua restrita ao tenant e ao e-mail do titular, com `GRANTED → REVOKED` e `revokedAt`;
- uma oposição concluída passa a ser uma preferência ativa para outbound por e-mail;
- `requestOutboundApproval` e `reviewOutboundApproval` revalidam oposição/revogação antes de preparar ou entregar no adaptador sandbox;
- o enforcement atual é deliberadamente limitado a `EMAIL`, pois o modelo de pedido possui `subjectEmail`, não identidade telefônica/finalidade granular suficiente para WhatsApp ou outros canais;
- nenhum envio externo real é habilitado por esta decisão.

### Direitos ainda não executáveis

`ANONYMIZATION_BLOCKING_DELETION` e `AUTOMATED_DECISION_REVIEW` deixam de poder ser concluídos pelo fluxo genérico. Eles permanecem bloqueados até existir executor técnico dedicado e, quando aplicável, decisão de retenção/negócio.

## Consequências

- uma correção não pode atravessar tenant nem atualizar campos arbitrários;
- preview stale é rejeitado se o pedido ou o registro mudar;
- oposição/revogação ocorrida após a criação de uma aprovação ainda bloqueia a aprovação final;
- o CRM não declara como atendido um direito que não possui efeito técnico correspondente;
- oposição não é tratada como bloqueio universal de todo processamento do CRM.

## Rollback

Não há rollback de banco. Em rollback de aplicação, remover os módulos de correção e comunicação e restaurar o fluxo anterior. Isso reintroduziria as lacunas de enforcement e não é recomendado.
