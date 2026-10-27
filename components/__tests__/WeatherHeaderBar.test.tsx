import { render, screen, fireEvent, act } from '@testing-library/react-native'
import { PaperProvider } from 'react-native-paper'
import { WeatherHeaderBar, type WeatherHeadBarProps } from '../WeatherHeaderBar'

describe('WeatherHeaderBar Component', () => {
  const renderHeaderBar = async (props: Partial<WeatherHeadBarProps> = {}) => {
    const defaults: WeatherHeadBarProps = {
      isFavorite: false,
      onToggleFavorite: jest.fn(),
      units: 'metric',
      onToggleUnit: jest.fn(),
    }
    const merged = { ...defaults, ...props }
    // PaperProvider hosts the Portal that tooltips render into
    await render(
      <PaperProvider>
        <WeatherHeaderBar {...merged} />
      </PaperProvider>
    )
    return merged
  }

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('Favorite button', () => {
    it('offers to add the city when it is not a favorite', async () => {
      await renderHeaderBar({ isFavorite: false })

      expect(screen.getByRole('button', { name: 'Add to favorites' })).toBeEnabled()
    })

    it('offers to remove the city when it is already a favorite', async () => {
      await renderHeaderBar({ isFavorite: true })

      expect(screen.getByRole('button', { name: 'Remove from favorites' })).toBeEnabled()
    })

    it('calls onToggleFavorite when pressed', async () => {
      const { onToggleFavorite } = await renderHeaderBar()

      await fireEvent.press(screen.getByRole('button', { name: 'Add to favorites' }))

      expect(onToggleFavorite).toHaveBeenCalledTimes(1)
    })

    it('is disabled for a new city once the favorites limit is reached', async () => {
      const { onToggleFavorite } = await renderHeaderBar({ isFavorite: false, isFavoritesFull: true })

      const button = screen.getByRole('button', { name: 'Add to favorites' })
      expect(button).toBeDisabled()

      await fireEvent.press(button)
      expect(onToggleFavorite).not.toHaveBeenCalled()
    })

    it('still allows removing a favorite when the limit is reached', async () => {
      const { onToggleFavorite } = await renderHeaderBar({ isFavorite: true, isFavoritesFull: true })

      await fireEvent.press(screen.getByRole('button', { name: 'Remove from favorites' }))

      expect(onToggleFavorite).toHaveBeenCalledTimes(1)
    })

    it.each([
      [false, false, 'Add to Favorites'],
      [true, false, 'Remove from Favorites'],
      [false, true, 'Favorites limit reached'],
      [true, true, 'Remove from Favorites'],
    ])('shows the right tooltip on long press (isFavorite=%s, isFavoritesFull=%s)', async (isFavorite, isFavoritesFull, tooltip) => {
      jest.useFakeTimers()
      await renderHeaderBar({ isFavorite, isFavoritesFull })

      // Long-press the button; it reaches the tooltip's wrapper even when the button is disabled
      await fireEvent(screen.getByRole('button', { name: /favorites/i }), 'longPress')
      await act(() => jest.advanceTimersByTimeAsync(600))

      expect(screen.getByTestId('tooltip-container')).toHaveTextContent(tooltip)
    })
  })

  describe('Units switch', () => {
    it('is on (°C) for metric units', async () => {
      await renderHeaderBar({ units: 'metric' })

      expect(screen.getByRole('switch')).toBeChecked()
    })

    it('is off (°F) for imperial units', async () => {
      await renderHeaderBar({ units: 'imperial' })

      expect(screen.getByRole('switch')).not.toBeChecked()
    })

    it('calls onToggleUnit when toggled', async () => {
      const { onToggleUnit } = await renderHeaderBar()

      // A native switch reports value changes, not presses
      await fireEvent(screen.getByRole('switch'), 'valueChange', false)

      expect(onToggleUnit).toHaveBeenCalledTimes(1)
    })
  })
})
