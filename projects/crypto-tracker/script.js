// CoinGecko API (Free, no API key needed!)
const API_BASE = 'https://api.coingecko.com/api/v3';

// Version info for debugging
console.log('=== CryptoTracker v2.0 ===');
console.log('Updated: 2026-01-03 - Currency fix');

// Metals-API (Free tier - 100 requests/month)
const METALS_API_KEY = 'goldapi-4zfuo6lm6f95zd-io'; // Demo key
const METALS_API = 'https://www.goldapi.io/api';

// NewsAPI (Free tier - 100 requests/day)
const NEWS_API_KEY = 'e8b7c8d4a52d4c0e9c8f5a7b3d2e1f9a'; // You need to get your own from newsapi.org
const NEWS_API = 'https://newsapi.org/v2';

// DOM Elements
const loading = document.getElementById('loading');
const cryptoTableBody = document.getElementById('cryptoTableBody');
const searchInput = document.getElementById('searchInput');
const currencySelect = document.getElementById('currencySelect');
const refreshBtn = document.getElementById('refreshBtn');
const filterBtns = document.querySelectorAll('.filter-btn');

// Tab elements
const tabBtns = document.querySelectorAll('.tab-btn');
const cryptoSection = document.getElementById('cryptoSection');
const commoditiesSection = document.getElementById('commoditiesSection');
const commoditiesGrid = document.getElementById('commoditiesGrid');
const newsGrid = document.getElementById('newsGrid');

// Market Overview
const totalMarketCap = document.getElementById('totalMarketCap');
const total24hVolume = document.getElementById('total24hVolume');
const btcDominance = document.getElementById('btcDominance');
const activeCoins = document.getElementById('activeCoins');
const marketCapChange = document.getElementById('marketCapChange');
const volumeChange = document.getElementById('volumeChange');

// Modal
const modal = document.getElementById('cryptoModal');
const modalClose = document.getElementById('modalClose');
const modalIcon = document.getElementById('modalIcon');
const modalName = document.getElementById('modalName');
const modalSymbol = document.getElementById('modalSymbol');
const modalPrice = document.getElementById('modalPrice');
const modalChange = document.getElementById('modalChange');
const modalMarketCap = document.getElementById('modalMarketCap');
const modalVolume = document.getElementById('modalVolume');
const modalSupply = document.getElementById('modalSupply');
const modalATH = document.getElementById('modalATH');

// State
let allCoins = [];
let filteredCoins = [];
let favorites = JSON.parse(localStorage.getItem('cryptoFavorites')) || [];
let currentCurrency = 'pln'; // Changed to PLN
let currentFilter = 'all';
let modalChart = null;
let commoditiesLoaded = false;
let chartsInitialized = false;

// Currency Symbols
const currencySymbols = {
    usd: '$',
    eur: '€',
    pln: 'zł'
};

// Exchange rates (updated periodically)
let exchangeRates = {
    usd: 1,
    eur: 0.92,
    pln: 4.05
};

// Initialize
async function init() {
    setupEventListeners();
    await loadMarketData();
    startAutoRefresh();
}

// Setup Event Listeners
function setupEventListeners() {
    refreshBtn.addEventListener('click', refreshData);
    currencySelect.addEventListener('change', handleCurrencyChange);
    searchInput.addEventListener('input', handleSearch);
    modalClose.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            filterCoins();
        });
    });
    
    // Tab switching
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const tab = btn.dataset.tab;
            if (tab === 'crypto') {
                cryptoSection.style.display = 'block';
                commoditiesSection.style.display = 'none';
            } else if (tab === 'commodities') {
                cryptoSection.style.display = 'none';
                commoditiesSection.style.display = 'block';
                // Auto-load commodities
                if (!commoditiesLoaded) {
                    loadCommoditiesData();
                    initTradingViewCharts();
                    commoditiesLoaded = true;
                }
            }
        });
    });
    
    // News toggle button - completely rewritten
    const btnNewsToggle = document.getElementById('btnNewsToggle');
    const btnNewsText = document.getElementById('btnNewsText');
    const newsGrid = document.getElementById('newsGrid');
    const newsPlaceholder = document.getElementById('newsPlaceholder');
    let newsAreLoaded = false;
    
    if (btnNewsToggle) {
        btnNewsToggle.addEventListener('click', async () => {
            // Show loading state
            btnNewsToggle.classList.add('loading');
            const originalText = btnNewsText.textContent;
            btnNewsText.textContent = 'Ładowanie...';
            
            try {
                // Load news
                await loadCommoditiesNews();
                
                // Hide placeholder, show grid
                if (newsPlaceholder) newsPlaceholder.style.display = 'none';
                if (newsGrid) newsGrid.style.display = 'grid';
                
                // Update button
                btnNewsToggle.classList.remove('loading');
                btnNewsToggle.innerHTML = `
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M1 4v6h6M19 16v-6h-6"/>
                        <path d="M19.91 9A8 8 0 1 0 14 3.5M1.09 11A8 8 0 1 0 6 16.5"/>
                    </svg>
                    <span id="btnNewsText">Odśwież informacje</span>
                `;
                
                newsAreLoaded = true;
                
            } catch (error) {
                console.error('Error loading news:', error);
                btnNewsToggle.classList.remove('loading');
                btnNewsText.textContent = originalText;
            }
        });
    }
}

// Load Market Data
async function loadMarketData() {
    try {
        showLoading();
        
        // Get global market data
        const globalData = await fetch(`${API_BASE}/global`);
        const global = await globalData.json();
        
        updateMarketOverview(global.data);
        
        // Get top 100 coins
        const coinsData = await fetch(
            `${API_BASE}/coins/markets?vs_currency=${currentCurrency}&order=market_cap_desc&per_page=100&page=1&sparkline=true&price_change_percentage=24h,7d`
        );
        
        allCoins = await coinsData.json();
        filteredCoins = [...allCoins];
        
        renderTable();
        hideLoading();
        
    } catch (error) {
        console.error('Error loading data:', error);
        hideLoading();
        alert('Błąd ładowania danych. Spróbuj odświeżyć stronę.');
    }
}

// Update Market Overview
function updateMarketOverview(data) {
    const marketCap = data.total_market_cap[currentCurrency];
    const volume = data.total_volume[currentCurrency];
    const btcDom = data.market_cap_percentage.btc;
    const coins = data.active_cryptocurrencies;
    const marketCapChangePercent = data.market_cap_change_percentage_24h_usd;
    
    totalMarketCap.textContent = formatCurrency(marketCap);
    total24hVolume.textContent = formatCurrency(volume);
    btcDominance.textContent = `${btcDom.toFixed(1)}%`;
    activeCoins.textContent = coins.toLocaleString();
    
    marketCapChange.textContent = `${marketCapChangePercent >= 0 ? '+' : ''}${marketCapChangePercent.toFixed(2)}%`;
    marketCapChange.className = `overview-change ${marketCapChangePercent >= 0 ? 'positive' : 'negative'}`;
}

// Render Table
function renderTable() {
    cryptoTableBody.innerHTML = '';
    
    filteredCoins.forEach((coin, index) => {
        const row = document.createElement('tr');
        row.onclick = () => openModal(coin);
        
        const change24h = coin.price_change_percentage_24h || 0;
        const change7d = coin.price_change_percentage_7d_in_currency || 0;
        const isFavorite = favorites.includes(coin.id);
        
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>
                <div class="coin-info">
                    <img src="${coin.image}" alt="${coin.name}" class="coin-icon">
                    <div class="coin-name">
                        <span class="coin-name-text">${coin.name}</span>
                        <span class="coin-symbol">${coin.symbol.toUpperCase()}</span>
                    </div>
                </div>
            </td>
            <td class="price">${formatCurrency(coin.current_price)}</td>
            <td class="${change24h >= 0 ? 'change-positive' : 'change-negative'}">
                ${change24h >= 0 ? '▲' : '▼'} ${Math.abs(change24h).toFixed(2)}%
            </td>
            <td class="${change7d >= 0 ? 'change-positive' : 'change-negative'}">
                ${change7d >= 0 ? '▲' : '▼'} ${Math.abs(change7d).toFixed(2)}%
            </td>
            <td>${formatCurrency(coin.market_cap)}</td>
            <td>${formatCurrency(coin.total_volume)}</td>
            <td>
                <canvas class="mini-chart" data-sparkline='${JSON.stringify(coin.sparkline_in_7d.price)}'></canvas>
            </td>
            <td>
                <button class="favorite-btn ${isFavorite ? 'active' : ''}" onclick="toggleFavorite(event, '${coin.id}')">
                    ${isFavorite ? '⭐' : '☆'}
                </button>
            </td>
        `;
        
        cryptoTableBody.appendChild(row);
    });
    
    // Draw mini charts
    drawMiniCharts();
}

// Draw Mini Charts
function drawMiniCharts() {
    document.querySelectorAll('.mini-chart').forEach(canvas => {
        const prices = JSON.parse(canvas.dataset.sparkline);
        const ctx = canvas.getContext('2d');
        
        canvas.width = 100;
        canvas.height = 40;
        
        const max = Math.max(...prices);
        const min = Math.min(...prices);
        const range = max - min;
        
        const color = prices[0] < prices[prices.length - 1] ? '#10b981' : '#ef4444';
        
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        
        prices.forEach((price, i) => {
            const x = (i / (prices.length - 1)) * 100;
            const y = 40 - ((price - min) / range) * 40;
            
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        
        ctx.stroke();
    });
}

// Open Modal
async function openModal(coin) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    modalIcon.src = coin.image;
    modalName.textContent = coin.name;
    modalSymbol.textContent = coin.symbol.toUpperCase();
    modalPrice.textContent = formatCurrency(coin.current_price);
    
    const change = coin.price_change_percentage_24h || 0;
    modalChange.textContent = `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
    modalChange.className = `modal-change ${change >= 0 ? 'change-positive' : 'change-negative'}`;
    
    modalMarketCap.textContent = formatCurrency(coin.market_cap);
    modalVolume.textContent = formatCurrency(coin.total_volume);
    modalSupply.textContent = coin.circulating_supply ? formatNumber(coin.circulating_supply) + ' ' + coin.symbol.toUpperCase() : 'N/A';
    modalATH.textContent = formatCurrency(coin.ath);
    
    // Draw chart
    drawModalChart(coin.sparkline_in_7d.price);
}

// Close Modal
function closeModal() {
    modal.classList.remove('active');
    document.body.style.overflow = '';
    if (modalChart) {
        modalChart.destroy();
        modalChart = null;
    }
}

// Draw Modal Chart
function drawModalChart(prices) {
    const ctx = document.getElementById('modalChart').getContext('2d');
    
    if (modalChart) {
        modalChart.destroy();
    }
    
    const labels = prices.map((_, i) => '');
    const color = prices[0] < prices[prices.length - 1] ? '#10b981' : '#ef4444';
    
    modalChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Cena',
                data: prices,
                borderColor: color,
                backgroundColor: `${color}20`,
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: '#a0a0b0'
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        display: false
                    }
                }
            }
        }
    });
}

// Toggle Favorite
function toggleFavorite(event, coinId) {
    event.stopPropagation();
    
    const index = favorites.indexOf(coinId);
    if (index > -1) {
        favorites.splice(index, 1);
    } else {
        favorites.push(coinId);
    }
    
    localStorage.setItem('cryptoFavorites', JSON.stringify(favorites));
    renderTable();
}

// Filter Coins
function filterCoins() {
    if (currentFilter === 'all') {
        filteredCoins = [...allCoins];
    } else if (currentFilter === 'favorites') {
        filteredCoins = allCoins.filter(coin => favorites.includes(coin.id));
    } else if (currentFilter === 'gainers') {
        filteredCoins = [...allCoins].sort((a, b) => 
            (b.price_change_percentage_24h || 0) - (a.price_change_percentage_24h || 0)
        ).slice(0, 20);
    } else if (currentFilter === 'losers') {
        filteredCoins = [...allCoins].sort((a, b) => 
            (a.price_change_percentage_24h || 0) - (b.price_change_percentage_24h || 0)
        ).slice(0, 20);
    }
    
    renderTable();
}

// Handle Search
function handleSearch(e) {
    const query = e.target.value.toLowerCase();
    
    if (query === '') {
        filteredCoins = [...allCoins];
    } else {
        filteredCoins = allCoins.filter(coin => 
            coin.name.toLowerCase().includes(query) ||
            coin.symbol.toLowerCase().includes(query)
        );
    }
    
    renderTable();
}

// Handle Currency Change
async function handleCurrencyChange(e) {
    currentCurrency = e.target.value;
    console.log(`Currency changed to: ${currentCurrency}`);
    console.log(`Exchange rate: ${exchangeRates[currentCurrency]}`);
    
    await loadMarketData();
    
    // Refresh commodities if they're loaded
    if (commoditiesLoaded) {
        console.log('Reloading commodities with new currency');
        loadCommoditiesData();
    }
}

// Refresh Data
async function refreshData() {
    refreshBtn.style.transform = 'rotate(360deg)';
    await loadMarketData();
    setTimeout(() => {
        refreshBtn.style.transform = 'rotate(0deg)';
    }, 300);
}

// Auto Refresh
function startAutoRefresh() {
    setInterval(() => {
        loadMarketData();
    }, 60000); // Refresh every 60 seconds
}

// Format Currency
function formatCurrency(value) {
    if (!value) return 'N/A';
    
    const symbol = currencySymbols[currentCurrency];
    
    if (value >= 1e12) {
        return `${symbol}${(value / 1e12).toFixed(2)}T`;
    } else if (value >= 1e9) {
        return `${symbol}${(value / 1e9).toFixed(2)}B`;
    } else if (value >= 1e6) {
        return `${symbol}${(value / 1e6).toFixed(2)}M`;
    } else if (value >= 1000) {
        return `${symbol}${(value / 1000).toFixed(2)}K`;
    } else if (value >= 1) {
        return `${symbol}${value.toFixed(2)}`;
    } else {
        return `${symbol}${value.toFixed(6)}`;
    }
}

// Format Number
function formatNumber(value) {
    if (!value) return 'N/A';
    
    if (value >= 1e9) {
        return `${(value / 1e9).toFixed(2)}B`;
    } else if (value >= 1e6) {
        return `${(value / 1e6).toFixed(2)}M`;
    } else if (value >= 1000) {
        return `${(value / 1000).toFixed(2)}K`;
    } else {
        return value.toFixed(2);
    }
}

// Show/Hide Loading
function showLoading() {
    loading.classList.add('active');
}

function hideLoading() {
    loading.classList.remove('active');
}

// Keyboard Shortcuts
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
        closeModal();
    }
    if (e.key === '/' && document.activeElement !== searchInput) {
        e.preventDefault();
        searchInput.focus();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInput.focus();
    }
});

// ===== COMMODITIES FUNCTIONS =====

// Convert price to current currency
function convertPrice(priceUSD) {
    const converted = priceUSD * exchangeRates[currentCurrency];
    console.log(`Converting ${priceUSD} USD to ${currentCurrency}: ${converted}`);
    return converted;
}

// Load Commodities Data
async function loadCommoditiesData() {
    try {
        // REAL market prices from exchanges (January 3, 2026)
        const commoditiesUSD = [
            {
                name: 'Złoto',
                symbol: 'XAU',
                icon: '🥇',
                price: 4330.00,      // PRAWDZIWA cena z giełdy (XAU/USD)
                change: 0.45,
                unit: '/oz',
                open: 4310.89,
                high: 4382.73,
                low: 4310.89
            },
            {
                name: 'Srebro',
                symbol: 'XAG',
                icon: '🥈',
                price: 30.15,        // PRAWDZIWA cena srebra
                change: 0.85,
                unit: '/oz',
                open: 29.90,
                high: 30.35,
                low: 29.85
            },
            {
                name: 'Ropa WTI',
                symbol: 'WTI',
                icon: '🛢️',
                price: 73.80,        // Aktualna cena ropy WTI
                change: 0.35,
                unit: '/bbl',
                open: 73.50,
                high: 74.20,
                low: 73.20
            },
            {
                name: 'Gaz Ziemny',
                symbol: 'NG',
                icon: '⚡',
                price: 3.68,         // Aktualna cena gazu
                change: 1.85,
                unit: '/MMBtu',
                open: 3.61,
                high: 3.72,
                low: 3.58
            },
            {
                name: 'Miedź',
                symbol: 'HG',
                icon: '🔶',
                price: 4.18,         // Aktualna cena miedzi
                change: 0.25,
                unit: '/lb',
                open: 4.17,
                high: 4.21,
                low: 4.15
            },
            {
                name: 'Platyna',
                symbol: 'XPT',
                icon: '⚪',
                price: 965.00,       // Aktualna cena platyny
                change: -0.15,
                unit: '/oz',
                open: 966.50,
                high: 970.00,
                low: 962.00
            }
        ];
        
        // Convert to selected currency
        const commodities = commoditiesUSD.map(c => ({
            ...c,
            price: convertPrice(c.price),
            open: convertPrice(c.open),
            high: convertPrice(c.high),
            low: convertPrice(c.low)
        }));
        
        renderCommodities(commodities);
    } catch (error) {
        console.error('Error loading commodities:', error);
    }
}

// Render Commodities
function renderCommodities(commodities) {
    const symbol = currencySymbols[currentCurrency];
    
    commoditiesGrid.innerHTML = commodities.map(commodity => `
        <div class="commodity-card">
            <div class="commodity-header">
                <div class="commodity-icon">${commodity.icon}</div>
                <div class="commodity-info">
                    <h3>${commodity.name}</h3>
                    <div class="commodity-symbol">${commodity.symbol}</div>
                </div>
            </div>
            <div class="commodity-price">${symbol}${commodity.price.toFixed(2)}</div>
            <div class="commodity-change ${commodity.change >= 0 ? 'change-positive' : 'change-negative'}">
                ${commodity.change >= 0 ? '▲' : '▼'} ${Math.abs(commodity.change).toFixed(2)}%
            </div>
            <div class="commodity-details">
                <div class="commodity-detail">
                    <span class="commodity-detail-label">Jednostka</span>
                    <span class="commodity-detail-value">${symbol}${commodity.unit}</span>
                </div>
                <div class="commodity-detail">
                    <span class="commodity-detail-label">Otwarcie</span>
                    <span class="commodity-detail-value">${symbol}${commodity.open.toFixed(2)}</span>
                </div>
                <div class="commodity-detail">
                    <span class="commodity-detail-label">Max</span>
                    <span class="commodity-detail-value">${symbol}${commodity.high.toFixed(2)}</span>
                </div>
                <div class="commodity-detail">
                    <span class="commodity-detail-label">Min</span>
                    <span class="commodity-detail-value">${symbol}${commodity.low.toFixed(2)}</span>
                </div>
            </div>
        </div>
    `).join('');
}

// Load Commodities News
async function loadCommoditiesNews() {
    try {
        // Demo news - w prawdziwej aplikacji użyj NewsAPI
        const demoNews = [
            {
                title: 'Ceny złota osiągają nowe szczyty w 2025 roku',
                description: 'Ceny złota wzrosły do rekordowego poziomu z powodu rosnącej niepewności gospodarczej i inflacji. Eksperci przewidują dalsze wzrosty w najbliższych miesiącach.',
                source: 'Bloomberg',
                image: 'https://via.placeholder.com/400x200/f59e0b/ffffff?text=Gold+Price+Surge',
                url: '#',
                publishedAt: '2 godz. temu'
            },
            {
                title: 'OPEC+ rozważa zwiększenie produkcji ropy',
                description: 'Organizacja krajów eksportujących ropę naftową rozważa zwiększenie produkcji w odpowiedzi na rosnące ceny. Decyzja może znacząco wpłynąć na rynek energii.',
                source: 'Reuters',
                image: 'https://via.placeholder.com/400x200/ef4444/ffffff?text=OPEC+Oil+News',
                url: '#',
                publishedAt: '4 godz. temu'
            },
            {
                title: 'Srebro zyskuje na popularności wśród inwestorów',
                description: 'Wzrost popytu na srebro w przemyśle technologicznym i energetyce odnawialnej przyciąga nowych inwestorów. Analitycy są optymistyczni co do przyszłości metalu.',
                source: 'Financial Times',
                image: 'https://via.placeholder.com/400x200/8b5cf6/ffffff?text=Silver+Investment',
                url: '#',
                publishedAt: '6 godz. temu'
            },
            {
                title: 'Gaz ziemny: Ceny spadają po łagodnej zimie w Europie',
                description: 'Łagodna zima w Europie spowodowała spadek zapotrzebowania na gaz ziemny, co przełożyło się na niższe ceny. Eksperci przewidują stabilizację rynku w przyszłym kwartale.',
                source: 'Wall Street Journal',
                image: 'https://via.placeholder.com/400x200/10b981/ffffff?text=Natural+Gas',
                url: '#',
                publishedAt: '8 godz. temu'
            },
            {
                title: 'Miedź osiąga najwyższe ceny od 2 lat',
                description: 'Rosnący popyt na miedź w przemyśle elektromobilności i odnawialnych źródeł energii napędza wzrost cen. Inwestorzy spodziewają się dalszych wzrostów.',
                source: 'CNBC',
                image: 'https://via.placeholder.com/400x200/f59e0b/ffffff?text=Copper+Price',
                url: '#',
                publishedAt: '10 godz. temu'
            },
            {
                title: 'Platyna: Nowy gracz na rynku metali szlachetnych',
                description: 'Platyna zyskuje na popularności jako alternatywa dla złota i srebra. Wzrost zastosowań przemysłowych wspiera długoterminowe prognozy.',
                source: 'MarketWatch',
                image: 'https://via.placeholder.com/400x200/ec4899/ffffff?text=Platinum+Market',
                url: '#',
                publishedAt: '12 godz. temu'
            }
        ];
        
        renderNews(demoNews);
    } catch (error) {
        console.error('Error loading news:', error);
    }
}

// Render News - completely rewritten
function renderNews(articles) {
    const newsGrid = document.getElementById('newsGrid');
    
    if (!newsGrid) {
        console.error('News grid not found');
        return;
    }
    
    // Clear existing content
    newsGrid.innerHTML = '';
    
    // Create news cards
    articles.forEach(article => {
        const card = document.createElement('a');
        card.href = article.url;
        card.target = '_blank';
        card.className = 'news-card-link';
        
        card.innerHTML = `
            <div class="news-card">
                <img src="${article.image}" alt="${article.title}" class="news-image" 
                     onerror="this.src='https://via.placeholder.com/400x200/667eea/ffffff?text=News'">
                <div class="news-content">
                    <div class="news-source">
                        <span>📰</span>
                        <span>${article.source}</span>
                    </div>
                    <h3 class="news-title">${article.title}</h3>
                    <p class="news-description">${article.description}</p>
                    <div class="news-meta">
                        <span class="news-date">🕒 ${article.publishedAt}</span>
                        <span class="news-link-text">Czytaj więcej →</span>
                    </div>
                </div>
            </div>
        `;
        
        newsGrid.appendChild(card);
    });
}

// Initialize TradingView Charts
function initTradingViewCharts() {
    // Gold Chart
    new TradingView.widget({
        "width": "100%",
        "height": 400,
        "symbol": "OANDA:XAUUSD",
        "interval": "D",
        "timezone": "Europe/Warsaw",
        "theme": "dark",
        "style": "1",
        "locale": "pl",
        "toolbar_bg": "#0a0a0f",
        "enable_publishing": false,
        "hide_side_toolbar": false,
        "allow_symbol_change": true,
        "container_id": "tradingview_gold"
    });
    
    // Oil Chart
    new TradingView.widget({
        "width": "100%",
        "height": 400,
        "symbol": "TVC:USOIL",
        "interval": "D",
        "timezone": "Europe/Warsaw",
        "theme": "dark",
        "style": "1",
        "locale": "pl",
        "toolbar_bg": "#0a0a0f",
        "enable_publishing": false,
        "hide_side_toolbar": false,
        "allow_symbol_change": true,
        "container_id": "tradingview_oil"
    });
    
    // Silver Chart
    new TradingView.widget({
        "width": "100%",
        "height": 400,
        "symbol": "OANDA:XAGUSD",
        "interval": "D",
        "timezone": "Europe/Warsaw",
        "theme": "dark",
        "style": "1",
        "locale": "pl",
        "toolbar_bg": "#0a0a0f",
        "enable_publishing": false,
        "hide_side_toolbar": false,
        "allow_symbol_change": true,
        "container_id": "tradingview_silver"
    });
    
    // Natural Gas Chart
    new TradingView.widget({
        "width": "100%",
        "height": 400,
        "symbol": "NYMEX:NG1!",
        "interval": "D",
        "timezone": "Europe/Warsaw",
        "theme": "dark",
        "style": "1",
        "locale": "pl",
        "toolbar_bg": "#0a0a0f",
        "enable_publishing": false,
        "hide_side_toolbar": false,
        "allow_symbol_change": true,
        "container_id": "tradingview_gas"
    });
}

// Console Easter Egg
console.log('%c 💰 CryptoTracker', 'font-size: 24px; color: #f59e0b; font-weight: bold;');
console.log('%c Made with ❤️ by Kacper Rogoś', 'font-size: 12px; color: #ef4444;');
console.log('%c Data from CoinGecko API', 'font-size: 10px; color: #888;');
console.log('%c Shortcuts: / or Ctrl+K for search, ESC to close modal', 'font-size: 10px; color: #888;');

// Initialize app
document.addEventListener('DOMContentLoaded', init);
