import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Generated service worker bundle (Serwist output):
    "public/sw.js",
    "public/sw.js.map",
    "public/workbox-*.js",
  ]),
  {
    // sw.ts runs in the ServiceWorkerGlobalScope, which needs the "webworker"
    // lib; that conflicts with the "dom" lib the rest of the app uses.
    files: ["src/app/sw.ts"],
    rules: {
      "@typescript-eslint/ban-ts-comment": "off",
    },
  },
]);

export default eslintConfig;
