# CRM Tupiniquim — instruções do repositório

## Diretório canônico

- Execute todas as atividades exclusivamente em `F:\CODEX\CRM TUPINIQUIM`.
- Antes de alterar arquivos, confirme que `git rev-parse --show-toplevel` retorna esse caminho.
- Não crie cópias, junctions ou workspaces paralelos em `C:` ou `E:`.

## Fonte de verdade

- Leia `PLANEJAMENTO_MESTRE_CRM_TUPINIQUIM_CODEX.md` antes de iniciar cada fase.
- Preserve checkpoints, critérios de aceite e gates de qualidade definidos no planejamento.
- Registre decisões arquiteturais relevantes em `docs/adrs/`.

## Método de execução

- Trabalhe em uma fase por vez e em fatias verticais pequenas.
- Mantenha regras de negócio e autorização no servidor.
- Toda consulta e escrita de dados deve respeitar o contexto da organização.
- Não use dados reais em seeds ou testes e não grave segredos no repositório.
- Antes de concluir uma fase, execute os gates aplicáveis: lint, typecheck, testes, build, migração limpa e verificação básica de acessibilidade.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->


## Tupiniquim Multi-LLM Toolbox

As regras específicas acima permanecem prioritárias. Este `AGENTS.md` também é o contrato canônico para qualquer agente/LLM usado neste repositório.

- Skill universal: `.agents/skills/tupiniquim-toolbox/SKILL.md`.
- Fonte corporativa: `tupiniquimtechsolution-blip/Tupiniquim_AI_Dev_Studio` → `docs/AI_TOOLBOX/`.
- Adaptadores `.claude/CLAUDE.md`, `QWEN.md` e `GEMINI.md` não podem contradizer este arquivo.
- Claude, Qwen, Kimi, DeepSeek, Gemini, GPT, Grok e outros modelos recebem estas regras por meio do harness/agente.
