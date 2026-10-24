import antfu from '@antfu/eslint-config'

export default antfu({
  type: 'app',
  typescript: false,
  vue: false,
  // Markdown 中的说明性代码片段不是待执行的产品源码。
  markdown: false,
  rules: {
    'jsdoc/require-returns-description': 'off',
    'test/consistent-test-it': [
      'error',
      { fn: 'test' },
    ],
  },
  ignores: ['dist/**', 'coverage/**', 'test-results/**'],
}, {
  files: ['src/**/*.js', 'test/**/*.js'],
  languageOptions: {
    globals: { chrome: 'readonly' },
  },
})
