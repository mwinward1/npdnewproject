# Weather Lookup

A simple static web page: type a city name or US ZIP code and see the current weather, a Rain-o-meter with rain-gear advice, a 7-day forecast, and recipe ideas with in-season fruit and vegetables. On load it shows the weather near you.

## Features

| # | Feature | Issue |
| --- | --- | --- |
| F1 | Weather near you on load (IP location, time-zone fallback) | #4 |
| F2 | 3-character minimum for searches | #5 |
| F3 | Dropdown of matching locations | #6 |
| F4 | Current conditions and 7-day forecast | #7 |
| F5 | Sky and cartoon character that match the weather | #8 |
| F6 | Clear errors; only the newest search is shown | #9 |
| F7 | Rain-o-meter: chance of rain and what rain gear to bring | #17 |
| F8 | Search by US ZIP code | #18 |
| F9 | Cook for the weather: recipe ideas and in-season produce | #20 |

Requirements, user stories (Gherkin) and scope are in the [Weather Lookup PRD](https://claude.ai/code/artifact/84fa999c-150b-4d3c-a29b-eb82cfbfa9b5); work is tracked under epic #3.

## Data sources

All free, with no API key:

- [Open-Meteo Geocoding API](https://open-meteo.com/en/docs/geocoding-api) turns a city name or ZIP code into latitude and longitude.
- [Open-Meteo Forecast API](https://open-meteo.com/en/docs) gets current conditions, the daily forecast and rain probability.
- [GeoJS](https://www.geojs.io/) finds the visitor's approximate location from their IP address.

Recipe and produce suggestions come from lists built into `food.js`; each dish links to a web search for recipes.

## Run it

No build step. Open `index.html` in a browser, or serve the folder locally:

```sh
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Files

- `index.html`: page markup
- `style.css`: styles (light and dark mode)
- `app.js`: API calls, search and rendering
- `scene.js`: weather-matched sky backgrounds and cartoon characters
- `rain.js`: Rain-o-meter chance of rain and rain-gear advice
- `food.js`: recipe ideas for the weather and country, and in-season produce
