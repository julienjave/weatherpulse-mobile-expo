import { render, screen, fireEvent } from '@testing-library/react-native'
import { LineChart } from 'react-native-gifted-charts'
import { TemperatureTrendsCard } from '../TemperatureTrendsCard'
import type { ForecastResponse } from '../../types/weather'

function makeForecast(temps: number[]): ForecastResponse {
  return {
    cod: '200',
    message: 0,
    cnt: temps.length,
    list: temps.map((temp, i) => ({
      dt: 1_790_000_000 + i * 3 * 3600,
      main: { temp, feels_like: temp - 1, temp_min: temp, temp_max: temp, pressure: 1013, humidity: 60, temp_kf: 0 },
      weather: [{ id: 800, main: 'Clear', description: 'clear sky', icon: '01d' }],
      clouds: { all: 0 },
      wind: { speed: 3, deg: 180 },
      visibility: 10000,
      pop: 0,
      sys: { pod: 'd' },
      dt_txt: '',
    })),
    city: {
      id: 1, name: 'Paris', coord: { lat: 48.85, lon: 2.35 }, country: 'FR',
      population: 0, timezone: 7200, sunrise: 0, sunset: 0,
    },
  }
}

const FORECAST = makeForecast([12, 12])

// The chart only renders once its area has been measured (it needs a pixel width)
async function layoutChartArea(width = 300) {
  await fireEvent(screen.getByTestId('temperature-chart-area'), 'layout', {
    nativeEvent: { layout: { x: 0, y: 0, width, height: 240 } },
  })
}

const lastChartProps = () => jest.mocked(LineChart).mock.calls.at(-1)![0] as Record<string, any>

describe('TemperatureTrendsCard Component', () => {
  beforeEach(() => {
    jest.mocked(LineChart).mockClear()
  })

  it('shows a fallback message when there is no forecast data', async () => {
    await render(<TemperatureTrendsCard forecastData={null} isThemeDark={false} units="metric" />)

    expect(screen.getByRole('header', { name: 'Next 24 Hours' })).toBeOnTheScreen()
    expect(screen.getByText(/No Forecast Data/)).toBeOnTheScreen()
    expect(screen.queryByTestId('temperature-chart-area')).not.toBeOnTheScreen()
  })

  it('renders the chart instead of the fallback once its area is measured', async () => {
    await render(<TemperatureTrendsCard forecastData={FORECAST} isThemeDark={false} units="metric" />)

    expect(screen.queryByText(/No Forecast Data/)).not.toBeOnTheScreen()
    expect(screen.queryByTestId('line-chart')).not.toBeOnTheScreen()

    await layoutChartArea()

    expect(screen.getByTestId('line-chart')).toBeOnTheScreen()
  })

  it('sizes the chart to the measured width', async () => {
    await render(<TemperatureTrendsCard forecastData={FORECAST} isThemeDark={false} units="metric" />)
    await layoutChartArea(300)

    const props = lastChartProps()
    expect(props.parentWidth).toBe(300)
    expect(props.width).toBe(300 - props.yAxisLabelWidth)
    // Both points fit between the edge padding on either side
    expect(props.initialSpacing + props.spacing + props.endSpacing).toBe(props.width)
  })

  it('zooms the Y axis onto the temperatures instead of starting at 0', async () => {
    await render(<TemperatureTrendsCard forecastData={makeForecast([15, 18, 20])} isThemeDark={false} units="metric" />)
    await layoutChartArea()

    const { yAxisOffset, maxValue, stepValue, noOfSections } = lastChartProps()
    // 2° of padding below the min and above the max, in whole-degree steps
    expect(yAxisOffset).toBe(13)
    expect(stepValue * noOfSections).toBe(maxValue)
    expect(yAxisOffset + maxValue).toBeGreaterThanOrEqual(22)
  })

  it('handles sub-zero temperatures', async () => {
    await render(<TemperatureTrendsCard forecastData={makeForecast([-5, 0, 3])} isThemeDark={false} units="metric" />)
    await layoutChartArea()

    const { yAxisOffset, maxValue } = lastChartProps()
    expect(yAxisOffset).toBe(-7)
    expect(yAxisOffset + maxValue).toBeGreaterThanOrEqual(5)
  })

  it('passes the real temperature for the tooltip, and shortened time labels', async () => {
    await render(<TemperatureTrendsCard forecastData={makeForecast([12, 13, 14])} isThemeDark={false} units="metric" />)
    await layoutChartArea()

    const { data } = lastChartProps()
    expect(data.map((point: { temp: number }) => point.temp)).toEqual([12, 13, 14])
    // Every other point is labeled, without ":00"
    expect(data[0].label).not.toContain(':00')
    expect(data[1].label).toBe('')
    expect(data[2].label).not.toBe('')
  })

  it('switches the title to white text on dark weather themes', async () => {
    await render(<TemperatureTrendsCard forecastData={FORECAST} isThemeDark={false} units="metric" />)
    expect(screen.getByRole('header', { name: 'Next 24 Hours' })).toHaveStyle({ color: '#000' })

    await render(<TemperatureTrendsCard forecastData={FORECAST} isThemeDark={true} units="metric" />)
    expect(screen.getByRole('header', { name: 'Next 24 Hours' })).toHaveStyle({ color: '#fff' })
  })
})
