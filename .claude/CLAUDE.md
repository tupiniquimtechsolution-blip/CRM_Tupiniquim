# Tupiniquim — Claude Code Project Baseline

Projeto: `CRM_Tupiniquim`

Estas instruções são persistentes e complementam requisitos específicos do projeto. Fonte central: `tupiniquimtechsolution-blip/Tupiniquim_AI_Dev_Studio` → `docs/AI_TOOLBOX/`.

## Fluxo
- Inspecione o estado real antes de editar; não invente arquivos, dependências, testes ou infraestrutura.
- Respeite planejamento, arquitetura e critérios de aceite existentes.
- Limite mudanças ao escopo. Peça aprovação antes de exclusões, migrações irreversíveis, mudanças de dados reais/schema, force-push, publicação externa ou dependência estrutural.
- Execute checks disponíveis e registre evidências.

## Segurança
- Nunca exponha/versione secrets, tokens, cookies, senhas ou chaves privilegiadas.
- Autenticação e autorização sensíveis no servidor.
- Valide entradas; avalie XSS, CSRF, SQL/command injection, SSRF, path traversal e abuso conforme a stack.
- Rate limiting em login, recuperação, formulários públicos, webhooks e endpoints caros.
- Não vaze stack traces, secrets ou dados pessoais em produção/logs.
- Revise CORS, cookies, HTTPS, headers, firewall/WAF/CDN, portas e variáveis de produção.
- Rollback e backup verificáveis quando houver banco/deploy crítico.
- Pentest somente em alvo próprio/autorizado.

## Toolbox
- UI/UX: `nextlevelbuilder/ui-ux-pro-max-skill`
- Prompts: `nidhinjs/prompt-master`
- Pesquisa: `Panniantong/Agent-Reach`
- Pentest: `usestrix/strix`
- CLI agent-native: `HKUDS/CLI-Anything`
- Agentes/RAG: `Shubhamsaboo/awesome-llm-apps`
- Instagram: `diwenne/openreply`
- TTS: `kyutai-labs/pocket-tts`
- Mídia generativa: `Anil-matcha/Open-Generative-AI`
- Kimi experimental: `FareedKhan-dev/kimi-k3-in-c`

Referências não são dependências automáticas; valide licença, compatibilidade, manutenção, risco e necessidade.

## Entrega
Finalize com arquivos alterados, checks, riscos restantes, referências usadas e próximo passo. Converta achados em GitHub Issues verificáveis.
