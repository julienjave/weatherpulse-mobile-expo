import { render, screen, waitFor, fireEvent } from '@testing-library/react-native'
import type { ComponentProps } from 'react'
import { SearchBar } from '../SearchBar'
import * as weatherApi from '../../services/weatherApi'
import { useCitySearch } from '../../hooks/useCitySearch'

// Mock custom hook and API service module
jest.mock('../../hooks/useCitySearch')
jest.mock('../../services/weatherApi', () => ({
  getReverseGeocode: jest.fn(),
}))

describe('SearchBar Component', () => {
  const mockOnSelectLocation = jest.fn()
  const mockOnUseMyLocation = jest.fn()
  const mockOnClear = jest.fn()
  const mockHandleInputChange = jest.fn()

  const sampleOptions = [
    { name: 'Sydney', lat: -33.8688, lon: 151.2093, country: 'AU', state: 'New South Wales' },
    { name: 'Paris', lat: 48.8566, lon: 2.3522, country: 'FR' },
  ]

  // Renders SearchBar with all required props, allowing overrides per test
  const renderSearchBar = (props: Partial<ComponentProps<typeof SearchBar>> = {}) =>
    render(
      <SearchBar
        onSelectLocation={mockOnSelectLocation}
        onUseMyLocation={mockOnUseMyLocation}
        onClear={mockOnClear}
        {...props}
      />
    )

  const mockCitySearch = (overrides: Partial<ReturnType<typeof useCitySearch>> = {}) => {
    jest.mocked(useCitySearch).mockReturnValue({
      searchTerm: '',
      handleInputChange: mockHandleInputChange,
      options: [],
      isSearching: false,
      searchError: null,
      ...overrides,
    })
  }

  const cityInput = () => screen.getByLabelText('Search city')
  const modeButton = (name: 'City search' | 'Coordinates search') => screen.getByRole('button', { name })

  beforeEach(() => {
    jest.clearAllMocks()
    mockCitySearch()
  })

  // --- CITY MODE TESTS ---

  describe('City Mode', () => {
    it('renders input field, search mode toggle, geolocation button and clear button', async () => {
      await renderSearchBar()

      expect(cityInput()).toBeOnTheScreen()
      expect(screen.getByRole('button', { name: /use my location/i })).toBeOnTheScreen()
      expect(modeButton('City search')).toBeOnTheScreen()
      expect(modeButton('Coordinates search')).toBeOnTheScreen()
      expect(screen.getByRole('button', { name: /^clear$/i })).toBeOnTheScreen()
    })

    it('calls handleInputChange when user types into the input field', async () => {
      await renderSearchBar()

      await fireEvent.changeText(cityInput(), 'Syd')

      expect(mockHandleInputChange).toHaveBeenCalledWith('Syd')
    })

    it('renders the options dropdown once at least 2 characters are typed', async () => {
      mockCitySearch({ searchTerm: 'Syd', options: sampleOptions })
      await renderSearchBar()

      await fireEvent.changeText(cityInput(), 'S')
      expect(screen.queryByText(/Sydney/)).not.toBeOnTheScreen()

      await fireEvent.changeText(cityInput(), 'Syd')
      expect(screen.getByRole('button', { name: 'Sydney, New South Wales, Australia' })).toBeOnTheScreen()
      expect(screen.getByRole('button', { name: 'Paris, France' })).toBeOnTheScreen()
    })

    it('reopens the dropdown on focus when there are results', async () => {
      mockCitySearch({ searchTerm: 'Syd', options: sampleOptions })
      await renderSearchBar()

      await fireEvent(cityInput(), 'focus')

      expect(screen.getByText('Sydney, New South Wales, Australia')).toBeOnTheScreen()
    })

    it('triggers onSelectLocation and closes the dropdown when an option is selected', async () => {
      mockCitySearch({ searchTerm: 'Paris', options: sampleOptions })
      await renderSearchBar()

      await fireEvent.changeText(cityInput(), 'Paris')
      await fireEvent.press(screen.getByRole('button', { name: 'Paris, France' }))

      expect(mockOnSelectLocation).toHaveBeenCalledWith(sampleOptions[1])
      expect(screen.queryByRole('button', { name: 'Paris, France' })).not.toBeOnTheScreen()
      // The input shows the chosen city's full label
      expect(mockHandleInputChange).toHaveBeenLastCalledWith('Paris, France')
    })

    it('says "Loading…" rather than "No cities found" while a search is in progress', async () => {
      mockCitySearch({ searchTerm: 'Xyzzyq', options: [], isSearching: true })
      await renderSearchBar()

      await fireEvent.changeText(cityInput(), 'Xyzzyq')

      expect(screen.getByText('Loading…')).toBeOnTheScreen()
      expect(screen.queryByText(/No cities found/)).not.toBeOnTheScreen()
    })

    it('replaces the geolocation button with a busy spinner when isGeoloading is true', async () => {
      await renderSearchBar({ isGeoloading: true })

      expect(screen.queryByRole('button', { name: /use my location/i })).not.toBeOnTheScreen()
      expect(screen.getByLabelText(/use my location/i)).toBeBusy()
    })

    it('shows a loading spinner in the input while searching', async () => {
      mockCitySearch({ searchTerm: 'Par', isSearching: true })
      await renderSearchBar()

      expect(screen.getByRole('progressbar')).toBeOnTheScreen()
    })

    it('triggers onUseMyLocation when the geolocation button is pressed', async () => {
      await renderSearchBar()

      await fireEvent.press(screen.getByRole('button', { name: /use my location/i }))

      expect(mockOnUseMyLocation).toHaveBeenCalledTimes(1)
    })

    it('forwards searchError to onError instead of rendering it inline', async () => {
      const mockOnError = jest.fn()
      mockCitySearch({ searchTerm: 'BadQuery', searchError: 'Failed to fetch city recommendations.' })
      await renderSearchBar({ onError: mockOnError })

      expect(mockOnError).toHaveBeenCalledWith('Failed to fetch city recommendations.')
      expect(screen.queryByText('Failed to fetch city recommendations.')).not.toBeOnTheScreen()
    })

    it('shows a "no cities found" message when the search returns no results', async () => {
      mockCitySearch({ searchTerm: 'Xyzzyq', options: [] })
      await renderSearchBar()

      await fireEvent.changeText(cityInput(), 'Xyzzyq')

      expect(screen.getByText('No cities found for "Xyzzyq"')).toBeOnTheScreen()
    })
  })

  // --- MODE TOGGLE TESTS ---

  describe('Mode Toggle', () => {
    it('stays in city mode when the already-selected toggle is pressed again', async () => {
      await renderSearchBar()

      await fireEvent.press(modeButton('City search'))

      expect(cityInput()).toBeOnTheScreen()
      expect(screen.queryByLabelText(/latitude/i)).not.toBeOnTheScreen()
    })

    it('clears a coordinate validation error when switching modes', async () => {
      await renderSearchBar()

      await submitCoords('100', '45')
      expect(screen.getByRole('alert')).toHaveTextContent('Latitude must be between -90 and 90')

      await fireEvent.press(modeButton('City search'))

      expect(screen.queryByRole('alert')).not.toBeOnTheScreen()
    })
  })

  // --- COORDINATES MODE TESTS ---

  const submitCoords = async (lat: string, lon: string) => {
    await fireEvent.press(modeButton('Coordinates search'))
    if (lat) await fireEvent.changeText(screen.getByLabelText(/latitude/i), lat)
    if (lon) await fireEvent.changeText(screen.getByLabelText(/longitude/i), lon)
    await fireEvent.press(screen.getByRole('button', { name: /^go$/i }))
  }

  describe('Coordinates Mode', () => {
    it('switches to the coordinate form when the coordinates toggle is pressed', async () => {
      await renderSearchBar()

      await fireEvent.press(modeButton('Coordinates search'))

      expect(screen.getByLabelText(/latitude/i)).toBeOnTheScreen()
      expect(screen.getByLabelText(/longitude/i)).toBeOnTheScreen()
      expect(screen.getByRole('button', { name: /^go$/i })).toBeOnTheScreen()
      expect(screen.queryByLabelText('Search city')).not.toBeOnTheScreen()
    })

    it('validates an invalid latitude and announces the error', async () => {
      await renderSearchBar()

      await submitCoords('100', '45') // invalid: > 90

      expect(screen.getByRole('alert')).toHaveTextContent('Latitude must be between -90 and 90')
      expect(weatherApi.getReverseGeocode).not.toHaveBeenCalled()
    })

    it('validates an invalid longitude and announces the error', async () => {
      await renderSearchBar()

      await submitCoords('45', '200') // invalid: > 180

      expect(screen.getByRole('alert')).toHaveTextContent('Longitude must be between -180 and 180')
      expect(weatherApi.getReverseGeocode).not.toHaveBeenCalled()
    })

    it('shows the latitude error when the form is submitted empty', async () => {
      await renderSearchBar()

      await submitCoords('', '')

      expect(screen.getByRole('alert')).toHaveTextContent('Latitude must be between -90 and 90')
      expect(weatherApi.getReverseGeocode).not.toHaveBeenCalled()
    })

    it('accepts boundary coordinate values (90, -180)', async () => {
      jest.mocked(weatherApi.getReverseGeocode).mockResolvedValueOnce({ data: [], error: null })
      await renderSearchBar()

      await submitCoords('90', '-180')

      await waitFor(() => {
        expect(weatherApi.getReverseGeocode).toHaveBeenCalledWith(90, -180)
      })
    })

    it('submits valid coordinates and triggers onSelectLocation with reverse geocoded data', async () => {
      jest.mocked(weatherApi.getReverseGeocode).mockResolvedValueOnce({
        data: [sampleOptions[0]],
        error: null,
      })
      await renderSearchBar()

      await submitCoords('-33.86', '151.20')

      await waitFor(() => {
        expect(weatherApi.getReverseGeocode).toHaveBeenCalledWith(-33.86, 151.20)
        expect(mockOnSelectLocation).toHaveBeenCalledWith(sampleOptions[0])
      })
    })

    it('falls back to raw coordinate string if reverse geocoding returns an empty list', async () => {
      jest.mocked(weatherApi.getReverseGeocode).mockResolvedValueOnce({
        data: [],
        error: null,
      })
      await renderSearchBar()

      await submitCoords('12.34', '56.78')

      await waitFor(() => {
        expect(mockOnSelectLocation).toHaveBeenCalledWith({
          name: '12.34°, 56.78°',
          lat: 12.34,
          lon: 56.78,
          country: '',
        })
      })
    })

    it('falls back to raw coordinate string if reverse geocoding returns an error envelope', async () => {
      jest.mocked(weatherApi.getReverseGeocode).mockResolvedValueOnce({
        data: null,
        error: { status: 500, message: 'Server error' },
      })
      await renderSearchBar()

      await submitCoords('1.005', '2')

      await waitFor(() => {
        expect(mockOnSelectLocation).toHaveBeenCalledWith(
          expect.objectContaining({ lat: 1.005, lon: 2, country: '' })
        )
      })
      expect(screen.queryByRole('alert')).not.toBeOnTheScreen()
    })

    it('disables the Go button and shows a spinner while reverse geocoding', async () => {
      let resolveRequest!: (value: Awaited<ReturnType<typeof weatherApi.getReverseGeocode>>) => void
      jest.mocked(weatherApi.getReverseGeocode).mockReturnValueOnce(
        new Promise((resolve) => { resolveRequest = resolve })
      )
      await renderSearchBar()

      await fireEvent.press(modeButton('Coordinates search'))
      await fireEvent.changeText(screen.getByLabelText(/latitude/i), '10')
      await fireEvent.changeText(screen.getByLabelText(/longitude/i), '10')
      // Don't await the press yet: RNTL waits for the handler, which waits for the request
      const pressing = fireEvent.press(screen.getByRole('button', { name: /^go$/i }))

      await waitFor(() => expect(screen.getByRole('button', { name: /^go$/i })).toBeDisabled())
      expect(screen.getByRole('progressbar')).toBeOnTheScreen()

      resolveRequest({ data: [], error: null })

      await waitFor(() => expect(screen.getByRole('button', { name: /^go$/i })).toBeEnabled())
      expect(screen.queryByRole('progressbar')).not.toBeOnTheScreen()
      await pressing
    })

    it('announces an error if the reverse geocoding request fails', async () => {
      jest.mocked(weatherApi.getReverseGeocode).mockRejectedValueOnce(new Error('Network Error'))
      await renderSearchBar()

      await submitCoords('10', '10')

      expect(await screen.findByRole('alert')).toHaveTextContent('Failed to resolve coordinates. Please try again.')
    })
  })

  // --- CLEAR BUTTON TESTS ---

  describe('Clear Button', () => {
    it('calls onClear and resets the city search term', async () => {
      mockCitySearch({ searchTerm: 'Paris' })
      await renderSearchBar()

      await fireEvent.press(screen.getByRole('button', { name: /^clear$/i }))

      expect(mockOnClear).toHaveBeenCalledTimes(1)
      expect(mockHandleInputChange).toHaveBeenLastCalledWith('')
    })

    it('empties the coordinate inputs and removes the coordinate error', async () => {
      await renderSearchBar()

      await submitCoords('100', '45')
      expect(screen.getByRole('alert')).toBeOnTheScreen()

      await fireEvent.press(screen.getByRole('button', { name: /^clear$/i }))

      expect(screen.getByLabelText(/latitude/i)).toHaveDisplayValue('')
      expect(screen.getByLabelText(/longitude/i)).toHaveDisplayValue('')
      expect(screen.queryByRole('alert')).not.toBeOnTheScreen()
      expect(mockOnClear).toHaveBeenCalledTimes(1)
    })

    it('keeps the current search mode', async () => {
      await renderSearchBar()

      await fireEvent.press(modeButton('Coordinates search'))
      await fireEvent.press(screen.getByRole('button', { name: /^clear$/i }))

      expect(screen.getByLabelText(/latitude/i)).toBeOnTheScreen()
    })
  })
})
