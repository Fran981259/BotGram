# Portal Cerrado — frontend

Frontend público e painel editorial do Portal Cerrado, executado com Next.js App Router.

## Desenvolvimento

Na raiz de `frontend/`, instale as dependências e inicie o servidor:

```bash
npm ci
npm run dev
```

Abra `http://localhost:3000`. A API esperada é definida por `NEXT_PUBLIC_API_URL` e pode ser sobrescrita em `.env.local`.

## Validação

```bash
npm run lint
npx tsc --noEmit
npm run build
```

O build usa os valores de `NEXT_PUBLIC_API_URL` e `NEXT_PUBLIC_SITE_URL` disponíveis no ambiente. Não iniciar deploy ou publicação a partir deste diretório; siga `../documento/PLANO_ACAO.md`.

Rotas públicas, painel admin e contratos da API estão descritos no `portal-cerrado.md` da raiz.
