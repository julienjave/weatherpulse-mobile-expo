import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { PaperProvider } from 'react-native-paper'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { APP_BACKGROUND_COLOR } from '@/utils/appColors'

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <PaperProvider>
        {/* Light icons: the app always sits on a dark background */}
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: APP_BACKGROUND_COLOR },
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="+not-found" />
        </Stack>
      </PaperProvider>
    </SafeAreaProvider>
  )
}
