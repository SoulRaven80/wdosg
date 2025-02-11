import globals from 'globals';
import js from '@eslint/js';
import stylisticJs from '@stylistic/eslint-plugin-js';

/** @type {import('eslint').Linter.Config[]} */
export default [
    {
        ignores: [
            'public/js-dos/',
            'public/js/bootstrap-fileinput/',
            'public/js/bootstrap.bundle.min.js',
            'public/js/color-modes.js',
            'public/js/jquery.min.js',
            'public/js/selectize.min.js',
            'public/js/w3.js',
            'public/wlibzip.js'
        ]
    },
    js.configs.recommended,
    {
        files: ['public/js/**/*.js'],
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.jquery,
                appendAlert: 'readonly',
                appendInfo: 'readonly',
                fileTypes: 'readonly',
                bootstrap: 'readonly',
                initHeader: 'readonly'
            }
        },
        plugins: {
            '@stylistic/js': stylisticJs
        },
        rules: {
            '@stylistic/js/indent': ['error', 4],
            '@stylistic/js/semi': ['error', 'always']
        }
    },
    {
        ignores: ['public/'],
        languageOptions: {
            globals: {
                ...globals.node
            }
        },
        plugins: {
            '@stylistic/js': stylisticJs
        },
        rules: {
            '@stylistic/js/indent': ['error', 4],
            '@stylistic/js/semi': ['error', 'always']
        }
    }
];