# WeatherNow

Aplikacja pogodowa z danymi w czasie rzeczywistym, prognozą godzinową i 5-dniową.

## Struktura projektu

```
weather-app/
├── index.html    Główny plik HTML
├── style.css     Stylowanie aplikacji
└── script.js     Logika JavaScript + API
```

## Funkcje

- Aktualna pogoda dla dowolnego miasta
- Geolokalizacja
- Prognoza godzinowa (8 godzin)
- Prognoza 5-dniowa
- Temperatura, wilgotność, wiatr, ciśnienie, widoczność
- Wschód i zachód słońca
- Responsywny design
- Skróty klawiszowe: L (lokalizacja), / (fokus na wyszukiwarkę)

## Uruchomienie

Otwórz `index.html` bezpośrednio w przeglądarce, lub uruchom lokalny serwer:

```bash
cd weather-app
python -m http.server 8000
```

Następnie otwórz http://localhost:8000

## API

Aplikacja korzysta z OpenWeatherMap API (darmowy tier, limit 60 zapytań/minutę).

Aby zmienić klucz API: otwórz `script.js`, znajdź linię `const API_KEY = '...'` i podmień wartość na własny klucz z https://openweathermap.org/api

## Personalizacja

Kolory: zmienne CSS w `style.css`, sekcja `:root`.
Ikony pogody: obiekt `weatherIcons` w `script.js`.

## Wymagania

- Nowoczesna przeglądarka z obsługą JavaScript
- Połączenie internetowe

## Rozwiązywanie problemów

**"Nie można pobrać danych"** — sprawdź połączenie internetowe, poprawność nazwy miasta oraz czy klucz API jest aktywny.

**Geolokalizacja nie działa** — sprawdź uprawnienia lokalizacji w przeglądarce.

**Strona się nie ładuje** — upewnij się, że `index.html`, `style.css` i `script.js` są w tym samym folderze.

## Autor

Kacper Rogoś
Email: rogoskacper@gmail.com
