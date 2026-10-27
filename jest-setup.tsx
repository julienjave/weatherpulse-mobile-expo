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

// Safe-area insets and frame, so components (and react-native-paper's Snackbar) render without a provider
jest.mock('react-native-safe-area-context', () =>
  require('react-native-safe-area-context/jest/mock').default
)

// In-memory AsyncStorage, used by useLocalStorage (favorites)
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
)

// The chart library schedules layout animations with React Native's Animated
// that can outlive the test environment. Replace it with a no-op render to keep
// unit tests focused on our component behavior.
jest.mock('react-native-gifted-charts', () => ({
  LineChart: function LineChartMock() {
    return null
  },
}))
