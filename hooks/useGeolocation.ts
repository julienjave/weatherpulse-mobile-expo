import { useState, useCallback } from "react"
import * as Location from "expo-location"


// === TYPES & INTERFACES ================================================================

export interface Coordinates {
    lat: number
    lon: number
}


// === CONSTANTS =========================================================================

const POSITION_MAX_AGE_MS = 300000  // Reuse a fix up to 5 minutes old instead of waiting for a new one
const POSITION_TIMEOUT_MS = 10000   // expo-location has no timeout option, so we race the request

const MESSAGES = {
    permissionDenied: 'Location access was denied. Please allow location permissions in your device settings.',
    servicesDisabled: 'Location services are turned off. Please enable them in your device settings.',
    timeout: 'Location request timed out. Please try again.',
    unavailable: 'Location information is unavailable. Please check your device settings.',
}


// === HELPER FUNCTION ===================================================================

class LocationTimeoutError extends Error {
    name = 'LocationTimeoutError'
}

/**
 * Resolves with the result of `promise`, or rejects with a LocationTimeoutError after `ms`.
 */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    let timeoutId: ReturnType<typeof setTimeout> | undefined
    const timeout = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => reject(new LocationTimeoutError()), ms)
    })

    return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId))
}


// === USEGEOLOCATION ====================================================================

export function useGeolocation() {
    // 1. STATE VARIABLES
    const [coordinates, setCoordinates] = useState<Coordinates | null>(null)
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [error, setError] = useState<string | null>(null)

    // 2. PRIMARY FUNCTION: getLocation
    // Wrap in useCallback so its reference remains stable.
    // Resolves with null (and sets `error`) on failure, so callers never have to catch.
    const getLocation = useCallback(async (): Promise<Coordinates | null> => {
        // A. Set loading state & reset error
        setIsLoading(true)
        setError(null)

        try {
            // B. Ask for permission (no prompt is shown if it was already granted)
            const { status } = await Location.requestForegroundPermissionsAsync()
            if(status !== Location.PermissionStatus.GRANTED) {
                setError(MESSAGES.permissionDenied)
                return null
            }

            // C. Check that the device's location services are switched on
            if(!(await Location.hasServicesEnabledAsync())) {
                setError(MESSAGES.servicesDisabled)
                return null
            }

            // D. Prefer a recent cached fix, otherwise request a fresh one
            const position =
                await Location.getLastKnownPositionAsync({ maxAge: POSITION_MAX_AGE_MS }) ??
                await withTimeout(
                    Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
                    POSITION_TIMEOUT_MS
                )

            const coords: Coordinates = {
                lat: position.coords.latitude,
                lon: position.coords.longitude
            }
            setCoordinates(coords)
            return coords

        } catch (err) {
            setError(err instanceof LocationTimeoutError ? MESSAGES.timeout : MESSAGES.unavailable)
            return null

        } finally {
            setIsLoading(false)
        }
    }, [])

    // 3. HANDLER: RESET
    const handleClearGeolocation = useCallback(() => {
        setCoordinates(null)
        setIsLoading(false)
        setError(null)
    },[])

    // 4. RETURN HOOK INTERFACE
    return {
        coordinates,
        isLoading,
        error,
        getLocation,
        handleClearGeolocation
    }
}
