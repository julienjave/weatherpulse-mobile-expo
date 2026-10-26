import { View, StyleSheet } from "react-native"
import Animated, { FadeInUp, LinearTransition } from "react-native-reanimated"
import { LinearGradient } from 'expo-linear-gradient'
import { type WeatherHeadBarProps, WeatherHeaderBar } from "./WeatherHeaderBar"
import { type CurrentWeatherCardProps, CurrentWeatherCard } from "./CurrentWeatherCard"
import { ForecastCard } from './ForecastCard'
import { WeatherMetricsCard } from "./WeatherMetricsCard"
import { TemperatureTrendsCard } from "./TemperatureTrendsCard"
import type { AirQualityResponse, ForecastResponse, TemperatureUnit } from "../types/weather"
import { type DailyForecastSummary, aggregateDailyForecast, getLocalDateKey } from '../utils/aggregateForecast'
import { getUsAqiKit } from "../utils/aqiConverter"
import { type WeatherThemeKit, getWeatherThemeKit } from '../utils/weatherThemes'


// === TYPES & INTERFACES ==================================================================

// Both prop types declare `units`, so the intersection keeps a single shared `units` prop.
// `units` drives the switch (flips instantly); `dataUnits` is the unit the displayed data was
// fetched in, so values and their symbols always change together once the refetch lands
export type WeatherPanelProps = 
    WeatherHeadBarProps & 
    Omit<CurrentWeatherCardProps, "theme"> & 
    {
        aqiData: AirQualityResponse | null
        forecastData: ForecastResponse | null
        dataUnits: TemperatureUnit
    }


// === COMPONENT: WEATHERPANEL =============================================================

export function WeatherPanel({
    weatherData,
    forecastData,
    aqiData,
    selectedCity,
    units,
    dataUnits,
    isFavorite,
    isFavoritesFull,
    onToggleFavorite,
    onToggleUnit
}: WeatherPanelProps) {
    // 1. VARIABLES
    // An air quality response can come back with an empty list: show the placeholder, not a fake reading
    const pm25 = aqiData?.list[0]?.components.pm2_5
    const aqiKit = pm25 !== undefined ? getUsAqiKit(pm25) : null
    let fourDayForecast: DailyForecastSummary[] | null = null
    const theme: WeatherThemeKit = getWeatherThemeKit(weatherData.weather[0].id, weatherData.weather[0].icon)
    
    // Pre-process forecast data
    if(forecastData) {
        const forecastDailySummaries: DailyForecastSummary[] = aggregateDailyForecast(
            forecastData.list,
            forecastData.city.timezone
        )

        // Remove the current day to avoid redundancy
        const todayKey: string = getLocalDateKey(weatherData.dt, weatherData.timezone)
        // Filter out today by date key match, then cap at 4 days
        fourDayForecast = forecastDailySummaries
            .filter((day) => day.dateKey !== todayKey)
            .slice(0,4)
    }

    // 2. RENDER
    return (
        <LinearGradient
            colors={theme.theme.colors as [string, string, ...string[]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.container}
        >
            {/* HEADER BAR */}
            <Animated.View entering={FadeInUp} layout={LinearTransition}>
                <WeatherHeaderBar
                    isFavorite={isFavorite}
                    onToggleFavorite={onToggleFavorite}
                    units={units}
                    onToggleUnit={onToggleUnit}
                    isFavoritesFull={isFavoritesFull}
                />
            </Animated.View>

            {/* Stacked: current weather, then metrics and the 24h trend */}
            <View style={styles.row}>
                {/* CURRENT WEATHER CARD */}
                <Animated.View entering={FadeInUp.delay(80)} layout={LinearTransition}>
                    <CurrentWeatherCard
                        weatherData={weatherData}
                        theme={theme}
                        selectedCity={selectedCity}
                        units={dataUnits}
                    />
                </Animated.View>

                <View style={styles.sideStack}>
                    {/* WEATHER METRICS CARD */}
                    <Animated.View entering={FadeInUp.delay(160)} layout={LinearTransition}>
                        <WeatherMetricsCard 
                            humidity={weatherData.main.humidity}
                            wind={weatherData.wind.speed}
                            aqiData={aqiKit}
                            theme={theme}
                            units={dataUnits}
                        />
                    </Animated.View>

                    {/* TEMPERATURE TRENDS CARD */}
                    <Animated.View entering={FadeInUp.delay(240)} layout={LinearTransition}>
                        <TemperatureTrendsCard
                            forecastData={forecastData}
                            isThemeDark={theme.theme.isDark}
                            units={dataUnits}
                        />
                    </Animated.View>
                </View>
            </View>

            {/* 5-DAY FORECAST */}
            {fourDayForecast && (
                <Animated.View entering={FadeInUp.delay(320)} layout={LinearTransition}>
                    <ForecastCard 
                        forecastList={fourDayForecast}
                        units={dataUnits}/>
                </Animated.View>
            )}
        </LinearGradient>
    )
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'column',
        gap: 8,
        padding: 8,
        borderRadius: 15,
    },
    // Cards stack vertically and size to their content. Avoid `flex: 1` here: inside the
    // screen's ScrollView there is no fixed height to grow into, so cards can collapse to 0
    row: {
        flexDirection: 'column',
        gap: 8,
        width: '100%',
    },
    sideStack: {
        gap: 8,
    },
})
