# 🌤️ WeatherNow - Aplikacja Pogodowa

Profesjonalna aplikacja pogodowa z real-time danymi, prognozą godzinową i 5-dniową.

## 📁 Struktura Projektu

```
weather-app/
├── index.html    # Główny plik HTML
├── style.css     # Stylowanie aplikacji
└── script.js     # Logika JavaScript + API
```

## ✨ Funkcje

- ☀️ Aktualna pogoda dla dowolnego miasta
- 📍 Geolokalizacja - automatyczne wykrywanie lokalizacji
- ⏰ Prognoza godzinowa (8 godzin)
- 📅 Prognoza 5-dniowa
- 🌡️ Szczegółowe dane: temperatura, wilgotność, wiatr, ciśnienie
- 🌅 Wschód i zachód słońca
- 📱 Responsywny design (mobile-friendly)
- 🎨 Animacje i gradient backgrounds
- ⌨️ Keyboard shortcuts (L - lokalizacja, / - search)

## 🚀 Jak Uruchomić

### Metoda 1: Bezpośrednio w przeglądarce
1. Otwórz folder `weather-app`
2. Kliknij dwukrotnie na `index.html`
3. Gotowe! 🎉

### Metoda 2: Z serwerem Python
```bash
cd weather-app
python -m http.server 8000
```
Następnie otwórz: http://localhost:8000

### Metoda 3: VSCode Live Server
1. Otwórz folder w VSCode
2. Zainstaluj rozszerzenie "Live Server"
3. Kliknij prawym na `index.html` → "Open with Live Server"

## 🔑 API

Aplikacja używa **OpenWeatherMap API** (darmowy tier):
- API Key jest już wbudowany (demo key)
- Możesz zarejestrować własny klucz na: https://openweathermap.org/api
- Limit: 60 zapytań/minutę

### Jak zmienić API Key:
1. Otwórz `script.js`
2. Znajdź linię: `const API_KEY = '...'`
3. Zamień na swój klucz

## 🎯 Jak Używać

1. **Wyszukiwanie:**
   - Wpisz nazwę miasta w search bar
   - Kliknij "Szukaj" lub naciśnij Enter

2. **Geolokalizacja:**
   - Kliknij ikonę lokalizacji 📍
   - Zezwól przeglądarce na dostęp do lokalizacji

3. **Keyboard Shortcuts:**
   - `L` - Użyj geolokalizacji
   - `/` - Focus na search bar

## 🎨 Customizacja

### Zmiana kolorów:
Edytuj zmienne CSS w `style.css`:
```css
:root {
    --primary-color: #6366f1;
    --secondary-color: #8b5cf6;
    --accent-color: #f59e0b;
}
```

### Zmiana ikony pogody:
Edytuj obiekt `weatherIcons` w `script.js`

## 📱 Responsive Breakpoints

- Desktop: > 968px
- Tablet: 640px - 968px
- Mobile: < 640px

## 🔧 Wymagania

- Nowoczesna przeglądarka (Chrome, Firefox, Edge, Safari)
- Połączenie internetowe (do API)
- JavaScript włączony

## 🐛 Troubleshooting

**Problem:** "Nie można pobrać danych"
- Sprawdź połączenie internetowe
- Upewnij się że nazwa miasta jest poprawna
- Sprawdź czy API key jest aktywny

**Problem:** Geolokalizacja nie działa
- Zezwól na dostęp do lokalizacji w przeglądarce
- Sprawdź ustawienia prywatności

**Problem:** Strona nie ładuje się
- Sprawdź czy wszystkie 3 pliki są w tym samym folderze
- Otwórz Console (F12) i sprawdź błędy

## 📝 TODO / Możliwe Ulepszenia

- [ ] Dodać więcej szczegółów pogodowych (UV index, jakość powietrza)
- [ ] Zapisywanie ulubionych miast (localStorage)
- [ ] Powiadomienia o zmianach pogody
- [ ] Dark/Light mode toggle
- [ ] Eksport danych do PDF
- [ ] Integracja z mapą
- [ ] PWA - offline mode

## 🔗 Linki

- OpenWeatherMap API: https://openweathermap.org/api
- Dokumentacja: https://openweathermap.org/current

## 👨‍💻 Autor

**Kacper Rogoś**
- Portfolio: [Link do twojego portfolio]
- Email: rogoskacper@gmail.com

---

Made with ❤️ and ☕
