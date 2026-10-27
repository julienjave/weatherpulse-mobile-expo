import AsyncStorage from '@react-native-async-storage/async-storage'
import { renderHook, act, waitFor } from '@testing-library/react-native'
import { useLocalStorage } from '../useLocalStorage'

describe('useLocalStorage', () => {
  const TEST_KEY = 'test_key'

  beforeEach(async () => {
    await AsyncStorage.clear()
    jest.clearAllMocks()
  })

  it('returns the initial value and becomes hydrated when nothing is stored', async () => {
    const { result } = await renderHook(() => useLocalStorage(TEST_KEY, 'default_value'))

    await waitFor(() => expect(result.current[2]).toBe(true))
    expect(result.current[0]).toBe('default_value')
  })

  it('loads the stored value after hydration', async () => {
    await AsyncStorage.setItem(TEST_KEY, JSON.stringify({ city: 'Paris' }))

    const { result } = await renderHook(() => useLocalStorage(TEST_KEY, { city: 'Default' }))

    await waitFor(() => expect(result.current[2]).toBe(true))
    expect(result.current[0]).toEqual({ city: 'Paris' })
  })

  it('updates state and persists serialized JSON', async () => {
    const { result } = await renderHook(() => useLocalStorage<string[]>(TEST_KEY, []))
    await waitFor(() => expect(result.current[2]).toBe(true))

    await act(() => result.current[1](['Paris', 'Sydney']))

    expect(result.current[0]).toEqual(['Paris', 'Sydney'])
    expect(AsyncStorage.setItem).toHaveBeenLastCalledWith(TEST_KEY, JSON.stringify(['Paris', 'Sydney']))
  })

  it('replays updates made before hydration on top of the stored value', async () => {
    await AsyncStorage.setItem(TEST_KEY, JSON.stringify(['Paris']))

    // Hold the read open so we can update while the hook is still loading
    let finishRead: (value: string | null) => void = () => {}
    jest.mocked(AsyncStorage.getItem).mockImplementationOnce(
      () => new Promise((resolve) => { finishRead = resolve })
    )

    const { result } = await renderHook(() => useLocalStorage<string[]>(TEST_KEY, []))
    expect(result.current[2]).toBe(false)

    await act(() => result.current[1]((prev) => [...prev, 'Sydney']))

    await act(async () => finishRead(JSON.stringify(['Paris'])))

    await waitFor(() => expect(result.current[2]).toBe(true))
    expect(result.current[0]).toEqual(['Paris', 'Sydney'])
    expect(AsyncStorage.setItem).toHaveBeenLastCalledWith(TEST_KEY, JSON.stringify(['Paris', 'Sydney']))
  })

  it('falls back to the initial value when the stored JSON is invalid', async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {})
    await AsyncStorage.setItem(TEST_KEY, '{not json')

    const { result } = await renderHook(() => useLocalStorage(TEST_KEY, 'default_value'))

    await waitFor(() => expect(result.current[2]).toBe(true))
    expect(result.current[0]).toBe('default_value')
  })
})
