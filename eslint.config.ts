import tseslint from 'typescript-eslint';
import stylisticTs from '@stylistic/eslint-plugin-ts';
import pluginVue from 'eslint-plugin-vue';
import parserVue from 'vue-eslint-parser';

const tsRules: Record<string, any> = {
  'constructor-super': 'warn',
  'curly': 'warn',
  'eqeqeq': 'warn',
  'prefer-const': ['warn', { 'destructuring': 'all' }],
  'no-caller': 'warn',
  'no-case-declarations': 'warn',
  'no-debugger': 'warn',
  'no-duplicate-case': 'warn',
  'no-duplicate-imports': 'warn',
  'no-eval': 'warn',
  'no-async-promise-executor': 'warn',
  'no-new-wrappers': 'warn',
  'no-redeclare': 'off',
  'no-sparse-arrays': 'warn',
  'no-throw-literal': 'warn',
  'no-unsafe-finally': 'warn',
  'no-unused-labels': 'warn',
  'no-misleading-character-class': 'warn',
  'no-restricted-globals': ['warn', 'name', 'length', 'event'],
  'no-var': 'warn',
  '@stylistic/ts/comma-dangle': ['warn', 'always-multiline'],
  '@stylistic/ts/semi': 'warn',
  '@stylistic/ts/no-extra-semi': 'warn',
  '@stylistic/ts/member-delimiter-style': 'warn',
};

const typescript = tseslint.config({
  name: 'setup/typescript',
  languageOptions: {
    parser: tseslint.parser,
    sourceType: 'module',
  },
  plugins: {
    '@typescript-eslint': tseslint.plugin,
    '@stylistic/ts': stylisticTs,
  },
  files: ['**/*.ts'],
  rules: tsRules,
});

const vue = tseslint.config({
  name: 'setup/vue',
  languageOptions: {
    parser: parserVue,
    parserOptions: {
      extraFileExtensions: ['.vue'],
      parser: tseslint.parser,
      sourceType: 'module',
    },
  },
  plugins: {
    '@typescript-eslint': tseslint.plugin,
    '@stylistic/ts': stylisticTs,
    'vue': pluginVue,
  },
  processor: pluginVue.processors.vue,
  files: ['**/*.vue'],
  rules: {
    ...tsRules,
    ...pluginVue.configs['flat/essential'].map(e => e.rules).reduce((a, c) => ({ ...a, ...c }), {}),
  },
});

export default [...typescript, ...vue];
