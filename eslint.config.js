const js = require("@eslint/js");
const tsParser = require("@typescript-eslint/parser");
const typescriptEslint = require("@typescript-eslint/eslint-plugin");
const prettier = require("eslint-plugin-prettier");
const nextEslintPluginNext = require("@next/eslint-plugin-next");

const { FlatCompat } = require("@eslint/eslintrc");

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

module.exports = [
  ...compat.extends("next/core-web-vitals"),
  ...compat.extends("eslint:recommended"),
  ...compat.extends("plugin:@typescript-eslint/recommended"),
  ...compat.extends("plugin:prettier/recommended"),
  ...compat.extends("next"),
  {
    languageOptions: {
      parser: tsParser,
      sourceType: "module",
      parserOptions: {
        project: "./tsconfig.json",
      },
    },
    plugins: {
      "@typescript-eslint": typescriptEslint,
      prettier,
      "@next/next": nextEslintPluginNext,
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      quotes: ["error", "double"],
      "@typescript-eslint/explicit-function-return-type": ["error"],
      "no-console": [
        "warn",
        {
          allow: ["error"],
        },
      ],
      "no-debugger": "warn",
      "no-underscore-dangle": "off",
      "prettier/prettier": [
        "error",
        {
          endOfLine: "auto",
        },
      ],
    },
  },
  {
    files: ["components/ui/**/*.tsx"],
    rules: {
      "@typescript-eslint/explicit-function-return-type": "off",
    },
  },
  {
    ignores: [
      "**/dist",
      "**/*.d.ts",
      "**/node_modules",
      "**/.next",
      "**/.eslintrc.js",
      "**/eslint.config.js",
      "**/next.config.js",
      "**/postcss.config.mjs",
      "**/tailwind.config.js",
    ],
  },
];
