import { useState, useCallback, useEffect } from "react"
import {
    View,
    ActivityIndicator,
    StyleSheet,
} from 'react-native'
import {
    TextInput,
    IconButton,
    Button,
    SegmentedButtons,
    Text,
    Tooltip,
} from 'react-native-paper'
import { useCitySearch } from "../hooks/useCitySearch"
import { getReverseGeocode } from '../services/weatherApi'
import { formatCountryName } from "../utils/formatCountry"
import { PANEL_STYLE } from "../utils/glassStyles"
import type { GeocodingLocation } from "../types/weather"


// === TYPES & INTERFACES ==================================================================

type SearchMode = 'city' | 'coords'

interface SearchBarProps {
    // Function that passes a selected GeocodingLocation back up to App
    onSelectLocation: (location: GeocodingLocation) => void
    // Function that triggers device geolocation
    onUseMyLocation: () => void
    // Function that resets state values
    onClear: () => void
    // Boolean flag from useGeolocation to show a spinner on the GPS button (Optional)
    isGeoloading?: boolean
    // Function that reports city search failures to the toast notifications (Optional)
    onError?: (message: string) => void
}


// === COMPONENT: SEARCHBAR ================================================================

export const SearchBar: React.FC<SearchBarProps> = ({
    onSelectLocation,
    onUseMyLocation,
    onClear,
    isGeoloading = false,
    onError
}) => {
    // 1. STATE VARIABLES

    const [searchMode, setSearchMode] = useState<SearchMode>('city')
    const [latInput, setLatInput] = useState<string>('')
    const [lonInput, setLonInput] = useState<string>('')
    const [isReverseGeocoding, setIsReverseGeoCoding] = useState<boolean>(false)
    const [coordError, setCoordError] = useState<string | null>(null)
    const [dropdownOpen, setDropdownOpen] = useState<boolean>(false)

    // 2. HOOKS

    const { 
        searchTerm,
        handleInputChange, 
        options, 
        isSearching, 
        searchError 
    } = useCitySearch()

    // Forward search failures (network, API) to the toast notifications
    useEffect(() => {
        if (searchError) onError?.(searchError)
    }, [searchError, onError])

    // 3. HANDLERS

    // Handler 1: Toggle Mode Switch
    const handleModeChange = useCallback((newMode: string) => {
        setSearchMode(newMode as SearchMode)
        setCoordError(null)
    }, [])

    // Handler 2: Submit Direct Coordinates
    const handleCoordsSubmit = useCallback(async () => {
        // Parse latInput and lonInput to floating-point numbers.
        const lat: number = parseFloat(latInput)
        const lon: number = parseFloat(lonInput)

        // Validate latitude (-90 to 90) and longitude (-180 to 180).
        if(isNaN(lat) || lat < -90 || lat > 90) {
            setCoordError(`Latitude must be between -90 and 90`)
            return
        }
        if(isNaN(lon) || lon < -180 || lon > 180) {
            setCoordError(`Longitude must be between -180 and 180`)
            return
        }

        // Reset error and set isReverseGeocoding to true
        setCoordError(null)
        setIsReverseGeoCoding(true)

        try {
            // Get location data from reverse geocoding
            const { data, error } = await getReverseGeocode(lat, lon)
    
            if(error || !data || data.length === 0) {
                // Graceful fallback to coordinate label if reverse lookup fails or returns empty
                onSelectLocation({
                    name: `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`,
                    lat,
                    lon,
                    country: ''
                })
                return
            }
    
            // Use the first location match returned by OpenWeatherMap
            onSelectLocation(data[0])
            
        } catch {
            setCoordError('Failed to resolve coordinates. Please try again.')
        } finally {
            // Update reverse geocoding state once done
            setIsReverseGeoCoding(false)
        }


    }, [latInput, lonInput, onSelectLocation])

    // Handler 3: Clear search fields
    const handleClearSearch = useCallback(() => {
        setLatInput('')
        setLonInput('')
        setCoordError(null)
        setDropdownOpen(false)
        onClear()
        handleInputChange('')
    }, [handleInputChange, onClear])

    // Handler 4: Select a city from the dropdown
    const handleSelectCity = useCallback((option: GeocodingLocation) => {
        setDropdownOpen(false)
        onSelectLocation(option)
    }, [onSelectLocation])

    // Handler 5: City search input change
    const handleCityInputChange = useCallback((value: string) => {
        handleInputChange(value)
        setDropdownOpen(value.trim().length >= 2)
    }, [handleInputChange])

    // 4. RENDER

    const modeButtons = [
        { value: 'city', label: 'City', icon: 'magnify' as const, testID: 'mode-city' },
        { value: 'coords', label: 'Coordinates', icon: 'map-marker' as const, testID: 'mode-coords' },
    ]

    const noOptionsText = searchTerm.trim().length >= 2
        ? `No cities found for "${searchTerm.trim()}"`
        : 'Type at least 2 characters'

    return (
        <View style={styles.outer}>
            <View style={styles.paper}>
                
                {/* ROW 1: Header Controls: Search Mode Toggle & Location Button */}
                <View style={styles.headerRow}>
                    <View style={styles.headerLeft}>
                        {/* SegmentedButtons: City vs Coordinates */}
                        <SegmentedButtons
                            value={searchMode}
                            onValueChange={handleModeChange}
                            buttons={modeButtons}
                            style={styles.segmentedButtons}
                        />

                        {/* Tooltip + IconButton (MyLocationIcon): Triggers onUseMyLocation */}
                        <Tooltip title="Use current location">
                            <View>
                                {isGeoloading ? (
                                    <ActivityIndicator
                                        size="small"
                                        style={styles.locationLoader}
                                        accessibilityLabel="use my location"
                                        accessibilityState={{ busy: true }}
                                    />
                                ) : (
                                    <IconButton
                                        icon="crosshairs-gps"
                                        mode="contained"
                                        onPress={onUseMyLocation}
                                        accessibilityLabel="use my location"
                                    />
                                )}
                            </View>
                        </Tooltip>
                    </View>
                    <Button
                        mode="contained"
                        onPress={handleClearSearch}
                        style={styles.clearButton}
                    >
                        Clear
                    </Button>
                </View>

                {/* ROW 2A: Mode 1 - City Autocomplete Search */}
                {searchMode === 'city' && (
                    <View>
                        <TextInput
                            label="Search City..."
                            mode="outlined"
                            value={searchTerm}
                            onChangeText={handleCityInputChange}
                            onFocus={() => setDropdownOpen(searchTerm.trim().length >= 2 && options.length > 0)}
                            right={isSearching ? <TextInput.Icon icon={() => <ActivityIndicator size="small" />} /> : undefined}
                            accessibilityLabel="Search city"
                            testID="search-city-input"
                        />
                        {dropdownOpen && (
                            <View style={styles.dropdown}>
                                {options.length === 0 ? (
                                    <Text style={styles.noOptions}>{noOptionsText}</Text>
                                ) : (
                                    // A plain map, not a FlatList: the search returns at most 5 cities, and a
                                    // virtualized list can't be nested inside the screen's ScrollView
                                    options.map((item) => {
                                        const country = formatCountryName(item.country)
                                        const state = item.state ? `, ${item.state}` : ''
                                        const label = `${item.name}${state}, ${country}`
                                        return (
                                            <Button
                                                key={`${item.lat},${item.lon}`}
                                                mode="text"
                                                onPress={() => handleSelectCity(item)}
                                                style={styles.optionButton}
                                                labelStyle={styles.optionLabel}
                                                icon="map-marker"
                                            >
                                                {label}
                                            </Button>
                                        )
                                    })
                                )}
                            </View>
                        )}
                    </View>
                )}

                {/* ROW 2B: Mode 2 - Direct Coordinate Inputs */}
                {searchMode === 'coords' && (
                    <View style={styles.coordsRow}>
                        <TextInput
                            label="Latitude (-90 to 90)"
                            mode="outlined"
                            dense
                            style={styles.coordInput}
                            keyboardType="numeric"
                            value={latInput}
                            onChangeText={setLatInput}
                            accessibilityLabel="Latitude"
                            testID="latitude-input"
                        />
                        <TextInput
                            label="Longitude (-180 to 180)"
                            mode="outlined"
                            dense
                            style={styles.coordInput}
                            keyboardType="numeric"
                            value={lonInput}
                            onChangeText={setLonInput}
                            accessibilityLabel="Longitude"
                            testID="longitude-input"
                        />
                        <Button
                            mode="contained"
                            onPress={handleCoordsSubmit}
                            disabled={isReverseGeocoding}
                            loading={isReverseGeocoding}
                            style={styles.goButton}
                        >
                            Go
                        </Button>
                    </View>
                )}

                {/* ROW 3: Coordinate validation feedback */}
                {coordError && (
                    <Text style={styles.errorText}>{coordError}</Text>
                )}

            </View>
        </View>
    )

}

const styles = StyleSheet.create({
    outer: {
        maxWidth: 700,
        alignSelf: 'center',
        marginBottom: 24,
        width: '100%',
    },
    paper: {
        padding: 16,
        borderRadius: 12,
        ...PANEL_STYLE,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
        gap: 8,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flex: 1,
    },
    segmentedButtons: {
        flex: 1,
    },
    locationLoader: {
        padding: 12,
    },
    clearButton: {
        alignSelf: 'center',
    },
    dropdown: {
        marginTop: 4,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.12)', // Separates the list from the white panel behind it
        borderRadius: 8,
        paddingVertical: 4,
    },
    noOptions: {
        padding: 12,
        textAlign: 'center',
    },
    optionButton: {
        justifyContent: 'flex-start',
        borderRadius: 0,
    },
    optionLabel: {
        fontSize: 14,
    },
    coordsRow: {
        flexDirection: 'column',
        gap: 12,
        alignItems: 'stretch',
    },
    coordInput: {
        flex: 1,
    },
    goButton: {
        alignSelf: 'flex-start',
    },
    errorText: {
        color: '#c62828',
        marginTop: 8,
    },
})
