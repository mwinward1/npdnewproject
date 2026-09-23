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
const suggestionsEl = document.getElementById("suggestions");

const MIN_CHARS = 3;
const MAX_SUGGESTIONS = 10;
const SUGGEST_DELAY_MS = 300;

let suggestions = [];
let activeIndex = -1;
let suggestTimer;
// Increments on every lookup so responses that arrive out of order are ignored.
let latestRequest = 0;

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

async function searchCities(name) {
  const params = new URLSearchParams({ name, count: String(MAX_SUGGESTIONS), language: "en", format: "json" });
  const data = await getJson(`${GEOCODING_URL}?${params}`);
  return data.results || [];
}

function placeLabel(place) {
  return [place.name, place.admin1, place.country].filter(Boolean).join(", ");
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

  document.getElementById("location").textContent = placeLabel(place);
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

function hideSuggestions() {
  suggestions = [];
  activeIndex = -1;
  suggestionsEl.hidden = true;
  suggestionsEl.replaceChildren();
  input.setAttribute("aria-expanded", "false");
  input.removeAttribute("aria-activedescendant");
}

function showSuggestions(places) {
  suggestions = places;
  activeIndex = -1;
  suggestionsEl.replaceChildren(
    ...places.map((place, i) => {
      const li = document.createElement("li");
      li.id = `suggestion-${i}`;
      li.setAttribute("role", "option");
      li.textContent = place.name;
      const region = document.createElement("span");
      region.className = "region";
      region.textContent = [place.admin1, place.country].filter(Boolean).join(", ");
      li.append(region);
      return li;
    })
  );
  suggestionsEl.hidden = places.length === 0;
  input.setAttribute("aria-expanded", String(places.length > 0));
}

function setActive(index) {
  const items = suggestionsEl.children;
  if (items[activeIndex]) items[activeIndex].classList.remove("active");
  activeIndex = index;
  if (items[index]) {
    items[index].classList.add("active");
    items[index].scrollIntoView({ block: "nearest" });
    input.setAttribute("aria-activedescendant", items[index].id);
  } else {
    input.removeAttribute("aria-activedescendant");
  }
}

function showTooShortError() {
  input.setAttribute("aria-invalid", "true");
  setStatus(`Please enter at least ${MIN_CHARS} characters of the city name.`, true);
}

async function loadWeather(place) {
  const requestId = ++latestRequest;
  clearTimeout(suggestTimer);
  hideSuggestions();
  input.value = placeLabel(place);
  button.disabled = true;
  setStatus("Loading…");

  try {
    const weather = await getWeather(place.latitude, place.longitude);
    if (requestId !== latestRequest) return;
    render(place, weather);
    setStatus("");
  } catch (error) {
    if (requestId !== latestRequest) return;
    resultEl.hidden = true;
    setStatus(`Could not load weather: ${error.message}`, true);
  } finally {
    if (requestId === latestRequest) button.disabled = false;
  }
}

// Suggest matching locations as the user types.
input.addEventListener("input", () => {
  clearTimeout(suggestTimer);
  input.removeAttribute("aria-invalid");
  // Typing supersedes any search or weather load still in flight.
  button.disabled = false;
  setStatus("");

  const query = input.value.trim();
  if (query.length < MIN_CHARS) {
    latestRequest++;
    hideSuggestions();
    return;
  }

  suggestTimer = setTimeout(async () => {
    const requestId = ++latestRequest;
    try {
      const places = await searchCities(query);
      if (requestId === latestRequest) showSuggestions(places);
    } catch {
      // Suggestions are optional; a failed lookup just shows none.
      if (requestId === latestRequest) hideSuggestions();
    }
  }, SUGGEST_DELAY_MS);
});

input.addEventListener("keydown", (event) => {
  if (suggestionsEl.hidden) return;
  if (event.key === "ArrowDown") {
    event.preventDefault();
    setActive((activeIndex + 1) % suggestions.length);
  } else if (event.key === "ArrowUp") {
    event.preventDefault();
    setActive(activeIndex <= 0 ? suggestions.length - 1 : activeIndex - 1);
  } else if (event.key === "Enter" && activeIndex >= 0) {
    event.preventDefault();
    loadWeather(suggestions[activeIndex]);
  } else if (event.key === "Escape") {
    hideSuggestions();
  }
});

// mousedown (not click) so the choice lands before the input loses focus.
suggestionsEl.addEventListener("mousedown", (event) => {
  const li = event.target.closest("li");
  if (!li) return;
  event.preventDefault();
  loadWeather(suggestions[Array.from(suggestionsEl.children).indexOf(li)]);
});

input.addEventListener("blur", hideSuggestions);

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearTimeout(suggestTimer);
  const city = input.value.trim();

  if (city.length < MIN_CHARS) {
    hideSuggestions();
    showTooShortError();
    input.focus();
    return;
  }

  const requestId = ++latestRequest;
  button.disabled = true;
  setStatus("Searching…");

  try {
    const places = await searchCities(city);
    if (requestId !== latestRequest) return;
    if (places.length === 0) {
      hideSuggestions();
      resultEl.hidden = true;
      setStatus(`No city found matching "${city}".`, true);
    } else if (places.length === 1) {
      await loadWeather(places[0]);
    } else {
      showSuggestions(places);
      input.focus();
      setStatus(`${places.length} locations match "${city}". Pick one from the list.`);
    }
  } catch (error) {
    if (requestId !== latestRequest) return;
    resultEl.hidden = true;
    setStatus(`Could not search for "${city}": ${error.message}`, true);
  } finally {
    if (requestId === latestRequest) button.disabled = false;
  }
});
