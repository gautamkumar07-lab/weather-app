# SkyPulse | Modern Glassmorphism Weather Forecast

SkyPulse is an ultra-modern, high-performance Weather Forecast web application designed with a sleek **Glassmorphism** visual language, dynamic animated atmospheric canvas effects, and comprehensive weather metrics.

---

## 🌟 Features & Highlights

### 1. Glassmorphism Visual Design
- **Frosted Glass Cards:** Built with high-fidelity `backdrop-filter: blur(20px)`, translucent backgrounds, multi-stop luminous borders, and ambient drop shadows.
- **Ambient Lighting:** Floating colored ambient orbs (`.ambient-glow`) provide organic depth and realistic lighting behind cards.
- **Dark & Light Mode:** Seamlessly switch between themes with persistence in `localStorage`.
- **Celsius (°C) & Fahrenheit (°F) Toggle:** Instant conversion of all metrics and forecasts without reloading data.

### 2. Dynamic Weather Background & Particle System
- Dynamically responds to current weather conditions with real-time gradient sky shifts and custom HTML5 Canvas particle systems:
  - ☀️ **Sunny / Clear:** Radiant warm sky gradient with floating glowing sun dust motes.
  - 🌧️ **Rainy / Drizzle:** Deep storm atmosphere with slanted rain streak animations and puddle splatters.
  - ☁️ **Cloudy / Overcast:** Layered drifting semi-transparent cloud masses across the screen.
  - ❄️ **Snow:** Crisp indigo winter sky with gentle fluttering snowflakes.
  - ⛈️ **Thunderstorm:** Storm clouds with randomized ambient lightning flashes.
  - 🌫️ **Mist / Fog:** Atmospheric drifting mist layer.

### 3. Comprehensive Weather Data Metrics
- **Current Hero Card:**
  - City name, country badge, and country flag styling.
  - Timezone-aware **Live Ticking Clock** and formatted current date.
  - Current temperature, "Feels Like" temperature, and daily High/Low range.
  - Floating weather icon and condition subtitle.
- **Detailed Metrics Grid:**
  - 💧 **Humidity:** Percentage bar, comfort level badge (Dry/Comfortable/Humid), and dew point.
  - 💨 **Wind Status:** Speed in km/h or mph, dynamic rotating compass dial for wind direction, and gust speeds.
  - 🫁 **Air Quality Index (AQI):** Visual color-coded health meter and advisory.
  - ☀️ **UV Index:** Solar exposure meter and protection advice.
  - 🌅 **Sunrise & Sunset:** Sun schedule card showing exact sunrise, sunset, total daylight duration, and remaining daylight.
  - 🧭 **Barometer & Vision:** Atmospheric pressure (hPa) and visibility (km).

### 4. Forecasts
- **24-Hour Hourly Forecast:** Horizontal scrollable card slider showing 3-hour interval predictions, temperature curves, weather icons, and precipitation probability (POP%).
- **5-Day Extended Outlook:** 5 glass cards detailing day names, dates, weather conditions, gradient temperature range bars (Min / Max), and rain probability.

### 5. Smart Dual-Engine Weather API Architecture
- **OpenWeatherMap API Support:** Full native support for OpenWeatherMap 2.5 Current Weather, 5-Day Forecast, and Air Pollution endpoints.
- **In-App API Settings Modal:** Click the gear icon in the header or footer to paste your OpenWeatherMap API key, test the connection with one click, and save it to `localStorage`.
- **Zero-Config Global Fallback:** If you don't have an OpenWeatherMap API key or if a key is invalid/rate-limited, SkyPulse automatically falls back to **Open-Meteo Global Weather Service** (100% free, real-time, zero API key required). The application works straight out of the box for any city on Earth!

### 6. Bonus Utilities
- 📍 **GPS Geolocation:** One-click "My Location" button with automatic reverse geocoding.
- 🕒 **Search History:** Recent search chips saved to `localStorage` with quick click-to-search and clear buttons.
- 🔔 **Toast Notification System:** Non-intrusive animated toast alerts for error handling, city lookups, and mode changes.
- 📱 **Mobile Responsive:** Fluid responsive layout from 320px mobile screens up to 4K displays.

---

## 📁 File Structure

```
weather-app/
├── index.html        # Clean, semantic HTML5 structure with glassmorphic components
├── style.css         # Modern CSS3 styling, design tokens, themes & animations
├── app.js            # ES6+ JavaScript: Canvas particle engine, dual-API dispatcher, state & UI
└── README.md         # Documentation & guide
```

---

## 🚀 How to Run

Because SkyPulse is built with standard vanilla web technologies (HTML5, CSS3, ES6 JavaScript), you can run it in multiple ways:

### Option A: Open directly in your browser
Simply double-click [**`index.html`**](file:///C:/Users/GAUATM%20KUMAR/.gemini/antigravity/scratch/weather-app/index.html) or open it directly in Chrome, Edge, Firefox, or Safari. Everything (search, forecast, particles, dark mode) works out-of-the-box!

### Option B: Run the built-in local server (Zero dependencies)
A lightweight Node.js server script (`server.js`) is included:

```powershell
# In PowerShell:
node "C:\Users\GAUATM KUMAR\.gemini\antigravity\scratch\weather-app\server.js"
```
Then visit **`http://localhost:8000`** in your browser.

---

## ⚙️ OpenWeatherMap API Setup (Optional)

1. Sign up for a free account at [openweathermap.org](https://home.openweathermap.org/users/sign_up).
2. Generate a free API key in your account dashboard.
3. In SkyPulse, click the **Settings (Gear Icon)** in the top right.
4. Paste your API key into the field and click **Test Key** to verify.
5. Click **Save & Apply**. Your key is securely stored in your browser's `localStorage`.
