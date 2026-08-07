import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

// Plugins
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import reactPlugin from "eslint-plugin-react";
import hooksPlugin from "eslint-plugin-react-hooks";
import importPlugin from "eslint-plugin-import";
import unusedImports from "eslint-plugin-unused-imports";
import jsxA11y from "eslint-plugin-jsx-a11y";

export default defineConfig([
  ...nextVitals,

  {
    files: ["**/*.{ts,tsx,js,jsx}"],

    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },

    plugins: {
      "@typescript-eslint": tsPlugin,
      react: reactPlugin,
      "react-hooks": hooksPlugin,
      import: importPlugin,
      "unused-imports": unusedImports,
    },

    rules: {
      // Unused imports
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": "warn",
      "unused-imports/no-unused-imports": "error",
      "@typescript-eslint/no-floating-promises": "off",
      "@typescript-eslint/no-shadow": "off",

      // Accessibility (CLAUDE.md 6.5). eslint-config-next registers the plugin
      // but enables only a subset; the recommended set is what the rule asks for.
      ...jsxA11y.configs.recommended.rules,

      // Pre-existing debt (44 violations at the time these rules were first
      // enabled): clickable divs, autofocus in dialogs, uncaptioned media.
      // Warn so the build stays green while the backlog is burned down; every
      // other a11y rule above is an error and fails the build.
      "jsx-a11y/no-static-element-interactions": "warn",
      "jsx-a11y/click-events-have-key-events": "warn",
      "jsx-a11y/no-noninteractive-element-interactions": "warn",
      "jsx-a11y/no-autofocus": "warn",
      "jsx-a11y/media-has-caption": "warn",
      "jsx-a11y/no-noninteractive-tabindex": "warn",

      // RTL (CLAUDE.md 6.5): directional spacing must be logical, so the
      // Arabic layout mirrors. ms/me/ps/pe, not ml/mr/pl/pr.
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "JSXAttribute[name.name='className'] Literal[value=/(^|[\\s\"'`])-?(ml|mr|pl|pr)-/]",
          message:
            "Use logical spacing utilities (ms-/me-/ps-/pe-) so the Arabic layout mirrors.",
        },
        {
          selector:
            "JSXAttribute[name.name='className'] TemplateElement[value.raw=/(^|[\\s\"'`])-?(ml|mr|pl|pr)-/]",
          message:
            "Use logical spacing utilities (ms-/me-/ps-/pe-) so the Arabic layout mirrors.",
        },
      ],
    },
  },

  {
    files: ["**/*.{js,cjs,mjs}"],
    rules: {
      "@typescript-eslint/no-shadow": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-floating-promises": "off",
    },
  },

  globalIgnores([
    "_to_delete/**",
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);


