// === APP FONTS ============================================================================

// Outfit, loaded in app/_layout.tsx. Each weight is its own family: on Android, `fontWeight`
// does not switch a custom font to its bold file, so pick the family instead of setting weight
export const FONTS = {
    regular: 'Outfit_400Regular',
    bold: 'Outfit_700Bold',
} as const
