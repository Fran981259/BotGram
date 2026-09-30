# 🗺️ Portal Cerrado — Project Map

## Stack

- Frontend: Next.js 16, TypeScript, Tailwind CSS
- Backend: FastAPI, SQLAlchemy, Celery
- Database and queue: PostgreSQL/SQLite fallback, Redis
- Infra: Docker Compose, Caddy, GitHub Actions

## Delivery Gate

- Regra pétrea: nenhuma funcionalidade nova ou deploy antes de todos os gates de `documento/PLANO_ACAO.md` passarem com evidência atual.
- Exceção: apenas correções necessárias para fechar os gates, registradas com validação e risco residual.

## Folder Structure

- app/ → API, editorial pipeline, persistence and background tasks
- config/ → source, scheduler and reporter policies
- frontend/src/app/ → public Next.js routes
- frontend/src/components/ → reusable public UI components
- frontend/src/components/Icon.tsx → local lucide icon vocabulary
- frontend/src/components/article/ → reading guide, sharing actions and article sidebar
- frontend/src/lib/ → API client and shared frontend utilities
- tests/ → unit and pipeline tests
- scripts/ → operational and maintenance commands

## Routes / Pages

- GET / → public home
- GET /categoria/[slug] → public category feed
- GET /noticia/[slug] → public article
- GET /api/news → paginated local public feed
- GET /api/editorial/review → protected queue for local review and published articles
- GET /api/operations/status → publication freshness signal
- GET /news-sitemap.xml → recent article discovery for news indexers
- GET /admin/editorial → protected editorial review workspace

## Key Files

- AGENTS.md → regra pétrea de entrega e proteção de alterações existentes
- app/main.py → FastAPI application and HTTP endpoints
- app/contracts.py → contratos de categoria, fontes e timestamps UTC/apresentação
- app/main.py → CORS fail-closed e endpoints FastAPI
- app/rate_limit.py → contador Redis compartilhado para endpoints públicos
- TRUSTED_PROXY_HOSTS → allowlist de proxies confiáveis para X-Forwarded-For
- app/security.py → autenticação por chave com política de força em produção
- app/editorial_routes.py → revisão editorial e registro de auditoria
- tests/unit/test_security.py → contrato de força da chave editorial
- tests/unit/test_admin_endpoints.py → suite automatizada dos endpoints do painel admin
- tests/unit/test_env_contract.py → variáveis documentadas versus runtime
- tests/unit/test_operations_sitemap.py → filtro de artigos do news sitemap
- .env.example → contrato de ambiente sem chaves legadas
- SENTRY_TRACES_SAMPLE_RATE / SENTRY_PROFILES_SAMPLE_RATE → amostragem configurável do Sentry
- LLM_FALLBACK_CHAIN → ordem de failover dos provedores LLM
- .env.example → placeholders sem senha reutilizável para desenvolvimento
- documento/OPERACAO.md → procedimento de backup e rotação de chave editorial
- app/editorial_routes.py → fonte única das rotas editoriais protegidas
- app/analytics_routes.py → fonte única do tracking de primeira parte
- app/database.py → sessões FastAPI com rollback e fechamento garantidos
- app/tasks/scan_tasks.py → orquestração Celery do pipeline de coleta
- app/translation_glossary.py → glossário compartilhado de tradução LLM
- app/tasks/scan_persistence.py → persistência e deduplicação de rascunhos coletados
- alembic/versions/b3a8e4f7c2d1_add_news_title_fts_index.py → índice FTS PostgreSQL para fontes relacionadas
- app/personality.py → evolução temporal dos repórteres com datas normalizadas
- scripts/quarantine_misclassified_global_articles.py → auditoria segura de fontes globais
- scripts/quarantine_english_articles.py → auditoria e quarentena de títulos em inglês
- app/duplicate_detection.py → regras compartilhadas de duplicação e conteúdo sensível
- app/trend_models.py → sinais e modelo de tendências editoriais
- app/curiosity_models.py → categorias e padrões de curiosidades
- app/curiosity_mixing.py → inserção de curiosidades no fluxo editorial
- app/scanner_catalog.py → agregador de dados editoriais do scanner
- app/scanner_keyword_core.py → palavras-chave principais do scanner
- app/scanner_keyword_extra.py → palavras-chave complementares do scanner
- app/scanner_parsing.py → coleta HTTP, parsing e validação de artigos
- app/classifier_patterns.py → padrões de importância e engajamento
- app/classifier_category.py → mixin de inferência de categoria
- app/classifier_category_keywords.py → agregador de palavras-chave do classificador
- app/classifier_category_core.py → palavras-chave principais de categoria
- app/classifier_category_extra.py → palavras-chave complementares de categoria
- app/auditor_agent_checks.py → checks de agentes e repórteres
- app/auditor_compliance_checks.py → checks de conteúdo, compliance, performance e categorias
- app/article_fetcher.py → orquestração HTTP da extração de artigos
- app/article_metadata.py → metadados, ruído e imagens de artigos
- app/article_body.py → corpo textual, fallback e limpeza de leads
- app/miner.py → fachada pública compatível do minerador
- app/miner_constants.py → constantes de volume e randomização
- app/miner_global.py → orquestração de coleta global
- app/miner_global_parsing.py → parsing RSS, Google News e relevância
- app/miner_volume.py → balanceamento de volume editorial
- app/miner_pipeline.py → classificação, tradução e roteamento
- app/publisher.py → publication and public feed rules
- app/local_news_policy.py → local editorial source gate
- frontend/src/lib/api.ts → frontend API client and home ranking
- frontend/src/lib/formatArticle.ts → article formatting and DOMPurify sanitization
- frontend/src/lib/electionCoverage.ts → deterministic election and politics selection for the home
- app/category_inference.py → conservative category inference for the publication pipeline
- tests/conftest.py → banco temporário e bloqueio de rede para testes unitários
- tests/integration/test_migrations.py → upgrade, downgrade e compatibilidade de migrations
- tests/unit/test_database_backup.py → round-trip e confirmação de restore
- tests/integration/test_indexes.py → índices de FK e consultas editoriais
- scripts/database_backup.py → backup/restore SQLite e PostgreSQL
- alembic/versions/a7c3d9e1f204_add_foreign_key_and_feed_indexes.py → índices de FKs e filtros editoriais
- frontend/src/lib/siteMetadata.ts → shared public social-preview metadata
- frontend/next.config.ts → allowlist explícita de hosts de imagem
- frontend/package.json → scripts oficiais de lint, TypeScript e build
- frontend/src/app/page.tsx → home dinâmica por depender de cotações no-store
- frontend/src/app/robots.ts → metadata de robots
- frontend/src/app/sitemap.ts → sitemap público
- frontend/src/app/news-sitemap.xml/route.ts → sitemap de notícias com fallback 503
- frontend/src/app/not-found.tsx → fallback editorial de rota inexistente
- frontend/src/app/noticia/[slug]/loading.tsx → skeleton da leitura de notícia
- documento/PRONTIDAO_CANDIDATO.md → gates finais e bloqueios para promoção
- Caddyfile → CSP, Permissions-Policy e headers HTTP de segurança
- tests/unit/test_security_headers.py → contrato estático dos headers do proxy
- docker-compose.local.yml → override local com bridge e portas temporárias
- docker-stack.swarm.yml → stack Swarm de teste com imagens por digest
- celery_monitoring → worker Celery dedicado à fila de healthcheck e métricas
- tests/unit/test_runtime_contract.py → serviços, healthchecks e isolamento Swarm
- tests/unit/test_ci_contract.py → promoção manual e tags imutáveis
- .github/workflows/deploy.yml → workflow manual por SHA e inventário de dependências
- scripts/update.sh → promoção local/Swarm com contrato explícito
- config/observability.yaml → métricas, alertas, retenção e rollback declarativos
- tests/unit/test_observability_contract.py → contrato offline de observabilidade
- tests/unit/test_failure_simulations.py → simulações offline de falhas críticas
- scripts/rollback.sh → rollback Swarm por SHA com dry-run obrigatório
- tests/unit/test_rollback_contract.py → contrato de confirmação e cobertura de serviços
- frontend/src/lib/editorialApi.ts → protected editorial queue client
- frontend/src/components/admin/ → editorial review dashboard UI
- config/scheduler.yaml → local publication policy
- frontend/src/app/admin/layout.tsx → shell do admin (auth guard + sidebar + topbar)
- frontend/src/app/admin/page.tsx → redirect /admin → /admin/dashboard
- frontend/src/app/admin/dashboard/page.tsx → KPIs, artigos recentes e atalhos
- frontend/src/app/admin/artigos/page.tsx → gestão completa de artigos (Fase 2 ✅)
- frontend/src/components/admin/ArticleEditModal.tsx → modal de edição inline (Fase 2 ✅)
- app/admin_routes.py → GET/PATCH/DELETE /api/admin/articles, GET /api/admin/stats (Fase 2 ✅)
- frontend/src/app/admin/pipeline/page.tsx → status e scan manual Celery (Fase 3 ✅)
- frontend/src/components/admin/PipelineFunnel.tsx → visualização do funil de estágios (Fase 3 ✅)
- app/admin_pipeline_routes.py → rotas de status, trigger e task do pipeline (Fase 3 ✅)
- frontend/src/app/admin/editorial/page.tsx → mesa editorial existente (integrada ao shell)
- frontend/src/app/admin/reporteres/page.tsx → gestão de agentes IA (Fase 4 ✅)
- frontend/src/components/admin/ReporterCard.tsx → card de repórter e métricas (Fase 4 ✅)
- frontend/src/components/admin/ReporterEditModal.tsx → editor de persona/voz/prompt (Fase 4 ✅)
- frontend/src/components/admin/ReporterArticlesModal.tsx → histórico de matérias do repórter (Fase 4 ✅)
- app/admin_reporter_routes.py → CRUD e persona de repórteres IA (Fase 4 ✅)
- frontend/src/app/admin/analytics/page.tsx → métricas e alcance editorial (Fase 5 ✅)
- frontend/src/components/admin/AnalyticsTimelineChart.tsx → gráfico vetorial de tendências (Fase 5 ✅)
- frontend/src/components/admin/AnalyticsDistribution.tsx → distribuição de categorias e repórteres (Fase 5 ✅)
- frontend/src/lib/adminAnalyticsApi.ts → cliente de dados de analytics (Fase 5 ✅)
- app/admin_analytics_routes.py → agregação de KPIs, timeline e rankings (Fase 5 ✅)
- frontend/src/app/admin/redes-sociais/page.tsx → Twitter/X e distribuição social (Fase 6 ✅)
- frontend/src/components/admin/SocialPostModal.tsx → modal de tweet manual com preview (Fase 6 ✅)
- frontend/src/lib/adminSocialApi.ts → cliente de API para redes sociais (Fase 6 ✅)
- app/admin_social_routes.py → rotas de status, disparo e histórico social (Fase 6 ✅)
- frontend/src/app/admin/logs/page.tsx → auditoria e histórico de logs (Fase 7 ✅)
- frontend/src/app/admin/moderacao/page.tsx → fila de moderação e quarentena (Fase 7 ✅)
- frontend/src/app/admin/usuarios/page.tsx → credenciais, operadores e segurança (Fase 7 ✅)
- frontend/src/lib/adminAuditApi.ts → cliente de API para auditoria e moderação (Fase 7 ✅)
- app/admin_audit_routes.py → rotas de auditoria, moderação e segurança (Fase 7 ✅)
- frontend/src/app/admin/configuracoes/page.tsx → scheduler, LLM e fontes (Fase 8 ✅)
- frontend/src/components/admin/LLMProviderCard.tsx → card de provedor LLM com teste (Fase 8 ✅)
- frontend/src/components/admin/SchedulerConfigCard.tsx → parâmetros de volume do scheduler (Fase 8 ✅)
- frontend/src/lib/adminConfigApi.ts → cliente de configurações e teste LLM (Fase 8 ✅)
- app/admin_config_routes.py → rotas de scheduler, teste LLM e fontes (Fase 8 ✅)
- frontend/src/components/admin/ArticleFilterBar.tsx → barra de filtros e busca de artigos
- frontend/src/components/admin/ArticleTable.tsx → tabela responsiva de artigos
- frontend/src/components/admin/PipelineLogsCard.tsx → card de logs de atividade Celery
- frontend/src/components/admin/PipelineMetricsCards.tsx → cards de status de workers e lock Redis
- frontend/src/components/admin/ReporterVoiceSection.tsx → formulário de persona e voz IA
- frontend/src/components/admin/AdminSidebar.tsx → navegação colapsável
- frontend/src/components/admin/AdminAuthGuard.tsx → proteção via PUBLISH_API_KEY + context
- frontend/src/components/admin/AdminLoginPanel.tsx → tela de login dark mode
- frontend/src/components/admin/AdminShared.tsx → StatCard, StatusBadge, ConfirmModal, useToast, Spinner, EmptyState
- frontend/src/lib/adminApi.ts → cliente HTTP do painel admin (tipagens + fetch)
- frontend/src/styles/admin.css → design system dark mode exclusivo do admin

## Last updated: 2026-09-29

- news_articles · reporters · publication_logs · scraping_tasks · editorial_trend_signals

## Data Retention

- Backups operacionais: retenção de 30 dias; restore de teste obrigatório antes de expurgo.

## Last updated: 2026-09-30
