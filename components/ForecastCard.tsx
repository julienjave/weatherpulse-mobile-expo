import {
    View,
    Text,
    Image,
    StyleSheet,
    useWindowDimensions,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import type { TemperatureUnit } from '../types/weather'
import { type DailyForecastSummary } from '../utils/aggregateForecast'
import { getIconUrl } from '../utils/weatherIcons'
import { glassStyle } from '../utils/glassStyles'
import { AnimatedText } from './AnimatedText'


// === TYPES & INTERFACES ==================================================================

interface ForecastCardProps {
    forecastList: DailyForecastSummary[]
    units: TemperatureUnit
}


// === COMPONENT: FORECASTCARD =============================================================

export function ForecastCard({ forecastList, units }: ForecastCardProps) {
    const { width } = useWindowDimensions()
    // Use 2 columns on narrow screens, 4 on wider screens
    const numColumns = width >= 600 ? 4 : 2

    return (
        <View style={glassStyle.container}>
            <View style={styles.grid}>
                {forecastList.map((dailySummary: DailyForecastSummary) => {
                    const textColor = dailySummary.theme.theme.isDark ? '#fff' : '#000'
                    const highColor = dailySummary.theme.theme.isDark ? '#ffcaca' : '#c62828'
                    const lowColor = dailySummary.theme.theme.isDark ? '#80caff' : '#0d47a1'

                    return (
                        <LinearGradient
                            key={dailySummary.dateKey}
                            colors={dailySummary.theme.theme.colors as [string, string, ...string[]]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={[
                                styles.cell,
                                { width: `${100 / numColumns - 2}%` },
                            ]}
                        >
                            <Text style={[styles.dateLabel, { color: textColor }]}>
                                {dailySummary.dateLabel}
                            </Text>
                            <View style={styles.dataRow}>
                                <Image
                                    source={getIconUrl(dailySummary.theme.icon)}
                                    style={styles.icon}
                                    resizeMode="contain"
                                    accessibilityLabel="weather icon"
                                />
                                <View>
                                    <AnimatedText
                                        text={`High: ${dailySummary.tempMax}°${units === 'metric' ? 'C' : 'F'}`}
                                        style={[styles.temp, { color: highColor }]}
                                    />
                                    <AnimatedText
                                        text={`Low: ${dailySummary.tempMin}°${units === 'metric' ? 'C' : 'F'}`}
                                        style={[styles.temp, { color: lowColor }]}
                                    />
                                </View>
                            </View>
                        </LinearGradient>
                    )
                })}
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        alignItems: 'stretch',
        margin: 8,
        padding: 8,
    },
    cell: {
        minWidth: 0,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
        opacity: 0.9,
    },
    dateLabel: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    dataRow: {
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: 8,
    },
    icon: {
        width: 50,
        height: 50,
    },
    temp: {
        fontSize: 13,
    },
})
