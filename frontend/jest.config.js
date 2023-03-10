const merge = require('lodash/merge');
const nextJest = require('next/jest')
const awsuiPreset = require('@cloudscape-design/jest-preset/jest-preset');

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  // Add more setup options before each test is run
  // setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  // if using TypeScript with a baseUrl set to the root directory then you need the below for alias' to work
  moduleDirectories: ['node_modules', '<rootDir>/'],
  testEnvironment: 'jest-environment-jsdom',
}

async function mergePolarisPreset() {
  const nextConfig = await createJestConfig(customJestConfig)()
  const mergedConfig = merge({}, nextConfig, awsuiPreset)

  return mergedConfig
}

module.exports = mergePolarisPreset