# MEMORIA - Portal Cerrado

> Documento canônico de arquitetura e restrições. Estado externo só é válido
> quando acompanhado de data e evidência; este arquivo não autoriza deploy.

## Canonico
- Nome do projeto: Portal Cerrado.
- Backend: FastAPI + Celery + Redis + PostgreSQL.
- Frontend: Next.js + Tailwind.
- Infra: Docker Swarm via Tailscale (100.95.111.24).

## Runtime Real
- O código suporta `gemini`, `groq` e `openai`; o provider ativo é definido por `LLM_PROVIDER` e a ordem de fallback por `LLM_FALLBACK_CHAIN`.
- Não há evidência atual nesta sessão para afirmar qual provider está ativo em produção. Não tratar valores de `.env.example` como configuração de produção.
- Classificador: heuristico com keywords PT-BR e EN, normalizado via contracts.category_name().
- Categorias canônicas: tech, culture, health, science, sports, politics, economy, security, agriculture, education, clima, world e general.
- Repórteres digitais são definidos em config/reporters.yml, inclusive cobertura internacional para world.
- A coleta automática é local: Campo Grande, Dourados, Três Lagoas, Corumbá e
  Ponta Porã, com complemento estadual de MS. Não há catálogo global ou dos EUA
  ativo; `world` é apenas uma categoria canônica para compatibilidade histórica.
- O repositório contém Compose para uso local/teste e uma stack Swarm dedicada para teste. A execução produtiva e o cutover continuam pendentes de evidência e aprovação.

## Regras Fixas
- Nao misturar docs de planejamento com docs de operacao.
- Nao tratar fallback de desenvolvimento como fluxo principal.
- Nao criar nomes ou marcas paralelas sem aprovacao.

## Identidade Editorial
- Os reporeres digitais sao os mesmos definidos em config/reporters.yml.
- A assinatura padrao deve continuar consistente com o projeto.
- Regras de escrita: 700-900 palavras, piramide invertida, 2-3 fontes cruzadas.

## Infraestrutura de Referencia
- O ambiente deve ser interpretado a partir do estado real do repositorio e da stack ativa.
- Quando houver conflito entre docs antigos e o estado atual, vale o estado atual confirmado.

## Observacao
- Esta memoria e para consistencia, nao para planejamento.

## Estado auditado

- Última validação local: 04/10/2026.
- A suíte completa passou com 149 testes; houve somente um aviso de depreciação
  transitivo do `TestClient`/Starlette.
- Resultados anteriores registrados neste diretório são históricos e não
  substituem a validação do candidato atual.

## Histórico e migração Swarm
- O destino oficial é Docker Swarm, com stack `cerrado`; nenhuma nova configuração deve introduzir o nome `botgram`.
- O runtime legado confirmado em 2026-09-18 é Docker Compose, projeto `botgram`, em `/home/razuk/BotGram`, com rede bridge `botgram_portal_cerrado_net` e volumes `botgram_postgres_data` e `botgram_app_data`.
- Esse legado não pode ser parado, removido, renomeado ou alterado até haver aprovação explícita de cutover e encerramento da janela de rollback.
- AP2WEB ocupa a porta pública 8000 no Swarm. Portal Cerrado não deve publicar API nessa porta.
- A porta 443 está ocupada por Tailscale no host. Antes do corte público, definir a estratégia TLS/proxy: liberar 443, usar outro IP/host, ou usar Tailscale Serve/Funnel. Não assumir que Caddy pode bindar 443.
- Para validação, a stack paralela `cerrado_test` usa rede e volumes isolados,
  sem reutilizar `botgram_*`. As portas e serviços publicados devem ser lidos do
  manifesto aplicado e do estado do host, nunca presumidos a partir deste texto.
- A stack Swarm de teste declarada usa nove serviços: `postgres`, `redis`,
  `portal_cerrado`, `celery_worker`, `celery_beat`, `celery_monitoring`,
  `flower`, `frontend` e `caddy`; ela não usa `container_name`. Nomes finais
  de produção continuam pendentes e não devem ser inferidos a partir do teste.
- Antes de qualquer rollout: concluir validações locais, gerar imagens imutáveis por SHA, validar migrations em banco novo e legado simulado, confirmar espaço em disco e documentar backup, rollback e verificação.
- Preflight remoto de 2026-09-18: Swarm manager ativo, cerca de 6,5 GB livres no host, nenhuma stack Swarm `cerrado` ativa e nenhum Caddy do Portal em execução.

## Separação Teste e Produção
- O repositório remoto de teste anterior foi descontinuado. Antes de qualquer novo deploy, definir e validar explicitamente a origem Git e a branch do ambiente; produção deve ter origem e branch próprias antes do cutover.
- A stack de teste usa `cerrado_test`, volumes `cerrado_test_*`, rede isolada e portas externas 8100 (API), 3100 (frontend), 8181 (HTTP) e 8843 (HTTPS).
- Produção deve trocar nome da stack, volumes, portas públicas, `SITE_URL`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_API_URL` e `CORS_ALLOWED_ORIGINS` antes da aplicação.
- Imagens de produção devem ser publicadas no registry aprovado por digest SHA-256; nunca promover `latest` nem reutilizar imagens do teste.
- Secrets de produção (`PUBLISH_API_KEY`, banco, Redis, LLM, Flower e registry) devem ser recriados no gestor de segredos; não copiar `.env` de teste.
- O cutover exige backup/restore validado, janela de rollback, TLS/proxy confirmado e encerramento explícito dos containers standalone legados.
