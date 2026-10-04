# RELATÓRIO DO REDESIGN - Portal Cerrado

> Relatório histórico do candidato `823fc06`. As medições e afirmações desta
> página não representam automaticamente o checkout atual nem o ambiente ativo.

Relatório de entrega, para quem precisa **verificar** o trabalho e não apenas
lê-lo. O plano e o raciocínio de cada decisão estão em `PLANO_REDESIGN.md`; aqui
está o que foi feito, como checar, e o que ficou de fora.

Candidato: `823fc06`. Árvore limpa, `local` igual a `remoto`.

---

## Resumo

Nove fases incrementais de redesign visual do frontend. Nenhum arquivo de
backend foi alterado. Nenhuma funcionalidade foi criada.

O redesign não é uma reorganização de marcação: cada fase foi fechada por
**medição no navegador**, não por leitura de código. O dado que decide o que
mudou está nas tabelas abaixo e é reproduzível com os comandos da seção seguinte.

---

## Como reproduzir a verificação

Nenhuma dependência nova é necessária. O build local pode ser apontado para a
API de produção — que é pública — para medir com conteúdo real:

```bash
# 1. build
cd frontend && npm run lint && npx tsc --noEmit && npm run build
npm audit --omit=dev --audit-level=high        # exige rede

# 2. backend
cd .. && .venv/bin/ruff check app tests scripts
.venv/bin/mypy app
.venv/bin/pytest -q

# 3. medir o build com conteúdo real
cd frontend && API_URL=https://portalcerrado.com.br npx next start -p 3990

# 4. auditoria visual por geometria (projeto auditor)
cd ../portal-cerrado-playwright
node tools/responsive.mjs http://127.0.0.1:3990 / /categoria/economy
node tools/tecnico.mjs      http://127.0.0.1:3990 / /sobre
node tools/fase8.mjs        http://127.0.0.1:3990 https://portalcerrado.com.br /
```

O banco SQLite local tem **0 notícias**. Apontar a build para a API de produção é
o que permite medir layout com conteúdo, e não é semear dado: a leitura é real e
apenas leitura.

---

## Resultado por fase

| Fase | Entrega | Como se prova |
| --- | --- | --- |
| 1 | Tokens de design, escala de espaço e contêiner | Diff do CSS compilado: 240 regras antes e depois, **0 alteradas** |
| 2 | Nove famílias de card com razão de aspecto | `NewsCard` vira fachada; altura fixa sai do caminho |
| 3 | Barra utilitária com data real; busca e footer | `/busca` a 360px: `scrollWidth` 379 → 360 |
| 4 | Hero por razão; "Mais lidas"; newsletter | Ordena por `engagement_score`, campo que a API já entrega |
| 5 | Recorte escolhido na figura; dobra sem ociosidade | Vão da dobra: 210/163/84px → 170/123/64px |
| 6 | Um ponto de tabulação por matéria | 98 pontos e 25 pares redundantes → 74 pontos e 0 pares |
| 7 | Passagem responsiva | 10 rotas × 6 larguras, 60 combinações sem overflow |
| 8 | QA visual por geometria | Razões de imagem na home `[1.47, 1.6, 1.91]` → `[1.6]` |
| 9 | Meta description e hierarquia de títulos | 12 de 12 combinações completas; LCP 232–1040 ms; CLS até 0,030 |

### Números consolidados

```
varredura responsiva   10 rotas × 6 larguras = 60 combinações
                       0 overflow · 1 h1 por página · 0 manchete repetida
desempenho             257–322 KB · LCP 232–1040 ms · CLS até 0,030
geometria da home      razões [1.47, 1.6, 1.91] -> [1.6]
                       primeira dobra 402px -> 246px
tecnico               12/12 com meta completa, sem salto de título
```

---

## Desvios e retificações

| Afirmação feita | Retificação pela medição |
| --- | --- |
| "59% e 68% de espaço vazio na dobra" | Falso: contava parágrafo e padding como váo. O vão real é 210/163/84px |
| "A imagem do agro fica deformada" | Falso: `fill` + `object-cover` recorta, não deforma |
| "Alvos de 21px violam a WCAG 2.5.8" | Falso como falha: a norma tem exceção para alvo **inline** |
| "Corrigi o recorte do agro" | Não corrigi: tinha reordenado duas classes |
| "Home com overflow de 994px" | Falso alarme: CSS respondendo HTTP 500, página sem estilo |
| "CLS 0,269 em `/busca`" | Amostra ruidosa: 4 rodadas deram 0,006 / 0,000 / 0,000 / 0,000 |

### Regressões que eu introduzi e corrigi

| Onde | O quê |
| --- | --- |
| Fase 4 | Home ficou **sem `h1`** — o card antigo era `h1`, a família editorial usa `h2`. Achado na Fase 7 |
| Fase 4 | **6 manchetes repetidas** entre blocos. Achado na Fase 7 |
| Fase 4–5 | **CSS morto**: nome de utilitário citado em comentário emitia classe, porque o Tailwind varre o texto bruto |
| Fase 8 | **Landmark duplicado** na newsletter: envolvi um componente que já é `section` |
| Fase 8 | Bloco de colunistas caiu de 8 para 4 cartões ao excluir repetidas |

---

## O que NÃO foi verificado

Declarado porque ausência de número é diferente de número ausente:

- **Julgamento visual.** A Fase 8 mediu geometria e guardou 60 capturas
  pareadas em `portal-cerrado-playwright/tools/fase8/{antes,depois}/`. Aprovação
  do resultado é de quem olha.
- **Contraste de texto.** Exige resolver fundo efetivo sobre imagem e gradiente;
  número errado nesse item é pior que ausência.
- **INP.** Exige interação real, não carga de página.
- **Comportamento com o acervo real de produção.** As medições usam a API pública,
  que é a mesma de produção, mas o banco local segue vazio.

---

## Pendências

| Pendência | Depende de |
| --- | --- |
| Aprovação visual das capturas | De quem julga |
| `RankedStoryItem` sem uso desde a Fase 2 | Removido na higienização posterior |
| Ferramentas do auditor não versionadas | Decisão de versionamento |
| Vulnerabilidade alta fora de produção (`brace-expansion`) | Autorizar `overrides` no `package.json` |
| Gate 8: imagem publicada e rollback em teste | Ver seção seguinte |

---

## Imagem: por que a produção ainda está em 29/09

Este é o ponto que explica a imagem desatualizada, e não é defeito do redesign.

**`deploy.yml` só dispara por `workflow_dispatch`.** Ele não tem gatilho de
`push`. Portanto nenhuma das nove fases gerou imagem — não por falha, mas por
nenhum workflow ter sido acionado.

A última execução do "CI/CD Pipeline" foi `#37046853945`, em 02/10, para o
commit `7062235`. Ela **falhou** no passo "Audit frontend dependencies" e o job
`publish` foi **skipped** — ou seja, aquela execução também não publicou imagem.

A causa era o **RCE crítico do `next` 16.3.3** (GHSA-vcvr-r3jv-pc5j), já
corrigido para 16.3.8. Hoje a auditoria passa:

```
$ npm audit --omit=dev --audit-level=high
found 0 vulnerabilities
```

Ou seja: **o bloqueio técnico já não existe**. O que falta é a decisão de
publicar, que é do gate 8 — adiado em 02/10 justamente para valer depois do
redesign.

Duas-saídas de atenção, ambas fora do escopo do redesign:

1. `docker-compose.yml` usa `:latest` como **fallback** de variável. Com
   `BACKEND_IMAGE` definida, o fallback morre e sobra o SHA — é o que o job
   `stack-contract` assegura, e ele passa. **Sem** a variável definida, o
   fallback resolve para a imagem antiga, sem aviso. É falha silenciosa, que é
   o pior dos dois modos.
2. Nenhum `git tag` existe no repositório, e `deploy.yml` publica as imagens só
   por `:${{ github.sha }}`. Não há `latest` publicado pelo pipeline.
