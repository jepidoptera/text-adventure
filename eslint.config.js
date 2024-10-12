import { ESLint } from 'eslint';
import('@typescript-eslint/recommended')
import js from "@eslint/js"
import plugin from "@eslint/plugin"

export default [
    js.configs.recommended,
    plugin,
    {
        files: ['**/*.ts', '**/*.js'],  // Ensure TypeScript files are targeted
        languageOptions: {
            parser: '@typescript-eslint/parser', // Language parser
        },
        plugins: {
            '@typescript-eslint': import('@typescript-eslint/eslint-plugin'),
        },
        rules: {
            '@typescript-eslint/await-thenable': 'error',
            '@typescript-eslint/no-floating-promises': [
                'error',
                {
                    'ignoreVoid': false,
                },
            ],
            '@typescript-eslint/no-misused-promises': [
                'error',
                {
                    'checksVoidReturn': true, // Ensures void returns are not missed
                },
            ],
            '@typescript-eslint/explicit-function-return-type': [
                'warn',
                {
                    'allowExpressions': true,
                },
            ],
        },
    },
];
