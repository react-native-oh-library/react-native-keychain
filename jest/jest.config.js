/**
 * Copyright (c) 2026 Huawei Technologies Co., Ltd.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// The tests live in jest/__tests__ while the library source lives in
// ../src (relative to the package root = rootDir), outside any Node
// resolution path of the tests, so react-native / @babel/runtime must be
// mapped explicitly.
//
// IMPORTANT: coverage runs must be started with cwd = the package root
// (ohos/react-native-keychain), which is what `npm run test:coverage`
// does. babel-plugin-istanbul silently skips files outside the jest cwd,
// so running jest from this jest directory would report 0% coverage for
// the whole library.
module.exports = {
  rootDir: '..',
  testEnvironment: 'node',
  transform: {
    '^.+\\.(ts|tsx)$': '<rootDir>/jest/babel-transformer.js',
  },
  testMatch: ['<rootDir>/jest/__tests__/*-test.ts'],
  testPathIgnorePatterns: ['/node_modules/'],
  moduleNameMapper: {
    '^react-native$': '<rootDir>/node_modules/react-native',
    '^@babel/runtime/(.*)$': '<rootDir>/node_modules/@babel/runtime/$1',
  },
  setupFiles: ['<rootDir>/jest/jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!react-native|@react-native|react)',
  ],
  collectCoverageFrom: ['<rootDir>/src/**/*.ts', '!<rootDir>/src/types.ts'],
  coverageThreshold: {
    global: { branches: 60 },
  },
};
