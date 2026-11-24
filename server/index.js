import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import compression from 'compression';
import pool from './db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable HTTP gzip/deflate compression for up to 80% smaller network transfers
app.use(compression());

// Enable CORS so the React app can request this API
app.use(cors());
app.use(express.json());

// In-memory TTL cache for high-efficiency response serving
const cache = new Map();
const DEFAULT_TTL_MS = 30 * 1000; // 30 seconds freshness window

function shouldBypassCache(req) {
  return req.query.refresh === 'true' || req.query.refresh === '1';
}

function getCached(key, forceRefresh = false) {
  if (forceRefresh) {
    cache.delete(key);
    return null;
  }
  const item = cache.get(key);
  if (!item) return null;
  if (Date.now() > item.expiresAt) {
    cache.delete(key);
    return null;
  }
  return item.data;
}

function setCached(key, data, ttlMs = DEFAULT_TTL_MS) {
  cache.set(key, { data, expiresAt: Date.now() + ttlMs, cachedAt: Date.now() });
}

// Healthy check route
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    database: process.env.DB_DATABASE, 
    cachedKeys: Array.from(cache.keys()),
    defaultTtlSeconds: DEFAULT_TTL_MS / 1000
  });
});

// Cache busting route
app.post('/api/cache/clear', (req, res) => {
  cache.clear();
  res.json({ message: 'Cache cleared successfully', timestamp: new Date().toISOString() });
});

// Consolidated KPIs endpoint: computes avg_price, avg_discount, availability_percentage, and avg_search_rank in a single SQL query
app.get('/api/kpis', async (req, res) => {
  try {
    const forceRefresh = shouldBypassCache(req);
    const cached = getCached('kpis', forceRefresh);
    if (cached) {
      res.set('X-Cache-Status', 'HIT');
      return res.json(cached);
    }

    const result = await pool.query(`
      SELECT 
        AVG(price) AS avg_price,
        AVG(discount) AS avg_discount,
        ROUND(COUNT(*) FILTER (WHERE TRIM(LOWER(availability)) = 'yes') * 100.0 / NULLIF(COUNT(*), 0), 2) AS availability_percentage,
        AVG(rank_num) AS avg_rank
      FROM public.raw_data
    `);

    const row = result.rows[0] || {};
    const data = {
      avgPrice: row.avg_price ? Math.round(parseFloat(row.avg_price)) : 0,
      avgDiscount: row.avg_discount ? parseFloat(parseFloat(row.avg_discount).toFixed(1)) : 0.0,
      availabilityPercentage: row.availability_percentage ? parseFloat(parseFloat(row.availability_percentage).toFixed(2)) : 0.0,
      avgSearchRank: row.avg_rank ? Math.round(parseFloat(row.avg_rank)) : 0
    };

    setCached('kpis', data);
    res.set('X-Cache-Status', 'MISS');
    res.json(data);
  } catch (error) {
    console.error('Error fetching consolidated KPIs:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

// Endpoint to fetch banner ads (with caching)
app.get('/api/banner-ads', async (req, res) => {
  try {
    const forceRefresh = shouldBypassCache(req);
    const cached = getCached('banner-ads', forceRefresh);
    if (cached) {
      res.set('X-Cache-Status', 'HIT');
      return res.json(cached);
    }

    const result = await pool.query('SELECT * FROM banner_data ORDER BY s_no ASC');
    setCached('banner-ads', result.rows);
    res.set('X-Cache-Status', 'MISS');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching banner ads:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

// Endpoint to fetch product listings (with caching)
app.get('/api/product-listings', async (req, res) => {
  try {
    const forceRefresh = shouldBypassCache(req);
    const cached = getCached('product-listings', forceRefresh);
    if (cached) {
      res.set('X-Cache-Status', 'HIT');
      return res.json(cached);
    }

    const result = await pool.query('SELECT * FROM raw_data ORDER BY s_no ASC');
    setCached('product-listings', result.rows);
    res.set('X-Cache-Status', 'MISS');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching product listings:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

// Endpoint to fetch distinct lower(title) from postgres (with caching)
app.get('/api/distinct-titles', async (req, res) => {
  try {
    const forceRefresh = shouldBypassCache(req);
    const cached = getCached('distinct-titles', forceRefresh);
    if (cached) {
      res.set('X-Cache-Status', 'HIT');
      return res.json(cached);
    }

    const result = await pool.query('SELECT DISTINCT LOWER(title) AS title FROM public.raw_data ORDER BY title ASC');
    const titles = result.rows.map(row => row.title).filter(Boolean);
    setCached('distinct-titles', titles, 60 * 1000);
    res.set('X-Cache-Status', 'MISS');
    res.json(titles);
  } catch (error) {
    console.error('Error fetching distinct titles:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

// Endpoint to fetch distinct lower(brand) from postgres (with caching)
app.get('/api/distinct-brands', async (req, res) => {
  try {
    const forceRefresh = shouldBypassCache(req);
    const cached = getCached('distinct-brands', forceRefresh);
    if (cached) {
      res.set('X-Cache-Status', 'HIT');
      return res.json(cached);
    }

    const result = await pool.query('SELECT DISTINCT LOWER(brand) AS brand FROM public.raw_data ORDER BY brand ASC');
    const brands = result.rows.map(row => row.brand).filter(Boolean);
    setCached('distinct-brands', brands, 60 * 1000);
    res.set('X-Cache-Status', 'MISS');
    res.json(brands);
  } catch (error) {
    console.error('Error fetching distinct brands:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

// Legacy endpoints maintained for backward compatibility (powered by cache)
app.get('/api/avg-price', async (req, res) => {
  try {
    const forceRefresh = shouldBypassCache(req);
    const cachedKpis = getCached('kpis', forceRefresh);
    if (cachedKpis) return res.json({ avgPrice: cachedKpis.avgPrice });

    const result = await pool.query('SELECT AVG(price) AS avg_price FROM public.raw_data');
    const avgPrice = result.rows[0]?.avg_price ? Math.round(parseFloat(result.rows[0].avg_price)) : 0;
    res.json({ avgPrice });
  } catch (error) {
    console.error('Error fetching average price:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

app.get('/api/avg-discount', async (req, res) => {
  try {
    const forceRefresh = shouldBypassCache(req);
    const cachedKpis = getCached('kpis', forceRefresh);
    if (cachedKpis) return res.json({ avgDiscount: cachedKpis.avgDiscount });

    const result = await pool.query('SELECT AVG(discount) AS avg_discount FROM public.raw_data');
    const avgDiscount = result.rows[0]?.avg_discount ? parseFloat(parseFloat(result.rows[0].avg_discount).toFixed(1)) : 0.0;
    res.json({ avgDiscount });
  } catch (error) {
    console.error('Error fetching average discount:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

app.get('/api/availability-percentage', async (req, res) => {
  try {
    const forceRefresh = shouldBypassCache(req);
    const cachedKpis = getCached('kpis', forceRefresh);
    if (cachedKpis) return res.json({ availabilityPercentage: cachedKpis.availabilityPercentage });

    const result = await pool.query("SELECT ROUND(COUNT(*) FILTER (WHERE TRIM(LOWER(availability)) = 'yes') * 100.0 / NULLIF(COUNT(*), 0), 2) AS availability_percentage FROM public.raw_data");
    const availabilityPercentage = result.rows[0]?.availability_percentage ? parseFloat(parseFloat(result.rows[0].availability_percentage).toFixed(2)) : 0.0;
    res.json({ availabilityPercentage });
  } catch (error) {
    console.error('Error fetching availability percentage:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

app.get('/api/avg-search-rank', async (req, res) => {
  try {
    const forceRefresh = shouldBypassCache(req);
    const cachedKpis = getCached('kpis', forceRefresh);
    if (cachedKpis) return res.json({ avgSearchRank: cachedKpis.avgSearchRank });

    const result = await pool.query("SELECT AVG(rank_num) AS avg_rank FROM public.raw_data");
    const avgSearchRank = result.rows[0]?.avg_rank ? Math.round(parseFloat(result.rows[0].avg_rank)) : 0;
    res.json({ avgSearchRank });
  } catch (error) {
    console.error('Error fetching average search rank:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

// Background cache pre-warming on server startup
async function warmCache() {
  try {
    console.log('⚡ Pre-warming database query cache in background...');
    const [kpis, banners, titles, brands] = await Promise.all([
      pool.query(`
        SELECT 
          AVG(price) AS avg_price,
          AVG(discount) AS avg_discount,
          ROUND(COUNT(*) FILTER (WHERE TRIM(LOWER(availability)) = 'yes') * 100.0 / NULLIF(COUNT(*), 0), 2) AS availability_percentage,
          AVG(rank_num) AS avg_rank
        FROM public.raw_data
      `),
      pool.query('SELECT * FROM banner_data ORDER BY s_no ASC'),
      pool.query('SELECT DISTINCT LOWER(title) AS title FROM public.raw_data ORDER BY title ASC'),
      pool.query('SELECT DISTINCT LOWER(brand) AS brand FROM public.raw_data ORDER BY brand ASC')
    ]);

    const row = kpis.rows[0] || {};
    setCached('kpis', {
      avgPrice: row.avg_price ? Math.round(parseFloat(row.avg_price)) : 0,
      avgDiscount: row.avg_discount ? parseFloat(parseFloat(row.avg_discount).toFixed(1)) : 0.0,
      availabilityPercentage: row.availability_percentage ? parseFloat(parseFloat(row.availability_percentage).toFixed(2)) : 0.0,
      avgSearchRank: row.avg_rank ? Math.round(parseFloat(row.avg_rank)) : 0
    }, 45 * 1000);

    setCached('banner-ads', banners.rows, 45 * 1000);
    setCached('distinct-titles', titles.rows.map(r => r.title).filter(Boolean), 90 * 1000);
    setCached('distinct-brands', brands.rows.map(r => r.brand).filter(Boolean), 90 * 1000);
    console.log('✅ Query cache pre-warmed successfully.');
  } catch (err) {
    console.warn('⚠️ Cache pre-warming note:', err.message);
  }
}

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  warmCache();
});
