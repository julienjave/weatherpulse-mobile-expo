import { render, screen, act, fireEvent } from '@testing-library/react-native'
import { NotificationToast } from '../NotificationToast'
import type { Notification } from '../../hooks/useNotification'

describe('NotificationToast Component', () => {
  const notification: Notification = { id: 1, message: 'City not found.', severity: 'error', open: true }

  afterEach(() => {
    jest.useRealTimers()
  })

  it('renders nothing when there is no notification', async () => {
    await render(<NotificationToast notification={null} onClose={jest.fn()} />)

    expect(screen.toJSON()).toBeNull()
  })

  it('renders the message as an alert', async () => {
    await render(<NotificationToast notification={notification} onClose={jest.fn()} />)

    expect(screen.getByRole('alert')).toHaveTextContent('City not found.')
  })

  it.each([
    ['error', '#d32f2f'],
    ['warning', '#ed6c02'],
  ] as const)('colors a %s toast like the web app (%s)', async (severity, color) => {
    await render(<NotificationToast notification={{ ...notification, severity }} onClose={jest.fn()} />)

    // The Snackbar's surface is an ancestor of the message; find the one carrying the background
    let node = screen.getByRole('alert').parent
    while (node && node.props.style?.backgroundColor === undefined) node = node.parent
    expect(node).toHaveStyle({ backgroundColor: color })
  })

  it('calls onClose when the close button is pressed', async () => {
    const onClose = jest.fn()
    await render(<NotificationToast notification={notification} onClose={onClose} />)

    await fireEvent.press(screen.getByRole('button', { name: /close/i }))

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose after the auto-hide duration', async () => {
    jest.useFakeTimers()
    const onClose = jest.fn()
    await render(<NotificationToast notification={notification} onClose={onClose} autoHideDuration={3000} />)

    // The timer starts once the 200 ms show animation has finished
    await act(() => jest.advanceTimersByTimeAsync(200))
    expect(onClose).not.toHaveBeenCalled()

    await act(() => jest.advanceTimersByTimeAsync(3000))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
