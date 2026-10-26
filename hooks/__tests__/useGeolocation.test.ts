import * as Location from 'expo-location'
import { renderHook, act } from '@testing-library/react-native'
import { useGeolocation } from '../useGeolocation'

jest.mock('expo-location', () => ({
  PermissionStatus: { GRANTED: 'granted', DENIED: 'denied' },
  Accuracy: { Balanced: 3 },
  requestForegroundPermissionsAsync: jest.fn(),
  hasServicesEnabledAsync: jest.fn(),
  getLastKnownPositionAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
}))

const mockLocation = jest.mocked(Location)

const position = (latitude: number, longitude: number) =>
  ({ coords: { latitude, longitude } }) as Location.LocationObject

describe('useGeolocation', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    mockLocation.requestForegroundPermissionsAsync.mockResolvedValue(
      { status: 'granted' } as Location.LocationPermissionResponse
    )
    mockLocation.hasServicesEnabledAsync.mockResolvedValue(true)
    mockLocation.getLastKnownPositionAsync.mockResolvedValue(null)
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('returns a recent cached position without requesting a new fix', async () => {
    mockLocation.getLastKnownPositionAsync.mockResolvedValue(position(48.85, 2.35))
    const { result } = await renderHook(() => useGeolocation())

    const coords = await act(() => result.current.getLocation())

    expect(coords).toEqual({ lat: 48.85, lon: 2.35 })
    expect(result.current.coordinates).toEqual({ lat: 48.85, lon: 2.35 })
    expect(result.current.isLoading).toBe(false)
    expect(mockLocation.getLastKnownPositionAsync).toHaveBeenCalledWith({ maxAge: 300000 })
    expect(mockLocation.getCurrentPositionAsync).not.toHaveBeenCalled()
  })

  it('requests a fresh position when there is no cached one', async () => {
    mockLocation.getCurrentPositionAsync.mockResolvedValue(position(-33.87, 151.21))
    const { result } = await renderHook(() => useGeolocation())

    const coords = await act(() => result.current.getLocation())

    expect(coords).toEqual({ lat: -33.87, lon: 151.21 })
    expect(mockLocation.getCurrentPositionAsync).toHaveBeenCalledWith({ accuracy: 3 })
  })

  it('reports a denied permission', async () => {
    mockLocation.requestForegroundPermissionsAsync.mockResolvedValue(
      { status: 'denied' } as Location.LocationPermissionResponse
    )
    const { result } = await renderHook(() => useGeolocation())

    const coords = await act(() => result.current.getLocation())

    expect(coords).toBeNull()
    expect(result.current.error).toMatch(/denied/)
    expect(result.current.isLoading).toBe(false)
    expect(mockLocation.getCurrentPositionAsync).not.toHaveBeenCalled()
  })

  it('reports disabled location services', async () => {
    mockLocation.hasServicesEnabledAsync.mockResolvedValue(false)
    const { result } = await renderHook(() => useGeolocation())

    const coords = await act(() => result.current.getLocation())

    expect(coords).toBeNull()
    expect(result.current.error).toMatch(/turned off/)
  })

  it('times out after 10 seconds', async () => {
    jest.useFakeTimers()
    mockLocation.getCurrentPositionAsync.mockReturnValue(new Promise(() => {}))
    const { result } = await renderHook(() => useGeolocation())

    let request: Promise<unknown> = Promise.resolve()
    await act(async () => {
      request = result.current.getLocation()
    })
    await act(() => jest.advanceTimersByTimeAsync(10000))

    await expect(request).resolves.toBeNull()
    expect(result.current.error).toMatch(/timed out/)
    expect(result.current.isLoading).toBe(false)
  })

  it('clears coordinates and errors on reset', async () => {
    mockLocation.hasServicesEnabledAsync.mockResolvedValue(false)
    const { result } = await renderHook(() => useGeolocation())
    await act(() => result.current.getLocation())

    await act(async () => result.current.handleClearGeolocation())

    expect(result.current.error).toBeNull()
    expect(result.current.coordinates).toBeNull()
  })
})
