import '@testing-library/jest-dom'

// Mock TextEncoder/TextDecoder for Solana
global.TextEncoder = require('util').TextEncoder
global.TextDecoder = require('util').TextDecoder

// Mock crypto for Solana
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: (arr) => require('crypto').randomBytes(arr.length),
    subtle: {},
  },
})
