const CACHE = new Map();

const TTL = {
  global: 60000,
  markets: 30000
};

exports.handler = async function (event) {
  const params = event.queryStringParameters || {};
  const endpoint = params.endpoint;

  if (endpoint !== 'global' && endpoint !== 'markets') {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Nieznany endpoint' })
    };
  }

  const forwardParams = new URLSearchParams(params);
  forwardParams.delete('endpoint');

  const cacheKey = `${endpoint}?${forwardParams.toString()}`;
  const cached = CACHE.get(cacheKey);
  const ttl = TTL[endpoint];

  if (cached && Date.now() - cached.timestamp < ttl) {
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=15',
        'Access-Control-Allow-Origin': '*'
      },
      body: cached.body
    };
  }

  const path = endpoint === 'global' ? 'global' : 'coins/markets';
  const url = `https://api.coingecko.com/api/v3/${path}${forwardParams.toString() ? '?' + forwardParams.toString() : ''}`;

  try {
    const res = await fetch(url);

    if (!res.ok) {
      if (cached) {
        return {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=15',
            'Access-Control-Allow-Origin': '*'
          },
          body: cached.body
        };
      }
      return {
        statusCode: res.status,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: `CoinGecko odpowiedział ${res.status}` })
      };
    }

    const bodyText = await res.text();
    CACHE.set(cacheKey, { body: bodyText, timestamp: Date.now() });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=15',
        'Access-Control-Allow-Origin': '*'
      },
      body: bodyText
    };
  } catch (err) {
    if (cached) {
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=15',
          'Access-Control-Allow-Origin': '*'
        },
        body: cached.body
      };
    }
    return {
      statusCode: 502,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Nie udało się połączyć z CoinGecko' })
    };
  }
};
