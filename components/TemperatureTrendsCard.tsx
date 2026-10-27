import { useState } from "react"
import { View, StyleSheet, type LayoutChangeEvent } from "react-native"
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
const Y_AXIS_LABEL_WIDTH = 32
const EDGE_SPACING = 16     // Room before the first and after the last point, so dots and labels aren't clipped
const Y_PADDING = 2         // Degrees above the max and below the min, like the web chart's dataMin - 2 / dataMax + 2
const Y_SECTIONS = 4


// === HELPERS =============================================================================

/**
 * Zooms the Y axis onto the data, like the web chart's `domain={['dataMin - 2', 'dataMax + 2']}`.
 * gifted-charts starts the axis at 0 by default, which squashes a 15–20° day into a flat line
 * and can't show sub-zero temperatures. `yAxisOffset` moves the axis start instead: values are
 * plotted as (value - offset), and `maxValue` is the height of the range above the offset.
 */
function getYAxisRange(temps: number[]) {
    if (temps.length === 0) return { yAxisOffset: 0, stepValue: 1, maxValue: Y_SECTIONS }

    const yAxisOffset = Math.floor(Math.min(...temps)) - Y_PADDING
    const top = Math.ceil(Math.max(...temps)) + Y_PADDING
    // Whole-degree steps so every axis label is a round number
    const stepValue = Math.max(1, Math.ceil((top - yAxisOffset) / Y_SECTIONS))
    return { yAxisOffset, stepValue, maxValue: stepValue * Y_SECTIONS }
}

// "3:00 PM" -> "3 PM": the full label doesn't fit between points on a phone
function shortTimeLabel(label: string): string {
    return label.replace(':00', '')
}


// === COMPONENT: TEMPERATURETRENDSCARD ====================================================

export function TemperatureTrendsCard({
    forecastData,
    isThemeDark,
    units
}: TemperatureTrendsCardProps) {
    // 1. VARIABLES
    // gifted-charts needs a pixel width, so measure the space the card gives us
    const [chartAreaWidth, setChartAreaWidth] = useState<number>(0)
    const handleLayout = (event: LayoutChangeEvent) => setChartAreaWidth(event.nativeEvent.layout.width)

    const unitSymbol = `°${units === 'metric' ? 'C' : 'F'}`
    const hourlyTrend: HourlyTrendPoint[] = forecastData
        ? getHourlyTrend(forecastData.list, forecastData.city.timezone)
        : []

    const seriesColor = isThemeDark ? '#fff' : '#419cd8'
    const axisColor = isThemeDark ? '#fff' : '#666'
    const textColor = isThemeDark ? '#fff' : '#000'

    const chartData = hourlyTrend.map((point, index) => ({
        // gifted-charts shifts `value` by yAxisOffset internally, so the tooltip reads `temp` instead
        value: point.temp,
        temp: point.temp,
        // Every other label (always including the first and last of the 9 points) so they don't collide
        label: index % 2 === 0 ? shortTimeLabel(point.timeLabel) : '',
        timeLabel: point.timeLabel,
        feelsLike: point.feelsLike,
        pop: point.pop,
        description: point.description,
    }))

    const { yAxisOffset, stepValue, maxValue } = getYAxisRange(hourlyTrend.map((point) => point.temp))
    const plotWidth = Math.max(0, chartAreaWidth - Y_AXIS_LABEL_WIDTH)
    const spacing = chartData.length > 1
        ? (plotWidth - 2 * EDGE_SPACING) / (chartData.length - 1)
        : 0

    // 2. RENDER
    return (
        <View style={[glassStyle.container, styles.container]}>
            <Text
                variant="titleMedium"
                accessibilityRole="header"
                style={{ color: textColor }}
            >
                Next 24 Hours
            </Text>

            {hourlyTrend.length === 0 ? (
                <Text style={[styles.empty, { color: textColor }]}>
                    - No Forecast Data -
                </Text>
            ) : (
                <View style={styles.chartWrapper} onLayout={handleLayout} testID="temperature-chart-area">
                    {/* Wait for the first measurement: a 0-width chart would lay out its points wrongly */}
                    {chartAreaWidth > 0 && (
                        <LineChart
                            areaChart
                            curved
                            data={chartData}
                            height={CHART_HEIGHT}
                            width={plotWidth}
                            parentWidth={chartAreaWidth}
                            spacing={spacing}
                            initialSpacing={EDGE_SPACING}
                            endSpacing={EDGE_SPACING}
                            disableScroll
                            yAxisOffset={yAxisOffset}
                            maxValue={maxValue}
                            stepValue={stepValue}
                            noOfSections={Y_SECTIONS}
                            yAxisLabelWidth={Y_AXIS_LABEL_WIDTH}
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
                            yAxisThickness={0}
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
                                // Keep the tooltip inside the card near the left and right edges
                                autoAdjustPointerLabelPosition: true,
                                pointerLabelWidth: 140,
                                pointerLabelHeight: 110,
                                pointerLabelComponent: (items: typeof chartData) => {
                                    const point = items[0]
                                    return (
                                        <View style={styles.tooltip}>
                                            <Text variant="titleSmall">{`${point.temp}${unitSymbol}`}</Text>
                                            <Text variant="bodySmall">{point.timeLabel}</Text>
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
                    )}
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
        width: 140,
    },
})
