import { render, screen } from '@testing-library/react-native'
import { CurrentWeatherCard } from '../CurrentWeatherCard'
import type { CurrentWeatherResponse, GeocodingLocation } from '../../types/weather'
import { getWeatherThemeKit } from '../../utils/weatherThemes'
import { getIconUrl } from '../../utils/weatherIcons'
import { pinTimeZone, restoreTimeZone } from '../../test-utils/timeZone'

// Thursday 15 Jan 2026, 12:00 UTC
const NOW = Date.UTC(2026, 0, 15, 12, 0)

const sydney: GeocodingLocation = { name: 'Sydney', lat: -33.8688, lon: 151.2093, country: 'AU' }

const WEATHER: CurrentWeatherResponse = {
  coord: { lat: sydney.lat, lon: sydney.lon },
  weather: [{ id: 800, main: 'Clear', description: 'clear sky', icon: '01d' }],
  base: 'stations',
  main: { temp: 21.6, feels_like: 20.4, temp_min: 19, temp_max: 24, pressure: 1015, humidity: 55 },
  visibility: 10000,
  wind: { speed: 4.1, deg: 90 },
  clouds: { all: 0 },
  dt: NOW / 1000,
  sys: { country: 'AU', sunrise: 0, sunset: 0 },
  timezone: 36000, // UTC+10
  id: 2147714,
  name: 'Sydney',
  cod: 200,
}

describe('CurrentWeatherCard Component', () => {
  const theme = getWeatherThemeKit(800, '01d')

  beforeEach(() => {
    // The date and time are "now" in the city timezone, whatever the machine's zone
    pinTimeZone('Europe/Paris')
    jest.useFakeTimers({ now: NOW })
  })

  afterEach(() => {
    jest.useRealTimers()
    restoreTimeZone()
  })

  it("shows today's date and current time in the city timezone", async () => {
    await render(<CurrentWeatherCard weatherData={WEATHER} theme={theme} selectedCity={sydney} units="metric" />)

    expect(screen.getByText('Today')).toBeOnTheScreen()
    expect(screen.getByText('Thursday, Jan 15')).toBeOnTheScreen()
    expect(screen.getByText(/^10:00\sPM$/)).toBeOnTheScreen()
  })

  it('shows the city name with its country code', async () => {
    await render(<CurrentWeatherCard weatherData={WEATHER} theme={theme} selectedCity={sydney} units="metric" />)

    expect(screen.getByText('Sydney, AU')).toBeOnTheScreen()
  })

  it('shows only the name when the location has no country (coordinate fallback)', async () => {
    const coordinates = { name: '48.86°, 2.35°', lat: 48.85661, lon: 2.35222, country: '' }
    await render(<CurrentWeatherCard weatherData={WEATHER} theme={theme} selectedCity={coordinates} units="metric" />)

    expect(screen.getByText('48.86°, 2.35°')).toBeOnTheScreen()
  })

  it('shows the condition description and theme icon', async () => {
    await render(<CurrentWeatherCard weatherData={WEATHER} theme={theme} selectedCity={sydney} units="metric" />)

    expect(screen.getByText('clear sky')).toBeOnTheScreen()
    expect(screen.getByLabelText('weather icon')).toHaveProp('source', getIconUrl(theme.icon))
  })

  it('shows rounded temperature and feels-like in °C for metric units', async () => {
    await render(<CurrentWeatherCard weatherData={WEATHER} theme={theme} selectedCity={sydney} units="metric" />)

    expect(screen.getByText('22°C')).toBeOnTheScreen()
    expect(screen.getByText('Feels like')).toBeOnTheScreen()
    expect(screen.getByText('20°C')).toBeOnTheScreen()
  })

  it('shows the °F symbol for imperial units', async () => {
    const imperial = { ...WEATHER, main: { ...WEATHER.main, temp: 70.9, feels_like: 68.7 } }
    await render(<CurrentWeatherCard weatherData={imperial} theme={theme} selectedCity={sydney} units="imperial" />)

    expect(screen.getByText('71°F')).toBeOnTheScreen()
    expect(screen.getByText('69°F')).toBeOnTheScreen()
  })

  // Regression: the temperature used to be nested in a <Text>, so its size and color were lost
  it('styles the temperature itself (large, theme-colored)', async () => {
    await render(<CurrentWeatherCard weatherData={WEATHER} theme={theme} selectedCity={sydney} units="metric" />)

    expect(screen.getByText('22°C')).toHaveStyle({ fontSize: 48, color: '#000' })
  })

  it('uses white text on dark weather themes and black text on light ones', async () => {
    await render(<CurrentWeatherCard weatherData={WEATHER} theme={theme} selectedCity={sydney} units="metric" />)
    for (const text of ['Today', 'Sydney, AU', 'clear sky', '22°C']) {
      expect(screen.getByText(text)).toHaveStyle({ color: '#000' })
    }

    await render(
      <CurrentWeatherCard weatherData={WEATHER} theme={getWeatherThemeKit(800, '01n')} selectedCity={sydney} units="metric" />
    )
    for (const text of ['Today', 'Sydney, AU', 'clear sky', '22°C']) {
      expect(screen.getByText(text)).toHaveStyle({ color: '#fff' })
    }
  })
})
