import { View, StyleSheet } from 'react-native'


// === COMPONENT: WEATHERPANELSKELETON =====================================================

// Mirrors WeatherPanel's layout so the page doesn't jump when the real data arrives
export function WeatherPanelSkeleton() {
    return (
        <View
            role="status"
            accessibilityState={{ busy: true }}
            accessibilityLabel="Loading weather data"
            style={styles.container}
        >
            {/* HEADER BAR: favorite button + units switch */}
            <View style={styles.header}>
                <View style={styles.circle} />
                <View style={styles.pill} />
            </View>

            <View style={styles.row}>
                {/* CURRENT WEATHER CARD */}
                <View style={[styles.card, styles.current]} />

                {/* METRICS + TEMPERATURE TRENDS */}
                <View style={styles.column}>
                    <View style={[styles.card, styles.metrics]} />
                    <View style={[styles.card, styles.trends]} />
                </View>
            </View>

            {/* FORECAST */}
            <View style={[styles.card, styles.forecast]} />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        padding: 8,
        borderRadius: 15,
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 8,
    },
    circle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.35)',
    },
    pill: {
        width: 90,
        height: 60,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.35)',
    },
    row: {
        flexDirection: 'column',
        gap: 8,
        width: '100%',
    },
    column: {
        gap: 8,
    },
    card: {
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.35)',
    },
    current: {
        height: 400,
    },
    metrics: {
        height: 130,
    },
    trends: {
        height: 300,
    },
    forecast: {
        height: 140,
    },
})
