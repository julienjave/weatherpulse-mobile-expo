import { StyleSheet, type ViewStyle } from 'react-native'


// === SOLID PANEL ==========================================================================

// Shadows use `boxShadow` rather than `elevation` / `shadow*`. Like CSS, it is only drawn outside
// the view's border box. The legacy native shadows also fill in behind the view, which shows up
// as a gray rectangle through any translucent background. (Needs Android 9+; none below that.)

// Opaque white card with a soft shadow, for controls like search, favorites and the header bar.
// Matches the web app, where these used MUI's default Paper at elevation 3 (same shadow string)
export const PANEL_STYLE: ViewStyle = {
    backgroundColor: '#fff',
    boxShadow: '0px 3px 3px -2px rgba(0, 0, 0, 0.2), 0px 3px 4px 0px rgba(0, 0, 0, 0.14), 0px 1px 8px 0px rgba(0, 0, 0, 0.12)',
}


// === GLASSMORPHISM ========================================================================

// Native glass style equivalent of the legacy MUI `sx` object, for cards on the weather gradient.
// There's no backdrop blur: blurring a smooth gradient looks the same as not blurring it, and
// on Android expo-blur would need a BlurTargetView, so the translucent fill does the work.
export const glassStyle = StyleSheet.create({
    container: {
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.5)',
        borderRadius: 12,
        boxShadow: '0px 8px 32px rgba(0, 0, 0, 0.25)', // Same as the web app's glassSx
    },
})

// Kept for compatibility with any remaining web references, but new code should use `glassStyle`.
export const glassSx = {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    backgroundImage: 'none',
    backdropFilter: 'blur(10px) saturate(160%)',
    WebkitBackdropFilter: 'blur(10px) saturate(160%)',
    border: '1px solid rgba(255, 255, 255, 0.5)',
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)',
}
