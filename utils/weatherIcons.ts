// Replace the Vite glob import with a static asset dictionary
const icons: Record<string, any> = {
    'clear-day.png': require('@/assets/icons/clear-day.png'),
    'clear-night.png': require('@/assets/icons/clear-night.png'),
    'cloudy.png': require('@/assets/icons/cloudy.png'),
    'drizzle.png': require('@/assets/icons/drizzle.png'),
    'fog.png': require('@/assets/icons/fog.png'),
    'heavy-rain.png': require('@/assets/icons/heavy-rain.png'),
    'heavy-snow.png': require('@/assets/icons/heavy-snow.png'),
    'heavy-thunderstorm.png': require('@/assets/icons/heavy-thunderstorm.png'),
    'light-rain.png': require('@/assets/icons/light-rain.png'),
    'light-snow.png': require('@/assets/icons/light-snow.png'),
    'overcast.png': require('@/assets/icons/overcast.png'),
    'partly-cloudy-day.png': require('@/assets/icons/partly-cloudy-day.png'),
    'partly-cloudy-night.png': require('@/assets/icons/partly-cloudy-night.png'),
    'rain-thunderstorm.png': require('@/assets/icons/rain-thunderstorm.png'),
    'rain.png': require('@/assets/icons/rain.png'),
    'sleet.png': require('@/assets/icons/sleet.png'),
    'snow.png': require('@/assets/icons/snow.png'),
    'thunderstorm.png': require('@/assets/icons/thunderstorm.png'),
    'tornado.png': require('@/assets/icons/tornado.png')
};

export const getIconUrl = (file: string) => {
    // Extract just the filename if a full path is passed
    const filename = file.split('/').pop() || 'clear-day.png';
    return icons[filename] ?? icons['clear-day.png'];
};