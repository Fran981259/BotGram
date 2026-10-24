# Portal Cerrado — Quick Brief

**O que é**: Portal de notícias automatizado com pipeline editorial IA + painel admin. 15.200 artigos em produção.
**Código real**: repositório no GitHub + deploy via Docker Swarm
**Infra**: Contabo VPS `13.140.149.158` (produção ativa) | Oracle Cloud `129.153.59.97` (origem — NÃO alterar)
**Status**: Em produção. Stack completa ativa no Swarm (11 serviços). Última atualização: 2026-10-22.
**Próximo passo**: ver `AGENTS.md` para pendências atuais.

## Regras
- Leia `AGENTS.md` antes de qualquer ação (fonte de verdade)
- Oracle Cloud (`129.153.59.97`) **intocável** até validação completa e virada de DNS
- Backups: retenção 30 dias; restore de teste obrigatório antes de expurgo

## Para trabalhar
- Fonte de verdade → `AGENTS.md`
- Mapa do projeto → `portal-cerrado.md`
- API → `app/` (FastAPI)
- Frontend → `frontend/src/app/`
- Configurações de portais → `config/`

## Stack
Next.js 16 · FastAPI · Celery · PostgreSQL 15 · Redis 7 · Docker Swarm · Caddy 2

## ⚠️ Não fazer
- Não alterar nem desativar o servidor Oracle Cloud `129.153.59.97`
- Não deployar sem GitHub Actions (pipeline CI/CD)
