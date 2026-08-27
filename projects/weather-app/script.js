const API_KEY = 'a6ee8c92a3b978d00acf4fbecae84bf5';
const API_BASE_URL = 'https://api.openweathermap.org/data/2.5';

const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const locationBtn = document.getElementById('locationBtn');
const loading = document.getElementById('loading');
const errorMessage = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');
const retryBtn = document.getElementById('retryBtn');
const weatherContainer = document.getElementById('weatherContainer');
const currentTime = document.getElementById('currentTime');

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
const hourlyForecast = document.getElementById('hourlyForecast');
const dailyForecast = document.getElementById('dailyForecast');

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

function init() {
    updateCurrentTime();
    setInterval(updateCurrentTime, 1000);

    getWeatherByCity('Warsaw');

    searchBtn.addEventListener('click', handleSearch);
    locationBtn.addEventListener('click', handleGeolocation);
    retryBtn.addEventListener('click', handleSearch);

    cityInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });
}

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

function showLoading() {
    loading.classList.add('active');
    errorMessage.classList.remove('active');
    weatherContainer.classList.remove('active');
}

function hideLoading() {
    loading.classList.remove('active');
}

function showError(message) {
    hideLoading();
    errorText.textContent = message;
    errorMessage.classList.add('active');
    weatherContainer.classList.remove('active');
}

function showWeather() {
    hideLoading();
    errorMessage.classList.remove('active');
    weatherContainer.classList.add('active');
}

function handleSearch() {
    const city = cityInput.value.trim();
    if (city) {
        getWeatherByCity(city);
    } else {
        showError('Proszę wpisać nazwę miasta');
    }
}

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

async function getWeatherByCity(city) {
    showLoading();
    try {
        const currentResponse = await fetch(
            `${API_BASE_URL}/weather?q=${city}&appid=${API_KEY}&units=metric&lang=pl`
        );

        if (!currentResponse.ok) {
            throw new Error('Nie znaleziono miasta');
        }

        const currentData = await currentResponse.json();

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

async function getWeatherByCoords(lat, lon) {
    try {
        const currentResponse = await fetch(
            `${API_BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=pl`
        );

        const currentData = await currentResponse.json();

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

function displayWeatherData(current, forecast) {
    cityName.textContent = current.name;
    country.textContent = current.sys.country;
    temperature.textContent = Math.round(current.main.temp);
    feelsLike.textContent = `${Math.round(current.main.feels_like)}°C`;
    weatherDescription.textContent = capitalizeFirst(current.weather[0].description);
    weatherIconLarge.textContent = weatherIcons[current.weather[0].icon] || '☀️';

    humidity.textContent = `${current.main.humidity}%`;
    windSpeed.textContent = `${Math.round(current.wind.speed * 3.6)} km/h`;
    pressure.textContent = `${current.main.pressure} hPa`;
    visibility.textContent = `${(current.visibility / 1000).toFixed(1)} km`;

    sunrise.textContent = formatTime(current.sys.sunrise);
    sunset.textContent = formatTime(current.sys.sunset);

    cityInput.value = current.name;

    displayHourlyForecast(forecast.list.slice(0, 8));
    displayDailyForecast(forecast.list);
}

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

function displayDailyForecast(forecastList) {
    dailyForecast.innerHTML = '';

    const dailyData = {};

    forecastList.forEach(item => {
        const date = new Date(item.dt * 1000);
        const dateKey = date.toDateString();

        if (!dailyData[dateKey] || Math.abs(date.getHours() - 12) < Math.abs(new Date(dailyData[dateKey].dt * 1000).getHours() - 12)) {
            dailyData[dateKey] = item;
        }
    });

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

document.addEventListener('DOMContentLoaded', init);

document.addEventListener('keydown', (e) => {
    if (e.key === 'l' && !cityInput.matches(':focus')) {
        handleGeolocation();
    }

    if (e.key === '/' && !cityInput.matches(':focus')) {
        e.preventDefault();
        cityInput.focus();
    }
});

window.addEventListener('unhandledrejection', (event) => {
    showError('Wystąpił nieoczekiwany błąd');
});
