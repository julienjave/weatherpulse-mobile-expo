import { renderHook, act } from '@testing-library/react-native'
import { useNotification } from '../useNotification'

describe('useNotification', () => {
  it('should initialize with no notification', async () => {
    const { result } = await renderHook(() => useNotification())

    expect(result.current.notification).toBeNull()
  })

  it('should open a notification with the given message and severity', async () => {
    const { result } = await renderHook(() => useNotification())

    await act(() => {
      result.current.notify('City not found.', 'warning')
    })

    expect(result.current.notification).toMatchObject({ message: 'City not found.', severity: 'warning', open: true })
  })

  it('should default severity to error', async () => {
    const { result } = await renderHook(() => useNotification())

    await act(() => {
      result.current.notify('Request timed out.')
    })

    expect(result.current.notification?.severity).toBe('error')
  })

  it('should give each notification a new id, even for a repeated message', async () => {
    const { result } = await renderHook(() => useNotification())

    await act(() => {
      result.current.notify('Request timed out.')
    })
    const firstId = result.current.notification?.id

    await act(() => {
      result.current.notify('Request timed out.')
    })

    expect(result.current.notification?.id).not.toBe(firstId)
  })

  it('should close the notification but keep its message for the exit transition', async () => {
    const { result } = await renderHook(() => useNotification())

    await act(() => {
      result.current.notify('Request timed out.')
    })
    await act(() => {
      result.current.dismiss()
    })

    expect(result.current.notification).toMatchObject({ message: 'Request timed out.', open: false })
  })
})
