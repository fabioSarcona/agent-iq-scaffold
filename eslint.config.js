import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      "@typescript-eslint/no-unused-vars": "off",
      "no-restricted-imports": [
        "error",
        {
          "paths": [
            {
              "name": "@/modules/moneylost/moneylost",
              "message": "Server-only MoneyLost math. Use requestMoneyLost() from the client."
            },
            {
              "name": "../../../modules/moneylost/moneylost",
              "message": "Server-only MoneyLost math. Use requestMoneyLost() from the client."
            },
            {
              "name": "../../modules/moneylost/moneylost",
              "message": "Server-only MoneyLost math. Use requestMoneyLost() from the client."
            },
            {
              "name": "../modules/moneylost/moneylost",
              "message": "Server-only MoneyLost math. Use requestMoneyLost() from the client."
            },
          ],
          "patterns": [
            {
              "group": ["../../modules/**", "../../../modules/**"],
              "message": "Use @modules alias instead of relative imports to modules/ directory."
            },
            {
              "group": ["**/index.ts", "**/index.tsx"],
              "message": "Do not import from index files. Import directly from the source file."
            },
            {
              "group": ["@modules"],
              "message": "Avoid barrel imports. Import directly from specific files for better tree-shaking and performance."
            }
          ]
        }
      ]
    },
  }
);
