# PLANO DE REDESIGN - Portal Cerrado

## Proveniência deste documento

> **O texto original do plano não estava no repositório.** Ele existia apenas na
> conversa de trabalho, e nenhuma das nove fases o registrou em arquivo. Este
> documento é uma **reconstrução**: reúne as regras que foram de fato aplicadas,
> os critérios de aceitação como foram executados, e a evidência medida de cada
> fase.
>
> Onde a reconstrução puder divergir do plano original, **o original manda**.
> As seções marcadas com **[R]** são interpretação minha, não citação.

Essa lacuna foi apontada ao fim de cinco fases seguidas antes de ser corrigida.
Quem pegou o projeto no meio do trabalho não encontrava as regras que o guiava.

---

## Escopo

Redesign visual do frontend, em nove fases incrementais. **Sem reescrita em bloco
único**, para que cada etapa possa ser medida e revertida isoladamente. O backend
não foi tocado. Nenhuma funcionalidade nova foi criada.

## Regra de conteúdo **[R]**

**Não entregar dado que o projeto não tem.** Fica proibido o uso de:

- clima ou temperatura que não venha de integração real
- cotações de bolsa ou índice que o sistema não integre
- nome de repórter, categoria ou número de matéria que não exista no acervo
- métrica de leitura, engajamento ou dado social inventado
- texto de apuração que afirme um processo de reporteria não comprovável

Quando o desenho de interface pede um dado que o projeto não entrega, **o
componente se adapta ao dado disponível** em vez de o componente ser preenchido
com invenção.

Consequências aplicadas no redesign:

| Situação | O que foi feito |
| --- | --- |
| Não há integração de clima | A barra utilitária mostra só a data real, calculada no servidor |
| Não há endpoint de assinatura | A newsletter leva a `/contato`, não a um formulário que "envia" para lugar nenhum |
| Não há tempo de leitura no banco | `readingTimeMinutes` conta palavras do texto real; artigo sem métrica não entra no ranking |
| Acervo sem corpo de matéria | A página diz que o texto integral não está no acervo e leva à fonte original pelo campo `url` |
| Sem integração social | Nada de contador de compartilhamento; só ações de compartilhar |

---

## Estado de referência em 03/10/2026

Candidato `32fb2fa5bddb015f3404f09d5284cc97e1a7b79b`, com árvore limpa e `local`
igual a `remoto`.

| Verificação | Estado | Evidência |
| --- | --- | --- |
| Lint frontend | aprovado | `npm run lint` → 0 problemas |
| Tipos frontend | aprovado | `npx tsc --noEmit` → 0 erros |
| Build frontend | aprovado | 25 rotas, `✓ Compiled successfully` |
| Dependências de produção | aprovado | `npm audit --omit=dev --audit-level=high` → 0 vulnerabilidades, com rede |
| Ruff backend | aprovado | `ruff check app tests scripts` → sem violações |
| Mypy backend | aprovado | `mypy app` → 73 arquivos, sem erros |
| Testes backend | aprovado | `pytest -q` → 145 passed |
| CI | aprovado | 4 jobs verdes a cada push em `main` |

---

## Fases

Cada fase foi um commit. O CI gera evidência de gate sozinho por `push` em
`main`, então nenhuma fase dependeu de clique manual.

| # | Commit | Entrega | Evidência que a fechou |
| --- | --- | --- | --- |
| 1 | `9264bfc` | Fundação de tokens: escala de espaço, contêiner, leitura, cor de borda | Diff do CSS compilado: 240 regras de utilitário antes e depois, **0 adicionadas, 0 removidas** — provado sem mudança visual |
| 2 | `3be97e8` | Nove famílias de card editorial, todas com razão de aspecto em vez de altura fixa | `NewsCard` passa a ser fachada; implementação antiga preservada em `components/legacy/` |
| 3 | `5809059` | Barra utilitária com data real, busca responsiva, landmarks de navegação | Medido: `/busca` a 360px tinha `scrollWidth` 379 contra 360; depois 360 = 360 |
| 4 | `7b0bb20` | Hero por razão, bloco "Mais lidas" por engajamento real, newsletter | Ordenação por `engagement_score`, campo que a API pública já entrega |
| 5 | `a285a26` | Figura do artigo com recorte escolhido; dobra sem altura ociosa | Medido em produção e no build local, mesmo artigo: vão da dobra caiu de 210/163/84px para 170/123/64px |
| 6 | `149f7b3` | Um ponto de tabulação por matéria; alvo de toque maior; escala de coluna lateral | Medido: 98 pontos de tabulação e 25 pares redundantes → 74 pontos e 0 pares |
| 7 | `25d00aa` | Passagem responsiva em 10 rotas × 6 larguras | 60 combinações sem overflow horizontal, um `h1` por página, nenhuma manchete repetida |
| 8 | `bed9124` | QA visual por geometria, antes e depois | Razões de imagem na home `[1.47, 1.6, 1.91]` → `[1.6]`; primeira dobra 402px → 246px |
| 9 | `32fb2fa` | QA técnico: `meta description` e hierarquia de títulos | 12 de 12 combinações com meta completa, sem salto de título; LCP 232–1040 ms, CLS até 0,030 |

---

## Método de medição

Nenhuma decisão de layout foi tomada por leitura de código. O motor de captura
vive no projeto `portal-cerrado-playwright`, que é **observacional** e não faz
julgamento visual.

Técnica que tornou a medição possível: **a API de produção é pública** e devolve
625 matérias sem token. O build local foi apontado para ela via `API_URL`, o que
permitiu medir o redesign com conteúdo real sem semear nada no banco local — que
segue com **0 notícias**.

```
API_URL=https://portalcerrado.com.br npx next start
```

Ferramentas criadas, todas no projeto auditor e **ainda não versionadas**:

| Arquivo | Para que serve |
| --- | --- |
| `tools/measure.mjs` | Overflow horizontal e medição de caixa |
| `tools/responsive.mjs` | Varredura de rotas × larguras, relatando só anomalias |
| `tools/agro-crop.mjs`, `tools/agro-crop-sweep.mjs` | Deriva da caixa de imagem entre larguras |
| `tools/article-hero.mjs` | Dobra, recorte e tempo de leitura da página de artigo |
| `tools/static-pages.mjs` | Duplicata, alvo de toque, `h1`, razão de imagem |
| `tools/fase8.mjs` | Comparativo de geometria antes/depois + capturas |
| `tools/tecnico.mjs` | Peso, LCP, CLS, `meta`, imagens, hierarquia |

### Limites declarados da medição

- **A baseline de 807 PNGs não foi sobrescrita.** O motor do auditor grava em
  `screenshots/` com caminho fixo e sem override de ambiente; capturar o build
  local teria apagado a única cópia do "antes", já que `screenshots/` é ignorado
  pelo git.
- **Contraste de texto não foi medido.** Exige resolver fundo efetivo sobre
  imagem e gradiente; número errado nesse item é pior que ausência.
- **INP não foi medido.** Exige interação real, não carga de página.
- **O julgamento visual é humano.** A Fase 8 mediu geometria e guardou 60 capturas
  pareadas em `tools/fase8/{antes,depois}/`; a aprovação do resultado é de quem
  olha.

---

## Retificações registradas

Afirmações minhas que a medição contrariou, e que ficaram registradas porque
documento que só guarda acertos não serve para nada:

| Afirmação | Retificação |
| --- | --- |
| "59% e 68% de espaço vazio na dobra" | Falso. Eu somava o parágrafo de abertura e o padding ao vão, contando conteúdo como vazio. O número certo é o vão de 210/163/84px |
| "A imagem do agro fica deformada" | Falso. `next/image` com `fill` vem com `object-cover`: recorta, não deforma. O defeito real era o recorte depender do tamanho do texto vizinho |
| "Os alvos de 21px violam a WCAG 2.5.8" | Falso como falha. A norma tem exceção para alvo **inline**, que é o caso de link dentro de frase. Fica como melhoria de usabilidade |
| "A "correção" do agro" | Não corrigia nada: eu tinha reordenado duas classes, deixando o comportamento idêntico ao defeito descrito |
| "Cheguei a um overflow de 994px na home" | Falso alarme. O `next-server` era um processo velho e o CSS respondia **HTTP 500**; a página estava sem estilo nenhum |

---

## Defeitos que eu introduzi e corrigi

| Fase | Regressão | Como foi achada |
| --- | --- | --- |
| 4 | A home ficou **sem `h1`**: o card principal antigo era `h1` e a família editorial usa `h2` | Fase 7, ao passar a medir `h1` por página |
| 4 | **Manchete repetida** em 6 blocos: `Columnists` buscava sozinho e o agro não excluía os destaques | Fase 7 |
| 8 | **Landmark duplicado** na newsletter: eu envolvi um componente que já é `section` | Fase 8, pelo inventário de blocos |
| 8 | Bloco de colunistas caiu de 8 para 4 cartões ao excluir repetidas | Fase 8, comparando geometria com produção |
| 4–5 | **CSS morto**: nomes de utilitário citados em comentários continuavam emitindo classe, porque o Tailwind varre o texto bruto | Comparando o CSS compilado |

Erros de ferramental que produziram leitura errada, corrigidos antes de reportar:

- comparava endereço de link truncado em 40 caracteres e fabricava duplicata entre
  matérias diferentes de mesmo prefixo
- contava como ponto de tabulação elemento com índice negativo, que não recebe a
  tecla
- media "sobra" somando conteúdo e padding
- **mediu CLS 0,269 numa rodada isolada** em `/busca`; quatro rodadas seguidas
  deram 0,006 / 0,000 / 0,000 / 0,000

---

## Pendências que o redesign não fecha

1. **Aprovação visual** depende de olhar as capturas pareadas em
   `tools/fase8/{antes,depois}/`. Nenhum número substitui esse passo.
2. **`RankedStoryItem`** está definido em `StoryCards.tsx` e sem nenhum
   consumidor desde a Fase 2.
3. **As ferramentas do auditor seguem não versionadas.** Decisão de versionamento
   é de quem mantém os dois projetos.
4. **O gate 8 de `PLANO_ACAO.md` continua adiado** por decisão registrada em
   02/10/2026: deploy e rollback passam a valer após o redesign.
5. **Uma vulnerabilidade alta fora de produção** (`brace-expansion`, transitiva de
   `typescript-eslint`) segue pendente: resolver exige `overrides` no
   `package.json`, que não foi autorizado.

---

## Regras permanentes que este redesign deixou

1. **Nenhum nome de utilitário é escrito dentro de comentário.** O Tailwind varre
   o texto bruto do arquivo e emite CSS para a classe citada, ainda que ela não
   esteja em uso.
2. **Altura fixa em imagem é defeito.** Toda imagem editorial tem razão de
   aspecto, para que o recorte não dependa do tamanho do texto vizinho.
3. **Link de imagem dentro de card é redundante.** Leva índice de tabulação
   negativo e ocultação para leitor de tela; quem fica com o foco é o link do
   título, que tem nome.
4. **Medida de layout vira token.** Literal em pixels em três lugares diferentes
   foi o que fez o esqueleto de carregamento poder desalinhar da página.
5. **Ação em componente isolado precisa saber da página.** `Columnists` buscava
   sozinho e por isso repetia manchete; a exclusão é passada por propriedade.