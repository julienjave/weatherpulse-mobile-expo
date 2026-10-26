import { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type SetValue<T> = T | ((val: T) => T);

function applyUpdate<T>(current: T, value: SetValue<T>): T {
    return typeof value === 'function'
        ? (value as (val: T) => T)(current)
        : value;
}

// === USELOCALSTORAGE (React Native / AsyncStorage version) ============================
/**
 * Custom hook that acts like React's useState,
 * but synchronizes its value with AsyncStorage in a safe, reactive way for Expo/React Native.
 *
 * AsyncStorage is asynchronous, so the first render uses `initialValue` and the stored value
 * arrives shortly after. Updates made before then are queued and replayed on top of the
 * stored value, so they are never lost or overwritten. `isHydrated` turns true once loaded.
 */

export function useLocalStorage<T>(
    key: string,
    initialValue: T | (() => T)
): [T, (value: SetValue<T>) => void, boolean] {
    // 1. RESOLVE INITIAL VALUE SYNCHRONOUSLY FOR FIRST RENDER
    const getInitialValue = (): T => {
        return typeof initialValue === 'function'
            ? (initialValue as () => T)()
            : initialValue;
    };

    const [storedValue, setStoredValue] = useState<T>(getInitialValue);
    const [isHydrated, setIsHydrated] = useState<boolean>(false);

    // Refs (not state) so `setValue` sees the latest values without changing identity
    const isHydratedRef = useRef<boolean>(false);
    const pendingUpdatesRef = useRef<SetValue<T>[]>([]);

    // 2. PERSIST HELPER
    const persist = useCallback((value: T) => {
        AsyncStorage.setItem(key, JSON.stringify(value))
            .catch((error) => {
                console.warn(`Error setting AsyncStorage key "${key}":`, error);
            });
    }, [key]);

    // 3. LOAD STORED VALUE FROM ASYNCSTORAGE ON MOUNT
    useEffect(() => {
        let isMounted = true;
        isHydratedRef.current = false;
        setIsHydrated(false);

        AsyncStorage.getItem(key)
            .then((item): { value: T } | null => {
                if (item === null) return null;
                try {
                    return { value: JSON.parse(item) as T };
                } catch (error) {
                    console.warn(`Error parsing AsyncStorage key "${key}":`, error);
                    return null;
                }
            })
            .catch((error) => {
                console.warn(`Error reading AsyncStorage key "${key}":`, error);
                return null;
            })
            .then((stored) => {
                if (!isMounted) return;

                // Replay anything the user did while we were loading on top of the stored value
                const pendingUpdates = pendingUpdatesRef.current;
                pendingUpdatesRef.current = [];
                isHydratedRef.current = true;

                setStoredValue((currentStoredValue) => {
                    const base = stored ? stored.value : currentStoredValue;
                    if (pendingUpdates.length === 0) return base;

                    const next = pendingUpdates.reduce<T>(applyUpdate, base);
                    persist(next);
                    return next;
                });
                setIsHydrated(true);
            });

        return () => {
            isMounted = false;
        };
    }, [key, persist]);

    // 4. SETTER FUNCTION
    // Wrap in useCallback to ensure a stable reference and persist asynchronously
    const setValue = useCallback((value: SetValue<T>) => {
        // Not loaded yet: queue the update so the stored value doesn't overwrite it
        if (!isHydratedRef.current) {
            pendingUpdatesRef.current.push(value);
            return;
        }

        setStoredValue((currentStoredValue) => {
            const valueToStore = applyUpdate(currentStoredValue, value);
            persist(valueToStore);
            return valueToStore;
        });
    }, [persist]);

    // 5. RETURN TUPLE (STATE, SETTER & HYDRATION FLAG)
    return [storedValue, setValue, isHydrated];
}
