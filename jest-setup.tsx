/// <reference types="jest" />
import { expect } from '@jest/globals'
import * as matchers from '@testing-library/react-native/matchers'

expect.extend(matchers)

// Enable React's `act()` warnings and async act support for this test renderer.
globalThis.IS_REACT_ACT_ENVIRONMENT = true

// NOTE: @testing-library/react-native v14 is async: `render`, `renderHook`, `act` and every
// `fireEvent.*` return Promises and must be awaited, or the event lands after the assertion.

// Reanimated 4: run animations on Jest's timers (paired with its resolver in jest.config.js)
require('react-native-reanimated').setUpTests()

// jest-expo mocks `react-native/asset-registry`, but in React Native 0.88 that is only a wrapper:
// `AssetRegistry` from 'react-native' (used by expo-asset, so expo-font and @expo/vector-icons)
// reads the private module directly and fails with 'Module "1" is missing from the asset
// registry'. Point the private module at jest-expo's mock too. (By file path: it isn't exported.)
jest.mock('./node_modules/react-native/src/private/assets/AssetRegistry', () => ({
  AssetRegistry: require('react-native/asset-registry'),
}))

// Safe-area insets and frame, so components (and react-native-paper's Snackbar) render without a provider
jest.mock('react-native-safe-area-context', () =>
  require('react-native-safe-area-context/jest/mock').default
)

// In-memory AsyncStorage, used by useLocalStorage (favorites)
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
)

// The chart library schedules layout animations with React Native's Animated
// that can outlive the test environment. Replace it with a placeholder View; it's a
// jest.fn, so tests can read the props it was given via `jest.mocked(LineChart).mock.calls`.
jest.mock('react-native-gifted-charts', () => {
  const { View } = require('react-native')
  return {
    LineChart: jest.fn(() => <View testID="line-chart" />),
  }
})
