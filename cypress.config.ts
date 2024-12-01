import { defineConfig } from 'cypress'
import { loadEnvConfig } from '@next/env'

const { combinedEnv } = loadEnvConfig(process.cwd())

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    viewportWidth: 1280,
    viewportHeight: 720,
    setupNodeEvents(on, config) {
      config.env = combinedEnv
      return config
    },
  },
  component: {
    devServer: {
      framework: 'next',
      bundler: 'webpack',
    },
  },
})
