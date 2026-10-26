import {
    View,
    Text,
    Image,
    StyleSheet,
} from 'react-native'
import type { 
    CurrentWeatherResponse,
    GeocodingLocation,
    TemperatureUnit
} from '../types/weather'
import { formatLocalTime } from '../utils/formatLocalTime'
import { type WeatherThemeKit } from '../utils/weatherThemes'
import { getIconUrl } from '../utils/weatherIcons'
import { AnimatedText } from './AnimatedText'


// === TYPES & INTERFACES ==================================================================

export interface CurrentWeatherCardProps {
    weatherData: CurrentWeatherResponse
    theme: WeatherThemeKit
    selectedCity: GeocodingLocation
    units: TemperatureUnit
}


// === COMPONENT: CURRENTWEATHERCARD =======================================================

export function CurrentWeatherCard ({
    weatherData,
    theme,
    selectedCity,
    units,
}: CurrentWeatherCardProps) {

    // 1. VARIABLES
    const currentDate: string = formatLocalTime(weatherData.timezone, 'day-long')
    const currentTime: string = formatLocalTime(weatherData.timezone, 'time')
    const textColor = theme.theme.isDark ? '#fff' : '#000'

    // 2. RENDER
    return (
        <View style={[styles.card, { backgroundColor: 'transparent' }]}>
            
            {/* DATE & LOCATION */}
            <View 
                accessibilityRole="summary"
                style={styles.section}
            >
                <Text style={[styles.heading, { color: textColor }]}>Today</Text>
                <Text style={[styles.subHeading, { color: textColor }]}>{currentDate}</Text>
                <Text style={[styles.subHeading, { color: textColor }]}>{currentTime}</Text>
                <Text style={[styles.location, { color: textColor }]}>
                    {selectedCity?.name}{selectedCity?.country ? `, ${selectedCity.country}` : ''}
                </Text>
            </View>

            {/* WEATHER DATA */}
            {weatherData && (
                <View style={styles.weatherRow}>
                    {/* Conditions */}
                    <View style={styles.conditionColumn}>
                        <Image
                            source={getIconUrl(theme.icon)}
                            style={styles.weatherIcon}
                            resizeMode="contain"
                            accessibilityLabel="weather icon"
                        />
                        <Text style={[styles.description, { color: textColor }]}>
                            {weatherData.weather[0].description}
                        </Text>
                    </View>

                    {/* Temperatures */}
                    <View>
                        <AnimatedText
                            text={`${Math.round(weatherData.main.temp)}°${units === 'metric' ? 'C' : 'F'}`}
                            style={[styles.temperature, { color: textColor }]}
                        />
                        <View style={styles.feelsLikeRow}>
                            <Text style={[styles.temperature, { color: textColor }]}>(</Text>
                            <View>
                                <Text style={[styles.body, { color: textColor }]}>Feels like</Text>
                                <AnimatedText
                                    text={`${Math.round(weatherData.main.feels_like)}°${units === 'metric' ? 'C' : 'F'}`}
                                    style={[styles.subHeading, { color: textColor }]}
                                />
                            </View>
                            <Text style={[styles.temperature, { color: textColor }]}>)</Text>
                        </View>
                    </View>
                </View>   
            )}

        </View>
    )
}

const styles = StyleSheet.create({
    card: {
        padding: 8,
    },
    section: {
        flexDirection: 'column',
        alignItems: 'center',
    },
    heading: {
        fontSize: 32,
        fontWeight: 'bold',
    },
    subHeading: {
        fontSize: 24,
        fontWeight: '600',
    },
    location: {
        fontSize: 18,
        marginTop: 4,
    },
    weatherRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
        marginTop: 16,
    },
    conditionColumn: {
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
    },
    weatherIcon: {
        width: 120,
        height: 120,
    },
    description: {
        fontSize: 18,
        textTransform: 'capitalize',
    },
    temperature: {
        fontSize: 48,
        fontWeight: 'bold',
    },
    feelsLikeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    body: {
        fontSize: 16,
    },
})
