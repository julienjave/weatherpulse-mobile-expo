module.exports = {
  // Mobile app: run component tests in the iOS React Native environment so we
  // don't need to pull in react-native-web and its peer dependency tree.
  preset: 'jest-expo/ios',
  // Reanimated 4 (and react-native-worklets) load their JS implementations under Jest
  resolver: 'react-native-reanimated/jest/resolver',
  setupFiles: ['<rootDir>/jest-act-env.ts'],
  setupFilesAfterEnv: ['<rootDir>/jest-setup.tsx'],
  transformIgnorePatterns: [
    'node_modules/(?!((react-native.*|@react-native.*|expo.*|@expo.*)/))',
  ],
  globals: {
    IS_REACT_ACT_ENVIRONMENT: true,
  },
}
