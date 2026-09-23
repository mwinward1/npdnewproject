// Open-Meteo APIs are free and need no API key.
const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

// WMO weather interpretation codes: https://open-meteo.com/en/docs
const WEATHER_CODES = {
  0: ["Clear sky", "☀️"],
  1: ["Mainly clear", "🌤️"],
  2: ["Partly cloudy", "⛅"],
  3: ["Overcast", "☁️"],
  45: ["Fog", "🌫️"],
  48: ["Depositing rime fog", "🌫️"],
  51: ["Light drizzle", "🌦️"],
  53: ["Moderate drizzle", "🌦️"],
  55: ["Dense drizzle", "🌦️"],
  56: ["Light freezing drizzle", "🌧️"],
  57: ["Dense freezing drizzle", "🌧️"],
  61: ["Slight rain", "🌧️"],
  63: ["Moderate rain", "🌧️"],
  65: ["Heavy rain", "🌧️"],
  66: ["Light freezing rain", "🌧️"],
  67: ["Heavy freezing rain", "🌧️"],
  71: ["Slight snow", "🌨️"],
  73: ["Moderate snow", "🌨️"],
  75: ["Heavy snow", "❄️"],
  77: ["Snow grains", "🌨️"],
  80: ["Slight rain showers", "🌦️"],
  81: ["Moderate rain showers", "🌦️"],
  82: ["Violent rain showers", "⛈️"],
  85: ["Slight snow showers", "🌨️"],
  86: ["Heavy snow showers", "❄️"],
  95: ["Thunderstorm", "⛈️"],
  96: ["Thunderstorm with slight hail", "⛈️"],
  99: ["Thunderstorm with heavy hail", "⛈️"],
};

const form = document.getElementById("search-form");
const input = document.getElementById("city-input");
const button = form.querySelector("button");
const statusEl = document.getElementById("status");
const resultEl = document.getElementById("result");

function describe(code) {
  return WEATHER_CODES[code] || ["Unknown", "❔"];
}

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.classList.toggle("error", isError);
}

async function getJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed (${response.status})`);
  }
  return response.json();
}

async function findCity(name) {
  const params = new URLSearchParams({ name, count: "1", language: "en", format: "json" });
  const data = await getJson(`${GEOCODING_URL}?${params}`);
  return data.results && data.results[0];
}

async function getWeather(latitude, longitude) {
  const params = new URLSearchParams({
    latitude,
    longitude,
    current: "temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m",
    daily: "weather_code,temperature_2m_max,temperature_2m_min",
    timezone: "auto",
  });
  return getJson(`${FORECAST_URL}?${params}`);
}

function render(place, weather) {
  const { current, current_units: units, daily } = weather;
  const [text, icon] = describe(current.weather_code);

  document.getElementById("location").textContent = [place.name, place.admin1, place.country]
    .filter(Boolean)
    .join(", ");
  document.getElementById("icon").textContent = icon;
  document.getElementById("temperature").textContent =
    `${Math.round(current.temperature_2m)}${units.temperature_2m}`;
  document.getElementById("description").textContent = text;
  document.getElementById("feels-like").textContent =
    `${Math.round(current.apparent_temperature)}${units.apparent_temperature}`;
  document.getElementById("humidity").textContent =
    `${current.relative_humidity_2m}${units.relative_humidity_2m}`;
  document.getElementById("wind").textContent =
    `${Math.round(current.wind_speed_10m)} ${units.wind_speed_10m}`;

  const forecastEl = document.getElementById("forecast");
  forecastEl.replaceChildren(
    ...daily.time.map((date, i) => {
      const [dayText, dayIcon] = describe(daily.weather_code[i]);
      // Parse as local noon so the weekday doesn't shift across time zones.
      const day = new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { weekday: "short" });
      const li = document.createElement("li");
      li.innerHTML = `
        <span class="day"></span>
        <span class="day-icon"></span>
        <span class="range"><span class="high"></span><span class="low"></span></span>`;
      li.querySelector(".day").textContent = i === 0 ? "Today" : day;
      li.querySelector(".day-icon").textContent = dayIcon;
      li.querySelector(".day-icon").title = dayText;
      li.querySelector(".high").textContent = `${Math.round(daily.temperature_2m_max[i])}°`;
      li.querySelector(".low").textContent = `${Math.round(daily.temperature_2m_min[i])}°`;
      return li;
    })
  );

  resultEl.hidden = false;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const city = input.value.trim();
  if (!city) return;

  button.disabled = true;
  setStatus("Loading…");

  try {
    const place = await findCity(city);
    if (!place) {
      resultEl.hidden = true;
      setStatus(`No city found matching "${city}".`, true);
      return;
    }
    const weather = await getWeather(place.latitude, place.longitude);
    render(place, weather);
    setStatus("");
  } catch (error) {
    resultEl.hidden = true;
    setStatus(`Could not load weather: ${error.message}`, true);
  } finally {
    button.disabled = false;
  }
});
