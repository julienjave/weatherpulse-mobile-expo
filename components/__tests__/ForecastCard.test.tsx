import { render, screen } from '@testing-library/react-native'
import { ForecastCard } from '../ForecastCard'
import type { DailyForecastSummary } from '../../utils/aggregateForecast'
import { getWeatherThemeKit } from '../../utils/weatherThemes'
import { getIconUrl } from '../../utils/weatherIcons'

const FORECAST_LIST: DailyForecastSummary[] = [
  { dateKey: '2026-01-16', dateLabel: '16 Fri', tempMax: 17, tempMin: 9, description: 'clear sky', theme: getWeatherThemeKit(800, '01d') },
  { dateKey: '2026-01-17', dateLabel: '17 Sat', tempMax: 14, tempMin: 8, description: 'light rain', theme: getWeatherThemeKit(500, '10d') },
  { dateKey: '2026-01-18', dateLabel: '18 Sun', tempMax: 11, tempMin: 3, description: 'snow', theme: getWeatherThemeKit(601, '13d') },
]

describe('ForecastCard Component', () => {
  it('renders one tile per day with its label', async () => {
    await render(<ForecastCard forecastList={FORECAST_LIST} units="metric" />)

    expect(screen.getByText('16 Fri')).toBeOnTheScreen()
    expect(screen.getByText('17 Sat')).toBeOnTheScreen()
    expect(screen.getByText('18 Sun')).toBeOnTheScreen()
    expect(screen.getAllByLabelText('weather icon')).toHaveLength(3)
  })

  it('shows the high and low temperatures in °C for metric units', async () => {
    await render(<ForecastCard forecastList={FORECAST_LIST} units="metric" />)

    expect(screen.getByText('High: 17°C')).toBeOnTheScreen()
    expect(screen.getByText('Low: 9°C')).toBeOnTheScreen()
  })

  it('shows the high and low temperatures in °F for imperial units', async () => {
    await render(<ForecastCard forecastList={FORECAST_LIST} units="imperial" />)

    expect(screen.getByText('High: 17°F')).toBeOnTheScreen()
    expect(screen.getByText('Low: 9°F')).toBeOnTheScreen()
  })

  it("uses each day's theme icon", async () => {
    await render(<ForecastCard forecastList={FORECAST_LIST} units="metric" />)

    const icons = screen.getAllByLabelText('weather icon')
    FORECAST_LIST.forEach((day, i) => {
      expect(icons[i]).toHaveProp('source', getIconUrl(day.theme.icon))
    })
  })

  it('uses white day labels on dark themes and black ones on light themes', async () => {
    await render(<ForecastCard forecastList={FORECAST_LIST} units="metric" />)

    expect(screen.getByText('16 Fri')).toHaveStyle({ color: '#000' }) // clear-day
    expect(screen.getByText('17 Sat')).toHaveStyle({ color: '#fff' }) // rain
  })

  it('renders no tiles for an empty forecast', async () => {
    await render(<ForecastCard forecastList={[]} units="metric" />)

    expect(screen.queryByLabelText('weather icon')).not.toBeOnTheScreen()
    expect(screen.queryByText(/High:/)).not.toBeOnTheScreen()
  })
})
