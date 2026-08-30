# Runbook de backup e restauração

## Backup local validável

`pnpm ops:backup` cria um arquivo comprimido exclusivo em `.backups/`, com migrações, metadados de colunas, ordem de dependências, linhas e checksum SHA-256 por tabela. O diretório é ignorado pelo Git e deve ficar dentro de `F:\CODEX\CRM TUPINIQUIM` neste ambiente.

O backup usa transação `REPEATABLE READ READ ONLY`, preserva timestamps PostgreSQL sem conversão implícita de fuso e nunca imprime credenciais.

## Ensaio de restauração

`pnpm ops:restore-drill` usa o backup mais recente, cria um schema temporário com nome restrito, aplica todas as migrações, restaura os registros em ordem referencial e compara tabela a tabela. O schema temporário é removido mesmo em caso de falha. O resultado fica em `.backups/last-restore-drill.json`.

Falha de migração, divergência de versão ou checksum bloqueia o lançamento. Nunca restaure automaticamente sobre `public`.

## Produção

Além do backup lógico da aplicação, habilitar backup automático, PITR e cópia em conta/região separada no provedor PostgreSQL. Criptografar em trânsito e repouso, restringir acesso, registrar restaurações e testar trimestralmente. Definir retenção conforme a política aprovada; o padrão local de 14 dias não substitui obrigação contratual ou legal.
