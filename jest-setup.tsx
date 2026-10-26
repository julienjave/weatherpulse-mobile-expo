/// <reference types="jest" />
import { expect } from '@jest/globals'
import * as matchers from '@testing-library/react-native/matchers'

expect.extend(matchers)

// Enable React's `act()` warnings and async act support for this test renderer.
globalThis.IS_REACT_ACT_ENVIRONMENT = true

// react-native-paper's Snackbar (and several other components) read safe-area
// insets. Provide defaults so individual tests don't need a wrapper.
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
  useSafeAreaInsets: () => ({ top: 0, left: 0, right: 0, bottom: 0 }),
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}))

// The chart library schedules layout animations with React Native's Animated
// that can outlive the test environment. Replace it with a no-op render to keep
// unit tests focused on our component behavior.
jest.mock('react-native-gifted-charts', () => ({
  LineChart: function LineChartMock() {
    return null
  },
}))

// react-native-paper's SegmentedButtons uses Pressable internally. Under the
// test renderer that press sometimes doesn't bubble to the value-change handler,
// so swap it for a plain TouchableOpacity implementation in tests.
jest.mock('react-native-paper', () => {
  const React = require('react')
  const { View, TouchableOpacity, Text } = require('react-native')
  const actual = jest.requireActual('react-native-paper')

  return {
    ...actual,
    SegmentedButtons: function SegmentedButtonsMock({
      value,
      onValueChange,
      buttons,
      style,
    }: {
      value: string
      onValueChange: (value: string) => void
      buttons: Array<{ value: string; label: string; testID?: string }>
      style?: unknown
    }) {
      return (
        <View style={style}>
          {buttons.map((button) => (
            <TouchableOpacity
              key={button.value}
              testID={button.testID}
              onPress={() => onValueChange(button.value)}
            >
              <Text>{button.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )
    },
  }
})

// Make sure the reanimated manual mock in __mocks__ is picked up; the real
// module initialises native worklet code that cannot load under Jest.
jest.mock('react-native-reanimated')
jest.mock('react-native-worklets')

// Vite-style `import.meta.glob` is not available in Jest. Stub the icon loader
// so components that import it can render under test.
jest.mock('./utils/weatherIcons', () => ({
  getIconUrl: (file: string) => `mock-icon-url://${file}`,
}))
