import { getIconUrl } from '../weatherIcons'
import { getWeatherIcon } from '../weatherThemes'

// On native, getIconUrl returns a bundled image source (`require(...)`), which jest-expo
// stubs as `{ testUri: '<path to the file>' }`. Assert on that path.
const assetPath = (source: unknown): string => (source as { testUri: string }).testUri

describe('weatherIcons', () => {
  describe('getIconUrl', () => {
    it('should resolve a known icon file to its bundled asset', () => {
      expect(assetPath(getIconUrl('rain.png'))).toMatch(/icons\/rain\.png$/)
      expect(assetPath(getIconUrl('partly-cloudy-night.png'))).toMatch(/icons\/partly-cloudy-night\.png$/)
    })

    it('should accept a full path and use only its filename', () => {
      expect(assetPath(getIconUrl('/some/dir/snow.png'))).toMatch(/icons\/snow\.png$/)
    })

    it('should fall back to the clear-day icon for an unknown file', () => {
      const fallback = getIconUrl('clear-day.png')
      expect(assetPath(fallback)).toMatch(/icons\/clear-day\.png$/)
      expect(getIconUrl('does-not-exist.png')).toBe(fallback)
      expect(getIconUrl('rain.svg')).toBe(fallback)
    })

    // Guards against getWeatherIcon returning a filename with no matching asset,
    // which would silently render the clear-day fallback
    it('should have a bundled asset for every icon getWeatherIcon can return', () => {
      const icons = new Set<string>()
      for (let code = 200; code < 900; code++) {
        icons.add(getWeatherIcon(code, '01d'))
        icons.add(getWeatherIcon(code, '01n'))
      }

      const missing = [...icons].filter((icon) => !assetPath(getIconUrl(icon)).endsWith(`icons/${icon}`))
      expect(missing).toEqual([])
    })
  })
})
