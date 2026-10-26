import { View, StyleSheet } from "react-native"
import { IconButton, Switch, Text, Tooltip } from "react-native-paper"
import type { TemperatureUnit } from "../types/weather"


// === TYPES & INTERFACES ==================================================================

export interface WeatherHeadBarProps {
    isFavorite: boolean
    onToggleFavorite: () => void
    units: TemperatureUnit
    onToggleUnit: () => void
    isFavoritesFull?: boolean
}


// === COMPONENT: WEATHERHEADERBAR =========================================================

export function WeatherHeaderBar({
    isFavorite,
    onToggleFavorite,
    units,
    onToggleUnit,
    isFavoritesFull = false
}: WeatherHeadBarProps) {

    // Removing is always allowed; adding is blocked once the favorites limit is reached
    const isAddDisabled = !isFavorite && isFavoritesFull
    const favoriteTooltip = isFavorite
        ? 'Remove from Favorites'
        : isAddDisabled ? 'Favorites limit reached' : 'Add to Favorites'

    return (
        <View style={styles.container}>
            {/* ADD TO FAVORITES BUTTON */}
            <Tooltip title={favoriteTooltip}>
                <View style={styles.favoriteButton}>
                    <IconButton
                        icon={isFavorite ? 'star' : 'star-outline'}
                        iconColor="#faac1b"
                        onPress={onToggleFavorite}
                        disabled={isAddDisabled}
                        accessibilityLabel={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                    />
                </View>
            </Tooltip>

            {/* UNITS SWITCH */}
            <View style={styles.unitsCard}>
                <Text style={styles.unitsLabel}>Units</Text>
                <View style={styles.switchRow}>
                    <Text style={styles.switchLabel}>°F</Text>
                    <Switch
                        value={units === 'metric'}
                        onValueChange={onToggleUnit}
                        accessibilityLabel="Toggle temperature units"
                    />
                    <Text style={styles.switchLabel}>°C</Text>
                </View>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 8,
    },
    favoriteButton: {
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    unitsCard: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 'auto',
        padding: 8,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    unitsLabel: {
        fontWeight: 'bold',
    },
    switchRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    switchLabel: {
        fontSize: 12,
    },
})
