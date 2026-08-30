# Runbook de produção

## Arquitetura suportada

- Aplicação: Node.js LTS com artefato Next.js `standalone`.
- Banco: PostgreSQL gerenciado com TLS, backup automático e point-in-time recovery.
- Entrada: proxy reverso/WAF com HTTPS, limites de corpo, conexão e requisições.
- Uma única imagem/build deve ser promovida entre homologação e produção.

## Variáveis obrigatórias

- `APP_URL=https://...`
- `DATABASE_URL` com usuário de privilégio mínimo e TLS.
- `AUTH_SECRET` aleatório com pelo menos 32 caracteres.
- `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` base64 válida e idêntica em todas as instâncias.
- `DEPLOYMENT_VERSION` imutável por release.
- `PRIVACY_CONTACT_EMAIL` aprovado pelo controlador.
- `DEMO_MODE=false`.
- Provedor de IA e `OPENAI_API_KEY` somente se a IA estiver habilitada.

Segredos são configurados no cofre do host, nunca no Git, imagem ou log.

## Ordem de implantação

1. Criar backup e executar restauração de ensaio.
2. Validar a migração em homologação com cópia anonimizada ou dados sintéticos.
3. Executar lint, tipos, testes, build, E2E, acessibilidade, carga e auditoria de dependências.
4. Aplicar `prisma migrate deploy` como job único antes de trocar o tráfego.
5. Publicar o artefato já validado; não recompilar no servidor.
6. Confirmar `/api/health` e `/api/ready` antes de liberar tráfego.
7. Fazer smoke de login, leitura isolada por organização e uma gravação sintética removível.
8. Monitorar erros, latência p95, disponibilidade do banco e filas de automação.

## SLO inicial e alertas

- Disponibilidade mensal: 99,5%.
- p95 de liveness: até 500 ms; primeira carga útil nas páginas principais: até 2,5 s em condição normal.
- RPO: 24 h no mínimo; alvo recomendado 15 min com PITR do provedor.
- RTO: 4 h no mínimo; alvo recomendado 60 min após ensaio no provedor.
- Alertar imediatamente: readiness falhando por 5 min, taxa 5xx acima de 1% por 5 min, falha de backup, automação `FAILED`, incidente alto/crítico ou uso anormal de limites.

## Gate de go-live

`pnpm ops:production-check` deve retornar `pass: true`. O checklist manual exige ainda: provedor e região aprovados, DPA/suboperadores registrados, domínio/TLS, canal do encarregado, política de retenção, PITR, alertas, responsáveis de plantão, janela de mudança e rollback ensaiado.
