import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  // eslint-plugin-react's version auto-detect crashes on ESLint 10; pin it instead.
  { settings: { react: { version: "19" } } },
  // CommonJS config files (next-sitemap) must use require().
  { files: ["**/*.js"], rules: { "@typescript-eslint/no-require-imports": "off" } },
  globalIgnores([".next/**", ".worktrees/**", "out/**", "build/**", "next-env.d.ts", "public/**"]),
]);
