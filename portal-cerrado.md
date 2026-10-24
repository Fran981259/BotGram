# 🗺️ Portal Cerrado — Project Map

## Stack
- Frontend: Next.js 16, TypeScript, Tailwind CSS
- Backend: FastAPI, SQLAlchemy, Celery
- Database and queue: PostgreSQL 15, Redis 7
- Infra: Docker Swarm (Contabo 13.140.149.158), Portainer CE 2.27, Caddy 2, GitHub Actions

## Deployment & Swarm
- Contabo VPS (`13.140.149.158`): nó swarm leader ativo com Portainer CE (9443/9000), 11 serviços ativos (botgram stack)
- Oracle Cloud (`129.153.59.97`): servidor de origem mantido 100% ativo e intocado até homologação e virada de DNS
- Banco de Dados PostgreSQL 15: restaurado integralmente (15.200 artigos) no volume swarm `botgram_postgres_data`

## Folder Structure
- app/ → API FastAPI, pipeline editorial, persistência e tarefas Celery
- config/ → catálogo de portais, políticas de scheduler e personas dos repórteres
- frontend/src/app/ → rotas públicas Next.js e painel editorial /admin
- frontend/src/components/ → componentes modulares (notícias, admin, gráficos)
- frontend/src/lib/ → clientes de API, sanitização e utilitários
- tests/ → suítes de testes unitários, contratuais e integração
- scripts/ → comandos de backup, migração, quarentena e deploy

## Routes / Pages
- GET / → home pública
- GET /categoria/[slug] → feed de categoria
- GET /noticia/[slug] → página de matéria
- GET /admin → painel administrativo e mesa editorial
- GET /admin/pipeline → monitoramento em tempo real do pipeline Celery
- GET /admin/artigos → gestão de matérias e quarentena
- GET /admin/reporteres → personas e prompts dos agentes de IA
- GET /admin/analytics → métricas first-party de tráfego e leituras
- GET /api/news → feed público de notícias
- GET /api/operations/status → telemetria e integridade dos serviços
- GET /news-sitemap.xml → sitemap de notícias para indexadores

## Swarm Services (Contabo 13.140.149.158)
- `portainer_portainer` (replicated 1/1, ports 9443, 9000, 8000)
- `portainer_agent` (global 1/1)
- `botgram_caddy` (replicated 1/1, ports 80, 443)
- `botgram_frontend` (replicated 1/1, port 3000)
- `botgram_portal_cerrado` (replicated 1/1, port 8080)
- `botgram_postgres` (replicated 1/1, volume `botgram_postgres_data`)
- `botgram_redis` (replicated 1/1, volume `botgram_redis_data`)
- `botgram_celery_worker` (replicated 1/1)
- `botgram_celery_beat` (replicated 1/1)
- `botgram_celery_monitoring` (replicated 1/1)
- `botgram_flower` (replicated 1/1, port 5555)

## Data retention & Safety
- Backups operacionais: retenção de 30 dias; restore de teste obrigatório antes de expurgo.
- Servidor de origem (Oracle Cloud 129.153.59.97): NÃO alterar nem desativar até validação completa.

## Last updated: 2026-10-22
