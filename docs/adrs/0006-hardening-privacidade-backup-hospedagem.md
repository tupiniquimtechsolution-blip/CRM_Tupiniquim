# ADR 0006 — Hardening, privacidade, backup e hospedagem

**Status:** aceito em 2026-08-13  
**Fase:** 8

## Contexto

O CRM mantém estado em PostgreSQL, executa regras no servidor, usa Prisma, Auth.js, Server Actions e integrações externas por adaptadores. A Fase 8 exige segurança/LGPD, restauração de backup, carga, observabilidade, rollback e preparação para produção.

O serviço OpenAI Sites disponível gera artefato Cloudflare Worker/vinext e oferece persistência D1/R2. Converter o CRM para esse runtime exigiria trocar banco, autenticação e arquitetura já validados, ampliando o risco exatamente na fase de hardening.

## Decisão

- Preservar Next.js em runtime Node.js, Auth.js, Prisma e PostgreSQL.
- Gerar build `standalone`, apropriado a host Node.js ou contêiner com proxy reverso e HTTPS.
- Não criar `.openai/hosting.json` nem publicar no Sites enquanto a arquitetura atual não for suportada integralmente.
- Usar liveness independente e readiness com banco/configuração, cabeçalhos de segurança, CSP com nonce e identificador de requisição.
- Limitar login, captura e webhooks por buckets persistentes; pseudonimizar identificadores com HMAC.
- Modelar finalidade, base legal, consentimento, solicitações de titulares, retenção e incidentes por organização.
- Manter incidentes por no mínimo cinco anos e sinalizar três dias úteis quando houver dados pessoais e risco/dano relevante; a decisão de comunicar permanece humana.
- Criar backup lógico agnóstico do binário `pg_dump`, pois o cliente PostgreSQL não está instalado na máquina, e provar restauração em schema temporário por migrações e checksum.
- Manter a migração final em dry-run até existirem origem aprovada, mapeamento assinado, backup restaurável e janela de mudança.

## Consequências

- O pacote pode ser promovido para qualquer host Node.js compatível, mas a publicação real depende de escolha de provedor, banco gerenciado, domínio/TLS e segredos de produção.
- O backup lógico cobre os dados e exige que as migrações correspondentes estejam disponíveis. Em produção, recomenda-se adicionalmente o snapshot/PITR nativo do provedor PostgreSQL.
- A conformidade jurídica não é declarada automaticamente: aviso, bases legais, retenção, operadores e canal do encarregado precisam de validação organizacional e jurídica.
