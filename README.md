# 🚀 Portfolio Kacper Rogoś

Profesjonalne portfolio programisty z działającymi projektami demonstracyjnymi.

## 📁 Struktura Projektu

```
Portfolio/
├── index.html              # Główna strona portfolio
├── styles.css              # Stylowanie portfolio
├── script.js               # Interaktywność portfolio
└── projects/               # Folder z projektami
    └── weather-app/        # Aplikacja pogodowa (LIVE)
        ├── index.html
        ├── style.css
        ├── script.js
        └── README.md
```

## 🎯 Jak Uruchomić Portfolio

### Metoda 1: Bezpośrednio (Najprostsza)
1. Otwórz folder `Portfolio`
2. Kliknij dwukrotnie na `index.html`
3. Portfolio otworzy się w przeglądarce! 🎉

### Metoda 2: Z lokalnym serwerem Python
```bash
# Przejdź do folderu Portfolio
cd Portfolio

# Uruchom serwer
python -m http.server 8000

# Otwórz w przeglądarce
# http://localhost:8000
```

### Metoda 3: VSCode Live Server
1. Otwórz folder `Portfolio` w Visual Studio Code
2. Zainstaluj rozszerzenie "Live Server"
3. Kliknij prawym na `index.html` → "Open with Live Server"

## ✨ Funkcje Portfolio

### Główna Strona:
- 🎨 Brutalistyczno-minimalistyczny design
- 🌓 Dark/Light mode toggle
- 📱 Fully responsive (mobile, tablet, desktop)
- ⚡ Smooth scroll animations
- 🎭 Glitch effects i typing animations
- 📊 Animated skill bars
- 📧 Formularz kontaktowy
- 🎮 Easter eggs (Konami Code!)

### Projekty:
- **WeatherNow** - Działająca aplikacja pogodowa (🟢 LIVE)
- E-commerce Dashboard (Coming Soon)
- Task Management App (Coming Soon)

## 🌤️ Aplikacja Pogodowa (WeatherNow)

Kliknij na pierwszy projekt w portfolio lub przejdź bezpośrednio do:
```
projects/weather-app/index.html
```

**Funkcje:**
- Real-time pogoda dla każdego miasta
- Geolokalizacja (automatyczne wykrywanie lokalizacji)
- Prognoza godzinowa (8 godzin)
- Prognoza 5-dniowa
- Szczegółowe dane: temperatura, wilgotność, wiatr, ciśnienie
- API: OpenWeatherMap

## 🎨 Customizacja

### Zmiana kolorów portfolio:
Edytuj `styles.css`:
```css
:root {
    --accent-primary: #00ff88;  /* Główny kolor akcent */
    --bg-primary: #0a0a0a;      /* Tło */
}
```

### Dodawanie własnych projektów:
1. Stwórz folder w `projects/`
2. Dodaj projekt w `index.html` w sekcji `<div class="projects-grid">`
3. Skopiuj strukturę istniejących projektów

### Zmiana informacji osobistych:
Edytuj `index.html`:
- Sekcja Hero: Linia ~50-70
- O mnie: Linia ~90-130
- Kontakt: Linia ~320-380

## 📝 Checklist przed publikacją:

- [ ] Zaktualizuj linki do GitHub w projektach
- [ ] Dodaj prawdziwe linki do LinkedIn/GitHub w stopce
- [ ] Zmień zdjęcie/avatar (opcjonalnie)
- [ ] Zmień API key w aplikacji pogodowej na własny
- [ ] Dodaj Google Analytics (opcjonalnie)
- [ ] Przetestuj na różnych urządzeniach
- [ ] Sprawdź wszystkie linki

## 🚀 Deployment (Hosting)

### Opcja 1: GitHub Pages (Darmowe)
```bash
# 1. Stwórz repo na GitHub
# 2. Wrzuć pliki
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/twojlogin/portfolio.git
git push -u origin main

# 3. W ustawieniach repo → Pages → Source: main branch
# Twoja strona będzie na: https://twojlogin.github.io/portfolio
```

### Opcja 2: Netlify (Darmowe)
1. Zaloguj się na https://netlify.com
2. Drag & drop folder Portfolio
3. Gotowe! Automatyczny HTTPS i domena

### Opcja 3: Vercel (Darmowe)
1. Zaloguj się na https://vercel.com
2. Import projektu z GitHub lub upload folder
3. Deploy!

### Opcja 4: Self-hosting (Własny serwer)
Zobacz instrukcje w głównym README o self-hostingu z Nginx/Apache.

## 🔧 Wymagania

- Nowoczesna przeglądarka (Chrome, Firefox, Edge, Safari)
- JavaScript włączony
- Połączenie internetowe (dla aplikacji pogodowej i fontów)

## 📱 Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## 🐛 Troubleshooting

**Problem:** Portfolio nie ładuje się
- Sprawdź czy wszystkie pliki są w tym samym folderze
- Otwórz Console (F12) i sprawdź błędy

**Problem:** Aplikacja pogodowa nie działa
- Sprawdź połączenie internetowe
- Zobacz README w `projects/weather-app/`

**Problem:** Czcionki się nie ładują
- Sprawdź połączenie internetowe (fonty z Google Fonts)

**Problem:** Dark mode nie działa
- Sprawdź czy JavaScript jest włączony

## 📚 Technologie

### Frontend:
- HTML5
- CSS3 (Custom Properties, Grid, Flexbox, Animations)
- Vanilla JavaScript (ES6+)
- Google Fonts (JetBrains Mono, Space Mono, Poppins)

### APIs:
- OpenWeatherMap API (aplikacja pogodowa)

### Tools:
- Żadnych framework dependencies!
- Pure HTML/CSS/JS - łatwy deployment

## 🎓 Nauka i rozwój

Ten projekt to świetny sposób na naukę:
- Responsywnego designu
- CSS Animations i Transitions
- JavaScript DOM manipulation
- API integration
- Git & GitHub
- Deployment

## 👨‍💻 Autor

**Kacper Rogoś**
- Email: rogoskacper@gmail.com
- Telefon: +48 665-891-434
- Lokalizacja: Krasnystaw, Polska
- Edukacja: Uniwersytet Vizja - Inżynieria Informatyczna

## 📄 Licencja

Ten projekt jest otwarty do użytku edukacyjnego i osobistego.

## 🤝 Contributing

Masz pomysł na ulepszenie? Znalazłeś bug?
- Możesz zgłosić issue
- Możesz zaproponować pull request
- Możesz skontaktować się bezpośrednio

## 🌟 Podziękowania

- OpenWeatherMap za API
- Google Fonts za czcionki
- Społeczność web dev za inspirację

---

Made with ❤️ and ☕ | © 2025 Kacper Rogoś
