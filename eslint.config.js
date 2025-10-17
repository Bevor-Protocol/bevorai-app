const {
    defineConfig,
    globalIgnores,
} = require("eslint/config");

const tsParser = require("@typescript-eslint/parser");
const typescriptEslint = require("@typescript-eslint/eslint-plugin");
const prettier = require("eslint-plugin-prettier");
const nextEslintPluginNext = require("@next/eslint-plugin-next");
const js = require("@eslint/js");

const {
    FlatCompat,
} = require("@eslint/eslintrc");

const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

module.exports = defineConfig([{
    languageOptions: {
        parser: tsParser,
        sourceType: "module",

        parserOptions: {
            project: "./tsconfig.json",
        },
    },

    extends: compat.extends(
        "next/core-web-vitals",
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:prettier/recommended",
        "next",
    ),

    plugins: {
        "@typescript-eslint": typescriptEslint,
        prettier,
        "@next/next": nextEslintPluginNext,
    },

    rules: {
        "@typescript-eslint/no-explicit-any": "warn",
        quotes: ["error", "double"],
        "@typescript-eslint/explicit-function-return-type": ["error"],

        "no-console": ["warn", {
            allow: ["error"],
        }],

        "no-debugger": "warn",
        "no-underscore-dangle": "off",

        "prettier/prettier": ["error", {
            endOfLine: "auto",
        }],
    },

    settings: {
        "import/resolver": {
            node: {
                extensions: [".js", ".ts", ".tsx"],
            },
        },
    },
}, {
    files: ["components/ui/**/*.tsx"],

    rules: {
        "@typescript-eslint/explicit-function-return-type": "off",
    },
}, globalIgnores([
    "**/dist",
    "**/*.d.ts",
    "**/node_modules",
    "**/.eslintrc.js",
    "**/next.config.js",
    "**/postcss.config.mjs",
    "**/tailwind.config.js",
])]);
