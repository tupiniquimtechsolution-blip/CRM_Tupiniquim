# Security Policy

Este projeto segue as regras de `AGENTS.md`, o planejamento mestre do CRM e o Tupiniquim Toolbox.

## Reporte responsável
Não publique credenciais, tokens, dados pessoais, dumps, detalhes exploráveis ou provas de conceito destrutivas em issues públicas. Relate vulnerabilidades por canal privado ao proprietário do repositório.

## Escopo de testes
Pentest e testes ofensivos apenas em ambientes próprios/autorizados, preferencialmente com dados sintéticos. Não altere schema/dados reais ou execute ações irreversíveis sem aprovação explícita.

## Controles esperados
- autorização e regras de negócio no servidor;
- isolamento por organização;
- validação de entradas;
- proteção de superfícies públicas contra abuso;
- segredos fora do Git e logs sanitizados;
- privacidade/LGPD, backup e restore drill;
- CI e checks de produção antes de merge/deploy.
