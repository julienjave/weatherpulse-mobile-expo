/**
 * Converts a 2-letter ISO country code into a full country name.
 * Uses the built-in Intl.DisplayNames API for a zero-dependency lookup. If the JS engine
 * doesn't provide it, the code itself is returned (e.g. "FR"), so labels still read sensibly.
 * 
 * @param countryCode - 2-letter ISO country code (e.g., "GB", "US", "JP")
 * @param locale - BCP 47 language tag (defaults to "en" for English)
 * @returns Full country name (e.g., "United Kingdom") or original code if invalid
 */
export function formatCountryName(countryCode: string, locale: string = 'en'): string {
    if(!countryCode) return ''

    try {
        const regionNames = new Intl.DisplayNames([locale], { type: "region" })
        return regionNames.of(countryCode.toUpperCase()) || countryCode.toUpperCase()
    } catch (error) {
        // Fallback to raw code if an invalid code or unsupported environment is passed
        return countryCode.toUpperCase()
    }
}
