import AsyncStorage from '@react-native-async-storage/async-storage'
import { renderHook, act, waitFor } from '@testing-library/react-native'
import { useFavorites, FAVORITES_STORAGE_KEY, MAX_FAVORITES } from '../useFavorites'
import type { GeocodingLocation } from '../../types/weather'

const PARIS: GeocodingLocation = { name: 'Paris', lat: 48.8566, lon: 2.3522, country: 'FR' }
const LONDON: GeocodingLocation = { name: 'London', lat: 51.5074, lon: -0.1278, country: 'GB' }

// Favorites load from AsyncStorage asynchronously: render, then wait until they're in
async function renderLoaded() {
  const rendered = await renderHook(() => useFavorites())
  await waitFor(() => expect(rendered.result.current.isLoaded).toBe(true))
  return rendered
}

const readStored = async () => JSON.parse((await AsyncStorage.getItem(FAVORITES_STORAGE_KEY)) ?? 'null')

describe('useFavorites', () => {
  beforeEach(async () => {
    await AsyncStorage.clear()
  })

  it('should start with an empty list when nothing is stored', async () => {
    const { result } = await renderLoaded()

    expect(result.current.favorites).toEqual([])
    expect(result.current.isFavorite(PARIS)).toBe(false)
  })

  it('should report isLoaded only once stored favorites have been read', async () => {
    // Hold the storage read open (the in-memory mock would otherwise resolve during render)
    let finishRead: (value: string | null) => void = () => {}
    jest.mocked(AsyncStorage.getItem).mockImplementationOnce(
      () => new Promise((resolve) => { finishRead = resolve })
    )
    const { result } = await renderHook(() => useFavorites())

    expect(result.current.isLoaded).toBe(false)
    expect(result.current.favorites).toEqual([])

    await act(async () => finishRead(JSON.stringify([PARIS])))

    await waitFor(() => expect(result.current.isLoaded).toBe(true))
    expect(result.current.favorites).toEqual([PARIS])
  })

  it('should load existing favorites from storage', async () => {
    await AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify([PARIS]))

    const { result } = await renderLoaded()

    expect(result.current.favorites).toEqual([PARIS])
    expect(result.current.isFavorite(PARIS)).toBe(true)
  })

  it('should add a city when toggled and persist it', async () => {
    const { result } = await renderLoaded()

    await act(() => {
      result.current.toggleFavorite(PARIS)
    })

    expect(result.current.favorites).toEqual([PARIS])
    expect(result.current.isFavorite(PARIS)).toBe(true)
    expect(await readStored()).toEqual([PARIS])
  })

  it('should remove a city when toggled twice', async () => {
    const { result } = await renderLoaded()

    await act(() => {
      result.current.toggleFavorite(PARIS)
    })
    await act(() => {
      result.current.toggleFavorite(PARIS)
    })

    expect(result.current.favorites).toEqual([])
    expect(result.current.isFavorite(PARIS)).toBe(false)
    expect(await readStored()).toEqual([])
  })

  it('should keep stored favorites when a city is toggled before they finish loading', async () => {
    await AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify([PARIS]))
    const { result } = await renderHook(() => useFavorites())

    await act(() => {
      result.current.toggleFavorite(LONDON)
    })

    await waitFor(() => expect(result.current.isLoaded).toBe(true))
    expect(result.current.favorites).toEqual([PARIS, LONDON])
    expect(await readStored()).toEqual([PARIS, LONDON])
  })

  it('should treat cities with near-identical coordinates as the same city', async () => {
    const { result } = await renderLoaded()
    const parisFromReverseGeocode = { ...PARIS, name: 'Paris 1er', lat: 48.8571, lon: 2.3518 }

    await act(() => {
      result.current.toggleFavorite(PARIS)
    })

    expect(result.current.isFavorite(parisFromReverseGeocode)).toBe(true)
  })

  it('should remove only the given city with removeFavorite', async () => {
    await AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify([PARIS, LONDON]))
    const { result } = await renderLoaded()

    await act(() => {
      result.current.removeFavorite(PARIS)
    })

    expect(result.current.favorites).toEqual([LONDON])
  })

  it('should not add more than MAX_FAVORITES cities but still allow removing', async () => {
    const cities = Array.from({ length: MAX_FAVORITES }, (_, i) => ({ ...PARIS, name: `City ${i}`, lat: i, lon: i }))
    await AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(cities))
    const { result } = await renderLoaded()

    expect(result.current.isFull).toBe(true)

    await act(() => {
      result.current.toggleFavorite(LONDON)
    })
    expect(result.current.favorites).toHaveLength(MAX_FAVORITES)
    expect(result.current.isFavorite(LONDON)).toBe(false)

    await act(() => {
      result.current.toggleFavorite(cities[0])
    })
    expect(result.current.favorites).toHaveLength(MAX_FAVORITES - 1)
    expect(result.current.isFull).toBe(false)
  })

  it('should return false from isFavorite when given null', async () => {
    const { result } = await renderLoaded()

    expect(result.current.isFavorite(null)).toBe(false)
  })
})
