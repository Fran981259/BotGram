# Portal Cerrado — documentação

Portal de noticias automatizado com backend FastAPI, fila Celery, banco PostgreSQL e frontend Next.js.

## Fonte de verdade

- `PLANO_ACAO.md` — gates, ordem de execução e bloqueios atuais.
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
- Testes direcionados de segurança/rate limit: 8 aprovados.
- Suíte completa: bloqueada por travamento em `tests/unit/test_admin_endpoints.py::test_admin_endpoints_require_auth`.
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
