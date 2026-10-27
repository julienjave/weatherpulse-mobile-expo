import { render, screen } from '@testing-library/react-native'
import type { TestInstance } from 'test-renderer'
import { WeatherMetricsCard } from '../WeatherMetricsCard'
import { getUsAqiKit } from '../../utils/aqiConverter'
import { getWeatherThemeKit } from '../../utils/weatherThemes'

// Nearest ancestor that sets a background color (the AQI badge around its text)
function backgroundOf(node: TestInstance) {
  let current: TestInstance | null = node.parent
  while (current) {
    const style = [current.props.style].flat(Infinity).reduce((acc, s) => ({ ...acc, ...s }), {})
    if (style.backgroundColor) return style.backgroundColor
    current = current.parent
  }
  return undefined
}

describe('WeatherMetricsCard Component', () => {
  const lightTheme = getWeatherThemeKit(800, '01d') // clear-day
  const darkTheme = getWeatherThemeKit(800, '01n') // clear-night

  it('shows humidity and wind next to labelled icons', async () => {
    await render(<WeatherMetricsCard humidity={55} wind={4.1} aqiData={null} theme={lightTheme} units="metric" />)

    expect(screen.getByLabelText('Humidity')).toBeOnTheScreen()
    expect(screen.getByLabelText('Wind')).toBeOnTheScreen()
    expect(screen.getByLabelText('Air Quality Index')).toBeOnTheScreen()
    expect(screen.getByText('55%')).toBeOnTheScreen()
  })

  it.each([
    ['metric', '4.1m/s'],
    ['imperial', '4.1mph'],
  ] as const)('shows wind speed in %s units', async (units, expected) => {
    await render(<WeatherMetricsCard humidity={55} wind={4.1} aqiData={null} theme={lightTheme} units={units} />)

    expect(screen.getByText(expected)).toBeOnTheScreen()
  })

  it('shows a placeholder when there is no AQI data', async () => {
    await render(<WeatherMetricsCard humidity={55} wind={4.1} aqiData={null} theme={lightTheme} units="metric" />)

    expect(screen.getByText(/- No Data -/)).toBeOnTheScreen()
  })

  it('shows the AQI value and label on a badge colored by category', async () => {
    await render(<WeatherMetricsCard humidity={55} wind={4.1} aqiData={getUsAqiKit(6)} theme={lightTheme} units="metric" />)

    expect(backgroundOf(screen.getByText('25 - Good'))).toBe('#00e400')
    expect(screen.queryByText(/- No Data -/)).not.toBeOnTheScreen()
  })

  it('uses white text on dark weather themes and black text on light ones', async () => {
    await render(<WeatherMetricsCard humidity={55} wind={4.1} aqiData={null} theme={lightTheme} units="metric" />)
    expect(screen.getByText('55%')).toHaveStyle({ color: '#000' })
    expect(screen.getByText('4.1m/s')).toHaveStyle({ color: '#000' })

    await render(<WeatherMetricsCard humidity={55} wind={4.1} aqiData={null} theme={darkTheme} units="metric" />)
    expect(screen.getByText('55%')).toHaveStyle({ color: '#fff' })
    expect(screen.getByText('4.1m/s')).toHaveStyle({ color: '#fff' })
  })

  // Regression: the badge text color used to be `${aqiData}` ("[object Object]") instead of `aqiData.color`
  it.each([
    [6, '25 - Good', '#000000'],
    [100, '174 - Unhealthy', '#ffffff'],
  ])('uses the AQI category text color on the badge (PM2.5 %f)', async (pm25, text, color) => {
    await render(<WeatherMetricsCard humidity={55} wind={4.1} aqiData={getUsAqiKit(pm25)} theme={lightTheme} units="metric" />)

    expect(screen.getByText(text)).toHaveStyle({ color })
  })
})
