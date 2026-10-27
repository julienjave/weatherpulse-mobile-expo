import { renderHook, act } from '@testing-library/react-native'
import { useCitySearch } from '../useCitySearch'
import * as weatherApi from '../../services/weatherApi'

type SearchResult = Awaited<ReturnType<typeof weatherApi.searchCityByName>>

jest.mock('../../services/weatherApi', () => ({
  searchCityByName: jest.fn(),
}))

describe('useCitySearch', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(async () => {
    jest.useRealTimers()
  })

  it('should initialize with default empty states', async () => {
    const { result } = await renderHook(() => useCitySearch())

    expect(result.current.searchTerm).toBe('')
    expect(result.current.options).toEqual([])
    expect(result.current.isSearching).toBe(false)
    expect(result.current.searchError).toBeNull()
  })

  it('should update searchTerm immediately on input change', async () => {
    const { result } = await renderHook(() => useCitySearch())

    await act(() => {
      result.current.handleInputChange('Paris')
    })

    expect(result.current.searchTerm).toBe('Paris')
  })

  it('should reset state when input is cleared or less than 2 characters', async () => {
    const { result } = await renderHook(() => useCitySearch())

    await act(() => {
      result.current.handleInputChange('P')
    })

    expect(result.current.options).toEqual([])
    expect(result.current.isSearching).toBe(false)
    expect(result.current.searchError).toBeNull()
    expect(weatherApi.searchCityByName).not.toHaveBeenCalled()
  })

  it('should trigger debounced search after 500ms', async () => {
    const mockLocations = [
      { name: 'Paris', lat: 48.8566, lon: 2.3522, country: 'FR' },
    ]
    jest.mocked(weatherApi.searchCityByName).mockResolvedValueOnce({
      data: mockLocations,
      error: null,
    })

    const { result } = await renderHook(() => useCitySearch())

    await act(() => {
      result.current.handleInputChange('Paris')
    })

    expect(weatherApi.searchCityByName).not.toHaveBeenCalled()

    await act(async () => {
      jest.advanceTimersByTime(500)
    })

    expect(weatherApi.searchCityByName).toHaveBeenCalledWith(
      'Paris',
      5,
      expect.any(AbortSignal)
    )
    expect(result.current.options).toEqual(mockLocations)
    expect(result.current.isSearching).toBe(false)
  })

  it('should handle API search error gracefully', async () => {
    jest.mocked(weatherApi.searchCityByName).mockResolvedValueOnce({
      data: null,
      error: { status: 404, message: 'City not found.' },
    })

    const { result } = await renderHook(() => useCitySearch())

    await act(() => {
      result.current.handleInputChange('InvalidCity')
    })

    await act(async () => {
      jest.advanceTimersByTime(500)
    })

    expect(result.current.searchError).toBe('City not found.')
    expect(result.current.options).toEqual([])
    expect(result.current.isSearching).toBe(false)
  })

  // --- ADDITIONAL COVERAGE ---

  const paris = [{ name: 'Paris', lat: 48.8566, lon: 2.3522, country: 'FR' }]
  const london = [{ name: 'London', lat: 51.5072, lon: -0.1276, country: 'GB' }]

  function deferred<T>() {
    let resolve!: (value: T) => void
    const promise = new Promise<T>((r) => { resolve = r })
    return { promise, resolve }
  }

  it('should collapse rapid typing into a single search for the latest value', async () => {
    jest.mocked(weatherApi.searchCityByName).mockResolvedValue({ data: paris, error: null })
    const { result } = await renderHook(() => useCitySearch())

    for (const value of ['Pa', 'Par', 'Pari', 'Paris']) {
      await act(() => {
        result.current.handleInputChange(value)
      })
      await act(() => {
        jest.advanceTimersByTime(200)
      })
    }

    await act(async () => {
      jest.advanceTimersByTime(500)
    })

    expect(weatherApi.searchCityByName).toHaveBeenCalledTimes(1)
    expect(weatherApi.searchCityByName).toHaveBeenCalledWith('Paris', 5, expect.any(AbortSignal))
  })

  it('should search with the trimmed query but keep the raw searchTerm', async () => {
    jest.mocked(weatherApi.searchCityByName).mockResolvedValue({ data: paris, error: null })
    const { result } = await renderHook(() => useCitySearch())

    await act(() => {
      result.current.handleInputChange('  Paris  ')
    })

    await act(async () => {
      jest.advanceTimersByTime(500)
    })

    expect(result.current.searchTerm).toBe('  Paris  ')
    expect(weatherApi.searchCityByName).toHaveBeenCalledWith('Paris', 5, expect.any(AbortSignal))
  })

  it('should treat whitespace-padded single characters as too short', async () => {
    const { result } = await renderHook(() => useCitySearch())

    await act(() => {
      result.current.handleInputChange('  P  ')
    })

    await act(async () => {
      jest.advanceTimersByTime(500)
    })

    expect(weatherApi.searchCityByName).not.toHaveBeenCalled()
  })

  it('should set isSearching to true while a request is in flight', async () => {
    const pending = deferred<SearchResult>()
    jest.mocked(weatherApi.searchCityByName).mockReturnValueOnce(pending.promise)
    const { result } = await renderHook(() => useCitySearch())

    await act(() => {
      result.current.handleInputChange('Paris')
    })
    await act(async () => {
      jest.advanceTimersByTime(500)
    })

    expect(result.current.isSearching).toBe(true)

    await act(async () => {
      pending.resolve({ data: paris, error: null })
    })

    expect(result.current.isSearching).toBe(false)
    expect(result.current.options).toEqual(paris)
  })

  it('should set isSearching to true during the debounce delay, before the request starts', async () => {
    const { result } = await renderHook(() => useCitySearch())

    await act(() => {
      result.current.handleInputChange('Paris')
    })

    expect(result.current.isSearching).toBe(true)
    expect(weatherApi.searchCityByName).not.toHaveBeenCalled()
  })

  it('should cancel a pending debounced search when the input is cleared', async () => {
    const { result } = await renderHook(() => useCitySearch())

    await act(() => {
      result.current.handleInputChange('Paris')
    })
    await act(() => {
      jest.advanceTimersByTime(300)
      result.current.handleInputChange('')
    })

    await act(async () => {
      jest.advanceTimersByTime(1000)
    })

    expect(weatherApi.searchCityByName).not.toHaveBeenCalled()
    expect(result.current.searchTerm).toBe('')
    expect(result.current.isSearching).toBe(false)
  })

  it('should abort an in-flight request and ignore its result when the input is cleared', async () => {
    const pending = deferred<SearchResult>()
    jest.mocked(weatherApi.searchCityByName).mockReturnValueOnce(pending.promise)
    const { result } = await renderHook(() => useCitySearch())

    await act(() => {
      result.current.handleInputChange('Paris')
    })
    await act(async () => {
      jest.advanceTimersByTime(500)
    })
    const signal = jest.mocked(weatherApi.searchCityByName).mock.calls[0][2] as AbortSignal

    await act(() => {
      result.current.handleInputChange('')
    })

    expect(signal.aborted).toBe(true)
    expect(result.current.isSearching).toBe(false)

    await act(async () => {
      pending.resolve({ data: paris, error: null })
    })

    expect(result.current.options).toEqual([])
  })

  it('should clear previous options and error when the input is cleared', async () => {
    jest.mocked(weatherApi.searchCityByName).mockResolvedValueOnce({
      data: null,
      error: { status: 500, message: 'Boom' },
    })
    const { result } = await renderHook(() => useCitySearch())

    await act(() => {
      result.current.handleInputChange('Paris')
    })
    await act(async () => {
      jest.advanceTimersByTime(500)
    })
    expect(result.current.searchError).toBe('Boom')

    await act(() => {
      result.current.handleInputChange('')
    })

    expect(result.current.searchError).toBeNull()
    expect(result.current.options).toEqual([])
  })

  it('should abort an older request when a newer search starts, ignoring the stale result', async () => {
    const first = deferred<SearchResult>()
    jest.mocked(weatherApi.searchCityByName)
      .mockReturnValueOnce(first.promise)
      .mockResolvedValueOnce({ data: london, error: null })

    const { result } = await renderHook(() => useCitySearch())

    await act(() => {
      result.current.handleInputChange('Paris')
    })
    await act(async () => {
      jest.advanceTimersByTime(500)
    })
    const firstSignal = jest.mocked(weatherApi.searchCityByName).mock.calls[0][2] as AbortSignal

    await act(() => {
      result.current.handleInputChange('London')
    })
    await act(async () => {
      jest.advanceTimersByTime(500)
    })

    expect(firstSignal.aborted).toBe(true)
    expect(result.current.options).toEqual(london)

    await act(async () => {
      first.resolve({ data: paris, error: null })
    })

    expect(result.current.options).toEqual(london)
  })

  it('should keep only the first result when several share the same name, state and country', async () => {
    const parisFR = { name: 'Paris', lat: 48.8566, lon: 2.3522, country: 'FR', state: 'Ile-de-France' }
    const parisFRDuplicate = { name: 'Paris', lat: 48.8589, lon: 2.32, country: 'FR', state: 'Ile-de-France' }
    const parisTX = { name: 'Paris', lat: 33.6609, lon: -95.5555, country: 'US', state: 'Texas' }
    const parisTN = { name: 'Paris', lat: 36.302, lon: -88.3267, country: 'US', state: 'Tennessee' }
    jest.mocked(weatherApi.searchCityByName).mockResolvedValueOnce({
      data: [parisFR, parisFRDuplicate, parisTX, parisTN],
      error: null,
    })
    const { result } = await renderHook(() => useCitySearch())

    await act(() => {
      result.current.handleInputChange('Paris')
    })
    await act(async () => {
      jest.advanceTimersByTime(500)
    })

    expect(result.current.options).toEqual([parisFR, parisTX, parisTN])
  })

  it('should cancel a pending search on unmount', async () => {
    const { result, unmount } = await renderHook(() => useCitySearch())

    await act(() => {
      result.current.handleInputChange('Paris')
    })
    await unmount()

    await act(async () => {
      jest.advanceTimersByTime(1000)
    })

    expect(weatherApi.searchCityByName).not.toHaveBeenCalled()
  })
})