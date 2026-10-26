import { View, StyleSheet } from "react-native"
import { Text, Tooltip } from "react-native-paper"
import { MaterialIcons } from '@expo/vector-icons'
import type { TemperatureUnit } from "../types/weather"
import type { UsAqiResult } from "../utils/aqiConverter"
import { glassStyle } from '../utils/glassStyles'
import type { WeatherThemeKit } from "../utils/weatherThemes"
import { AnimatedText } from "./AnimatedText"


// === TYPES & INTERFACES ==================================================================

interface WeatherMetricsCardProps {
    humidity: number
    wind: number 
    aqiData: UsAqiResult | null
    theme: WeatherThemeKit
    units: TemperatureUnit
}


// === COMPONENT: WEATHERMETRICSCARD ========================================================

export function WeatherMetricsCard({
    humidity,
    wind,
    aqiData,
    theme,
    units='metric'
}: WeatherMetricsCardProps) {
    // RENDER
    const textColor = theme.theme.isDark ? '#fff' : '#000'

    return (
        <View style={glassStyle.container}>
            <View style={styles.stack}>
                <View style={styles.row}>
                    <Tooltip title="Humidity">
                        <View accessibilityLabel="Humidity" accessibilityRole="image">
                            <MaterialIcons name="water-drop" size={24} color={theme.theme.isDark ? '#00aaff' : '#009ae6'} />
                        </View>
                    </Tooltip>
                    <Text style={{ color: textColor }}>
                        {`${humidity}%`}
                    </Text>
                </View>
                <View style={styles.row}>
                    <Tooltip title="Wind">
                        <View accessibilityLabel="Wind" accessibilityRole="image">
                            <MaterialIcons name="air" size={24} color={theme.theme.isDark ? '#b3e3fb' : '#6a8c9c'} />
                        </View>
                    </Tooltip>
                    <AnimatedText
                        text={`${wind}${units==='metric' ? 'm/s':'mph'}`}
                        style={{ color: textColor }}
                    />
                </View>
                <View style={styles.row}>
                    <Tooltip title="Air Quality Index">
                        <View accessibilityLabel="Air Quality Index" accessibilityRole="image">
                            <MaterialIcons name="emoji-nature" size={24} color={theme.theme.isDark ? '#22f02c' : '#09900f'} />
                        </View>
                    </Tooltip>
                    { aqiData ? (
                        <View style={[
                            styles.aqiBadge,
                            {
                                backgroundColor: aqiData.background,
                                borderColor: aqiData.color,
                            }
                        ]}>
                            <Text style={{ color: aqiData.color }}>
                                {`${aqiData.aqi} - ${aqiData.label}`}
                            </Text>
                        </View>
                    ) : (
                        <Text style={{ color: textColor }}>
                             - No Data -
                        </Text>
                    )}
                </View>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    stack: {
        gap: 8,
        padding: 8,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    aqiBadge: {
        borderWidth: 1,
        borderRadius: 30,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
})
