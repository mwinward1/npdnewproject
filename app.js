// Open-Meteo APIs are free and need no API key.
const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
// Free IP-based location lookup (no API key), used to pick the starting city.
const IP_LOCATION_URL = "https://get.geojs.io/v1/ip/geo.json";

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
const nearbyEl = document.getElementById("nearby");

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

// US ZIP code: 5 digits, optionally followed by -1234.
const ZIP_PATTERN = /^(\d{5})(?:-\d{4})?$/;

async function searchCities(query) {
  const zip = query.trim().match(ZIP_PATTERN)?.[1];
  const params = new URLSearchParams({
    name: zip || query,
    count: String(MAX_SUGGESTIONS),
    language: "en",
    format: "json",
  });
  // Open-Meteo also matches postal codes; limit 5-digit codes to the US.
  if (zip) params.set("countryCode", "US");
  const data = await getJson(`${GEOCODING_URL}?${params}`);
  const results = data.results || [];
  return zip ? results.map((place) => ({ ...place, zip })) : results;
}

function placeLabel(place) {
  const label = [place.name, place.admin1, place.country].filter(Boolean).join(", ");
  return place.zip ? `${label} (ZIP ${place.zip})` : label;
}

async function getWeather(latitude, longitude) {
  const params = new URLSearchParams({
    latitude,
    longitude,
    current: "temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,is_day",
    daily:
      "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,wind_speed_10m_max",
    timezone: "auto",
  });
  return getJson(`${FORECAST_URL}?${params}`);
}

function render(place, weather) {
  const { current, current_units: units, daily } = weather;
  const [text] = describe(current.weather_code);
  const kind = weatherKind(current.weather_code);
  const isDay = current.is_day !== 0;

  setScene(kind, isDay);
  document.getElementById("location").textContent = placeLabel(place);
  document.getElementById("art").innerHTML = illustration(kind, isDay);
  document.getElementById("tip").textContent = weatherTip(kind, isDay);
  document.getElementById("temperature").textContent =
    `${Math.round(current.temperature_2m)}${units.temperature_2m}`;
  document.getElementById("description").textContent = text;
  document.getElementById("feels-like").textContent =
    `${Math.round(current.apparent_temperature)}${units.apparent_temperature}`;
  document.getElementById("humidity").textContent =
    `${current.relative_humidity_2m}${units.relative_humidity_2m}`;
  document.getElementById("wind").textContent =
    `${Math.round(current.wind_speed_10m)} ${units.wind_speed_10m}`;

  renderRain(daily);

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
        <span class="day-rain"></span>
        <span class="range"><span class="high"></span><span class="low"></span></span>`;
      li.querySelector(".day").textContent = i === 0 ? "Today" : day;
      li.querySelector(".day-icon").textContent = dayIcon;
      li.querySelector(".day-icon").title = dayText;
      const chance = daily.precipitation_probability_max?.[i];
      if (chance !== null && chance !== undefined) {
        li.querySelector(".day-rain").textContent = `💧 ${Math.round(chance)}%`;
        li.querySelector(".day-rain").title = "Chance of rain";
      }
      li.querySelector(".high").textContent = `${Math.round(daily.temperature_2m_max[i])}°`;
      li.querySelector(".low").textContent = `${Math.round(daily.temperature_2m_min[i])}°`;
      return li;
    })
  );

  renderFood(place, kind, daily);

  resultEl.hidden = false;
}

function chipList(el, items) {
  el.replaceChildren(
    ...items.map((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      return li;
    })
  );
}

function renderFood(place, kind, daily) {
  const food = foodIdeas({ place, kind, tempMax: daily.temperature_2m_max[0], date: daily.time[0] });

  document.getElementById("food-headline").textContent = food.headline;
  document.getElementById("recipes").replaceChildren(
    ...food.ideas.map((idea) => {
      const li = document.createElement("li");
      const link = document.createElement("a");
      link.href = idea.url;
      link.target = "_blank";
      link.rel = "noopener";
      const icon = document.createElement("span");
      icon.className = "recipe-icon";
      icon.setAttribute("aria-hidden", "true");
      icon.textContent = idea.icon;
      const text = document.createElement("span");
      text.className = "recipe-text";
      const name = document.createElement("strong");
      name.textContent = idea.name;
      const why = document.createElement("span");
      why.className = "recipe-why";
      why.textContent = idea.why;
      text.append(name, why);
      const more = document.createElement("span");
      more.className = "recipe-link";
      more.textContent = "Find recipes ↗";
      link.append(icon, text, more);
      li.append(link);
      return li;
    })
  );
  document.getElementById("season-label").textContent = `(${food.season.label})`;
  chipList(document.getElementById("fruits"), food.produce.fruits);
  chipList(document.getElementById("veggies"), food.produce.veggies);
}

function renderRain(daily) {
  const rain = rainOutlook({
    chance: daily.precipitation_probability_max?.[0] ?? null,
    amount: daily.precipitation_sum?.[0] ?? 0,
    windMax: daily.wind_speed_10m_max?.[0] ?? 0,
    code: daily.weather_code[0],
  });

  const meter = document.getElementById("rain-meter");
  meter.style.setProperty("--level", `${rain.percent}%`);
  meter.setAttribute("aria-valuenow", String(rain.percent));
  meter.setAttribute("aria-valuetext", `${rain.percent}% chance of rain, ${rain.level}`);
  meter.dataset.level = rain.level.toLowerCase();

  document.getElementById("rain-chance").textContent = `${rain.known ? "" : "~"}${rain.percent}%`;
  document.getElementById("rain-caption").textContent = rain.known
    ? "chance of rain today"
    : "estimated from expected rainfall";
  document.getElementById("rain-level").textContent = rain.level;
  document.getElementById("rain-amount").textContent = rain.amountText;
  document.getElementById("rain-note").textContent = rain.note;
  document.getElementById("rain-gear").replaceChildren(
    ...rain.gear.map(([icon, name]) => {
      const li = document.createElement("li");
      const iconEl = document.createElement("span");
      iconEl.className = "gear-icon";
      iconEl.setAttribute("aria-hidden", "true");
      iconEl.textContent = icon;
      li.append(iconEl, name);
      return li;
    })
  );
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
      region.textContent = [place.zip && `ZIP ${place.zip}`, place.admin1, place.country].filter(Boolean).join(", ");
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

async function loadWeather(place, { nearby = false } = {}) {
  const requestId = ++latestRequest;
  clearTimeout(suggestTimer);
  hideSuggestions();
  // Leave the box empty for the automatic lookup so the user can just start typing.
  if (!nearby) input.value = placeLabel(place);
  nearbyEl.hidden = !nearby;
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

// ---- Starting location ----

// Approximate location from the visitor's IP address.
async function locateByIp() {
  const data = await getJson(IP_LOCATION_URL);
  const latitude = Number(data.latitude);
  const longitude = Number(data.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  return {
    name: data.city || "Your area",
    admin1: data.region,
    country: data.country,
    country_code: data.country_code,
    latitude,
    longitude,
  };
}

// Fallback: the city in the browser's time zone, e.g. "America/New_York" -> "New York".
async function locateByTimeZone() {
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  const city = zone.split("/").pop().replace(/_/g, " ");
  if (city.length < MIN_CHARS || zone === "UTC") return null;
  const [place] = await searchCities(city);
  return place || null;
}

async function showLocalWeather() {
  const startRequest = latestRequest;
  setStatus("Finding weather near you…");

  let place = null;
  for (const locate of [locateByIp, locateByTimeZone]) {
    try {
      place = await locate();
    } catch {
      place = null;
    }
    if (place) break;
  }

  // Don't override anything the user started doing in the meantime.
  if (latestRequest !== startRequest || input.value.trim()) return;
  if (place) {
    loadWeather(place, { nearby: true });
  } else {
    setStatus("");
  }
}

showLocalWeather();
