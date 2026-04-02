// API Configuration
const API_KEY = '895284fb2d2c50a520ea537456963d9c'; // Free OpenWeatherMap API key (demo)
const API_BASE_URL = 'https://api.openweathermap.org/data/2.5';

// DOM Elements
const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const locationBtn = document.getElementById('locationBtn');
const loading = document.getElementById('loading');
const errorMessage = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');
const retryBtn = document.getElementById('retryBtn');
const weatherContainer = document.getElementById('weatherContainer');
const currentTime = document.getElementById('currentTime');

// Weather Data Elements
const cityName = document.getElementById('cityName');
const country = document.getElementById('country');
const temperature = document.getElementById('temperature');
const feelsLike = document.getElementById('feelsLike');
const weatherDescription = document.getElementById('weatherDescription');
const weatherIconLarge = document.getElementById('weatherIconLarge');
const humidity = document.getElementById('humidity');
const windSpeed = document.getElementById('windSpeed');
const pressure = document.getElementById('pressure');
const visibility = document.getElementById('visibility');
const sunrise = document.getElementById('sunrise');
const sunset = document.getElementById('sunset');
const uvIndex = document.getElementById('uvIndex');
const hourlyForecast = document.getElementById('hourlyForecast');
const dailyForecast = document.getElementById('dailyForecast');

// Weather Icons Mapping
const weatherIcons = {
    '01d': '☀️', '01n': '🌙',
    '02d': '⛅', '02n': '☁️',
    '03d': '☁️', '03n': '☁️',
    '04d': '☁️', '04n': '☁️',
    '09d': '🌧️', '09n': '🌧️',
    '10d': '🌦️', '10n': '🌧️',
    '11d': '⛈️', '11n': '⛈️',
    '13d': '❄️', '13n': '❄️',
    '50d': '🌫️', '50n': '🌫️'
};

// Initialize App
function init() {
    updateCurrentTime();
    setInterval(updateCurrentTime, 1000);
    
    // Load default city
    getWeatherByCity('Warsaw');
    
    // Event Listeners
    searchBtn.addEventListener('click', handleSearch);
    locationBtn.addEventListener('click', handleGeolocation);
    retryBtn.addEventListener('click', handleSearch);
    
    cityInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });
}

// Update Current Time
function updateCurrentTime() {
    const now = new Date();
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    currentTime.textContent = now.toLocaleDateString('pl-PL', options);
}

// Show Loading State
function showLoading() {
    loading.classList.add('active');
    errorMessage.classList.remove('active');
    weatherContainer.classList.remove('active');
}

// Hide Loading State
function hideLoading() {
    loading.classList.remove('active');
}

// Show Error
function showError(message) {
    hideLoading();
    errorText.textContent = message;
    errorMessage.classList.add('active');
    weatherContainer.classList.remove('active');
}

// Show Weather Data
function showWeather() {
    hideLoading();
    errorMessage.classList.remove('active');
    weatherContainer.classList.add('active');
}

// Handle Search
function handleSearch() {
    const city = cityInput.value.trim();
    if (city) {
        getWeatherByCity(city);
    } else {
        showError('Proszę wpisać nazwę miasta');
    }
}

// Handle Geolocation
function handleGeolocation() {
    if (navigator.geolocation) {
        showLoading();
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                getWeatherByCoords(latitude, longitude);
            },
            (error) => {
                showError('Nie można pobrać lokalizacji. Sprawdź uprawnienia przeglądarki.');
            }
        );
    } else {
        showError('Geolokalizacja nie jest wspierana przez twoją przeglądarkę');
    }
}

// Fetch Weather by City Name
async function getWeatherByCity(city) {
    showLoading();
    try {
        // Current Weather
        const currentResponse = await fetch(
            `${API_BASE_URL}/weather?q=${city}&appid=${API_KEY}&units=metric&lang=pl`
        );
        
        if (!currentResponse.ok) {
            throw new Error('Nie znaleziono miasta');
        }
        
        const currentData = await currentResponse.json();
        
        // Forecast
        const forecastResponse = await fetch(
            `${API_BASE_URL}/forecast?q=${city}&appid=${API_KEY}&units=metric&lang=pl`
        );
        
        const forecastData = await forecastResponse.json();
        
        displayWeatherData(currentData, forecastData);
        showWeather();
        
    } catch (error) {
        showError(error.message || 'Wystąpił błąd podczas pobierania danych');
    }
}

// Fetch Weather by Coordinates
async function getWeatherByCoords(lat, lon) {
    try {
        // Current Weather
        const currentResponse = await fetch(
            `${API_BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=pl`
        );
        
        const currentData = await currentResponse.json();
        
        // Forecast
        const forecastResponse = await fetch(
            `${API_BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=pl`
        );
        
        const forecastData = await forecastResponse.json();
        
        displayWeatherData(currentData, forecastData);
        showWeather();
        
    } catch (error) {
        showError('Wystąpił błąd podczas pobierania danych');
    }
}

// Display Weather Data
function displayWeatherData(current, forecast) {
    // Current Weather
    cityName.textContent = current.name;
    country.textContent = current.sys.country;
    temperature.textContent = Math.round(current.main.temp);
    feelsLike.textContent = `${Math.round(current.main.feels_like)}°C`;
    weatherDescription.textContent = capitalizeFirst(current.weather[0].description);
    weatherIconLarge.textContent = weatherIcons[current.weather[0].icon] || '☀️';
    
    // Details
    humidity.textContent = `${current.main.humidity}%`;
    windSpeed.textContent = `${Math.round(current.wind.speed * 3.6)} km/h`;
    pressure.textContent = `${current.main.pressure} hPa`;
    visibility.textContent = `${(current.visibility / 1000).toFixed(1)} km`;
    
    // Sun times
    sunrise.textContent = formatTime(current.sys.sunrise);
    sunset.textContent = formatTime(current.sys.sunset);
    
    // UV Index (mock data - OpenWeatherMap free tier doesn't provide this)
    uvIndex.textContent = '5 (Średni)';
    
    // Update input value
    cityInput.value = current.name;
    
    // Hourly Forecast
    displayHourlyForecast(forecast.list.slice(0, 8));
    
    // Daily Forecast
    displayDailyForecast(forecast.list);
}

// Display Hourly Forecast
function displayHourlyForecast(hourlyData) {
    hourlyForecast.innerHTML = '';
    
    hourlyData.forEach(hour => {
        const time = new Date(hour.dt * 1000);
        const hourElement = document.createElement('div');
        hourElement.className = 'hourly-item';
        hourElement.innerHTML = `
            <div class="hourly-time">${time.getHours()}:00</div>
            <div class="hourly-icon">${weatherIcons[hour.weather[0].icon] || '☀️'}</div>
            <div class="hourly-temp">${Math.round(hour.main.temp)}°</div>
        `;
        hourlyForecast.appendChild(hourElement);
    });
}

// Display Daily Forecast
function displayDailyForecast(forecastList) {
    dailyForecast.innerHTML = '';
    
    // Group by day and get one entry per day (at noon)
    const dailyData = {};
    
    forecastList.forEach(item => {
        const date = new Date(item.dt * 1000);
        const dateKey = date.toDateString();
        
        // Get forecast closest to noon (12:00)
        if (!dailyData[dateKey] || Math.abs(date.getHours() - 12) < Math.abs(new Date(dailyData[dateKey].dt * 1000).getHours() - 12)) {
            dailyData[dateKey] = item;
        }
    });
    
    // Display first 5 days
    Object.values(dailyData).slice(0, 5).forEach(day => {
        const date = new Date(day.dt * 1000);
        const dayElement = document.createElement('div');
        dayElement.className = 'daily-item';
        dayElement.innerHTML = `
            <div class="daily-day">${getDayName(date)}</div>
            <div class="daily-icon">${weatherIcons[day.weather[0].icon] || '☀️'}</div>
            <div class="daily-temps">
                <span class="temp-max">${Math.round(day.main.temp_max)}°</span>
                <span class="temp-min">${Math.round(day.main.temp_min)}°</span>
            </div>
            <div class="daily-desc">${capitalizeFirst(day.weather[0].description)}</div>
        `;
        dailyForecast.appendChild(dayElement);
    });
}

// Utility Functions
function formatTime(timestamp) {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
}

function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function getDayName(date) {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
        return 'Dziś';
    } else if (date.toDateString() === tomorrow.toDateString()) {
        return 'Jutro';
    } else {
        return date.toLocaleDateString('pl-PL', { weekday: 'long' });
    }
}

// Change Background Based on Weather
function changeBackground(weatherCode) {
    const body = document.body;
    
    if (weatherCode >= 200 && weatherCode < 300) {
        // Thunderstorm
        body.style.background = 'linear-gradient(135deg, #283048 0%, #859398 100%)';
    } else if (weatherCode >= 300 && weatherCode < 600) {
        // Drizzle/Rain
        body.style.background = 'linear-gradient(135deg, #4B79A1 0%, #283E51 100%)';
    } else if (weatherCode >= 600 && weatherCode < 700) {
        // Snow
        body.style.background = 'linear-gradient(135deg, #E0EAFC 0%, #CFDEF3 100%)';
    } else if (weatherCode >= 700 && weatherCode < 800) {
        // Atmosphere (fog, mist, etc.)
        body.style.background = 'linear-gradient(135deg, #606c88 0%, #3f4c6b 100%)';
    } else if (weatherCode === 800) {
        // Clear
        body.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    } else if (weatherCode > 800) {
        // Clouds
        body.style.background = 'linear-gradient(135deg, #bdc3c7 0%, #2c3e50 100%)';
    }
}

// Popular Cities Suggestions (optional enhancement)
const popularCities = ['Warsaw', 'Krakow', 'Gdansk', 'Wroclaw', 'Poznan', 'London', 'Paris', 'Berlin', 'New York'];

cityInput.addEventListener('input', (e) => {
    const value = e.target.value.toLowerCase();
    // You can implement autocomplete suggestions here
});

// Service Worker for PWA (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // navigator.serviceWorker.register('/sw.js');
    });
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Press 'L' for location
    if (e.key === 'l' && !cityInput.matches(':focus')) {
        handleGeolocation();
    }
    
    // Press '/' to focus search
    if (e.key === '/' && !cityInput.matches(':focus')) {
        e.preventDefault();
        cityInput.focus();
    }
});

// Console Easter Egg
console.log('%c 🌤️ WeatherNow App', 'font-size: 20px; color: #667eea; font-weight: bold;');
console.log('%c Made with ❤️ by Kacper Rogoś', 'font-size: 12px; color: #764ba2;');
console.log('%c Try keyboard shortcuts: L for location, / for search', 'font-size: 10px; color: #888;');

// Error handling for fetch
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    showError('Wystąpił nieoczekiwany błąd');
});

// Performance monitoring
if (window.performance) {
    window.addEventListener('load', () => {
        setTimeout(() => {
            const perfData = window.performance.timing;
            const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
            console.log(`⚡ Weather App loaded in ${pageLoadTime}ms`);
        }, 0);
    });
}
