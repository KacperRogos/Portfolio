const API_BASE = '/.netlify/functions/coingecko';

let allCoinsUSD = [];
let allCoins = [];
let filteredCoins = [];
let lastGlobalData = null;
let favorites = JSON.parse(localStorage.getItem('cryptoFavorites')) || [];
let currentCurrency = 'pln';
let currentFilter = 'all';
let modalChart = null;
let commoditiesLoaded = false;

const currencySymbols = {
    usd: '$',
    eur: '€',
    pln: 'zł'
};

let exchangeRates = {
    usd: 1,
    eur: 0.92,
    pln: 4.05
};

let loading, cryptoTableBody, searchInput, currencySelect, refreshBtn, filterBtns;
let tabBtns, cryptoSection, commoditiesSection, commoditiesGrid;
let totalMarketCap, total24hVolume, btcDominance, activeCoins, marketCapChange, volumeChange;
let modal, modalClose, modalIcon, modalName, modalSymbol, modalPrice, modalChange;
let modalMarketCap, modalVolume, modalSupply, modalATH;

async function fetchExchangeRates() {
    try {
        const res = await fetch('/.netlify/functions/rates');
        if (!res.ok) throw new Error('Exchange rate fetch failed');
        const data = await res.json();
        exchangeRates.eur = data.rates.EUR;
        exchangeRates.pln = data.rates.PLN;
    } catch (e) {
        console.warn('Nie udało się pobrać kursów walut, używam wartości domyślnych.');
    }
}

async function init() {
    setupEventListeners();
    await fetchExchangeRates();
    await loadMarketData();
    startAutoRefresh();
}

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
                if (!commoditiesLoaded) {
                    loadCommoditiesData();
                    initTradingViewCharts();
                    commoditiesLoaded = true;
                }
            }
        });
    });
}

async function fetchWithRetry(url, retries = 3, delayMs = 2000) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const res = await fetch(url);

            if (res.status === 429) {
                const retryAfter = res.headers.get('Retry-After');
                const waitMs = retryAfter ? parseInt(retryAfter) * 1000 : delayMs * attempt;
                console.warn(`Rate limit — czekam ${waitMs}ms (próba ${attempt}/${retries})`);
                await new Promise(r => setTimeout(r, waitMs));
                continue;
            }

            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const data = await res.json();

            if (data && data.status && data.status.error_code) {
                throw new Error(`API error: ${data.status.error_message}`);
            }

            return data;

        } catch (err) {
            if (attempt === retries) throw err;
            const wait = delayMs * attempt;
            console.warn(`Próba ${attempt} nieudana: ${err.message}. Ponawiam za ${wait}ms...`);
            await new Promise(r => setTimeout(r, wait));
        }
    }
}

async function loadMarketData() {
    try {
        showLoading();

        const global = await fetchWithRetry(`${API_BASE}?endpoint=global`);
        lastGlobalData = global.data;
        updateMarketOverview(lastGlobalData);

        const coinsData = await fetchWithRetry(
            `${API_BASE}?endpoint=markets&vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=true&price_change_percentage=24h,7d`
        );

        if (!Array.isArray(coinsData)) {
            throw new Error('Nieoczekiwany format odpowiedzi z API');
        }

        allCoinsUSD = coinsData;
        applyCurrencyConversion();

        updateVolumeChange(allCoins);
        hideLoading();

    } catch (error) {
        console.error('Błąd ładowania danych:', error);
        hideLoading();
        showError('Nie udało się pobrać danych. API może być chwilowo niedostępne — odświeżenie nastąpi automatycznie.');
    }
}

function applyCurrencyConversion() {
    const rate = exchangeRates[currentCurrency];

    allCoins = allCoinsUSD.map(coin => ({
        ...coin,
        current_price: coin.current_price != null ? coin.current_price * rate : coin.current_price,
        market_cap: coin.market_cap != null ? coin.market_cap * rate : coin.market_cap,
        total_volume: coin.total_volume != null ? coin.total_volume * rate : coin.total_volume,
        ath: coin.ath != null ? coin.ath * rate : coin.ath,
        sparkline_in_7d: coin.sparkline_in_7d && coin.sparkline_in_7d.price
            ? { price: coin.sparkline_in_7d.price.map(p => p * rate) }
            : coin.sparkline_in_7d
    }));

    filterCoins();
}

function showError(message) {
    let errorBanner = document.getElementById('errorBanner');
    if (!errorBanner) {
        errorBanner = document.createElement('div');
        errorBanner.id = 'errorBanner';
        errorBanner.style.cssText = `
            background: rgba(239,68,68,0.15);
            border: 1px solid rgba(239,68,68,0.4);
            color: #ef4444;
            padding: 1rem 1.5rem;
            border-radius: 12px;
            margin-bottom: 1.5rem;
            font-size: 0.95rem;
            display: flex;
            align-items: center;
            gap: 0.75rem;
        `;
        const searchSection = document.querySelector('.search-section');
        searchSection.parentNode.insertBefore(errorBanner, searchSection);
    }
    errorBanner.textContent = message;
    errorBanner.style.display = 'flex';

    setTimeout(() => {
        if (errorBanner) errorBanner.style.display = 'none';
    }, 10000);
}

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

function updateVolumeChange(coins) {
    if (!coins || coins.length === 0 || !volumeChange) return;

    const top20 = coins.slice(0, 20);
    const avgChange = top20.reduce((sum, c) => sum + (c.price_change_percentage_24h || 0), 0) / top20.length;

    volumeChange.textContent = `${avgChange >= 0 ? '+' : ''}${avgChange.toFixed(2)}%`;
    volumeChange.className = `overview-change ${avgChange >= 0 ? 'positive' : 'negative'}`;
}

function renderTable() {
    cryptoTableBody.innerHTML = '';

    if (filteredCoins.length === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = `
            <td colspan="9" style="text-align:center; padding: 3rem; color: var(--text-muted); font-size: 0.95rem;">
                Brak wyników
            </td>
        `;
        cryptoTableBody.appendChild(emptyRow);
        return;
    }

    filteredCoins.forEach((coin, index) => {
        const row = document.createElement('tr');
        row.onclick = () => openModal(coin);

        const change24h = coin.price_change_percentage_24h || 0;
        const change7d = coin.price_change_percentage_7d_in_currency || 0;
        const isFavorite = favorites.includes(coin.id);

        const sparklineData = coin.sparkline_in_7d && coin.sparkline_in_7d.price
            ? JSON.stringify(coin.sparkline_in_7d.price)
            : '[]';

        const imageUrl = coin.image || '';
        const imageEl = imageUrl
            ? `<img src="${imageUrl}" alt="${coin.name}" class="coin-icon" onerror="this.style.display='none'">`
            : `<div class="coin-icon" style="background:var(--bg-hover);border-radius:50%;"></div>`;

        row.innerHTML = `
            <td>${index + 1}</td>
            <td>
                <div class="coin-info">
                    ${imageEl}
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
                <canvas class="mini-chart" data-sparkline='${sparklineData}'></canvas>
            </td>
            <td>
                <button class="favorite-btn ${isFavorite ? 'active' : ''}" onclick="toggleFavorite(event, '${coin.id}')">
                    ${isFavorite ? '★' : '☆'}
                </button>
            </td>
        `;

        cryptoTableBody.appendChild(row);
    });

    drawMiniCharts();
}

function drawMiniCharts() {
    document.querySelectorAll('.mini-chart').forEach(canvas => {
        const prices = JSON.parse(canvas.dataset.sparkline);
        if (!prices || prices.length < 2) return;

        const ctx = canvas.getContext('2d');
        canvas.width = 100;
        canvas.height = 40;

        const max = Math.max(...prices);
        const min = Math.min(...prices);
        const range = max - min;
        if (range === 0) return;

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

async function openModal(coin) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    modalIcon.src = coin.image || '';
    modalIcon.style.display = coin.image ? 'block' : 'none';
    modalName.textContent = coin.name;
    modalSymbol.textContent = coin.symbol.toUpperCase();
    modalPrice.textContent = formatCurrency(coin.current_price);

    const change = coin.price_change_percentage_24h || 0;
    modalChange.textContent = `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
    modalChange.className = `modal-change ${change >= 0 ? 'change-positive' : 'change-negative'}`;

    modalMarketCap.textContent = formatCurrency(coin.market_cap);
    modalVolume.textContent = formatCurrency(coin.total_volume);
    modalSupply.textContent = coin.circulating_supply
        ? formatNumber(coin.circulating_supply) + ' ' + coin.symbol.toUpperCase()
        : 'N/A';
    modalATH.textContent = formatCurrency(coin.ath);

    if (coin.sparkline_in_7d && coin.sparkline_in_7d.price) {
        drawModalChart(coin.sparkline_in_7d.price);
    }
}

function closeModal() {
    modal.classList.remove('active');
    document.body.style.overflow = '';
    if (modalChart) {
        modalChart.destroy();
        modalChart = null;
    }
}

function drawModalChart(prices) {
    const ctx = document.getElementById('modalChart').getContext('2d');
    if (modalChart) modalChart.destroy();

    const labels = prices.map(() => '');
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
            plugins: { legend: { display: false } },
            scales: {
                y: {
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: { color: '#a0a0b0' }
                },
                x: {
                    grid: { display: false },
                    ticks: { display: false }
                }
            }
        }
    });
}

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

function debounce(fn, delay) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}

const handleSearch = debounce(function(e) {
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
}, 200);

function handleCurrencyChange(e) {
    currentCurrency = e.target.value;

    currentFilter = 'all';
    searchInput.value = '';
    filterBtns.forEach(b => b.classList.remove('active'));
    filterBtns.forEach(b => { if (b.dataset.filter === 'all') b.classList.add('active'); });

    if (allCoinsUSD.length > 0) {
        applyCurrencyConversion();
        updateVolumeChange(allCoins);
        if (lastGlobalData) updateMarketOverview(lastGlobalData);
    } else {
        loadMarketData();
    }

    if (commoditiesLoaded) {
        loadCommoditiesData();
    }
}

async function refreshData() {
    refreshBtn.classList.add('spinning');
    await loadMarketData();
    refreshBtn.classList.remove('spinning');
}

function startAutoRefresh() {
    setInterval(() => {
        loadMarketData();
    }, 90000);
}

function formatCurrency(value) {
    if (value === null || value === undefined) return 'N/A';
    const symbol = currencySymbols[currentCurrency];
    if (value >= 1e12) return `${symbol}${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9)  return `${symbol}${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6)  return `${symbol}${(value / 1e6).toFixed(2)}M`;
    if (value >= 1000) return `${symbol}${(value / 1000).toFixed(2)}K`;
    if (value >= 1)    return `${symbol}${value.toFixed(2)}`;
    if (value > 0)     return `${symbol}${value.toFixed(6)}`;
    return `${symbol}0.00`;
}

function formatNumber(value) {
    if (!value) return 'N/A';
    if (value >= 1e9)  return `${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6)  return `${(value / 1e6).toFixed(2)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(2)}K`;
    return value.toFixed(2);
}

function showLoading() { loading.classList.add('active'); }
function hideLoading() { loading.classList.remove('active'); }

document.addEventListener('DOMContentLoaded', () => {
    loading         = document.getElementById('loading');
    cryptoTableBody = document.getElementById('cryptoTableBody');
    searchInput     = document.getElementById('searchInput');
    currencySelect  = document.getElementById('currencySelect');
    refreshBtn      = document.getElementById('refreshBtn');
    filterBtns      = document.querySelectorAll('.filter-btn');
    tabBtns         = document.querySelectorAll('.tab-btn');
    cryptoSection   = document.getElementById('cryptoSection');
    commoditiesSection = document.getElementById('commoditiesSection');
    commoditiesGrid = document.getElementById('commoditiesGrid');
    totalMarketCap  = document.getElementById('totalMarketCap');
    total24hVolume  = document.getElementById('total24hVolume');
    btcDominance    = document.getElementById('btcDominance');
    activeCoins     = document.getElementById('activeCoins');
    marketCapChange = document.getElementById('marketCapChange');
    volumeChange    = document.getElementById('volumeChange');
    modal           = document.getElementById('cryptoModal');
    modalClose      = document.getElementById('modalClose');
    modalIcon       = document.getElementById('modalIcon');
    modalName       = document.getElementById('modalName');
    modalSymbol     = document.getElementById('modalSymbol');
    modalPrice      = document.getElementById('modalPrice');
    modalChange     = document.getElementById('modalChange');
    modalMarketCap  = document.getElementById('modalMarketCap');
    modalVolume     = document.getElementById('modalVolume');
    modalSupply     = document.getElementById('modalSupply');
    modalATH        = document.getElementById('modalATH');

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) closeModal();
        if (e.key === '/' && document.activeElement !== searchInput) {
            e.preventDefault();
            searchInput.focus();
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            searchInput.focus();
        }
    });

    init();
});

function convertPrice(priceUSD) {
    return priceUSD * exchangeRates[currentCurrency];
}

async function loadCommoditiesData() {
    try {
        const commoditiesUSD = [
            { name: 'Złoto',      symbol: 'XAU', price: 3230.00, change: 0.45,  unit: '/oz',    open: 3210.89, high: 3282.73, low: 3210.89 },
            { name: 'Srebro',     symbol: 'XAG', price: 32.50,   change: 0.85,  unit: '/oz',    open: 32.20,   high: 32.70,   low: 32.10 },
            { name: 'Ropa WTI',   symbol: 'WTI', price: 61.50,   change: -0.95, unit: '/bbl',   open: 62.10,   high: 62.50,   low: 61.00 },
            { name: 'Gaz Ziemny', symbol: 'NG',  price: 3.72,    change: 1.85,  unit: '/MMBtu', open: 3.65,    high: 3.78,    low: 3.60 },
            { name: 'Miedź',      symbol: 'HG',  price: 4.65,    change: 0.25,  unit: '/lb',    open: 4.63,    high: 4.68,    low: 4.60 },
            { name: 'Platyna',    symbol: 'XPT', price: 980.00,  change: -0.15, unit: '/oz',    open: 981.50,  high: 985.00,  low: 977.00 }
        ];

        const commodities = commoditiesUSD.map(c => ({
            ...c,
            price: convertPrice(c.price),
            open:  convertPrice(c.open),
            high:  convertPrice(c.high),
            low:   convertPrice(c.low)
        }));

        renderCommodities(commodities);
    } catch (error) {
        console.error('Error loading commodities:', error);
    }
}

function renderCommodities(commodities) {
    const symbol = currencySymbols[currentCurrency];

    commoditiesGrid.innerHTML = commodities.map(commodity => `
        <div class="commodity-card">
            <div class="commodity-header">
                <div class="commodity-badge">${commodity.symbol}</div>
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


function initTradingViewCharts() {
    const charts = [
        { id: 'tradingview_gold',   symbol: 'OANDA:XAUUSD' },
        { id: 'tradingview_oil',    symbol: 'TVC:USOIL' },
        { id: 'tradingview_silver', symbol: 'OANDA:XAGUSD' },
        { id: 'tradingview_gas',    symbol: 'NYMEX:NG1!' }
    ];

    charts.forEach(({ id, symbol }) => {
        new TradingView.widget({
            width: '100%',
            height: 400,
            symbol,
            interval: 'D',
            timezone: 'Europe/Warsaw',
            theme: 'dark',
            style: '1',
            locale: 'pl',
            toolbar_bg: '#0a0a0f',
            enable_publishing: false,
            hide_side_toolbar: false,
            allow_symbol_change: true,
            container_id: id
        });
    });
}

