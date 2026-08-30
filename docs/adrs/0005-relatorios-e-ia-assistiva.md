# ADR 0005 — Relatórios conciliáveis e IA assistiva

- Status: aceito
- Data: 2026-08-13

## Contexto

O CRM precisa apresentar indicadores gerenciais confiáveis e permitir assistência por IA sem ignorar isolamento entre organizações, permissões ou revisão humana.

## Decisão

- Indicadores são derivados dos registros detalhados no momento da consulta; a resposta inclui identificadores de reconciliação para oportunidades, receitas e upsells.
- Forecast usa `valor × probabilidade da etapa` somente para oportunidades abertas.
- MRR considera receitas `MRR` ativas; projetos consideram receitas `PROJECT` ativas ou em forecast; upsell separa receita realizada de potencial aberto.
- Exportações CSV pertencem à organização e ao usuário solicitante, expiram em 24 horas e são registradas na auditoria.
- O adaptador de IA usa a Responses API da OpenAI com Structured Outputs e esquema Zod quando a chave está configurada. O modo determinístico permanece disponível para testes.
- O contexto enviado à IA é buscado novamente no servidor, filtrado pela organização e minimizado. Identificadores de entrada do navegador nunca substituem a autorização.
- A saída é persistida como rascunho com digest do contexto, provedor e modelo. Aprovar um rascunho não o envia.
- Apenas papéis com `ai:use` geram rascunhos e apenas papéis com `ai:review` os aprovam ou rejeitam.

## Consequências

- Os números podem ser conciliados com as tabelas detalhadas.
- A chave da API permanece exclusiva do servidor e fora do Git.
- Conteúdo gerado pode ser rastreado, revisado e rejeitado.
- Custos e limites do provedor precisam ser monitorados antes do lançamento da Fase 8.
