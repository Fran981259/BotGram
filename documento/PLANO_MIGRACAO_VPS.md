# PLANO DE ACAO — Migracao para o repo BotGram (VPS 13.140.149.158)

> Data da elaboracao: 2026-09-30
> Candidato: `codex/otimizacao-completa` @ `380f49e`
> Origem: `cerrado_test.git`
> Destino: `BotGram.git` na VPS `/home/ubuntu/BotGram`
> Regra: nenhuma etapa de escrita em producao sem aprovacao explicita do usuario.

---

## 1. Objetivo

Atualizar o repositorio oficial do projeto na VPS com o codigo do dashboard
admin, preservando integralmente as 6045 noticias ja publicadas e seu
historico completo.

O conteudo editorial nao esta no Git: vive no volume Docker
`botgram_postgres_data`. Atualizar o repositorio, trocar de branch ou
sobrescrever arquivos da pasta **nao toca no banco**. A perda so ocorreria se o
volume fosse destruido ou recriado. Por isso a Etapa 2 e a Etapa 3 sao as
barreiras de protecao do dado.

---

## 2. Estado apurado (evidencia de 2026-09-30)

### 2.1 Producao

| Item | Valor |
| --- | --- |
| Host | `13.140.149.158` / `vmi3587775` |
| SO | Ubuntu 24.04.5 LTS, up 12 dias |
| Recursos | 7.9 GB RAM (4.5 GB livre), disco 62% (37 GB livres) |
| Site | HTTP 200 em 0.44s |
| Containers | 8 (6 do Portal Cerrado + Portainer), todos healthy, Up 5 days |

### 2.2 Banco de dados

| Tabela / Indicador | Valor |
| --- | --- |
| `news_articles` | 6045 |
| `published` / `review` / `classified` / `failed` | 645 / 4441 / 956 / 3 |
| `article_identities` | 6045 |
| Faixa de datas | 2026-09-17 ate 2026-09-30 |
| Tamanho | 53 MB |
| `alembic_version` | `944b989187cf` |
| Volume ativo | `botgram_postgres_data` (109 MB) |

**Confirmado pelo usuario:** as 6045 linhas cobrem todo o historico a preservar.

### 2.3 Divergencia de codigo

O codigo da VPS corresponde ao `main` antigo. O candidato e 12 commits a frente.

Modulos existentes no candidato e **ausentes na imagem de producao** (a imagem
tem 27 arquivos em `app/`; o candidato tem 58):

```
admin_routes.py           admin_pipeline_routes.py     admin_reporter_routes.py
admin_analytics_routes.py admin_social_routes.py      admin_config_routes.py
admin_audit_routes.py     rate_limit.py                trend_models.py
scanner_catalog.py        miner_global.py              article_body.py
classifier_category*.py   duplicate_detection.py       translation_glossary.py
```

Consequencia atual: o frontend de producao tem `/admin` compilado, mas o backend
nao possui as rotas. **O painel esta inacessivel hoje.**

### 2.4 Riscos identificados

| # | Risco | Gravidade | Mitigacao |
| --- | --- | --- | --- |
| R1 | `portalcerrado_postgres_data` (orfao, 4 KB, vazio) induz a belief de que ali estao os dados | **Critica** | Fixar `COMPOSE_PROJECT_NAME=botgram` e `postgres_data` (Etapa 2) |
| R2 | Imagens por tag `:latest` — rollback nao deterministico | Alta | Promover por digest (Etapa 5) |
| R3 | `docker compose down -v` destrói o volume | **Critica** | Proibido no procedimento; unico `down` sem `-v` |
| R4 | `ENVIRONMENT=development` no `.env` da VPS | Alta | Corrigir para `production` (Etapa 4) |
| R5 | `TRUSTED_PROXY_HOSTS` ausente; novo `security.py` exige allowlist | Alta | Adicionar antes do deploy (Etapa 4) |
| R6 | `GEMINI_API_KEY` presente no `.env` mas ausente no container | Media | Alinhar (Etapa 4) |
| R7 | 132 arquivos modificados nao commitados na pasta da VPS | Media | Snapshot completo feito; conteudo e base antiga, nao trabalho unico |
| R8 | 31 MB em `cerrado.zip` e artefatos nao rastreados | Baixa | Nao versionar; ja preservados no snapshot |

---

## 3. Gates validados no candidato

Executados em 2026-09-30 sobre `380f49e`:

| Gate | Comando | Resultado |
| --- | --- | --- |
| Compilacao | `compileall app` | OK |
| Ruff | `ruff check app/ tests/` | All checks passed |
| Mypy | `mypy app/` | 73 arquivos, sem erro |
| Testes | `pytest tests/unit tests/integration` | **145 passed** em 22.36s |
| Frontend lint | `npm run lint` | OK |
| Frontend tipos | `npx tsc --noEmit` | OK |
| Frontend build | `npm run build` | 9 rotas `/admin/*` geradas |
| Migrations | cadeia `01ab4a` → `b3a8e4` | UP e DOWN testados |

As duas migrations pendentes (`a7c3d9e1f204`, `b3a8e4f7c2d1`) sao **exclusivamente
criacao de indice** — nenhuma altera dados.

---

## 4. Backups ja realizados

Em `/root/backups/` na VPS:

| Arquivo | Tamanho | Validacao |
| --- | --- | --- |
| `pc_20260930-140836.dump` | 12 MB | **Restore real executado** em banco temporario: 6045 artigos, mesmas contagens por status. Banco descartado. |
| `vps-pasta-20260930-143002.tar.gz` | 409 MB | 9498 arquivos (pasta + `.git` + `.env`) |
| `diff-vps-20260930-143002.patch` | 584 KB | Patch dos 132 arquivos modificados |
| `env-20260930-143002/` | 2.4 KB | `.env` e `.env.production` com `chmod 600` |

---

## 5. Procedimento

### Etapa 1 — Aprovacao e congelamento (sem escrita)

- [ ] Usuario aprova este plano explicitamente
- [ ] Registrar SHA candidato: `380f49e`
- [ ] Confirmar janela de manutencao

### Etapa 2 — Barreira anti-perda (CRITICA)

O objetivo e garantir que nenhuma variante do Compose aponte para o volume
vazio. Antes de qualquer `up`:

```bash
# Fixar o nome do projeto: o volume passa a ser botgram_postgres_data
echo 'COMPOSE_PROJECT_NAME=botgram' >> /home/ubuntu/BotGram/.env

# Registrar o volume como externo, nome fixo, imune ao nome do projeto
docker volume inspect botgram_postgres_data --format '{{.Name}}'
```

Regra dura: **`down` nunca com `-v`; `rm` de volume nunca.**

### Etapa 3 — Code backup e saneamento da pasta

```bash
cd /home/ubuntu/BotGram
cp -p docker-compose.yml docker-compose.yml.bak.$(date +%Y%m%d-%H%M%S)
cp -p Caddyfile Caddyfile.bak.$(date +%Y%m%d-%H%M%S)
```

Preservar explicitamente (nao reaproveitar do repo):
- `.env`, `.env.production` — credenciais de producao
- `cerrado.db`, `data/`, `arq_data/` — dados locais
- `history_dump.json` — export historico

### Etapa 4 — Ajustes de `.env` (pre-requisito do deploy)

| Variavel | Valor atual | Valor requerido | Motivo |
| --- | --- | --- | --- |
| `ENVIRONMENT` | `development` | `production` | Ativa o fail-closed de `security.py` |
| `TRUSTED_PROXY_HOSTS` | ausente | `172.16.0.0/12,10.0.0.0/8` (rede Compose) | Novo codigo exige allowlist de proxy |
| `COMPOSE_PROJECT_NAME` | ausente | `botgram` | Protege o volume (R1) |
| `LLM_FALLBACK_CHAIN` | ausente | `gemini,groq` | Requerido pelo contrato do Compose candidato |
| `GEMINI_API_KEY` | no `.env`, ausente no container | alinhar | Evita 503 do LLM apos o restart |

Validar antes de seguir:
```bash
docker compose -f docker-compose.yml config >/dev/null && echo "compose valido"
```

### Etapa 5 — Build e publicacao por digest

```bash
# Local, a partir do candidato
docker build -t ghcr.io/fran981259/portal-cerrado-backend:$SHA .
docker build --build-arg NEXT_PUBLIC_API_URL=http://portal_cerrado:8000 \
             --build-arg NEXT_PUBLIC_SITE_URL=https://portalcerrado.com.br \
             -t ghcr.io/fran981259/portal-cerrado-frontend:$SHA ./frontend
docker push ghcr.io/fran981259/portal-cerrado-backend:$SHA
docker push ghcr.io/fran981259/portal-cerrado-frontend:$SHA
```

Registrar o digest de cada imagem:
```bash
docker inspect --format '{{index .RepoDigests 0}}' <imagem>
```

Anotar os digests no relatorio. Eles sao a referencia de rollback (mitiga R2).

### Etapa 6 — Backupimediatamente antes de subir

```bash
docker exec portal_cerrado_postgres pg_dump -U portal_user -d portal_cerrado \
  -Fc -f /tmp/pre_deploy.dump
```
Registrar a contagem antes do deploy: deve ser **6045**.

### Etapa 7 — Deploy

```bash
cd /home/ubuntu/BotGram
git fetch origin
git checkout <branch-com-candidato>
git pull --ff-only

BACKEND_IMAGE=<backend@sha256:...> \
FRONTEND_IMAGE=<frontend@sha256:...> \
docker compose -f docker-compose.yml up -d
```

Sem `--build`, sem `-v`, sem `down -v`.

### Etapa 8 — Pos-deploy: verificacao de integridade

```bash
# 1. Dado intacto
docker exec portal_cerrado_postgres psql -U portal_user -d portal_cerrado \
  -tAc "select count(*) from news_articles;"          # esperado: 6045

# 2. Historico preservado
docker exec portal_cerrado_postgres psql -U portal_user -d portal_cerrado \
  -tAc "select min(created_at)::date, max(created_at)::date from news_articles;"
# esperado: 2026-09-17 | 2026-09-30

# 3. Volume intacto
docker volume inspect botgram_postgres_data --format '{{.Name}}'

# 4. Migrations aplicadas
docker exec portal_cerrado_postgres psql -U portal_user -d portal_cerrado \
  -tAc "select version_num from alembic_version;"    # esperado: b3a8e4f7c2d1

# 5. Servicos
curl -s localhost:8000/health
curl -s -o /dev/null -w '%{http_code}\n' https://portalcerrado.com.br/

# 6. Admin agora responde
curl -s -o /dev/null -w '%{http_code}\n' https://portalcerrado.com.br/admin/dashboard
```

### Etapa 9 — Rollback

```bash
BACKEND_IMAGE=<backend-digest-anterior> \
FRONTEND_IMAGE=<frontend-digest-anterior> \
docker compose -f docker-compose.yml up -d
```

O rollback nao toca o banco: as migrations sao aditivas e o schema antigo
permanece valido. Se for necessario reverter o schema, usar
`alembic downgrade 944b989187cf` — as duas migrations tem `downgrade` implementado.

---

## 6. Criterio de aceite

A migracao so e considerada bem-sucedida quando, simultaneamente:

1. `news_articles` = **6045** (ou maior, se o pipeline publicou no intervalo)
2. Faixa de datas preservada: 2026-09-17 a 2026-09-30
3. `alembic_version` = `b3a8e4f7c2d1`
4. Volume `botgram_postgres_data` intacto
5. Site responde HTTP 200
6. `/admin/dashboard` responde (antes: inexistente no backend)
7. Os 8 containers estao healthy
8. Celery Beat continua emitindo `run-full-pipeline`

---

## 7. Bloqueios que exigem decisao do usuario

1. **Aprovacao deste plano** antes da Etapa 2.
2. **Janela de manutencao** — o deploy recria containers; haverá indisponibilidade
   breve de 1 a 3 minutos.
3. **Rotacao de `PUBLISH_API_KEY`** — a atual e de comprimento curto; o
   `security.py` candidato exige >= 32 caracteres em producao e **recusa a
   inicializacao** se a chave for fraca. O `.env` atual precisa ser ajustado ou
   a chave trocada, caso contrario o backend nao sobe.
4. **Imagem oficial em `cerrado_test` ou `BotGram`?** O plano assume build
   local + push para GHCR. Se preferir, o `deploy.yml` faz isso via GitHub
   Actions com aprovacao manual.
