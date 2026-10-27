import { render, screen, waitFor, fireEvent } from '@testing-library/react-native'
import type { ComponentProps } from 'react'
import { FavoritesBar } from '../FavoritesBar'
import type { GeocodingLocation } from '../../types/weather'

const PARIS: GeocodingLocation = { name: 'Paris', lat: 48.8566, lon: 2.3522, country: 'FR' }
const SYDNEY: GeocodingLocation = { name: 'Sydney', lat: -33.8688, lon: 151.2093, country: 'AU' }

describe('FavoritesBar Component', () => {
  const mockOnSelect = jest.fn()
  const mockOnDelete = jest.fn()

  const favoritesBar = (props: Partial<ComponentProps<typeof FavoritesBar>> = {}) => (
    <FavoritesBar
      favorites={[PARIS, SYDNEY]}
      selectedCity={null}
      onSelect={mockOnSelect}
      onDelete={mockOnDelete}
      {...props}
    />
  )

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('keeps the bar visible with a placeholder when there are no favorites', async () => {
    await render(favoritesBar({ favorites: [] }))

    expect(screen.getByLabelText('Favorite cities')).toHaveTextContent('No favorites yet')
    expect(screen.queryByRole('button')).not.toBeOnTheScreen()
  })

  it('shows neither the placeholder nor chips while favorites are loading', async () => {
    await render(favoritesBar({ favorites: [], isLoading: true }))

    expect(screen.getByLabelText('Favorite cities')).toBeOnTheScreen()
    expect(screen.queryByText('No favorites yet')).not.toBeOnTheScreen()
  })

  it('hides the placeholder once there are favorites', async () => {
    await render(favoritesBar())

    expect(screen.queryByText('No favorites yet')).not.toBeOnTheScreen()
  })

  it('renders one chip per favorite city with its country code', async () => {
    await render(favoritesBar())

    expect(screen.getByRole('button', { name: 'Paris, FR' })).toBeOnTheScreen()
    expect(screen.getByRole('button', { name: 'Sydney, AU' })).toBeOnTheScreen()
  })

  it('calls onSelect with the city when a chip is pressed', async () => {
    await render(favoritesBar())

    await fireEvent.press(screen.getByRole('button', { name: 'Sydney, AU' }))

    expect(mockOnSelect).toHaveBeenCalledWith(SYDNEY)
    expect(mockOnDelete).not.toHaveBeenCalled()
  })

  it("calls onDelete (and not onSelect) when a chip's remove button is pressed", async () => {
    await render(favoritesBar())

    await fireEvent.press(screen.getByRole('button', { name: 'Remove Paris, FR' }))

    expect(mockOnDelete).toHaveBeenCalledWith(PARIS)
    expect(mockOnSelect).not.toHaveBeenCalled()
  })

  it('marks the chip of the currently displayed city as selected', async () => {
    await render(favoritesBar({ selectedCity: { ...SYDNEY, lat: -33.8691 } }))

    expect(screen.getByRole('button', { name: 'Sydney, AU' })).toBeSelected()
    expect(screen.getByRole('button', { name: 'Paris, FR' })).not.toBeSelected()
  })

  it('removes a chip (after its exit animation) when the city is removed from favorites', async () => {
    await render(favoritesBar())

    await render(favoritesBar({ favorites: [SYDNEY] }))

    await waitFor(() => expect(screen.queryByRole('button', { name: 'Paris, FR' })).not.toBeOnTheScreen())
    expect(screen.getByRole('button', { name: 'Sydney, AU' })).toBeOnTheScreen()
  })

  it('shows the placeholder again once the last chip is removed', async () => {
    await render(favoritesBar({ favorites: [PARIS] }))

    await render(favoritesBar({ favorites: [] }))

    expect(await screen.findByText('No favorites yet')).toBeOnTheScreen()
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Paris, FR' })).not.toBeOnTheScreen())
  })
})
