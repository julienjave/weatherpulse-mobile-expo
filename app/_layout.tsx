import { useEffect } from 'react'
import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useFonts } from 'expo-font'
// Per-weight imports: the package root requires all 9 weights, which would all end up in the bundle
import { Outfit_400Regular } from '@expo-google-fonts/outfit/400Regular'
import { Outfit_700Bold } from '@expo-google-fonts/outfit/700Bold'
import { MD3LightTheme, PaperProvider } from 'react-native-paper'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { APP_BACKGROUND_COLOR } from '@/utils/appColors'

// Keep the splash screen up until the fonts are ready, so the title never flashes in the system font
SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  // Keys must match FONTS in utils/appFonts.ts
  const [fontsLoaded, fontError] = useFonts({ Outfit_400Regular, Outfit_700Bold })
  const isReady = fontsLoaded || fontError !== null

  useEffect(() => {
    // On a font error, carry on with the system font rather than blocking the app
    if (isReady) SplashScreen.hideAsync()
  }, [isReady])

  if (!isReady) return null

  return (
    <SafeAreaProvider>
      {/* Always light: without a theme, Paper follows the phone's dark mode, and its dark
          theme's pale text is unreadable on the app's white cards */}
      <PaperProvider theme={MD3LightTheme}>
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
