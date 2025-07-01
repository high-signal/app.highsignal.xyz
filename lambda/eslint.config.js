const globals = require("globals")
const tseslint = require("typescript-eslint")
const eslintConfigPrettier = require("eslint-config-prettier")

module.exports = tseslint.config(
    {
        // Global ignores
        ignores: [
            "dist/",
            "node_modules/",
            "bundle/",
            "scripts/discourse-forum-OLD/",
            ".husky/",
            "eslint.config.js",
            ".prettierrc.js",
        ],
    },
    {
        // All TypeScript files
        files: ["**/*.ts"],
        extends: [
            ...tseslint.configs.recommended, // Base rules for TypeScript
        ],
        languageOptions: {
            parserOptions: {
                project: true, // Enable type-aware linting
                tsconfigRootDir: __dirname,
            },
            globals: {
                ...globals.node, // Add Node.js global variables
            },
        },
        rules: {
            // Custom rule overrides
            "@typescript-eslint/interface-name-prefix": "off",
            "@typescript-eslint/explicit-function-return-type": "off",
            "@typescript-eslint/explicit-module-boundary-types": "off",
            "@typescript-eslint/no-explicit-any": "warn", // Warn on 'any' type
            "no-console": "warn", // Warn on 'console.log'
        },
    },
    eslintConfigPrettier, // Must be last to override formatting rules
)
