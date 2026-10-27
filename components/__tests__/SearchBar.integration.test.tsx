import { render, screen, waitFor, fireEvent } from '@testing-library/react-native'
import { SearchBar } from '../SearchBar'
import * as weatherApi from '../../services/weatherApi'

// Uses the REAL useCitySearch hook (only the network layer is mocked) so the
// interaction between the hook's searchTerm, its debounce and the dropdown is exercised
jest.mock('../../services/weatherApi', () => ({
  searchCityByName: jest.fn(),
  getReverseGeocode: jest.fn(),
}))

describe('SearchBar + useCitySearch integration', () => {
  const mockOnSelectLocation = jest.fn()
  const mockOnClear = jest.fn()
  const mockOnError = jest.fn()

  const paris = { name: 'Paris', lat: 48.8566, lon: 2.3522, country: 'FR' }

  beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(weatherApi.searchCityByName).mockResolvedValue({ data: [paris], error: null })
  })

  const renderSearchBar = () =>
    render(
      <SearchBar
        onSelectLocation={mockOnSelectLocation}
        onUseMyLocation={jest.fn()}
        onClear={mockOnClear}
        onError={mockOnError}
      />
    )

  const cityInput = () => screen.getByLabelText('Search city')

  it('searches after debounce, selects a city and shows its label in the input', async () => {
    await renderSearchBar()

    await fireEvent.changeText(cityInput(), 'Par')

    // Debounced search (500ms) resolves and populates the dropdown
    await fireEvent.press(await screen.findByRole('button', { name: 'Paris, France' }, { timeout: 2000 }))

    expect(weatherApi.searchCityByName).toHaveBeenCalledWith('Par', 5, expect.any(AbortSignal))
    expect(mockOnSelectLocation).toHaveBeenCalledWith(paris)
    expect(cityInput()).toHaveDisplayValue('Paris, France')
    expect(screen.queryByRole('button', { name: 'Paris, France' })).not.toBeOnTheScreen()
  })

  it('empties the input on Clear', async () => {
    await renderSearchBar()

    await fireEvent.changeText(cityInput(), 'Par')
    await fireEvent.press(await screen.findByRole('button', { name: 'Paris, France' }, { timeout: 2000 }))
    expect(cityInput()).toHaveDisplayValue('Paris, France')

    await fireEvent.press(screen.getByRole('button', { name: /^clear$/i }))

    expect(mockOnClear).toHaveBeenCalledTimes(1)
    expect(cityInput()).toHaveDisplayValue('')
  })

  it('shows loading instead of "No cities found" while the search is debounced', async () => {
    jest.mocked(weatherApi.searchCityByName).mockResolvedValue({ data: [], error: null })
    await renderSearchBar()

    await fireEvent.changeText(cityInput(), 'Xyzzyq')

    // Still inside the 500ms debounce window: no request yet, no premature empty-result message
    expect(weatherApi.searchCityByName).not.toHaveBeenCalled()
    expect(screen.getByText('Loading…')).toBeOnTheScreen()
    expect(screen.queryByText(/No cities found/)).not.toBeOnTheScreen()

    expect(await screen.findByText('No cities found for "Xyzzyq"', {}, { timeout: 2000 })).toBeOnTheScreen()
  })

  it('reports a failed city search through onError', async () => {
    jest.mocked(weatherApi.searchCityByName).mockResolvedValue({
      data: null,
      error: { status: 500, message: 'Failed to fetch city recommendations.' },
    })
    await renderSearchBar()

    await fireEvent.changeText(cityInput(), 'Par')

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith('Failed to fetch city recommendations.')
    }, { timeout: 2000 })
  })
})
