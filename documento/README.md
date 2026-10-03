# Portal Cerrado — documentação

Portal de noticias automatizado com backend FastAPI, fila Celery, banco PostgreSQL e frontend Next.js.

## Fonte de verdade

- `PLANO_ACAO.md` — gates, ordem de execução e bloqueios atuais.
- `PLANO_REDESIGN.md` — regras e evidência das nove fases do redesign do
  frontend. Reconstrução: o texto original vivia só na conversa de trabalho.
- `RELATORIO_REDESIGN.md` — relatório de entrega: o que foi feito,
  como reproduzir a verificação e o que ficou de fora.
- `MEMORIA.md` — fatos canônicos confirmados sobre arquitetura, runtime e restrições.
- `OPERACAO.md` — procedimentos de backup, rotação, rollback e promoção.
- `SPEC.md` — visão curta do produto e componentes.
- `EVIDENCIAS_VALIDACAO.md` — evidências datadas; não substitui a execução atual.
- `PRONTIDAO_CANDIDATO.md` — snapshot histórico, válido apenas para o SHA registrado.

Os documentos de ML são planejamento futuro e não autorizam implementação nem promoção.

Quando houver conflito, prevalece: código/testes no commit atual, `PLANO_ACAO.md`, `MEMORIA.md`, `OPERACAO.md` e demais documentos datados.

## Estado auditado em 29/09/2026

- Branch: `codex/otimizacao-completa`; base: `850cdd6`.
- Checkout limpo no início da otimização.
- Ruff, Mypy, compileall, ESLint e build frontend aprovados nesta sessão.
- Suíte completa: 145 testes aprovados em ambiente limpo Python 3.12 com as restrições atuais de dependências.
- Docker indisponível nesta sessão; Compose, Swarm e smoke externo permanecem não verificados.

## Stack
- FastAPI
- Celery + Redis
- PostgreSQL
- Next.js + Tailwind
- Scraping, classificacao, reescrita e publicacao por pipeline

## Fonte de configuração

- `config/scheduler.yaml` controla a meta mínima diária e a cadência do pipeline Celery.
- `config/orchestrator.yaml` é referência de produto; não altera o runtime.

## Regra
- Este repositorio deve tratar os documentos em `documento/` como fonte ativa.
