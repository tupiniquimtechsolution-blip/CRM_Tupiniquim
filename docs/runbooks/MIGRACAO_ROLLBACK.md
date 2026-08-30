# Runbook de migração final e rollback

## Migração final

1. Congelar o arquivo-fonte aprovado dentro do workspace e calcular seu checksum.
2. Executar `pnpm ops:migration-dry-run -- --input=<arquivo.csv>`.
3. Corrigir cabeçalhos, linhas inválidas e duplicidades; arquivar o manifesto em `artifacts/migration/`.
4. Obter aprovação do responsável pelos dados e registrar a janela de mudança.
5. Criar backup e concluir restauração de ensaio.
6. Usar o importador auditado do CRM para a carga efetiva; o script de dry-run bloqueia `--execute` deliberadamente.
7. Conciliar contagens, valores, tenants, amostras e rejeições; preservar o arquivo-fonte e o relatório conforme a política aprovada.

## Rollback de aplicação

- Manter o artefato anterior e o identificador de deployment.
- Se o health/readiness ou smoke falhar, retirar a nova versão do tráfego e voltar ao artefato anterior.
- Migrações desta fase são aditivas. Não executar down migration destrutiva automaticamente.
- Corrigir por migração forward sempre que possível.
- Se houver corrupção de dados, bloquear gravações, preservar evidências, criar backup do estado atual e restaurar em banco/schema novo. Só trocar a conexão após conciliação e aprovação.

## Critérios de interrupção

Interromper o go-live diante de vulnerabilidade alta/crítica, migração não reproduzível, checksum divergente, isolamento de tenant falhando, backup sem restauração comprovada, ausência de TLS/segredos, erro E2E crítico ou responsável de rollback indisponível.
