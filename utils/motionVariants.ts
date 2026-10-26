// === SHARED ANIMATION TOKENS =============================================================

// One easing curve and a couple of durations so every animation in the app feels related
export const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1]
export const DURATION_FAST = 200
export const DURATION_BASE = 400


// === LEGACY FRAMER-MOTION VARIANTS (kept for reference) ===================================

// These objects were originally Framer Motion `Variants`. After migrating to
// react-native-reanimated, components use the entering/exiting/layout props directly.
// The objects below are retained only so any remaining imports do not break.

export const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { duration: DURATION_FAST, staggerChildren: 0.08 }
    },
    exit: { opacity: 0, transition: { duration: DURATION_FAST } }
} as const

export const fadeSlideUp = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: DURATION_BASE } },
    exit: { opacity: 0, y: 16, transition: { duration: DURATION_FAST } }
} as const

export const fade = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: DURATION_FAST } },
    exit: { opacity: 0, transition: { duration: DURATION_FAST } }
} as const
