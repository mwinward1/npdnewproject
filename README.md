# Weather Lookup

A simple static web page: type a city name and see the current weather and a 7-day forecast.

It uses the free, open-source [Open-Meteo](https://open-meteo.com/) APIs (no API key needed):

- **Geocoding API** turns the city name into latitude and longitude.
- **Forecast API** gets the current conditions and daily forecast for that location.

## Run it

No build step. Open `index.html` in a browser, or serve the folder locally:

```sh
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Files

- `index.html`: page markup
- `style.css`: styles (light and dark mode)
- `app.js`: API calls and rendering
