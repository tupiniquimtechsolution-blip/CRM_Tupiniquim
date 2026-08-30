# ADR 0004 — Motor de automações durável e idempotente

- Status: aceito
- Data: 2026-08-13

## Contexto

A Fase 6 exige gatilhos, condições, ações externas, retentativas e auditoria. A mesma origem pode reenviar eventos e uma falha parcial não pode repetir tarefas, mensagens ou webhooks já processados.

## Decisão

- O PostgreSQL é a fila durável inicial por meio de `AutomationRun`.
- Cada automação mantém versões imutáveis em `AutomationVersion`; uma execução referencia a versão publicada que a originou.
- A combinação organização, automação e chave do evento é única.
- Cada passo recebe um índice e uma chave de idempotência única em `AutomationActionLog`.
- Retentativas ignoram passos em `SUCCEEDED`, `SKIPPED` ou `AWAITING_APPROVAL`.
- Backoff exponencial é limitado a 60 minutos e o número de tentativas é limitado por execução.
- E-mail, calendário, WhatsApp e webhook usam adaptadores. Nesta fase, todos os adaptadores são sandbox.
- Toda ação externa cria `OutboundApproval`; somente um revisor autorizado pode liberá-la, e a liberação permanece em sandbox.
- Webhooks de entrada exigem bearer token armazenado apenas como hash, `Idempotency-Key` e payload de até 256 KB.

## Consequências

- O motor pode ser testado e auditado sem infraestrutura adicional de fila.
- O modelo permite trocar o executor por um worker dedicado sem mudar a semântica de idempotência.
- Não há envio real acidental nesta fase.
- Um processador agendado contínuo e conectores de produção ficam para hardening e lançamento.
