// TEMP: dev-only preview of every weather theme, for tuning gradients. Delete when done.
import { View, Text, Image, StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { getWeatherThemeKit } from '../utils/weatherThemes'
import { getIconUrl } from '../utils/weatherIcons'
import { glassStyle } from '../utils/glassStyles'

// One representative OpenWeatherMap condition per theme, so this goes through the real mapping
// and picks up edits to `THEMES` via hot reload
const SAMPLES: { label: string, conditionId: number, iconCode: string }[] = [
    { label: 'Clear (day)',     conditionId: 800, iconCode: '01d' },
    { label: 'Clear (night)',   conditionId: 800, iconCode: '01n' },
    { label: 'Partly cloudy',   conditionId: 801, iconCode: '02d' },
    { label: 'Clouds',          conditionId: 804, iconCode: '04d' },
    { label: 'Rain',            conditionId: 501, iconCode: '10d' },
    { label: 'Drizzle',         conditionId: 300, iconCode: '09d' },
    { label: 'Thunderstorm',    conditionId: 211, iconCode: '11d' },
    { label: 'Snow',            conditionId: 601, iconCode: '13d' },
    { label: 'Atmosphere',      conditionId: 741, iconCode: '50d' },
]

export function ThemePreview() {
    return (
        <View style={styles.grid}>
            {SAMPLES.map(({ label, conditionId, iconCode }) => {
                const { theme, icon } = getWeatherThemeKit(conditionId, iconCode)
                const textColor = theme.isDark ? '#fff' : '#000'

                return (
                    <LinearGradient
                        key={label}
                        colors={theme.colors as [string, string, ...string[]]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.card}
                    >
                        {/* Bare text straight on the gradient, like CurrentWeatherCard */}
                        <View style={styles.row}>
                            <Image source={{ uri: getIconUrl(icon) }} style={styles.icon} resizeMode="contain" />
                            <View>
                                <Text style={[styles.title, { color: textColor }]}>{label}</Text>
                                <Text style={[styles.caption, { color: textColor }]}>
                                    {theme.key} · isDark: {String(theme.isDark)}
                                </Text>
                            </View>
                        </View>

                        {/* Glass card on the gradient, like the metrics/forecast cards */}
                        <View style={[glassStyle.container, { padding: 8 }]}>
                            <Text style={[styles.temp, { color: textColor }]}>21°C</Text>
                            <Text style={[styles.caption, { color: textColor }]}>Humidity 64% · Wind 3.2 m/s</Text>
                        </View>

                        <Text style={[styles.gradientString, { color: textColor }]}>
                            {theme.gradient}
                        </Text>
                    </LinearGradient>
                )
            })}
        </View>
    )
}

const styles = StyleSheet.create({
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
        marginBottom: 32,
    },
    card: {
        padding: 8,
        borderRadius: 15,
        flex: 1,
        minWidth: 260,
        flexDirection: 'column',
        gap: 8,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    icon: {
        width: 64,
        height: 64,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    caption: {
        fontSize: 12,
    },
    temp: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    gradientString: {
        fontFamily: 'monospace',
        fontSize: 10,
        opacity: 0.8,
    },
})
