module.exports = {
  roots: ['./'],
  testMatch: ['**/__tests__/**/*.spec.ts'],
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/dist/',
  ],
};
