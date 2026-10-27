import { render, screen } from '@testing-library/react-native'
import { WeatherPanelSkeleton } from '../WeatherPanelSkeleton'

describe('WeatherPanelSkeleton Component', () => {
  it('announces itself as a busy loading region', async () => {
    await render(<WeatherPanelSkeleton />)

    const status = screen.getByLabelText('Loading weather data')
    expect(status).toHaveProp('role', 'status')
    expect(status).toBeBusy()
  })
})
