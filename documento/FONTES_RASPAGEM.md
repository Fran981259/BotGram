# Fontes de raspagem — Portal Cerrado

O catálogo operacional é único: `config/portals_capital_ms.yml`. Esta página é
uma referência humana dele; não habilita fontes por si só.

## Cobertura editorial ativa

O Portal Cerrado coleta exclusivamente notícias de interesse de Campo Grande,
Dourados, Três Lagoas, Corumbá e Ponta Porã, com complemento estadual de fontes
públicas de MS. Catálogos globais e dos EUA foram removidos do repositório e não
participam do scanner.

| Praça | Fontes |
|---|---|
| Campo Grande | Midiamax; Correio do Estado; Campo Grande News; O Estado Online; A Crítica CG; JD1 Notícias |
| Dourados | Dourados News; O Progresso; Dourados Agora |
| Três Lagoas | Perfil News; RCN67; JP News |
| Corumbá | Correio de Corumbá; Diário Corumbaense |
| Ponta Porã | Repórter MS; Ponta Porã Informa |
| MS (complementar) | G1 MS; Agência de Notícias MS |

## Saúde e governança das fontes

Cada execução registra uma linha por fonte em `scraping_tasks`, com artigos
encontrados, inseridos, duplicados, erros, taxa de sucesso, taxa de duplicação,
bloqueio por `robots.txt` e imagens bloqueadas por hotlink (`403` ou `401` com
o referenciador do Portal). A coleta não é interrompida por uma falha transitória
de imagem.

Antes de manter ou ampliar uma fonte, avalie a janela recente desses registros:

- taxa de sucesso: execuções `success` ÷ execuções totais;
- duplicação: `duplicates` ÷ artigos encontrados;
- bloqueios de `robots.txt` e de imagem;
- relevância geográfica e qualidade editorial.

Uma fonte com bloqueio recorrente ou baixa qualidade deve ser removida do
catálogo, nunca contornada por raspagem agressiva. A política local também
descarta conteúdo fora das praças prioritárias antes da persistência.

## Operação de saneamento

Para retirar do feed itens publicados por fontes que já não pertencem ao
catálogo ativo, execute primeiro a auditoria e depois, se o resultado estiver
correto, aplique a quarentena reversível:

```bash
.venv/bin/python scripts/quarantine_misclassified_global_articles.py
.venv/bin/python scripts/quarantine_misclassified_global_articles.py --apply
```

O segundo comando move itens para `review` com visibilidade `private`; não
apaga matérias. Faça backup do banco antes de executá-lo em qualquer ambiente.
