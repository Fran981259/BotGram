# Evidências de validação — Portal Cerrado

Registro detalhado extraído do plano operacional. O plano principal mantém apenas
decisões, gates e critérios; esta página guarda evidências extensas.

## Regra de validade

Cada evidência é histórica e vale somente para o SHA, data, ambiente e comando registrados. Nenhum resultado desta página substitui a execução no candidato atual.

## Snapshot histórico — 29/09/2026

- Base: `850cdd6`, branch `codex/otimizacao-completa`.
- Ruff: aprovado com `./venv/bin/ruff check app tests scripts`.
- Mypy: aprovado com `./.venv/bin/mypy app` em 73 arquivos.
- Compilação Python: aprovada com `python3 -m compileall -q app scripts`.
- ESLint: aprovado com `npm run lint`.
- Build frontend: aprovado com `npm run build`; Next 16.3.3 gerou 37 páginas.
- Testes direcionados: 14 aprovados em segurança, rate limit, ambiente e CI.
- Suíte completa: 145 testes aprovados em 19,79s usando ambiente limpo Python 3.12 com `requirements.txt`; foi emitido apenas um warning de depreciação da biblioteca Starlette.
- A falha anterior do `.venv` local foi reproduzida como incompatibilidade de Starlette 1.x com o TestClient; a restrição `starlette<1.0.0` resolveu o problema no ambiente limpo.
- Docker: indisponível na sessão; validações Compose, Swarm, healthcheck real e rollback não foram executadas.

## Validação local — 04/10/2026

- Escopo: checkout com refinamentos visuais e higienização ainda não agrupados em
  candidato Git; portanto esta entrada não aprova deploy ou promoção.
- Frontend: `npm run lint`, `npx tsc --noEmit` e `npm run build` passaram; o
  build Next gerou 37 rotas.
- Backend: `ruff check app tests scripts` passou e `pytest -q` executou 149
  testes com sucesso.
- Integridade: `git diff --check` passou.
- Aviso residual: uma depreciação transitiva do `TestClient`/Starlette, sem
  falha de teste.

## Snapshot de CI, imagens e performance — 29/09/2026

- CI publicado com todos os jobs verdes; manifests GHCR consultados no host de teste e digests registrados no relatório de prontidão. Nenhuma stack foi aplicada.
- Auditoria local de performance/SEO: Lighthouse não está instalado; o build produziu 1,36 MB de assets estáticos e 2,06 MB de server bundle, não há tags `<img>` cruas no frontend, as três rotas de metadata existem e `npm audit` offline não encontrou vulnerabilidades altas.

## Higiene e testes

- A auditoria de higiene não encontrou `console.log` ou `debugger`; o `.env.example` teve senha reutilizável convertida para placeholder. Arquivos legados acima de 300 linhas permanecem dívida técnica registrada.
- A auditoria Ruff completa encontrou apenas o bootstrap intencional de `sys.path`; os quatro imports receberam justificativa `E402` localizada.
- A suíte de integração passou com 8 testes; a suíte unitária passou com 120/120 testes.

## Correção técnica de runtime Swarm — 25/09/2026

- Causa: o backend usava DBAPI incompatível com o driver instalado; o healthcheck do Caddy requisitava `/healthz`, ausente no frontend.
- Arquivos: `app/database.py`, `docker-stack.swarm.yml`, `docker-compose.yml`.
- Validação: os 8 serviços `cerrado_test` convergiram em `1/1`; API, frontend e Caddy responderam HTTP 200 com headers de segurança.
- Risco residual: baixo; fallback defensivo e drivers explícitos, sem impacto nos containers standalone de produção.

## Estabilização de healthchecks e resiliência Swarm — 28/09/2026

- Causa: healthcheck do Caddy batia na raiz `/` (renderização SSR Next.js pesada sofria timeout no wget sob contenção); o worker Celery de monitoramento excedia 15s no cold start do python com cota estrita de 0.25 CPU; ambos saíam limpos (código 0) e não reiniciavam por causa de `restart_policy.condition: on-failure`.
- Arquivos: `Caddyfile.test`, `Caddyfile`, `docker-stack.swarm.yml`, `documento/EVIDENCIAS_VALIDACAO.md`.
- Validação: Caddy responde 200 direto em `/healthz`; `cerrado_test_caddy` e `cerrado_test_celery_monitoring` convergiram para 1/1 com status `healthy`; todos os 9 serviços `cerrado_test` ativos em 1/1; 125 testes unitários e 8 de integração aprovados.
- Risco residual: baixo; cotas e endpoints isolados, sem impacto nos contêineres legados de produção.
