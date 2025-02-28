module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    "\\.(css|less)$": "jest-transform-stub",
    "\\.(jpg|jpeg|png|gif|webp)$": "<rootDir>/__mocks__/fileMock.js"
  },
  testPathIgnorePatterns: ['/node_modules/'],
  transform: {
    "^.+\\.js$": "babel-jest"
  }
};