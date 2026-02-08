import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";
import boundaries from "eslint-plugin-boundaries";

export default [
    {
        files: ["src/**/*.ts"],
        languageOptions: {
            parser: tsparser,
            parserOptions: {
                ecmaVersion: "latest",
                sourceType: "module",
            },
        },
        plugins: {
            "@typescript-eslint": tseslint,
            boundaries,
        },
        settings: {
            "import/resolver": {
                typescript: {
                    alwaysTryTypes: true,
                },
            },
            "boundaries/elements": [
                {
                    type: "shared",
                    pattern: "src/shared",
                    mode: "folder",
                },
                {
                    type: "hooks",
                    pattern: "src/hooks",
                    mode: "folder",
                },
                {
                    type: "types",
                    pattern: "src/types",
                    mode: "folder",
                },
                {
                    type: "feature",
                    pattern: "src/*",
                    mode: "folder",
                    capture: ["elementName"],
                },
            ],
        },
        rules: {
            // ─── TypeScript Rules ────────────────────────────────────────────
            "@typescript-eslint/no-explicit-any": "warn",
            "@typescript-eslint/no-unused-vars": [
                "warn",
                { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
            ],
            "no-console": ["warn", { allow: ["warn", "error", "info", "log"] }],
            "prefer-const": "warn",
            "no-var": "error",

            // ─── Boundary Rules ──────────────────────────────────────────────
            ...boundaries.configs.recommended.rules,

            "boundaries/entry-point": [2, {
                default: "allow",
                rules: [
                    {
                        target: ["feature"],
                        disallow: "*",
                    },
                    {
                        target: ["feature"],
                        allow: "index.{ts,js}",
                    },
                ],
            }],

            "boundaries/element-types": [2, {
                default: "allow",
                rules: [
                    {
                        from: ["shared"],
                        disallow: ["feature", "hooks"],
                        message: "src/shared/ must not import from features or hooks.",
                    },
                ],
            }],
        },
    },
    {
        ignores: ["dist/**", "node_modules/**", "*.config.*"],
    },
];
