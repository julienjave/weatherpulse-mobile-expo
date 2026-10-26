// === GLASSMORPHISM ========================================================================

import { StyleSheet } from 'react-native'

// Native glass style equivalent of the legacy MUI `sx` object.
// `backdropFilter` is not supported in React Native; use `expo-blur` BlurView if you need blur.
export const glassStyle = StyleSheet.create({
    container: {
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.5)',
        borderRadius: 12,
        // iOS shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 32,
        // Android elevation
        elevation: 8,
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
