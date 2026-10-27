import { View, StyleSheet } from "react-native"
import { Chip, Text } from "react-native-paper"
import Animated, { LinearTransition, FadeIn, FadeOut } from "react-native-reanimated"
import type { GeocodingLocation } from "../types/weather"
import { isSameLocation } from "../utils/compareCities"
import { PANEL_STYLE } from "../utils/glassStyles"


// === TYPES & INTERFACES ==================================================================

interface FavoritesBarProps {
    favorites: GeocodingLocation[]
    selectedCity: GeocodingLocation | null
    onSelect: (city: GeocodingLocation) => void
    onDelete: (city: GeocodingLocation) => void
    // True while saved favorites are still loading, so the empty placeholder doesn't flash (Optional)
    isLoading?: boolean
}


// === COMPONENT: FAVORITESBAR =============================================================

export function FavoritesBar({
    favorites,
    selectedCity,
    onSelect,
    onDelete,
    isLoading = false
}: FavoritesBarProps) {

    return (
        <View style={styles.outer}>
            <View style={styles.paper}>
                <View
                    accessibilityRole="navigation"
                    accessibilityLabel="Favorite cities"
                    style={styles.chipRow}
                >
                    {/* Row keeps its minHeight while loading, so nothing jumps when favorites arrive */}
                    {isLoading ? null : favorites.length === 0 ? (
                        <Text style={styles.placeholder}>No favorites yet</Text>
                    ) : (
                        favorites.map((city) => {
                            const isActive = selectedCity !== null && isSameLocation(city, selectedCity)
                            const label = city.country ? `${city.name}, ${city.country}` : city.name

                            return (
                                <Animated.View
                                    key={`${city.lat},${city.lon}`}
                                    layout={LinearTransition}
                                    entering={FadeIn}
                                    exiting={FadeOut}
                                >
                                    {/* Outlined when idle, filled blue when active (like the web app's MUI chips) */}
                                    <Chip
                                        icon="star"
                                        mode={isActive ? 'flat' : 'outlined'}
                                        selected={isActive}
                                        selectedColor={isActive ? '#fff' : undefined}
                                        showSelectedCheck={false}
                                        onPress={() => onSelect(city)}
                                        onClose={() => onDelete(city)}
                                        // Paper's default is "Close" on every chip; name the city instead
                                        closeIconAccessibilityLabel={`Remove ${label}`}
                                        accessibilityState={{ selected: isActive }}
                                        accessibilityLabel={label}
                                        style={isActive ? styles.activeChip : undefined}
                                    >
                                        {label}
                                    </Chip>
                                </Animated.View>
                            )
                        })
                    )}
                </View>
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
        padding: 12,
        borderRadius: 12,
        ...PANEL_STYLE,
    },
    chipRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 32,
    },
    activeChip: {
        backgroundColor: '#1976d2',
    },
    placeholder: {
        fontSize: 12,
        color: 'rgba(0, 0, 0, 0.6)',
    },
})
