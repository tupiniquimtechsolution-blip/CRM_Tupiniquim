# ADR 0003 — Health score e domínio de retenção

- **Status:** aceito
- **Data:** 2026-08-12

## Contexto

A Fase 5 exige saúde do cliente, onboarding, tickets, renovação, churn e upsell. O planejamento deixa o critério final de health score configurável e determina que regras determinísticas precedam inteligência artificial.

## Decisão

Adotar a fórmula determinística `v1`, persistindo cada cálculo como um registro histórico imutável. O resultado varia de 0 a 100 e combina:

- Engajamento e recência de interação: 30%.
- Atendimento, tickets urgentes e SLA vencido: 25%.
- Progresso/bloqueio do onboarding: 15%.
- Receita ativa ou em forecast: 15%.
- Renovação, proximidade e churn: 15%.

Faixas:

- `HEALTHY`: 80–100.
- `ATTENTION`: 60–79.
- `AT_RISK`: 40–59.
- `CRITICAL`: 0–39.

Churn confirmado limita a pontuação a 25. O cálculo também persiste componentes, fatores de risco e versão, permitindo explicar o resultado e comparar alterações futuras.

O domínio pós-venda terá entidades separadas para planos/etapas de onboarding, tickets, snapshots de saúde, renovações e upsells. Todas carregam `organizationId` e são acessadas somente por serviços que aplicam tenant e permissão no servidor.

## Consequências

- A saúde é explicável, auditável e independente de IA.
- Alterar pesos exige uma nova versão de cálculo; snapshots anteriores não são reescritos.
- Marcar churn exige motivo e encerra MRR ativo da conta, preservando histórico.
- A conta muda para ciclo de vida inativo após churn, mas permanece na visão 360º para preservar a jornada e permitir auditoria histórica.
- Ganhar um upsell cria uma receita `UPSELL` uma única vez, ligada à oportunidade.
- A parametrização da fórmula por organização permanece backlog de configuração; a versão inicial é global e documentada.
