import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS so the React app can request this API
app.use(cors());
app.use(express.json());

// Healthy check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', database: process.env.DB_DATABASE });
});

// Endpoint to fetch banner ads
app.get('/api/banner-ads', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM banner_data ORDER BY s_no ASC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching banner ads:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

// Endpoint to fetch product listings
app.get('/api/product-listings', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM raw_data ORDER BY s_no ASC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching product listings:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

// Endpoint to fetch distinct lower(title) from postgres
app.get('/api/distinct-titles', async (req, res) => {
  try {
    const result = await pool.query('SELECT DISTINCT LOWER(title) AS title FROM public.raw_data ORDER BY title ASC');
    // Map result.rows to extract only the title string values
    const titles = result.rows.map(row => row.title).filter(Boolean);
    res.json(titles);
  } catch (error) {
    console.error('Error fetching distinct titles:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

// Endpoint to fetch distinct lower(brand) from postgres
app.get('/api/distinct-brands', async (req, res) => {
  try {
    const result = await pool.query('SELECT DISTINCT LOWER(brand) AS brand FROM public.raw_data ORDER BY brand ASC');
    // Map result.rows to extract only the brand string values
    const brands = result.rows.map(row => row.brand).filter(Boolean);
    res.json(brands);
  } catch (error) {
    console.error('Error fetching distinct brands:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

// Endpoint to fetch average price from postgres
app.get('/api/avg-price', async (req, res) => {
  try {
    const result = await pool.query('SELECT AVG(price) AS avg_price FROM public.raw_data');
    const avgPrice = result.rows[0]?.avg_price ? Math.round(parseFloat(result.rows[0].avg_price)) : 0;
    res.json({ avgPrice });
  } catch (error) {
    console.error('Error fetching average price:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

// Endpoint to fetch average discount from postgres
app.get('/api/avg-discount', async (req, res) => {
  try {
    const result = await pool.query('SELECT AVG(discount) AS avg_discount FROM public.raw_data');
    const avgDiscount = result.rows[0]?.avg_discount ? parseFloat(parseFloat(result.rows[0].avg_discount).toFixed(1)) : 0.0;
    res.json({ avgDiscount });
  } catch (error) {
    console.error('Error fetching average discount:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

// Endpoint to fetch availability percentage from postgres
app.get('/api/availability-percentage', async (req, res) => {
  try {
    const result = await pool.query("SELECT ROUND(COUNT(*) FILTER (WHERE TRIM(LOWER(availability)) = 'yes') * 100.0 / COUNT(*), 2) AS availability_percentage FROM public.raw_data");
    const availabilityPercentage = result.rows[0]?.availability_percentage ? parseFloat(parseFloat(result.rows[0].availability_percentage).toFixed(2)) : 0.0;
    res.json({ availabilityPercentage });
  } catch (error) {
    console.error('Error fetching availability percentage:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

// Endpoint to fetch average search rank from postgres
app.get('/api/avg-search-rank', async (req, res) => {
  try {
    const result = await pool.query("SELECT AVG(rank_num) AS avg_rank FROM public.raw_data");
    const avgSearchRank = result.rows[0]?.avg_rank ? Math.round(parseFloat(result.rows[0].avg_rank)) : 0;
    res.json({ avgSearchRank });
  } catch (error) {
    console.error('Error fetching average search rank:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
