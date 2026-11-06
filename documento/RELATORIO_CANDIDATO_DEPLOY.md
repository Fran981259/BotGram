# Relatório de Aceite — Candidato de Deploy

**Data:** 2026-11-06  
**Branch:** main  
**Commit de referência:** c07fef2 (pós-Fase 9)  
**Gerado por:** Fase 10 — PLANO_ACAO.md

---

## 1. Versões

| Componente | Versão / Referência |
|---|---|
| Backend (FastAPI) | `app/` — Python 3.12, commit `c07fef2` |
| Frontend (Next.js) | `frontend/` — Node 20, Next.js 16 |
| PostgreSQL | 15 (declarado em `docker-stack.swarm.yml`) |
| Redis | 7 (declarado em `docker-stack.swarm.yml`) |
| Caddy | 2 (declarado em `docker-stack.swarm.yml`) |
| Imagem backend | `ghcr.io/fran981259/portal-cerrado-backend:${BACKEND_IMAGE}` |
| Imagem frontend | `ghcr.io/fran981259/portal-cerrado-frontend:${FRONTEND_IMAGE}` |

---

## 2. Gates aprovados

| Fase | Estado | Commit |
|---|---|---|
| 0 — Infra e repositório | concluída | — |
| 1 — Modelos e migração | concluída | — |
| 2 — Pipeline editorial IA | concluída | — |
| 3 — Frontend e SEO | concluída | — |
| 4 — Admin e segurança | concluída | — |
| 5 — Caddy e roteamento | concluída | 16d588d |
| 6 — SEO e contratos de resposta | concluída | (vários) |
| 7 — Contrato Swarm e Compose | concluída | fc16ac7 |
| 8 — CI, imagens e promoção | concluída | 4684af7 |
| 9 — Observabilidade e operação | concluída | 297467d |
| 10 — Candidato de deploy | **este relatório** | c07fef2+ |

---

## 3. Resultados da validação estática

| Verificação | Resultado |
|---|---|
| Testes unitários | **175 passando**, 0 falhas |
| Ruff (linting) | **0 violações** |
| Mypy (tipos) | **0 erros** em 80 arquivos |
| Contratos de release (7 novos) | **7/7 passando** |
| Python CI | 3.12 (alinhado local e GitHub Actions) |
| Imagens SHA-pinned | deploy.yml usa `${{ github.sha }}` |
| Tag `:latest` proibida | ausente em deploy.yml e docker-stack.swarm.yml |
| Gates publish | dependency-inventory + test-backend + lint-frontend |

---

## 4. Processo de deploy em teste

```bash
# 1. Disparar workflow_dispatch no GitHub (deploy.yml)
#    → publica ghcr.io/fran981259/portal-cerrado-{backend,frontend}:<SHA>

# 2. No nó Swarm (100.95.111.24):
export BACKEND_IMAGE=ghcr.io/fran981259/portal-cerrado-backend:<SHA>
export FRONTEND_IMAGE=ghcr.io/fran981259/portal-cerrado-frontend:<SHA>
export POSTGRES_USER=...
export POSTGRES_PASSWORD=...
export REDIS_PASSWORD=...
export FLOWER_USER=...
export FLOWER_PASSWORD=...
export PUBLISH_API_KEY=...
export NEXT_PUBLIC_SITE_URL=https://portalcerrado.com.br
export CORS_ALLOWED_ORIGINS=https://portalcerrado.com.br

# 3. Renderizar e validar antes de aplicar
docker stack config -c docker-stack.swarm.yml > /tmp/swarm.rendered.yml

# 4. Aplicar stack de teste (portas alternativas: API 8100, frontend 3100)
docker stack deploy -c docker-stack.swarm.yml cerrado_test

# 5. Aguardar healthchecks (1/1 réplica por serviço)
docker stack services cerrado_test

# 6. Smoke test
curl http://100.95.111.24:8100/health      # → {"status":"healthy"}
curl http://100.95.111.24:3100/            # → 200 OK
curl http://100.95.111.24:8181/            # → Caddy HTTP
```

---

## 5. Plano de rollback

```bash
# Rollback para SHA anterior (requer ROLLBACK_APPROVED=yes)
ROLLBACK_APPROVED=yes bash scripts/rollback.sh <SHA_ANTERIOR>

# Ou manualmente:
docker service update --image ghcr.io/fran981259/portal-cerrado-backend:<SHA_ANTERIOR> cerrado_test_portal_cerrado
docker service update --image ghcr.io/fran981259/portal-cerrado-frontend:<SHA_ANTERIOR> cerrado_test_frontend
```

Tempo estimado de rollback: < 2 minutos (pull da imagem anterior já em cache).

---

## 6. Risco residual

| Risco | Classificação | Mitigação |
|---|---|---|
| Primeira aplicação da stack `cerrado_test` no nó | Médio | Ports 8100/3100/8181/8843 livres; smoke test obrigatório |
| Volumes `cerrado_test_*` criados na primeira aplicação | Baixo | Dados de teste; destruíveis sem impacto |
| Redis e Celery sem ensaio com serviços reais | Médio | Simulação offline validou independência do broker |
| Oracle Cloud `129.153.59.97` intocável | N/A | Nenhuma ação planejada nesse servidor |
| **Produção `13.140.149.158`** | **Bloqueado** | **Exige aprovação explícita do usuário** |

---

## 7. Decisão

**Produção permanece bloqueada.**  
Este relatório documenta que todos os gates estáticos e contratuais estão aprovados.  
O deploy em produção (Contabo `13.140.149.158`, DNS `portalcerrado.com.br`) requer:

1. Execução manual do processo acima na stack `cerrado_test`
2. Smoke test aprovado pelo usuário
3. Aprovação explícita do usuário para corte de DNS / stack de produção
