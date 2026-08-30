# Ambiente de desenvolvimento no SSD F

**Data da validação:** 12 de agosto de 2026  
**Diretório canônico do CRM:** `F:\CODEX\CRM TUPINIQUIM`

## Toolchain instalado em F

| Componente | Versão validada | Local |
| --- | --- | --- |
| Node.js LTS | 24.19.0 | `F:\CODEX\programas\nodejs` |
| npm | 11.17.0 | distribuído com o Node.js em F |
| pnpm | 11.16.0 | `F:\CODEX\programas\pnpm` |
| .NET SDK | 10.0.400 | `F:\CODEX\programas\dotnet` |
| Compilador Visual Basic | Roslyn do .NET SDK 10.0.400 | `F:\CODEX\programas\dotnet\sdk\10.0.400\Roslyn\bincore\vbc.dll` |

O SDK do .NET fornece o compilador e o toolchain de Visual Basic. O IDE gráfico Visual Studio não foi instalado.

## Caches e pacotes em F

- npm: `F:\CODEX\programas\npm-cache`
- prefixo global do npm: `F:\CODEX\programas\npm-global`
- pnpm/Corepack: `F:\CODEX\programas\pnpm` e `F:\CODEX\programas\corepack`
- store do pnpm: `F:\CODEX\programas\pnpm\store\v11`
- NuGet: `F:\CODEX\programas\nuget-packages`
- estado da CLI do .NET: `F:\CODEX\programas\dotnet-cli-home`

As variáveis do usuário `NODE_HOME`, `PNPM_HOME`, `PNPM_STORE_DIR`, `COREPACK_HOME`, `DOTNET_ROOT`, `DOTNET_CLI_HOME`, `NUGET_PACKAGES`, `NPM_CONFIG_CACHE` e `NPM_CONFIG_PREFIX` apontam para esses diretórios.

## Validações executadas

- `git rev-parse --show-toplevel`: `F:/CODEX/CRM TUPINIQUIM`.
- Instalação do Node validada pelo SHA-256 publicado no arquivo oficial `SHASUMS256.txt`.
- 622 pacotes do CRM materializados no store do pnpm em F, sem alteração do lockfile.
- Prisma Client 7.9.1 gerado no workspace em F.
- Testes unitários: 5 arquivos e 11 testes aprovados.
- TypeScript: aprovado sem erros.
- ESLint: aprovado sem erros ou avisos de código-fonte.
- Build de produção do Next.js: aprovado, com todas as rotas geradas.
- Visual Basic: projeto `.vbproj` criado, restaurado, compilado e executado em `F:\CODEX\.tmp\vb-smoke-20260812`.

## Estado da migração

- O projeto oficial e executável está em F.
- Não há referências aos caminhos antigos em C ou E nos arquivos de projeto.
- O diretório antigo em C está vazio, mas a tarefa atual do Codex ainda o mantém como contexto do projeto salvo.
- A cópia em E foi preservada como contingência; sua exclusão exige autorização explícita.
- A interface do Codex deve adicionar/reabrir manualmente `F:\CODEX\CRM TUPINIQUIM`, pois a tarefa em execução não pode alterar o próprio projeto salvo.
