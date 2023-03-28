const merge = require('lodash/merge')
const nextJest = require('next/jest')
const awsuiPreset = require('@cloudscape-design/jest-preset/jest-preset')

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

// necessary to circumvent Jest exception handlers to test exception throwing
// this is due to the impossibility to run code before Jest starts, since Jest performs its
// override/patching of the `process` variable
// see https://johann.pardanaud.com/blog/how-to-assert-unhandled-rejection-and-uncaught-exception-with-jest/
// this is not the right place for setup code or custom configuration code
// do NOT add code here
process._original = (function (_original) {
  return function () {
    return _original
  }
})(process)

module.exports = mergePolarisPreset
