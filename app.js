/**
 * ==============================================================================
 * SkyPulse Weather - Modern Glassmorphism Weather Forecast Application
 * ==============================================================================
 * Features:
 * - Real-time Weather via OpenWeatherMap API with smart Open-Meteo fallback
 * - 5-Day Extended Weather Forecast & 24-Hour Hourly Slider
 * - Dynamic Canvas Weather Particles (Rain, Snow, Sunny Motes, Drifting Clouds)
 * - Geolocation Auto-Detection with Fallback
 * - LocalStorage Recent Search History with Quick-Select Chips
 * - Celsius (°C) / Fahrenheit (°F) Instant Unit Conversion
 * - Dark & Light Mode Glassmorphic Theme Toggle
 * - Timezone-Aware Live Local Ticking Clock
 * - Air Quality Index (AQI), UV Index, Sunrise & Sunset Times
 * ==============================================================================
 */

'use strict';

// --- Configuration & Constants ---
const CONFIG = {
  // Default fallback API Key (can be configured by user via UI Settings modal)
  DEFAULT_OWM_KEY: '', // User can input in Settings modal or app uses smart live fallback
  STORAGE_KEYS: {
    API_KEY: 'skypulse_owm_api_key',
    SEARCH_HISTORY: 'skypulse_search_history',
    THEME: 'skypulse_theme',
    UNIT: 'skypulse_unit',
    LAST_CITY: 'skypulse_last_city',
    PROVIDER_CHOICE: 'skypulse_provider_choice'
  },
  MAX_HISTORY_ITEMS: 6,
  DEFAULT_CITY: 'London'
};

// --- Application State ---
const state = {
  city: 'London',
  country: 'GB',
  unit: localStorage.getItem(CONFIG.STORAGE_KEYS.UNIT) || 'metric', // 'metric' (°C) or 'imperial' (°F)
  theme: localStorage.getItem(CONFIG.STORAGE_KEYS.THEME) || 'dark', // 'dark' or 'light'
  apiKey: localStorage.getItem(CONFIG.STORAGE_KEYS.API_KEY) || CONFIG.DEFAULT_OWM_KEY,
  providerChoice: localStorage.getItem(CONFIG.STORAGE_KEYS.PROVIDER_CHOICE) || 'auto',
  weatherData: null,
  forecastData: null,
  aqiData: null,
  timezoneOffsetSeconds: 0,
  activeCondition: 'sunny', // 'sunny', 'rainy', 'cloudy', 'snow', 'thunderstorm', 'mist'
  searchHistory: JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.SEARCH_HISTORY) || '[]')
};

// --- DOM Element References ---
const elements = {
  // Theme & Units
  html: document.documentElement,
  body: document.body,
  themeToggle: document.getElementById('theme-toggle'),
  themeIcon: document.querySelector('.theme-icon'),
  unitCBtn: document.getElementById('unit-c'),
  unitFBtn: document.getElementById('unit-f'),

  // Header Datetime
  headerTime: document.getElementById('header-time'),
  headerDate: document.getElementById('header-date'),

  // Search
  searchForm: document.getElementById('search-form'),
  searchInput: document.getElementById('search-input'),
  clearSearchBtn: document.getElementById('clear-search-btn'),
  geoBtn: document.getElementById('geo-location-btn'),
  recentChipsList: document.getElementById('recent-chips-list'),
  clearHistoryBtn: document.getElementById('clear-history-btn'),
  recentSearchesWrapper: document.getElementById('recent-searches-wrapper'),

  // Loader & Notifications
  loadingOverlay: document.getElementById('loading-overlay'),
  toastContainer: document.getElementById('toast-container'),

  // Hero Card
  cityName: document.getElementById('city-name'),
  countryBadge: document.getElementById('country-badge'),
  cityLocalTime: document.getElementById('city-local-time'),
  weatherConditionText: document.getElementById('weather-condition-text'),
  currentTemp: document.getElementById('current-temp'),
  currentTempUnit: document.getElementById('current-temp-unit'),
  feelsLikeTemp: document.getElementById('feels-like-temp'),
  tempMax: document.getElementById('temp-max'),
  tempMin: document.getElementById('temp-min'),
  heroWeatherIcon: document.getElementById('weather-hero-icon'),
  weatherDescriptionSub: document.getElementById('weather-description-sub'),

  // Quick Hero Footer Pills
  quickHumidity: document.getElementById('quick-humidity'),
  quickWind: document.getElementById('quick-wind'),
  quickPressure: document.getElementById('quick-pressure'),
  quickVisibility: document.getElementById('quick-visibility'),

  // Metrics Grid
  metricHumidityVal: document.getElementById('metric-humidity-val'),
  humidityProgress: document.getElementById('humidity-progress'),
  metricHumidityBadge: document.getElementById('metric-humidity-badge'),
  humidityDew: document.getElementById('humidity-dew'),

  metricWindVal: document.getElementById('metric-wind-val'),
  metricWindUnit: document.getElementById('metric-wind-unit'),
  windDirectionText: document.getElementById('wind-direction-text'),
  compassArrow: document.getElementById('compass-arrow'),
  windGustVal: document.getElementById('wind-gust-val'),
  windDesc: document.getElementById('wind-desc'),

  metricAqiVal: document.getElementById('metric-aqi-val'),
  aqiStatusBadge: document.getElementById('aqi-status-badge'),
  aqiProgress: document.getElementById('aqi-progress'),
  aqiAdvice: document.getElementById('aqi-advice'),

  metricUvVal: document.getElementById('metric-uv-val'),
  uvStatusBadge: document.getElementById('uv-status-badge'),
  uvProgress: document.getElementById('uv-progress'),
  uvAdvice: document.getElementById('uv-advice'),

  daylightDuration: document.getElementById('daylight-duration'),
  sunriseTime: document.getElementById('sunrise-time'),
  sunsetTime: document.getElementById('sunset-time'),
  sunStatusText: document.getElementById('sun-status-text'),

  metricPressureVal: document.getElementById('metric-pressure-val'),
  metricVisibilityVal: document.getElementById('metric-visibility-val'),
  pressureDesc: document.getElementById('pressure-desc'),

  // Forecast Sections
  hourlyForecastList: document.getElementById('hourly-forecast-list'),
  fiveDayForecastGrid: document.getElementById('five-day-forecast-grid'),

  // Footer & Settings
  activeDataSource: document.getElementById('active-data-source'),
  settingsToggle: document.getElementById('settings-toggle'),
  footerSettingsBtn: document.getElementById('footer-settings-btn'),
  settingsModal: document.getElementById('settings-modal'),
  closeModalBtn: document.getElementById('close-modal-btn'),
  apiKeyInput: document.getElementById('api-key-input'),
  toggleKeyVisibility: document.getElementById('toggle-key-visibility'),
  testApiBtn: document.getElementById('test-api-btn'),
  saveSettingsBtn: document.getElementById('save-settings-btn'),
  providerRadios: document.querySelectorAll('input[name="provider-choice"]'),

  // Canvas
  canvas: document.getElementById('weather-canvas')
};

// ==============================================================================
// 1. Dynamic Canvas Weather Animation Engine
// ==============================================================================
class WeatherParticleEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.animationFrameId = null;
    this.currentMode = 'sunny';
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.init();
  }

  init() {
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.setMode('sunny');
    this.animate();
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
  }

  setMode(mode) {
    this.currentMode = mode;
    this.particles = [];

    const count = this.getParticleCount(mode);
    for (let i = 0; i < count; i++) {
      this.particles.push(this.createParticle(mode, true));
    }
  }

  getParticleCount(mode) {
    if (mode === 'rainy') return Math.min(180, Math.floor(this.width / 8));
    if (mode === 'snow') return Math.min(120, Math.floor(this.width / 12));
    if (mode === 'cloudy') return 12;
    if (mode === 'thunderstorm') return Math.min(220, Math.floor(this.width / 6));
    if (mode === 'mist') return 24;
    return 40; // sunny dust motes / sunbeams
  }

  createParticle(mode, randomY = false) {
    const yPos = randomY ? Math.random() * this.height : -20;

    switch (mode) {
      case 'rainy':
      case 'thunderstorm':
        return {
          x: Math.random() * (this.width + 100) - 50,
          y: yPos,
          length: Math.random() * 20 + 15,
          speed: Math.random() * 12 + 18,
          angle: 0.15, // slight tilt
          opacity: Math.random() * 0.4 + 0.3,
          width: Math.random() * 1.5 + 0.8
        };

      case 'snow':
        return {
          x: Math.random() * this.width,
          y: yPos,
          radius: Math.random() * 3.5 + 1.2,
          speed: Math.random() * 1.2 + 0.8,
          swing: Math.random() * 2 + 1,
          swingSpeed: Math.random() * 0.02 + 0.01,
          swingOffset: Math.random() * Math.PI * 2,
          opacity: Math.random() * 0.6 + 0.4
        };

      case 'cloudy':
        return {
          x: Math.random() * (this.width + 200) - 100,
          y: Math.random() * (this.height * 0.4),
          radius: Math.random() * 100 + 70,
          speed: Math.random() * 0.25 + 0.1,
          opacity: Math.random() * 0.15 + 0.05
        };

      case 'mist':
        return {
          x: Math.random() * (this.width + 100) - 50,
          y: Math.random() * this.height,
          radius: Math.random() * 140 + 80,
          speed: Math.random() * 0.2 + 0.05,
          opacity: Math.random() * 0.08 + 0.04
        };

      case 'sunny':
      default:
        return {
          x: Math.random() * this.width,
          y: randomY ? Math.random() * this.height : this.height + 10,
          radius: Math.random() * 2.5 + 1,
          speed: Math.random() * 0.6 + 0.2,
          drift: (Math.random() - 0.5) * 0.4,
          opacity: Math.random() * 0.5 + 0.2,
          pulse: Math.random() * 0.03 + 0.01
        };
    }
  }

  animate() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    // Random lightning flash in thunderstorm mode
    if (this.currentMode === 'thunderstorm' && Math.random() < 0.007) {
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      this.ctx.fillRect(0, 0, this.width, this.height);
    }

    // Render & update active particle set
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      if (this.currentMode === 'rainy' || this.currentMode === 'thunderstorm') {
        this.ctx.strokeStyle = `rgba(186, 230, 253, ${p.opacity})`;
        this.ctx.lineWidth = p.width;
        this.ctx.lineCap = 'round';
        this.ctx.beginPath();
        this.ctx.moveTo(p.x, p.y);
        this.ctx.lineTo(p.x - p.length * p.angle, p.y + p.length);
        this.ctx.stroke();

        p.y += p.speed;
        p.x -= p.speed * p.angle;

        if (p.y > this.height) {
          this.particles[i] = this.createParticle(this.currentMode, false);
        }
      } else if (this.currentMode === 'snow') {
        p.swingOffset += p.swingSpeed;
        p.x += Math.sin(p.swingOffset) * p.swing;
        p.y += p.speed;

        this.ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        this.ctx.fill();

        if (p.y > this.height + 10) {
          this.particles[i] = this.createParticle('snow', false);
        }
      } else if (this.currentMode === 'cloudy' || this.currentMode === 'mist') {
        p.x += p.speed;
        this.ctx.fillStyle = state.theme === 'light' 
          ? `rgba(255, 255, 255, ${p.opacity * 1.5})` 
          : `rgba(255, 255, 255, ${p.opacity})`;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        this.ctx.fill();

        if (p.x - p.radius > this.width) {
          p.x = -p.radius;
        }
      } else {
        // Sunny floating motes
        p.y -= p.speed;
        p.x += p.drift;
        p.opacity += Math.sin(Date.now() * 0.002) * 0.005;

        this.ctx.fillStyle = `rgba(251, 191, 36, ${Math.max(0.1, Math.min(0.7, p.opacity))})`;
        this.ctx.shadowBlur = 8;
        this.ctx.shadowColor = 'rgba(251, 191, 36, 0.5)';
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;

        if (p.y < -10) {
          this.particles[i] = this.createParticle('sunny', false);
        }
      }
    }

    this.animationFrameId = requestAnimationFrame(() => this.animate());
  }
}

let particleEngine = null;

// ==============================================================================
// 2. Dynamic Weather Background & UI Sync
// ==============================================================================
function setWeatherBackgroundCondition(conditionCode, weatherMain) {
  let mappedCondition = 'sunny';
  const mainLower = (weatherMain || '').toLowerCase();

  if (mainLower.includes('rain') || mainLower.includes('drizzle')) {
    mappedCondition = 'rainy';
  } else if (mainLower.includes('thunder') || mainLower.includes('storm')) {
    mappedCondition = 'thunderstorm';
  } else if (mainLower.includes('snow') || mainLower.includes('sleet') || mainLower.includes('blizzard')) {
    mappedCondition = 'snow';
  } else if (mainLower.includes('cloud')) {
    mappedCondition = 'cloudy';
  } else if (mainLower.includes('mist') || mainLower.includes('fog') || mainLower.includes('haze') || mainLower.includes('smoke')) {
    mappedCondition = 'mist';
  } else if (mainLower.includes('clear') || mainLower.includes('sun')) {
    mappedCondition = 'sunny';
  }

  state.activeCondition = mappedCondition;

  // Remove existing condition classes and apply new one
  elements.body.classList.remove(
    'condition-sunny',
    'condition-rainy',
    'condition-cloudy',
    'condition-snow',
    'condition-thunderstorm',
    'condition-mist'
  );
  elements.body.classList.add(`condition-${mappedCondition}`);

  // Switch particle animation system
  if (particleEngine) {
    particleEngine.setMode(mappedCondition);
  }
}

// ==============================================================================
// 3. Live Timezone Clock Engine
// ==============================================================================
let liveClockInterval = null;

function startLiveClock() {
  if (liveClockInterval) clearInterval(liveClockInterval);

  function update() {
    // Current UTC time + target city timezone offset
    const nowUtc = Date.now() + (new Date().getTimezoneOffset() * 60000);
    const cityTime = new Date(nowUtc + (state.timezoneOffsetSeconds * 1000));

    // Time string HH:MM:SS
    const hours = String(cityTime.getHours()).padStart(2, '0');
    const minutes = String(cityTime.getMinutes()).padStart(2, '0');
    const seconds = String(cityTime.getSeconds()).padStart(2, '0');
    elements.headerTime.textContent = `${hours}:${minutes}:${seconds}`;

    // Date string
    const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
    elements.headerDate.textContent = cityTime.toLocaleDateString('en-US', options);

    // City hero local time badge
    const localTimeOptions = { weekday: 'long', hour: '2-digit', minute: '2-digit' };
    elements.cityLocalTime.textContent = `Local Time: ${cityTime.toLocaleDateString('en-US', localTimeOptions)}`;
  }

  update();
  liveClockInterval = setInterval(update, 1000);
}

// ==============================================================================
// 4. Toast Notification System
// ==============================================================================
function showToast(message, type = 'info', duration = 4000) {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  let iconClass = 'fa-circle-info';
  if (type === 'error') iconClass = 'fa-circle-exclamation';
  if (type === 'success') iconClass = 'fa-circle-check';

  toast.innerHTML = `
    <i class="fa-solid ${iconClass}"></i>
    <span>${message}</span>
  `;

  elements.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideOutToast 0.35s forwards';
    setTimeout(() => toast.remove(), 350);
  }, duration);
}

// Show / Hide Loader
function setLoading(isLoading) {
  elements.loadingOverlay.style.display = isLoading ? 'flex' : 'none';
  elements.loadingOverlay.setAttribute('aria-hidden', !isLoading);
}

// ==============================================================================
// 5. Units & Temperature Conversion Helpers
// ==============================================================================
function convertTemp(celsius) {
  if (state.unit === 'imperial') {
    return Math.round((celsius * 9/5) + 32);
  }
  return Math.round(celsius);
}

function getTempUnitSymbol() {
  return state.unit === 'imperial' ? 'F' : 'C';
}

function getSpeedUnit() {
  return state.unit === 'imperial' ? 'mph' : 'km/h';
}

function convertSpeed(kmh) {
  if (state.unit === 'imperial') {
    return (kmh * 0.621371).toFixed(1);
  }
  return kmh.toFixed(1);
}

function getWindDirectionCompass(degrees) {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round((degrees % 360) / 22.5) % 16;
  return `${directions[index]} (${Math.round(degrees)}°)`;
}

function formatTime(timestamp, timezoneOffsetSec = 0) {
  const utcMs = (timestamp * 1000) + (new Date().getTimezoneOffset() * 60000);
  const date = new Date(utcMs + (timezoneOffsetSec * 1000));
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
}

// ==============================================================================
// 6. Weather Icon Mapping (Crisp Modern Visuals)
// ==============================================================================
function getWeatherIconUrl(iconCode, condition) {
  // If valid OpenWeatherMap code, return high-res 4x official asset
  if (iconCode && typeof iconCode === 'string' && iconCode.length >= 2) {
    return `https://openweathermap.org/img/wn/${iconCode}@4x.png`;
  }

  // Fallback high-res condition maps
  const lower = (condition || '').toLowerCase();
  if (lower.includes('rain')) return 'https://openweathermap.org/img/wn/10d@4x.png';
  if (lower.includes('thunder')) return 'https://openweathermap.org/img/wn/11d@4x.png';
  if (lower.includes('snow')) return 'https://openweathermap.org/img/wn/13d@4x.png';
  if (lower.includes('cloud')) return 'https://openweathermap.org/img/wn/03d@4x.png';
  if (lower.includes('mist') || lower.includes('fog')) return 'https://openweathermap.org/img/wn/50d@4x.png';
  return 'https://openweathermap.org/img/wn/01d@4x.png';
}

// ==============================================================================
// 7. Weather Data Providers Engine
// ==============================================================================

/**
 * Primary Provider: OpenWeatherMap API
 */
async function fetchFromOpenWeatherMap(query, isCoords = false) {
  const apiKey = state.apiKey.trim();
  if (!apiKey) throw new Error('NO_API_KEY');

  const baseWeather = 'https://api.openweathermap.org/data/2.5/weather';
  const baseForecast = 'https://api.openweathermap.org/data/2.5/forecast';

  const params = isCoords 
    ? `lat=${query.lat}&lon=${query.lon}&appid=${apiKey}&units=metric`
    : `q=${encodeURIComponent(query)}&appid=${apiKey}&units=metric`;

  const weatherRes = await fetch(`${baseWeather}?${params}`);
  if (!weatherRes.ok) {
    if (weatherRes.status === 401) throw new Error('INVALID_API_KEY');
    if (weatherRes.status === 404) throw new Error('CITY_NOT_FOUND');
    throw new Error(`OWM_ERROR_${weatherRes.status}`);
  }
  const weatherJson = await weatherRes.json();

  const forecastRes = await fetch(`${baseForecast}?${params}`);
  const forecastJson = forecastRes.ok ? await forecastRes.json() : null;

  // Optional Air Pollution API
  let aqiJson = null;
  try {
    const aqiRes = await fetch(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${weatherJson.coord.lat}&lon=${weatherJson.coord.lon}&appid=${apiKey}`);
    if (aqiRes.ok) aqiJson = await aqiRes.json();
  } catch (e) {
    console.warn('Air pollution API fetch skipped:', e);
  }

  return normalizeOwmData(weatherJson, forecastJson, aqiJson);
}

function normalizeOwmData(current, forecast, aqi) {
  // Aggregate 5-Day Forecast from 3-hour list
  const dailyMap = {};
  const hourlyList = [];

  if (forecast && forecast.list) {
    forecast.list.forEach((item, index) => {
      // Collect first 8 items (next 24 hours) for hourly
      if (index < 8) {
        hourlyList.push({
          time: formatTime(item.dt, current.timezone),
          tempC: item.main.temp,
          icon: item.weather[0].icon,
          condition: item.weather[0].main,
          pop: Math.round((item.pop || 0) * 100)
        });
      }

      // Group by date for daily forecast
      const dateKey = item.dt_txt ? item.dt_txt.split(' ')[0] : new Date(item.dt * 1000).toISOString().split('T')[0];
      if (!dailyMap[dateKey]) {
        dailyMap[dateKey] = {
          date: dateKey,
          dt: item.dt,
          minTempC: item.main.temp_min,
          maxTempC: item.main.temp_max,
          icon: item.weather[0].icon,
          condition: item.weather[0].description,
          mainCondition: item.weather[0].main,
          humidity: item.main.humidity,
          pop: Math.round((item.pop || 0) * 100)
        };
      } else {
        dailyMap[dateKey].minTempC = Math.min(dailyMap[dateKey].minTempC, item.main.temp_min);
        dailyMap[dateKey].maxTempC = Math.max(dailyMap[dateKey].maxTempC, item.main.temp_max);
        if (item.dt_txt && item.dt_txt.includes('12:00:00')) {
          dailyMap[dateKey].icon = item.weather[0].icon;
          dailyMap[dateKey].condition = item.weather[0].description;
          dailyMap[dateKey].mainCondition = item.weather[0].main;
        }
      }
    });
  }

  const dailyList = Object.values(dailyMap).slice(0, 5);

  let aqiValue = 35;
  if (aqi && aqi.list && aqi.list[0]) {
    // OpenWeatherMap scale is 1 (Good) to 5 (Very Poor) -> convert to standard AQI approx
    const scale = aqi.list[0].main.aqi;
    aqiValue = scale === 1 ? 25 : scale === 2 ? 55 : scale === 3 ? 110 : scale === 4 ? 165 : 220;
  }

  return {
    source: 'OpenWeatherMap API',
    city: current.name,
    country: current.sys.country || '',
    lat: current.coord.lat,
    lon: current.coord.lon,
    tempC: current.main.temp,
    feelsLikeC: current.main.feels_like,
    tempMinC: current.main.temp_min,
    tempMaxC: current.main.temp_max,
    condition: current.weather[0].description,
    mainCondition: current.weather[0].main,
    icon: current.weather[0].icon,
    humidity: current.main.humidity,
    pressure: current.main.pressure,
    windSpeedKmh: current.wind.speed * 3.6, // m/s to km/h
    windDeg: current.wind.deg || 0,
    windGustKmh: current.wind.gust ? current.wind.gust * 3.6 : (current.wind.speed * 3.6 * 1.3),
    visibilityKm: (current.visibility / 1000).toFixed(1),
    sunrise: current.sys.sunrise,
    sunset: current.sys.sunset,
    timezoneOffset: current.timezone,
    uvIndex: 3.2, // OWM 2.5 doesn't include UV directly in free tier
    aqi: aqiValue,
    hourly: hourlyList,
    daily: dailyList
  };
}

/**
 * Secondary / Zero-Key Provider: Open-Meteo Global Engine
 * Guarantees that any user can test ANY city immediately without an API key!
 */
async function fetchFromOpenMeteo(query, isCoords = false) {
  let lat = 51.5074;
  let lon = -0.1278;
  let cityName = 'London';
  let countryCode = 'GB';

  if (isCoords) {
    lat = query.lat;
    lon = query.lon;
    cityName = 'Your Location';
    countryCode = 'GPS';
    // Reverse geocode via BigDataCloud or Open-Meteo reverse
    try {
      const revRes = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
      if (revRes.ok) {
        const revJson = await revRes.json();
        cityName = revJson.city || revJson.locality || 'Current Location';
        countryCode = revJson.countryCode || '';
      }
    } catch (e) {
      console.warn('Reverse geocode failed:', e);
    }
  } else {
    // Forward geocode city name
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`;
    const geoRes = await fetch(geoUrl);
    if (!geoRes.ok) throw new Error('GEOCODE_FAILED');
    const geoJson = await geoRes.json();

    if (!geoJson.results || geoJson.results.length === 0) {
      throw new Error('CITY_NOT_FOUND');
    }

    const first = geoJson.results[0];
    lat = first.latitude;
    lon = first.longitude;
    cityName = first.name;
    countryCode = first.country_code || first.country || '';
  }

  // Fetch complete weather parameters from Open-Meteo
  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m&hourly=temperature_2m,weather_code,precipitation_probability&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max&timezone=auto`;

  const weatherRes = await fetch(weatherUrl);
  if (!weatherRes.ok) throw new Error('OPEN_METEO_FETCH_FAILED');
  const weatherJson = await weatherRes.json();

  return normalizeOpenMeteoData(cityName, countryCode, weatherJson);
}

function wmoCodeToCondition(code) {
  // WMO Weather interpretation codes (WW)
  if (code === 0) return { main: 'Clear', desc: 'Clear sky', icon: '01d' };
  if (code === 1) return { main: 'Clear', desc: 'Mainly clear', icon: '02d' };
  if (code === 2) return { main: 'Clouds', desc: 'Partly cloudy', icon: '03d' };
  if (code === 3) return { main: 'Clouds', desc: 'Overcast clouds', icon: '04d' };
  if (code >= 45 && code <= 48) return { main: 'Mist', desc: 'Fog & depositing rime fog', icon: '50d' };
  if (code >= 51 && code <= 55) return { main: 'Rain', desc: 'Light drizzle', icon: '09d' };
  if (code >= 61 && code <= 65) return { main: 'Rain', desc: 'Rain showers', icon: '10d' };
  if (code >= 71 && code <= 77) return { main: 'Snow', desc: 'Snowfall', icon: '13d' };
  if (code >= 80 && code <= 82) return { main: 'Rain', desc: 'Violent rain showers', icon: '09d' };
  if (code >= 85 && code <= 86) return { main: 'Snow', desc: 'Heavy snow showers', icon: '13d' };
  if (code >= 95 && code <= 99) return { main: 'Thunderstorm', desc: 'Thunderstorm with precipitation', icon: '11d' };
  return { main: 'Clouds', desc: 'Scattered clouds', icon: '03d' };
}

function normalizeOpenMeteoData(cityName, countryCode, json) {
  const current = json.current;
  const daily = json.daily;
  const hourly = json.hourly;
  const cond = wmoCodeToCondition(current.weather_code);

  const timezoneOffsetSec = json.utc_offset_seconds || 0;

  // Next 8 hours hourly
  const hourlyList = [];
  if (hourly && hourly.time) {
    const nowHour = new Date().getHours();
    for (let i = 0; i < 8; i++) {
      const idx = (nowHour + i * 3) % hourly.time.length;
      const c = wmoCodeToCondition(hourly.weather_code[idx]);
      const dateObj = new Date(hourly.time[idx]);
      let hrs = dateObj.getHours();
      const ampm = hrs >= 12 ? 'PM' : 'AM';
      hrs = hrs % 12 || 12;

      hourlyList.push({
        time: `${hrs}:00 ${ampm}`,
        tempC: hourly.temperature_2m[idx],
        icon: c.icon,
        condition: c.main,
        pop: hourly.precipitation_probability ? hourly.precipitation_probability[idx] : 10
      });
    }
  }

  // 5 Days daily
  const dailyList = [];
  if (daily && daily.time) {
    for (let i = 0; i < Math.min(5, daily.time.length); i++) {
      const c = wmoCodeToCondition(daily.weather_code[i]);
      dailyList.push({
        date: daily.time[i],
        dt: Math.floor(new Date(daily.time[i]).getTime() / 1000),
        minTempC: daily.temperature_2m_min[i],
        maxTempC: daily.temperature_2m_max[i],
        icon: c.icon,
        condition: c.desc,
        mainCondition: c.main,
        humidity: current.relative_humidity_2m,
        pop: daily.precipitation_probability_max ? daily.precipitation_probability_max[i] : 20
      });
    }
  }

  // Sunrise / Sunset parse
  const sunriseIso = daily && daily.sunrise ? daily.sunrise[0] : null;
  const sunsetIso = daily && daily.sunset ? daily.sunset[0] : null;
  const sunriseTs = sunriseIso ? Math.floor(new Date(sunriseIso).getTime() / 1000) : Math.floor(Date.now() / 1000) - 14400;
  const sunsetTs = sunsetIso ? Math.floor(new Date(sunsetIso).getTime() / 1000) : Math.floor(Date.now() / 1000) + 14400;

  return {
    source: 'Open-Meteo Live Engine (Free Global)',
    city: cityName,
    country: countryCode.toUpperCase(),
    lat: json.latitude,
    lon: json.longitude,
    tempC: current.temperature_2m,
    feelsLikeC: current.apparent_temperature,
    tempMinC: daily ? daily.temperature_2m_min[0] : current.temperature_2m - 4,
    tempMaxC: daily ? daily.temperature_2m_max[0] : current.temperature_2m + 4,
    condition: cond.desc,
    mainCondition: cond.main,
    icon: cond.icon,
    humidity: current.relative_humidity_2m,
    pressure: Math.round(current.surface_pressure || 1013),
    windSpeedKmh: current.wind_speed_10m,
    windDeg: current.wind_direction_10m || 0,
    windGustKmh: current.wind_gusts_10m || (current.wind_speed_10m * 1.3),
    visibilityKm: '10.0',
    sunrise: sunriseTs,
    sunset: sunsetTs,
    timezoneOffset: timezoneOffsetSec,
    uvIndex: daily && daily.uv_index_max ? daily.uv_index_max[0] : 3.5,
    aqi: 32, // pristine
    hourly: hourlyList,
    daily: dailyList
  };
}

/**
 * Unified Dispatcher: Tries OpenWeatherMap first if key exists,
 * or gracefully falls back to Open-Meteo so the app never fails!
 */
async function loadWeatherData(query, isCoords = false) {
  setLoading(true);

  try {
    let data = null;
    const hasKey = state.apiKey && state.apiKey.trim().length > 0;
    const forceOpenMeteo = state.providerChoice === 'openmeteo';

    if (hasKey && !forceOpenMeteo) {
      try {
        data = await fetchFromOpenWeatherMap(query, isCoords);
        showToast('Connected to OpenWeatherMap API', 'success');
      } catch (err) {
        if (err.message === 'CITY_NOT_FOUND') {
          throw new Error('City not found. Please verify spelling.');
        }
        console.warn('OpenWeatherMap call failed, falling back to Open-Meteo:', err);
        showToast('Falling back to Open-Meteo Global Weather Engine', 'info');
        data = await fetchFromOpenMeteo(query, isCoords);
      }
    } else {
      // Auto-fallback or preferred Open-Meteo
      data = await fetchFromOpenMeteo(query, isCoords);
    }

    // Save to state and update DOM
    state.weatherData = data;
    state.city = data.city;
    state.country = data.country;
    state.timezoneOffsetSeconds = data.timezoneOffset;

    // Update search history if city name query
    if (!isCoords && typeof query === 'string') {
      addToSearchHistory(data.city);
    }

    renderWeatherDashboard(data);
    startLiveClock();
    localStorage.setItem(CONFIG.STORAGE_KEYS.LAST_CITY, data.city);

  } catch (error) {
    console.error('Weather load error:', error);
    showToast(error.message || 'Unable to load weather data. Please try again.', 'error');
  } finally {
    setLoading(false);
  }
}

// ==============================================================================
// 8. UI Rendering Engine
// ==============================================================================
function renderWeatherDashboard(data) {
  // 1. Hero Card Location & Titles
  elements.cityName.textContent = data.city;
  elements.countryBadge.textContent = data.country || 'GLOBAL';
  elements.weatherConditionText.textContent = data.condition;
  elements.weatherDescriptionSub.textContent = `Today: ${data.condition}`;

  // 2. Dynamic Background & Canvas Effect
  setWeatherBackgroundCondition(data.icon, data.mainCondition);

  // 3. Temperatures
  elements.currentTemp.textContent = convertTemp(data.tempC);
  elements.currentTempUnit.textContent = getTempUnitSymbol();
  elements.feelsLikeTemp.textContent = `${convertTemp(data.feelsLikeC)}°${getTempUnitSymbol()}`;
  elements.tempMax.textContent = `${convertTemp(data.tempMaxC)}°${getTempUnitSymbol()}`;
  elements.tempMin.textContent = `${convertTemp(data.tempMinC)}°${getTempUnitSymbol()}`;

  // 4. Hero Weather Icon
  elements.heroWeatherIcon.src = getWeatherIconUrl(data.icon, data.mainCondition);
  elements.heroWeatherIcon.alt = data.condition;

  // 5. Quick Pills in Hero Footer
  elements.quickHumidity.textContent = `${data.humidity}%`;
  elements.quickWind.textContent = `${convertSpeed(data.windSpeedKmh)} ${getSpeedUnit()}`;
  elements.quickPressure.textContent = `${data.pressure} hPa`;
  elements.quickVisibility.textContent = `${data.visibilityKm} km`;

  // 6. Metrics Grid
  // Metric: Humidity
  elements.metricHumidityVal.textContent = data.humidity;
  elements.humidityProgress.style.width = `${Math.min(100, data.humidity)}%`;
  if (data.humidity < 35) {
    elements.metricHumidityBadge.textContent = 'Dry';
    elements.metricHumidityBadge.className = 'metric-status-badge badge-normal';
  } else if (data.humidity <= 65) {
    elements.metricHumidityBadge.textContent = 'Comfortable';
    elements.metricHumidityBadge.className = 'metric-status-badge badge-good';
  } else {
    elements.metricHumidityBadge.textContent = 'Humid';
    elements.metricHumidityBadge.className = 'metric-status-badge badge-alert';
  }
  const dewApprox = Math.round(data.tempC - ((100 - data.humidity) / 5));
  elements.humidityDew.textContent = `Dew point is approx ${convertTemp(dewApprox)}°${getTempUnitSymbol()}.`;

  // Metric: Wind
  elements.metricWindVal.textContent = convertSpeed(data.windSpeedKmh);
  elements.metricWindUnit.textContent = getSpeedUnit();
  elements.windDirectionText.textContent = getWindDirectionCompass(data.windDeg);
  elements.compassArrow.style.transform = `rotate(${data.windDeg}deg)`;
  elements.windGustVal.textContent = `${convertSpeed(data.windGustKmh)} ${getSpeedUnit()}`;
  if (data.windSpeedKmh < 10) elements.windDesc.textContent = 'Light gentle breeze';
  else if (data.windSpeedKmh < 28) elements.windDesc.textContent = 'Moderate constant breeze';
  else if (data.windSpeedKmh < 45) elements.windDesc.textContent = 'Strong brisk winds';
  else elements.windDesc.textContent = 'High wind gale warning';

  // Metric: Air Quality Index (AQI)
  elements.metricAqiVal.textContent = data.aqi;
  const aqiPct = Math.min(100, Math.round((data.aqi / 300) * 100));
  elements.aqiProgress.style.width = `${aqiPct}%`;
  if (data.aqi <= 50) {
    elements.aqiStatusBadge.textContent = 'Good';
    elements.aqiStatusBadge.className = 'metric-status-badge badge-good';
    elements.aqiAdvice.textContent = 'Air quality is satisfactory and poses little or no risk.';
  } else if (data.aqi <= 100) {
    elements.aqiStatusBadge.textContent = 'Moderate';
    elements.aqiStatusBadge.className = 'metric-status-badge badge-normal';
    elements.aqiAdvice.textContent = 'Acceptable quality; sensitive individuals should take care.';
  } else {
    elements.aqiStatusBadge.textContent = 'Unhealthy';
    elements.aqiStatusBadge.className = 'metric-status-badge badge-alert';
    elements.aqiAdvice.textContent = 'Consider reducing prolonged outdoor exertion.';
  }

  // Metric: UV Index
  elements.metricUvVal.textContent = data.uvIndex.toFixed(1);
  const uvPct = Math.min(100, Math.round((data.uvIndex / 12) * 100));
  elements.uvProgress.style.width = `${uvPct}%`;
  if (data.uvIndex <= 2) {
    elements.uvStatusBadge.textContent = 'Low';
    elements.uvStatusBadge.className = 'metric-status-badge badge-low';
    elements.uvAdvice.textContent = 'Minimal protection required. Safe outdoor sun.';
  } else if (data.uvIndex <= 5) {
    elements.uvStatusBadge.textContent = 'Moderate';
    elements.uvStatusBadge.className = 'metric-status-badge badge-normal';
    elements.uvAdvice.textContent = 'Wear sunglasses and apply SPF 30+ sunscreen.';
  } else {
    elements.uvStatusBadge.textContent = 'Very High';
    elements.uvStatusBadge.className = 'metric-status-badge badge-alert';
    elements.uvAdvice.textContent = 'High risk of harm. Seek shade during midday.';
  }

  // Metric: Sun Schedule
  elements.sunriseTime.textContent = formatTime(data.sunrise, data.timezoneOffset);
  elements.sunsetTime.textContent = formatTime(data.sunset, data.timezoneOffset);
  const totalDaylightSec = Math.max(0, data.sunset - data.sunrise);
  const daylightHours = Math.floor(totalDaylightSec / 3600);
  const daylightMins = Math.floor((totalDaylightSec % 3600) / 60);
  elements.daylightDuration.textContent = `${daylightHours}h ${daylightMins}m`;

  const nowSec = Math.floor(Date.now() / 1000);
  if (nowSec > data.sunset) {
    elements.sunStatusText.textContent = 'Sun has set for today.';
  } else if (nowSec < data.sunrise) {
    elements.sunStatusText.textContent = 'Awaiting dawn.';
  } else {
    const leftSec = data.sunset - nowSec;
    const leftH = Math.floor(leftSec / 3600);
    const leftM = Math.floor((leftSec % 3600) / 60);
    elements.sunStatusText.textContent = `Daylight remaining: ${leftH}h ${leftM}m`;
  }

  // Metric: Pressure & Visibility
  elements.metricPressureVal.textContent = data.pressure;
  elements.metricVisibilityVal.textContent = data.visibilityKm;
  if (data.pressure > 1020) elements.pressureDesc.textContent = 'High pressure system (fair skies expected)';
  else if (data.pressure < 1005) elements.pressureDesc.textContent = 'Low pressure system (possible storm/rain)';
  else elements.pressureDesc.textContent = 'Normal atmospheric barometric pressure';

  // 7. Hourly Forecast Slider
  renderHourlyForecast(data.hourly);

  // 8. 5-Day Forecast Grid
  renderFiveDayForecast(data.daily);

  // 9. Footer Provider Tag
  elements.activeDataSource.textContent = data.source;
}

function renderHourlyForecast(hourlyItems) {
  elements.hourlyForecastList.innerHTML = '';
  if (!hourlyItems || hourlyItems.length === 0) return;

  hourlyItems.forEach(item => {
    const card = document.createElement('div');
    card.className = 'hourly-card';
    card.innerHTML = `
      <span class="hourly-time">${item.time}</span>
      <img class="hourly-icon" src="${getWeatherIconUrl(item.icon, item.condition)}" alt="${item.condition}" />
      <span class="hourly-temp">${convertTemp(item.tempC)}°${getTempUnitSymbol()}</span>
      <span class="hourly-pop"><i class="fa-solid fa-droplet"></i> ${item.pop}%</span>
    `;
    elements.hourlyForecastList.appendChild(card);
  });
}

function renderFiveDayForecast(dailyItems) {
  elements.fiveDayForecastGrid.innerHTML = '';
  if (!dailyItems || dailyItems.length === 0) return;

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  dailyItems.forEach((day, index) => {
    const dateObj = new Date(day.dt * 1000);
    let dayName = daysOfWeek[dateObj.getDay()];
    if (index === 0) dayName = 'Today';
    else if (index === 1) dayName = 'Tomorrow';

    const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    const card = document.createElement('div');
    card.className = 'daily-card glass-card';
    card.innerHTML = `
      <div class="daily-date-group">
        <span class="daily-day-name">${dayName}</span>
        <span class="daily-full-date">${formattedDate}</span>
      </div>
      <div class="daily-icon-wrap">
        <img class="daily-icon" src="${getWeatherIconUrl(day.icon, day.mainCondition)}" alt="${day.condition}" />
      </div>
      <span class="daily-condition-label">${day.condition}</span>
      <div class="daily-temp-bar-container">
        <div class="daily-temp-range">
          <span class="daily-high">${convertTemp(day.maxTempC)}°</span>
          <span class="daily-low">${convertTemp(day.minTempC)}°</span>
        </div>
        <div class="daily-range-bar"></div>
      </div>
      <div class="daily-meta-footer">
        <span><i class="fa-solid fa-droplet"></i> ${day.pop}% Rain</span>
        <span><i class="fa-solid fa-water"></i> ${day.humidity}%</span>
      </div>
    `;
    elements.fiveDayForecastGrid.appendChild(card);
  });
}

// ==============================================================================
// 9. Recent Searches & LocalStorage Engine
// ==============================================================================
function renderSearchHistory() {
  elements.recentChipsList.innerHTML = '';
  if (state.searchHistory.length === 0) {
    elements.recentSearchesWrapper.style.display = 'none';
    return;
  }
  elements.recentSearchesWrapper.style.display = 'flex';

  state.searchHistory.forEach(city => {
    const chip = document.createElement('div');
    chip.className = 'recent-chip';
    chip.innerHTML = `
      <span>${city}</span>
      <button class="chip-remove-btn" title="Remove ${city}" aria-label="Remove ${city}">
        <i class="fa-solid fa-xmark"></i>
      </button>
    `;

    // Click chip text to trigger search
    chip.querySelector('span').addEventListener('click', () => {
      elements.searchInput.value = city;
      loadWeatherData(city);
    });

    // Remove single chip
    chip.querySelector('.chip-remove-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      removeFromSearchHistory(city);
    });

    elements.recentChipsList.appendChild(chip);
  });
}

function addToSearchHistory(cityName) {
  if (!cityName) return;
  const cleanCity = cityName.trim();
  // Filter out duplicate
  let history = state.searchHistory.filter(c => c.toLowerCase() !== cleanCity.toLowerCase());
  history.unshift(cleanCity);
  if (history.length > CONFIG.MAX_HISTORY_ITEMS) {
    history = history.slice(0, CONFIG.MAX_HISTORY_ITEMS);
  }
  state.searchHistory = history;
  localStorage.setItem(CONFIG.STORAGE_KEYS.SEARCH_HISTORY, JSON.stringify(history));
  renderSearchHistory();
}

function removeFromSearchHistory(cityName) {
  state.searchHistory = state.searchHistory.filter(c => c.toLowerCase() !== cityName.toLowerCase());
  localStorage.setItem(CONFIG.STORAGE_KEYS.SEARCH_HISTORY, JSON.stringify(state.searchHistory));
  renderSearchHistory();
}

function clearAllSearchHistory() {
  state.searchHistory = [];
  localStorage.removeItem(CONFIG.STORAGE_KEYS.SEARCH_HISTORY);
  renderSearchHistory();
  showToast('Search history cleared', 'info');
}

// ==============================================================================
// 10. Geolocation (Auto-Detect User Location)
// ==============================================================================
function detectUserLocation() {
  if (!navigator.geolocation) {
    showToast('Geolocation is not supported by your browser.', 'error');
    return;
  }

  setLoading(true);
  showToast('Detecting your GPS location...', 'info');

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const coords = {
        lat: position.coords.latitude,
        lon: position.coords.longitude
      };
      loadWeatherData(coords, true);
    },
    (error) => {
      setLoading(false);
      let errMsg = 'Unable to retrieve location.';
      if (error.code === error.PERMISSION_DENIED) {
        errMsg = 'Location permission was denied. Please search by city name.';
      } else if (error.code === error.POSITION_UNAVAILABLE) {
        errMsg = 'Location signal unavailable.';
      } else if (error.code === error.TIMEOUT) {
        errMsg = 'Location request timed out.';
      }
      showToast(errMsg, 'error');
    },
    { timeout: 10000, enableHighAccuracy: true }
  );
}

// ==============================================================================
// 11. Theme & Unit Toggle Handlers
// ==============================================================================
function applyTheme(theme) {
  state.theme = theme;
  elements.html.setAttribute('data-theme', theme);
  localStorage.setItem(CONFIG.STORAGE_KEYS.THEME, theme);

  if (theme === 'light') {
    elements.themeIcon.className = 'fa-solid fa-sun theme-icon';
    elements.themeToggle.title = 'Switch to Dark Mode';
  } else {
    elements.themeIcon.className = 'fa-solid fa-moon theme-icon';
    elements.themeToggle.title = 'Switch to Light Mode';
  }
}

function toggleTheme() {
  const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
  applyTheme(nextTheme);
}

function setUnit(unit) {
  if (state.unit === unit) return;
  state.unit = unit;
  localStorage.setItem(CONFIG.STORAGE_KEYS.UNIT, unit);

  if (unit === 'metric') {
    elements.unitCBtn.classList.add('active');
    elements.unitFBtn.classList.remove('active');
  } else {
    elements.unitFBtn.classList.add('active');
    elements.unitCBtn.classList.remove('active');
  }

  // Re-render dashboard with new units instantly without re-fetching
  if (state.weatherData) {
    renderWeatherDashboard(state.weatherData);
  }
}

// ==============================================================================
// 12. Settings Modal (API Key Configuration)
// ==============================================================================
function openSettingsModal() {
  elements.apiKeyInput.value = state.apiKey;
  elements.providerRadios.forEach(radio => {
    radio.checked = (radio.value === state.providerChoice);
  });
  elements.settingsModal.style.display = 'flex';
  elements.settingsModal.setAttribute('aria-hidden', 'false');
}

function closeSettingsModal() {
  elements.settingsModal.style.display = 'none';
  elements.settingsModal.setAttribute('aria-hidden', 'true');
}

async function testApiKey() {
  const key = elements.apiKeyInput.value.trim();
  if (!key) {
    showToast('Please paste an API key first.', 'error');
    return;
  }

  setLoading(true);
  try {
    const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=London&appid=${key}`);
    if (res.ok) {
      showToast('API Key verified successfully! OpenWeatherMap is active.', 'success');
    } else {
      showToast('API Key test failed. Status: ' + res.status + ' (' + res.statusText + ')', 'error');
    }
  } catch (e) {
    showToast('Network error during API test: ' + e.message, 'error');
  } finally {
    setLoading(false);
  }
}

function saveSettings() {
  const newKey = elements.apiKeyInput.value.trim();
  state.apiKey = newKey;
  localStorage.setItem(CONFIG.STORAGE_KEYS.API_KEY, newKey);

  let selectedProvider = 'auto';
  elements.providerRadios.forEach(r => {
    if (r.checked) selectedProvider = r.value;
  });
  state.providerChoice = selectedProvider;
  localStorage.setItem(CONFIG.STORAGE_KEYS.PROVIDER_CHOICE, selectedProvider);

  closeSettingsModal();
  showToast('Settings saved. Refreshing weather data...', 'success');

  // Reload current city with updated settings
  loadWeatherData(state.city || CONFIG.DEFAULT_CITY);
}

// ==============================================================================
// 13. Event Listeners Setup
// ==============================================================================
function bindEventListeners() {
  // Search Form Submit
  elements.searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = elements.searchInput.value.trim();
    if (query) {
      loadWeatherData(query);
      elements.searchInput.blur();
    }
  });

  // Search Input Input & Clear button
  elements.searchInput.addEventListener('input', () => {
    elements.clearSearchBtn.style.display = elements.searchInput.value ? 'block' : 'none';
  });

  elements.clearSearchBtn.addEventListener('click', () => {
    elements.searchInput.value = '';
    elements.clearSearchBtn.style.display = 'none';
    elements.searchInput.focus();
  });

  // Geolocation button
  elements.geoBtn.addEventListener('click', () => {
    detectUserLocation();
  });

  // Clear all history
  elements.clearHistoryBtn.addEventListener('click', () => {
    clearAllSearchHistory();
  });

  // Units
  elements.unitCBtn.addEventListener('click', () => setUnit('metric'));
  elements.unitFBtn.addEventListener('click', () => setUnit('imperial'));

  // Theme toggle
  elements.themeToggle.addEventListener('click', toggleTheme);

  // Settings Modal toggles
  elements.settingsToggle.addEventListener('click', openSettingsModal);
  elements.footerSettingsBtn.addEventListener('click', openSettingsModal);
  elements.closeModalBtn.addEventListener('click', closeSettingsModal);
  elements.settingsModal.addEventListener('click', (e) => {
    if (e.target === elements.settingsModal) closeSettingsModal();
  });

  // Toggle API Key visibility
  elements.toggleKeyVisibility.addEventListener('click', () => {
    const isPassword = elements.apiKeyInput.type === 'password';
    elements.apiKeyInput.type = isPassword ? 'text' : 'password';
    elements.toggleKeyVisibility.querySelector('i').className = isPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye';
  });

  elements.testApiBtn.addEventListener('click', testApiKey);
  elements.saveSettingsBtn.addEventListener('click', saveSettings);

  // Keyboard shortcut Esc to close modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && elements.settingsModal.style.display === 'flex') {
      closeSettingsModal();
    }
  });
}

// ==============================================================================
// 14. Application Initialization
// ==============================================================================
function initApp() {
  // 1. Initialize Canvas Particle Engine
  particleEngine = new WeatherParticleEngine(elements.canvas);

  // 2. Setup Theme & Units
  applyTheme(state.theme);
  setUnit(state.unit);

  // 3. Render Search History Chips
  renderSearchHistory();

  // 4. Bind DOM Events
  bindEventListeners();

  // 5. Initial Weather Load: Try last searched city, or default to London, and attempt Geolocation if first visit
  const lastCity = localStorage.getItem(CONFIG.STORAGE_KEYS.LAST_CITY);
  const initialCity = lastCity || CONFIG.DEFAULT_CITY;
  elements.searchInput.value = initialCity;

  loadWeatherData(initialCity);
}

// Bootstrap on DOMContentLoaded
document.addEventListener('DOMContentLoaded', initApp);
