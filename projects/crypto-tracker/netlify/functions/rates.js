let cache = null;
let cacheTime = 0;
const TTL = 3600000;

exports.handler = async function () {
  if (cache && Date.now() - cacheTime < TTL) {
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*'
      },
      body: cache
    };
  }

  try {
    const res = await fetch('https://api.frankfurter.app/latest?from=USD&to=EUR,PLN');

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const bodyText = await res.text();
    cache = bodyText;
    cacheTime = Date.now();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*'
      },
      body: bodyText
    };
  } catch (err) {
    if (cache) {
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=3600',
          'Access-Control-Allow-Origin': '*'
        },
        body: cache
      };
    }
    return {
      statusCode: 502,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Nie udało się pobrać kursów walut' })
    };
  }
};
