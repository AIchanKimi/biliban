import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['test/**/*.test.js'],
    environment: 'node',
    environmentOptions: {
      jsdom: { url: 'https://www.bilibili.com/video/test' },
    },
    restoreMocks: true,
    unstubGlobals: true,
  },
})
