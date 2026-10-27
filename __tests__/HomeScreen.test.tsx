import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Location from 'expo-location'
import { render, screen, waitFor, within, fireEvent } from '@testing-library/react-native'
import { MD3LightTheme, PaperProvider } from 'react-native-paper'
import HomeScreen from '../app/index'
import * as weatherApi from '../services/weatherApi'
import { FAVORITES_STORAGE_KEY } from '../hooks/useFavorites'
import type {
  AirQualityResponse,
  CurrentWeatherResponse,
  ForecastResponse,
  GeocodingLocation
} from '../types/weather'

type CurrentWeatherResult = Awaited<ReturnType<typeof weatherApi.fetchCurrentWeatherByCoords>>

// Network and device location are mocked; hooks (useWeather, useGeolocation, useCitySearch,
// useFavorites, useNotification) are real
jest.mock('../services/weatherApi', () => ({
  searchCityByName: jest.fn(),
  getReverseGeocode: jest.fn(),
  fetchCurrentWeatherByCoords: jest.fn(),
  fetch5DayForecastByCoords: jest.fn(),
  fetchAirQualityByCoords: jest.fn(),
}))

jest.mock('expo-location', () => ({
  PermissionStatus: { GRANTED: 'granted', DENIED: 'denied' },
  Accuracy: { Balanced: 3 },
  requestForegroundPermissionsAsync: jest.fn(),
  hasServicesEnabledAsync: jest.fn(),
  getLastKnownPositionAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
}))

// --- FIXTURES ---------------------------------------------------------------------------

const sydney: GeocodingLocation = { name: 'Sydney', lat: -33.8688, lon: 151.2093, country: 'AU', state: 'New South Wales' }

const makeCurrentWeather = (temp: number, feelsLike: number): CurrentWeatherResponse => ({
  coord: { lat: sydney.lat, lon: sydney.lon },
  weather: [{ id: 800, main: 'Clear', description: 'clear sky', icon: '01d' }],
  base: 'stations',
  main: { temp, feels_like: feelsLike, temp_min: temp, temp_max: temp, pressure: 1015, humidity: 55 },
  visibility: 10000,
  wind: { speed: 4.1, deg: 90 },
  clouds: { all: 0 },
  dt: 1_790_000_000,
  sys: { country: 'AU', sunrise: 0, sunset: 0 },
  timezone: 36000,
  id: 2147714,
  name: 'Sydney',
  cod: 200,
})

const FORECAST: ForecastResponse = {
  cod: '200',
  message: 0,
  cnt: 2,
  list: [0, 1].map((i) => ({
    dt: 1_790_000_000 + i * 3 * 3600,
    main: { temp: 20, feels_like: 19, temp_min: 18, temp_max: 23, pressure: 1015, humidity: 55, temp_kf: 0 },
    weather: [{ id: 800, main: 'Clear', description: 'clear sky', icon: '01d' }],
    clouds: { all: 0 },
    wind: { speed: 4, deg: 90 },
    visibility: 10000,
    pop: 0,
    sys: { pod: 'd' },
    dt_txt: '',
  })),
  city: {
    id: 2147714, name: 'Sydney', coord: { lat: sydney.lat, lon: sydney.lon }, country: 'AU',
    population: 0, timezone: 36000, sunrise: 0, sunset: 0,
  },
}

const AIR_QUALITY: AirQualityResponse = {
  coord: { lat: sydney.lat, lon: sydney.lon },
  list: [{
    dt: 1_790_000_000,
    main: { aqi: 1 },
    components: { co: 0, no: 0, no2: 0, o3: 0, so2: 0, pm2_5: 6, pm10: 0, nh3: 0 }, // PM2.5 6 → US AQI 25 (Good)
  }],
}

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((r) => { resolve = r })
  return { promise, resolve }
}

// --- HELPERS ----------------------------------------------------------------------------

const mockLocation = jest.mocked(Location)

const mockPosition = (latitude: number, longitude: number) => {
  mockLocation.getLastKnownPositionAsync.mockResolvedValue({ coords: { latitude, longitude } } as Location.LocationObject)
}

const denyLocationPermission = () => {
  mockLocation.requestForegroundPermissionsAsync.mockResolvedValue(
    { status: 'denied' } as Location.LocationPermissionResponse
  )
}

// Same theme as the app's root layout
const renderHome = () =>
  render(
    <PaperProvider theme={MD3LightTheme}>
      <HomeScreen />
    </PaperProvider>
  )

const favoritesBar = () => screen.getByLabelText('Favorite cities')
const pressUseMyLocation = () => fireEvent.press(screen.getByRole('button', { name: /use my location/i }))
// A native switch reports value changes, not presses
const toggleUnits = () => fireEvent(screen.getByRole('switch'), 'valueChange', false)

// Resolves the device location to Sydney and waits for the weather panel to render
const loadSydney = async () => {
  mockPosition(sydney.lat, sydney.lon)
  jest.mocked(weatherApi.getReverseGeocode).mockResolvedValueOnce({ data: [sydney], error: null })

  await pressUseMyLocation()
  expect(await screen.findByText('Sydney, AU')).toBeOnTheScreen()
}

// --- TESTS ------------------------------------------------------------------------------

describe('HomeScreen', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    await AsyncStorage.clear()

    mockLocation.requestForegroundPermissionsAsync.mockResolvedValue(
      { status: 'granted' } as Location.LocationPermissionResponse
    )
    mockLocation.hasServicesEnabledAsync.mockResolvedValue(true)
    mockLocation.getLastKnownPositionAsync.mockResolvedValue(null)

    jest.mocked(weatherApi.fetchCurrentWeatherByCoords).mockResolvedValue({ data: makeCurrentWeather(21.6, 20.4), error: null })
    jest.mocked(weatherApi.fetch5DayForecastByCoords).mockResolvedValue({ data: FORECAST, error: null })
    jest.mocked(weatherApi.fetchAirQualityByCoords).mockResolvedValue({ data: AIR_QUALITY, error: null })
  })

  it('renders the header and search bar with no location selected', async () => {
    await renderHome()

    expect(screen.getByRole('header', { name: 'WeatherPulse' })).toBeOnTheScreen()
    expect(screen.getByLabelText('Search city')).toBeOnTheScreen()
    expect(screen.queryByRole('button', { name: /add to favorites/i })).not.toBeOnTheScreen()
    // Shown once the (empty) saved favorites have loaded
    await waitFor(() => expect(favoritesBar()).toHaveTextContent('No favorites yet'))
  })

  describe('use my location', () => {
    it('reverse geocodes the position, then shows the weather panel for that city', async () => {
      await renderHome()

      await loadSydney()

      expect(screen.getByText('22°C')).toBeOnTheScreen()
      expect(screen.getByText('20°C')).toBeOnTheScreen() // feels like
      expect(screen.getByText('clear sky')).toBeOnTheScreen()
      expect(screen.getByText('55%')).toBeOnTheScreen() // humidity
      expect(screen.getByText('4.1m/s')).toBeOnTheScreen() // wind
      expect(screen.getByText('25 - Good')).toBeOnTheScreen() // AQI

      expect(weatherApi.getReverseGeocode).toHaveBeenCalledWith(sydney.lat, sydney.lon, 1, expect.any(AbortSignal))
      expect(weatherApi.fetchCurrentWeatherByCoords).toHaveBeenCalledWith(
        sydney.lat, sydney.lon, 'metric', expect.any(AbortSignal)
      )
    })

    it('falls back to a coordinate label when reverse geocoding returns nothing', async () => {
      mockPosition(48.85661, 2.35222)
      jest.mocked(weatherApi.getReverseGeocode).mockResolvedValueOnce({ data: [], error: null })

      await renderHome()
      await pressUseMyLocation()

      expect(await screen.findByText('48.86°, 2.35°')).toBeOnTheScreen()
      expect(weatherApi.fetchCurrentWeatherByCoords).toHaveBeenCalledWith(
        48.85661, 2.35222, 'metric', expect.any(AbortSignal)
      )
    })

    it('falls back to a coordinate label when reverse geocoding returns an error', async () => {
      mockPosition(10, 20)
      jest.mocked(weatherApi.getReverseGeocode).mockResolvedValueOnce({
        data: null,
        error: { status: 500, message: 'Server error' },
      })

      await renderHome()
      await pressUseMyLocation()

      expect(await screen.findByText('10.00°, 20.00°')).toBeOnTheScreen()
    })

    it('shows the location error as a warning toast and does not fetch anything when permission is denied', async () => {
      denyLocationPermission()

      await renderHome()
      await pressUseMyLocation()

      expect(await screen.findByRole('alert')).toHaveTextContent(/Location access was denied/)
      expect(weatherApi.getReverseGeocode).not.toHaveBeenCalled()
      expect(weatherApi.fetchCurrentWeatherByCoords).not.toHaveBeenCalled()
    })
  })

  it('shows a loading skeleton until the weather data arrives', async () => {
    const pending = deferred<CurrentWeatherResult>()
    jest.mocked(weatherApi.fetchCurrentWeatherByCoords).mockReturnValueOnce(pending.promise)
    mockPosition(sydney.lat, sydney.lon)
    jest.mocked(weatherApi.getReverseGeocode).mockResolvedValueOnce({ data: [sydney], error: null })

    await renderHome()
    await pressUseMyLocation()

    expect(await screen.findByLabelText('Loading weather data')).toBeOnTheScreen()
    expect(screen.queryByText('Sydney, AU')).not.toBeOnTheScreen()

    pending.resolve({ data: makeCurrentWeather(21.6, 20.4), error: null })

    expect(await screen.findByText('Sydney, AU')).toBeOnTheScreen()
    await waitFor(() => expect(screen.queryByLabelText('Loading weather data')).not.toBeOnTheScreen())
  })

  it('shows the weather error as a toast when the primary weather API fails', async () => {
    mockPosition(sydney.lat, sydney.lon)
    jest.mocked(weatherApi.getReverseGeocode).mockResolvedValueOnce({ data: [sydney], error: null })
    jest.mocked(weatherApi.fetchCurrentWeatherByCoords).mockResolvedValueOnce({
      data: null,
      error: { status: 401, message: 'Invalid API key. Please check your OpenWeatherMap configuration.' },
    })

    await renderHome()
    await pressUseMyLocation()

    expect(await screen.findByRole('alert')).toHaveTextContent(/Invalid API key/)
    expect(screen.queryByText('Sydney, AU')).not.toBeOnTheScreen()
    await waitFor(() => expect(screen.queryByLabelText('Loading weather data')).not.toBeOnTheScreen())
  })

  it('refetches in imperial units when the units switch is toggled', async () => {
    await renderHome()
    await loadSydney()

    jest.mocked(weatherApi.fetchCurrentWeatherByCoords).mockResolvedValueOnce({ data: makeCurrentWeather(70.9, 68.7), error: null })
    await toggleUnits()

    expect(await screen.findByText('71°F')).toBeOnTheScreen()
    expect(weatherApi.fetchCurrentWeatherByCoords).toHaveBeenLastCalledWith(
      sydney.lat, sydney.lon, 'imperial', expect.any(AbortSignal)
    )
  })

  it('never shows the old value with the new unit symbol while the unit refetch is in flight', async () => {
    await renderHome()
    await loadSydney()
    expect(await screen.findByText('22°C')).toBeOnTheScreen()

    const refetch = deferred<CurrentWeatherResult>()
    jest.mocked(weatherApi.fetchCurrentWeatherByCoords).mockReturnValueOnce(refetch.promise)
    await toggleUnits()

    // Switch already flipped, but the card still labels the °C data as °C
    expect(screen.getByRole('switch')).not.toBeChecked()
    expect(screen.getByText('22°C')).toBeOnTheScreen()
    expect(screen.queryByText('22°F')).not.toBeOnTheScreen()

    refetch.resolve({ data: makeCurrentWeather(70.9, 68.7), error: null })

    expect(await screen.findByText('71°F')).toBeOnTheScreen()
    await waitFor(() => expect(screen.queryByText('22°C')).not.toBeOnTheScreen())
  })

  it('hides the old-unit forecast when only the forecast refetch fails on a unit toggle', async () => {
    await renderHome()
    await loadSydney()
    // The °C forecast is loaded (fixture slots are all "today", so it feeds the trends chart only)
    expect(await screen.findByText('22°C')).toBeOnTheScreen()
    expect(screen.queryByText(/No Forecast Data/)).not.toBeOnTheScreen()

    jest.mocked(weatherApi.fetchCurrentWeatherByCoords).mockResolvedValueOnce({ data: makeCurrentWeather(70.9, 68.7), error: null })
    jest.mocked(weatherApi.fetch5DayForecastByCoords).mockResolvedValueOnce({ data: null, error: { status: 500, message: 'Forecast down' } })
    await toggleUnits()

    expect(await screen.findByText('71°F')).toBeOnTheScreen()
    expect(screen.getByText(/No Forecast Data/)).toBeOnTheScreen()
  })

  describe('favorites', () => {
    it('adds the selected city to the favorites bar and persists it', async () => {
      await renderHome()
      await loadSydney()

      await fireEvent.press(screen.getByRole('button', { name: /add to favorites/i }))

      expect(within(favoritesBar()).getByRole('button', { name: 'Sydney, AU' })).toBeOnTheScreen()
      expect(screen.getByRole('button', { name: /remove from favorites/i })).toBeOnTheScreen()
      await waitFor(async () =>
        expect(JSON.parse((await AsyncStorage.getItem(FAVORITES_STORAGE_KEY))!)).toEqual([sydney])
      )
    })

    it('loads the weather for a saved favorite when its chip is pressed', async () => {
      await AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify([sydney]))

      await renderHome()
      await fireEvent.press(await within(favoritesBar()).findByRole('button', { name: 'Sydney, AU' }))

      expect(await screen.findByText('22°C')).toBeOnTheScreen()
      expect(weatherApi.fetchCurrentWeatherByCoords).toHaveBeenCalledWith(
        sydney.lat, sydney.lon, 'metric', expect.any(AbortSignal)
      )
    })
  })

  describe('Clear', () => {
    it('removes the weather panel', async () => {
      await renderHome()
      await loadSydney()

      await fireEvent.press(screen.getByRole('button', { name: /^clear$/i }))

      expect(screen.queryByText('Sydney, AU')).not.toBeOnTheScreen()
      expect(screen.queryByText('22°C')).not.toBeOnTheScreen()
    })

    it('dismisses the location error toast', async () => {
      denyLocationPermission()

      await renderHome()
      await pressUseMyLocation()
      expect(await screen.findByText(/Location access was denied/)).toBeOnTheScreen()

      await fireEvent.press(screen.getByRole('button', { name: /^clear$/i }))

      await waitFor(() => {
        expect(screen.queryByText(/Location access was denied/)).not.toBeOnTheScreen()
      })
    })

    it('dismisses the weather error toast', async () => {
      mockPosition(0, 0)
      jest.mocked(weatherApi.getReverseGeocode).mockResolvedValueOnce({ data: [], error: null })
      jest.mocked(weatherApi.fetchCurrentWeatherByCoords).mockResolvedValueOnce({
        data: null,
        error: { status: 500, message: 'Server error' },
      })

      await renderHome()
      await pressUseMyLocation()
      expect(await screen.findByText('Server error')).toBeOnTheScreen()

      await fireEvent.press(screen.getByRole('button', { name: /^clear$/i }))

      await waitFor(() => {
        expect(screen.queryByText('Server error')).not.toBeOnTheScreen()
      })
    })
  })
})
