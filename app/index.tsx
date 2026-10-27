import { useCallback, useEffect } from 'react'
import { View, Image, ImageBackground, StyleSheet, ScrollView } from 'react-native'
import { Text } from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated'
import { SearchBar } from '@/components/SearchBar'
import { FavoritesBar } from '@/components/FavoritesBar'
import { WeatherPanel } from '@/components/WeatherPanel'
import { WeatherPanelSkeleton } from '@/components/WeatherPanelSkeleton'
import { NotificationToast } from '@/components/NotificationToast'
import { useWeather } from '@/hooks/useWeather'
import { type Coordinates, useGeolocation } from '@/hooks/useGeolocation'
import { getReverseGeocode } from '@/services/weatherApi'
import { useFavorites } from '@/hooks/useFavorites'
import { useNotification } from '@/hooks/useNotification'
import { APP_BACKGROUND_COLOR } from '@/utils/appColors'
import { FONTS } from '@/utils/appFonts'

const logo = require('@/assets/weather-pulse-logo.png')
const background = require('@/assets/weather-pulse-bg.jpg')

export default function HomeScreen() {
  // 1. --- STATE VARIABLES ---
  const {
    weatherData,
    forecastData,
    aqiData,
    selectedCity,
    units,
    dataUnits,
    isLoading: isWeatherLoading,
    error: weatherError,
    handleSelectLocation,
    handleToggleUnits,
    handleClearLocation
  } = useWeather()

  const {
    isLoading: isGeoloading,
    error: geoError,
    getLocation,
    handleClearGeolocation
  } = useGeolocation()

  const {
    favorites,
    isLoaded: isFavoritesLoaded,
    isFull: isFavoritesFull,
    isFavorite,
    toggleFavorite,
    removeFavorite
  } = useFavorites()

  const { notification, notify, dismiss: dismissNotification } = useNotification()

  // 2. --- ERROR TOASTS ---
  useEffect(() => {
    if (weatherError) notify(weatherError, 'error')
  }, [weatherError, notify])

  useEffect(() => {
    if (geoError) notify(geoError, 'warning')
  }, [geoError, notify])

  // 3. --- HANDLERS ---
  const handleUseMyLocation = useCallback(async () => {
    try {
      const coords: Coordinates | null = await getLocation()
      if (!coords) return

      const timeoutController = new AbortController()
      const timeoutId = setTimeout(() => timeoutController.abort(), 8000)

      try {
        const { data, error } = await getReverseGeocode(coords.lat, coords.lon, 1, timeoutController.signal)

        if (error || !data || data.length === 0) {
          handleSelectLocation({
            name: `${coords.lat.toFixed(2)}°, ${coords.lon.toFixed(2)}°`,
            lat: coords.lat,
            lon: coords.lon,
            country: ''
          })
          return
        }

        handleSelectLocation(data[0])
      } finally {
        clearTimeout(timeoutId)
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        console.warn('Geolocation reverse lookup timed out.')
      } else {
        console.error('Failed to resolve location:', err)
      }
    }
  }, [getLocation, handleSelectLocation])

  const handleClearSearch = useCallback(() => {
    handleClearLocation()
    handleClearGeolocation()
    dismissNotification()
  }, [handleClearLocation, handleClearGeolocation, dismissNotification])

  const handleToggleFavorite = useCallback(() => {
    if (selectedCity) toggleFavorite(selectedCity)
  }, [selectedCity, toggleFavorite])

  return (
    // `cover` fills any screen aspect ratio, cropping the edges (like the web app's background)
    <ImageBackground source={background} resizeMode="cover" style={styles.background}>
      {/* Bottom edge is left to the ScrollView's padding so content can scroll behind the home indicator */}
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
        {/* "handled": tapping a search result works on the first tap while the keyboard is open */}
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={styles.header}>
            <Image
              source={logo}
              style={styles.logo}
              resizeMode="contain"
            />
            <View style={styles.titleContainer}>
              <Text variant="headlineLarge" accessibilityRole="header" style={styles.title}>
                WeatherPulse
              </Text>
              <Text variant="bodyLarge" style={styles.subtitle}>
                Real-time weather forecast & air quality tracking
              </Text>
            </View>
          </View>

          {/* SearchBar Component */}
          <SearchBar
            onSelectLocation={handleSelectLocation}
            onUseMyLocation={handleUseMyLocation}
            onClear={handleClearSearch}
            isGeoloading={isGeoloading}
            onError={notify}
          />

          {/* Favorites Bar Component */}
          <FavoritesBar
            favorites={favorites}
            selectedCity={selectedCity}
            onSelect={handleSelectLocation}
            onDelete={removeFavorite}
            isLoading={!isFavoritesLoaded}
          />

          {/* Weather Panel (skeleton while loading) */}
          <Animated.View layout={LinearTransition}>
            {selectedCity && !weatherData && isWeatherLoading && (
              <Animated.View entering={FadeIn} exiting={FadeOut}>
                <WeatherPanelSkeleton />
              </Animated.View>
            )}

            {selectedCity && weatherData && (
              <WeatherPanel
                key={`${selectedCity.lat},${selectedCity.lon}`}
                weatherData={weatherData}
                forecastData={forecastData}
                aqiData={aqiData}
                selectedCity={selectedCity}
                units={units}
                dataUnits={dataUnits}
                isFavorite={isFavorite(selectedCity)}
                isFavoritesFull={isFavoritesFull}
                onToggleFavorite={handleToggleFavorite}
                onToggleUnit={handleToggleUnits}
              />
            )}
          </Animated.View>
        </ScrollView>

        {/* Error Toasts: outside the ScrollView so they stay pinned to the bottom of the screen */}
        <NotificationToast notification={notification} onClose={dismissNotification} />
      </SafeAreaView>
    </ImageBackground>
  )
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: APP_BACKGROUND_COLOR, // Shown while the image loads
  },
  safeArea: {
    flex: 1,
  },
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  logo: {
    width: 220,
    height: 90,
    maxWidth: '100%',
  },
  titleContainer: {
    alignItems: 'center',
  },
  // Sizes match the web app on phones (2.25rem title, 1rem subtitle)
  title: {
    fontFamily: FONTS.bold,
    fontSize: 36,
    lineHeight: 44,
    color: '#fff',
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: FONTS.regular,
    color: '#fff',
    textAlign: 'center',
  },
})