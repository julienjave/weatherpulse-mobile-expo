import { render, screen, waitFor } from '@testing-library/react-native'
import { AnimatedText } from '../AnimatedText'

describe('AnimatedText Component', () => {
  it('renders the given text', async () => {
    await render(<AnimatedText text="22°C" />)

    expect(screen.getByText('22°C')).toBeOnTheScreen()
  })

  it('swaps to the new text when it changes and removes the old one', async () => {
    const { rerender } = await render(<AnimatedText text="22°C" />)

    await rerender(<AnimatedText text="72°F" />)

    expect(screen.getByText('72°F')).toBeOnTheScreen()
    await waitFor(() => expect(screen.queryByText('22°C')).not.toBeOnTheScreen())
  })

  it('keeps the same element when re-rendered with unchanged text', async () => {
    const { rerender } = await render(<AnimatedText text="22°C" />)
    const before = screen.getByText('22°C')

    await rerender(<AnimatedText text="22°C" />)

    expect(screen.getByText('22°C')).toBe(before)
  })
})
