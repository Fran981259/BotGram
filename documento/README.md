# Portal Cerrado — documentação

Portal de noticias automatizado com backend FastAPI, fila Celery, banco PostgreSQL e frontend Next.js.

## Governança documental

| Papel | Documento | Regra de uso |
| --- | --- | --- |
| Plano vivo | `PLANO_ACAO.md` | Prioridades, critérios de pronto e próximos passos. |
| Fatos canônicos | `MEMORIA.md` | Arquitetura, separação teste/produção e restrições permanentes. |
| Operação | `OPERACAO.md` | Backup, rotação, rollback e promoção; não substitui checagem ao vivo. |
| Evidência datada | `EVIDENCIAS_VALIDACAO.md` | Resultado associado a data, ambiente e comando. |
| Especificação | `SPEC.md` | Limites e objetivo de produto, sem status operacional. |
| Histórico | `PLANO_REDESIGN.md`, `RELATORIO_REDESIGN.md` | Não descrevem automaticamente o checkout ou runtime atual. |
| Referência futura | `PLANO_ML.md`, `REFERENCIA_ML_NOTICIAS_CURTAS_PTB.md` | Não autorizam implementação, deploy ou promoção. |

Em caso de conflito, a precedência é: código e testes do commit atual;
instruções de `AGENTS.md`; `PLANO_ACAO.md`; `MEMORIA.md`; `OPERACAO.md`; e,
por fim, evidências e snapshots datados.

## Estado de referência local — 04/10/2026

- A higienização e o refinamento visual ainda estão sem commit; o checkout não
  deve ser descrito como limpo até existir um candidato identificado por SHA.
- Ruff, lint, TypeScript, build Next e `git diff --check` passaram nesta árvore.
- A suíte Python passou com 149 testes; há um aviso transitivo de depreciação do
  `TestClient`/Starlette.
- O ambiente de teste tem evidência histórica de uma stack Swarm `cerrado_test`
  saudável. Seu estado presente deve ser consultado no host antes de qualquer ação.

## Stack
- FastAPI
- Celery + Redis
- PostgreSQL
- Next.js + Tailwind
- Scraping, classificacao, reescrita e publicacao por pipeline

## Fonte de configuração

- `config/scheduler.yaml` controla a meta mínima diária e a cadência do pipeline Celery.
- `config/orchestrator.yaml` é referência de produto; não altera o runtime.

## Regra
- Este repositorio deve tratar os documentos em `documento/` como fonte ativa.
