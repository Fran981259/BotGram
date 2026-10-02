import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/preserve-manual-memoization": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Ambientes Python que aparecem dentro de frontend/. São 552 MB de pacotes
    // de terceiros (scikit-learn, matplotlib) cujo JavaScript interno gerava 5
    // erros de lint que não têm relação com o código deste projeto.
    // Ignorar o diretório é a correção mínima: o código do projeto continua
    // integralmente verificado, e o venv não é destruído.
    ".venv/**",
    "venv/**",
  ]),
]);

export default eslintConfig;
