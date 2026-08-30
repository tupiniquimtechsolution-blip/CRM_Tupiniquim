# Fase 0 — Descoberta do repositório e baseline

**Data:** 2026-08-11  
**Diretório canônico:** `F:\CODEX\CRM TUPINIQUIM`

## Resumo executivo

O repositório está íntegro, porém vazio de implementação. Não há código importado do Replit para preservar. O CRM deve iniciar como projeto greenfield na Fase 1, seguindo o planejamento mestre e o ADR 0001.

## Inventário

| Item | Resultado |
| --- | --- |
| Git | Repositório não bare, sem commits, branch inicial `master` |
| Remotos | Nenhum configurado |
| Código da aplicação | Ausente |
| Manifestos e lockfiles | Ausentes |
| Rotas e páginas | Ausentes |
| Banco e migrações | Ausentes |
| Testes e CI | Ausentes |
| Documentação inicial | Apenas o planejamento mestre |

O SHA-256 do planejamento inspecionado é `2F576792EF993BD3882003B9C8BFEE902A3D2C95D1A0D4A286E82918C50934CC`.

## Baseline de qualidade

Instalação, lint, typecheck, testes, build e migração limpa não são aplicáveis, pois ainda não existe manifesto, dependência, código ou schema. Isso não representa aprovação desses gates: a Fase 1 deverá criá-los e executá-los antes do aceite.

## Mapeamento para o planejamento

- As Fases 1 a 8 ainda não possuem implementação.
- A arquitetura recomendada existe apenas como especificação.
- Os requisitos de multiempresa, autorização, auditoria, LGPD, responsividade e PWA devem nascer na fundação, não ser adicionados posteriormente.
- Não há dados existentes no repositório; a importação das planilhas permanece escopo da Fase 2.

## Riscos

1. Hospedagem e fornecedores ainda não estão definidos.
2. A política de autenticação e MFA ainda não está fechada.
3. Não há baseline executável nem CI até a conclusão da Fase 1.
4. O projeto ainda não possui remoto ou estratégia de backup do código.
5. As escolhas futuras devem evitar acoplamento precoce a fornecedores.

## Decisões e recomendação para a Fase 1

- Manter o planejamento mestre como fonte de verdade.
- Iniciar greenfield, conforme ADR 0001.
- Adotar a stack recomendada no planejamento, mantendo fornecedores externos atrás de adaptadores.
- Criar estrutura modular, banco, migração inicial, seed sintético, autenticação, organizações, memberships, autorização, auditoria, layout responsivo e CI.
- Provar o isolamento entre dois tenants com testes de integração antes de declarar a fase concluída.

## Checkpoint

A Fase 0 está concluída quando estes artefatos estiverem versionáveis e revisados. A Fase 1 pode começar após confirmação das decisões de fundação que afetam hospedagem, autenticação e banco.
