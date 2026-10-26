import { View, StyleSheet } from "react-native"
import { Text } from "react-native-paper"
import { LineChart } from "react-native-gifted-charts"
import type { ForecastResponse, TemperatureUnit } from "../types/weather"
import { type HourlyTrendPoint, getHourlyTrend } from "../utils/hourlyForecast"
import { glassStyle } from '../utils/glassStyles'


// === TYPES & INTERFACES ==================================================================

interface TemperatureTrendsCardProps {
    forecastData: ForecastResponse | null
    isThemeDark: boolean
    units: TemperatureUnit
}


// === CONSTANTS ===========================================================================

// Explicit chart height so the chart never measures a 0px / growing parent
const CHART_HEIGHT = 240


// === COMPONENT: TEMPERATURETRENDSCARD ====================================================

export function TemperatureTrendsCard({
    forecastData,
    isThemeDark,
    units
}: TemperatureTrendsCardProps) {
    // 1. VARIABLES
    const unitSymbol = `°${units === 'metric' ? 'C' : 'F'}`
    const hourlyTrend: HourlyTrendPoint[] = forecastData
        ? getHourlyTrend(forecastData.list, forecastData.city.timezone)
        : []

    const seriesColor = isThemeDark ? '#fff' : '#419cd8'
    const axisColor = isThemeDark ? '#fff' : '#666'

    const chartData = hourlyTrend.map((point) => ({
        value: point.temp,
        label: point.timeLabel,
        feelsLike: point.feelsLike,
        pop: point.pop,
        description: point.description,
    }))

    // 2. RENDER
    return (
        <View style={[glassStyle.container, styles.container]}>
            <Text 
                variant="titleMedium"
                style={{ color: isThemeDark ? '#fff' : '#000' }}
            >
                Next 24 Hours
            </Text>

            {hourlyTrend.length === 0 ? (
                <Text style={[styles.empty, { color: isThemeDark ? '#fff' : '#000' }]}>
                    - No Forecast Data -
                </Text>
            ) : (
                <View style={styles.chartWrapper}>
                    <LineChart
                        areaChart
                        data={chartData}
                        height={CHART_HEIGHT}
                        color={seriesColor}
                        thickness={2}
                        startFillColor={seriesColor}
                        endFillColor={seriesColor}
                        startOpacity={0.25}
                        endOpacity={0.02}
                        dataPointsColor={seriesColor}
                        dataPointsRadius={3}
                        focusedDataPointColor={seriesColor}
                        focusedDataPointRadius={5}
                        xAxisColor={axisColor}
                        yAxisColor={axisColor}
                        yAxisTextStyle={{ color: axisColor, fontSize: 10 }}
                        xAxisLabelTextStyle={{ color: axisColor, fontSize: 10 }}
                        yAxisLabelSuffix="°"
                        hideRules={false}
                        rulesColor={isThemeDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}
                        pointerConfig={{
                            pointerStripHeight: CHART_HEIGHT,
                            pointerStripColor: axisColor,
                            pointerStripWidth: 1,
                            pointerColor: seriesColor,
                            radius: 5,
                            pointerLabelComponent: (items: any[]) => {
                                const point = items[0]
                                return (
                                    <View style={styles.tooltip}>
                                        <Text variant="titleSmall">{`${point.value}${unitSymbol}`}</Text>
                                        <Text variant="bodySmall">{point.label}</Text>
                                        <Text variant="bodySmall">{`Feels like ${point.feelsLike}${unitSymbol}`}</Text>
                                        <Text variant="bodySmall">{`${point.pop}% chance of rain`}</Text>
                                        <Text variant="bodySmall" style={{ textTransform: 'capitalize' }}>
                                            {point.description}
                                        </Text>
                                    </View>
                                )
                            },
                        }}
                    />
                </View>
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        padding: 16,
    },
    chartWrapper: {
        width: '100%',
        marginTop: 8,
    },
    empty: {
        paddingVertical: 16,
    },
    tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 8,
        padding: 8,
        minWidth: 120,
    },
})
