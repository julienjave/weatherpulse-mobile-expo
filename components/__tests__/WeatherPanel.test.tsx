import { render, screen, fireEvent } from '@testing-library/react-native'
import { WeatherPanel, type WeatherPanelProps } from '../WeatherPanel'
import type {
  AirQualityResponse,
  CurrentWeatherResponse,
  ForecastItem,
  ForecastResponse,
  GeocodingLocation
} from '../../types/weather'
import { pinTimeZone, restoreTimeZone } from '../../test-utils/timeZone'

// UTC seconds for a given day/hour in Jan 2026 (15 Jan 2026 is a Thursday)
const utc = (day: number, hour: number) => Date.UTC(2026, 0, day, hour) / 1000

const NOW = utc(15, 12)

const sydney: GeocodingLocation = { name: 'Sydney', lat: -33.8688, lon: 151.2093, country: 'AU' }

const makeWeather = (id: number, icon: string): CurrentWeatherResponse => ({
  coord: { lat: sydney.lat, lon: sydney.lon },
  weather: [{ id, main: 'Weather', description: 'clear sky', icon }],
  base: 'stations',
  main: { temp: 21.6, feels_like: 20.4, temp_min: 19, temp_max: 24, pressure: 1015, humidity: 55 },
  visibility: 10000,
  wind: { speed: 4.1, deg: 90 },
  clouds: { all: 0 },
  dt: NOW,
  sys: { country: 'AU', sunrise: 0, sunset: 0 },
  timezone: 0,
  id: 2147714,
  name: 'Sydney',
  cod: 200,
})

// 40 three-hour slots (the free API's 5-day window) starting at `start`
const makeForecast = (start: number): ForecastResponse => ({
  cod: '200',
  message: 0,
  cnt: 40,
  list: Array.from({ length: 40 }, (_, i): ForecastItem => ({
    dt: start + i * 3 * 3600,
    main: { temp: 20, feels_like: 19, temp_min: 15, temp_max: 25, pressure: 1015, humidity: 55, temp_kf: 0 },
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
    population: 0, timezone: 0, sunrise: 0, sunset: 0,
  },
})

const makeAirQuality = (pm2_5: number | null): AirQualityResponse => ({
  coord: { lat: sydney.lat, lon: sydney.lon },
  list: pm2_5 === null ? [] : [{
    dt: NOW,
    main: { aqi: 1 },
    components: { co: 0, no: 0, no2: 0, o3: 0, so2: 0, pm2_5, pm10: 0, nh3: 0 },
  }],
})

describe('WeatherPanel Component', () => {
  beforeEach(async () => {
    pinTimeZone('Europe/Paris')
    jest.useFakeTimers({ now: NOW * 1000 })
  })

  afterEach(async () => {
    jest.useRealTimers()
    jest.restoreAllMocks()
    restoreTimeZone()
  })

  const renderPanel = async (props: Partial<WeatherPanelProps> = {}) => {
    const defaults: WeatherPanelProps = {
      weatherData: makeWeather(800, '01d'),
      forecastData: makeForecast(utc(15, 12)),
      aqiData: makeAirQuality(6),
      selectedCity: sydney,
      units: 'metric',
      dataUnits: 'metric',
      isFavorite: false,
      isFavoritesFull: false,
      onToggleFavorite: jest.fn(),
      onToggleUnit: jest.fn(),
    }
    const merged = { ...defaults, ...props }
    await render(<WeatherPanel {...merged} />)
    return merged
  }

  it('renders every section of the panel', async () => {
    await renderPanel()

    expect(screen.getByRole('button', { name: 'Add to favorites' })).toBeOnTheScreen() // header bar
    expect(screen.getByText('Sydney, AU')).toBeOnTheScreen() // current weather
    expect(screen.getByText('55%')).toBeOnTheScreen() // metrics
    expect(screen.getByRole('header', { name: 'Next 24 Hours' })).toBeOnTheScreen() // trends
    expect(screen.getAllByText(/^High:/).length).toBeGreaterThan(0) // forecast
  })

  it('converts PM2.5 into a US AQI badge', async () => {
    await renderPanel({ aqiData: makeAirQuality(6) })

    expect(screen.getByText('25 - Good')).toBeOnTheScreen()
  })

  it('shows the AQI placeholder when there is no air quality data', async () => {
    await renderPanel({ aqiData: null })

    expect(screen.getByText(/- No Data -/)).toBeOnTheScreen()
  })

  describe('forecast', () => {
    it('leaves today out of the daily forecast', async () => {
      await renderPanel({ forecastData: makeForecast(utc(15, 12)) })

      expect(screen.queryByText('15 Thu')).not.toBeOnTheScreen()
      expect(screen.getAllByText(/^High:/)).toHaveLength(4)
      expect(screen.getByText('16 Fri')).toBeOnTheScreen()
      expect(screen.getByText('19 Mon')).toBeOnTheScreen()
    })

    it('caps the daily forecast at 4 days when today is not in the data', async () => {
      await renderPanel({ forecastData: makeForecast(utc(16, 0)) }) // 5 full days: 16th to 20th

      expect(screen.getAllByText(/^High:/)).toHaveLength(4)
      expect(screen.getByText('16 Fri')).toBeOnTheScreen()
      expect(screen.queryByText('20 Tue')).not.toBeOnTheScreen()
    })

    it('hides the daily forecast and chart when there is no forecast data', async () => {
      await renderPanel({ forecastData: null })

      expect(screen.queryByText(/^High:/)).not.toBeOnTheScreen()
      expect(screen.getByText(/No Forecast Data/)).toBeOnTheScreen()
    })
  })

  it('passes the units down to every card', async () => {
    await renderPanel({ units: 'imperial', dataUnits: 'imperial' })

    expect(screen.getByRole('switch')).not.toBeChecked()
    expect(screen.getByText('22°F')).toBeOnTheScreen()
    expect(screen.getByText('4.1mph')).toBeOnTheScreen()
    expect(screen.getAllByText('High: 25°F')).toHaveLength(4)
  })

  it('flips the switch immediately but keeps card symbols on the data units until new data lands', async () => {
    // Mid unit-toggle: the switch is already on °F, the °C data hasn't been refetched yet
    await renderPanel({ units: 'imperial', dataUnits: 'metric' })

    expect(screen.getByRole('switch')).not.toBeChecked()
    expect(screen.getByText('22°C')).toBeOnTheScreen()
    expect(screen.queryByText('22°F')).not.toBeOnTheScreen()
    expect(screen.getByText('4.1m/s')).toBeOnTheScreen()
    expect(screen.getAllByText('High: 25°C')).toHaveLength(4)
  })

  it('themes the cards from the current weather condition', async () => {
    await renderPanel({ weatherData: makeWeather(500, '10n') }) // rain → dark theme

    expect(screen.getByText('Today')).toHaveStyle({ color: '#fff' })
    expect(screen.getByText('55%')).toHaveStyle({ color: '#fff' })
    expect(screen.getByRole('header', { name: 'Next 24 Hours' })).toHaveStyle({ color: '#fff' })
  })

  it('forwards favorite and unit toggles to its callbacks', async () => {
    const { onToggleFavorite, onToggleUnit } = await renderPanel({ isFavorite: true })

    await fireEvent.press(screen.getByRole('button', { name: 'Remove from favorites' }))
    await fireEvent(screen.getByRole('switch'), 'valueChange', true) // native switches report value changes

    expect(onToggleFavorite).toHaveBeenCalledTimes(1)
    expect(onToggleUnit).toHaveBeenCalledTimes(1)
  })

  // Regression: an empty air quality list used to crash the panel, then render "NaN - Hazardous"
  it('renders the AQI placeholder when the air quality list is empty', async () => {
    await renderPanel({ aqiData: makeAirQuality(null) })

    expect(screen.queryByText(/NaN/)).not.toBeOnTheScreen()
    expect(screen.getByText(/- No Data -/)).toBeOnTheScreen()
  })
})
