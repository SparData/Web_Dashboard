import React from 'react';
import DataTable from '../components/DataTable';
import ChartContainer from '../components/ChartContainer';

export default function ProductInsights({ productListings, distinctTitles = [] }) {

  // 1. Calculate price range distribution
  const priceRanges = {
    'Under ₹150': 0,
    '₹150 - ₹300': 0,
    '₹300 - ₹600': 0,
    'Above ₹600': 0
  };

  productListings.forEach(p => {
    const price = parseFloat(p.price) || 0;
    if (price < 150) priceRanges['Under ₹150']++;
    else if (price >= 150 && price < 300) priceRanges['₹150 - ₹300']++;
    else if (price >= 300 && price < 600) priceRanges['₹300 - ₹600']++;
    else priceRanges['Above ₹600']++;
  });

  const priceChartOption = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '4%', bottom: '8%', top: '10%', containLabel: true },
    xAxis: {
      type: 'category',
      data: Object.keys(priceRanges),
      axisLabel: { color: '#9ca3af', fontSize: 10 },
      axisLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.08)' } }
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#9ca3af', fontSize: 10 },
      splitLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.05)' } }
    },
    series: [
      {
        name: 'Product Count',
        type: 'bar',
        barWidth: '40%',
        data: Object.values(priceRanges),
        itemStyle: {
          color: '#d946ef',
          borderRadius: [4, 4, 0, 0]
        }
      }
    ]
  };

  // 2. Average rating per brand using db column 'rating_of_5'
  const brandRatings = {};
  productListings.forEach(p => {
    const rating = parseFloat(p.rating_of_5) || 0;
    if (rating > 0) {
      if (!brandRatings[p.brand]) {
        brandRatings[p.brand] = { sum: 0, count: 0 };
      }
      brandRatings[p.brand].sum += rating;
      brandRatings[p.brand].count++;
    }
  });

  const brandAvgRatings = Object.entries(brandRatings)
    .map(([brand, data]) => ({
      brand,
      avg: parseFloat((data.sum / data.count).toFixed(2))
    }))
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 8); // Top 8 brands

  const ratingChartOption = {
    tooltip: { trigger: 'axis', formatter: '{b}: {c} ★' },
    grid: { left: '3%', right: '4%', bottom: '8%', top: '10%', containLabel: true },
    xAxis: {
      type: 'category',
      data: brandAvgRatings.map(d => d.brand),
      axisLabel: { color: '#9ca3af', fontSize: 10, rotate: 15 },
      axisLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.08)' } }
    },
    yAxis: {
      type: 'value',
      min: 3.5, // Zoom into rating differences
      max: 5,
      axisLabel: { color: '#9ca3af', fontSize: 10 },
      splitLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.05)' } }
    },
    series: [
      {
        name: 'Avg Rating',
        type: 'bar',
        barWidth: '35%',
        data: brandAvgRatings.map(d => d.avg),
        itemStyle: {
          color: '#10b981',
          borderRadius: [4, 4, 0, 0]
        }
      }
    ]
  };

  // Columns definition matching db schema exactly
  const columns = [
    { key: 'rank_num', label: 'Rank', width: '70px', render: (val) => <span style={{ fontWeight: 700 }}>#{val}</span> },
    { key: 'title', label: 'Product Name', width: '250px' },
    { key: 'brand', label: 'Brand', width: '110px', render: (val) => <span className="badge primary">{val}</span> },
    { key: 'price', label: 'Price', width: '90px', render: (val, row) => <span>₹{val} <span style={{ textDecoration: 'line-through', fontSize: '0.75rem', color: 'var(--text-muted)' }}>₹{row.original_price}</span></span> },
    { key: 'rating_of_5', label: 'Rating', width: '80px', render: (val) => <span style={{ color: 'var(--success)', fontWeight: 600 }}>{val} ★</span> },
    { key: 'availability', label: 'Stock', width: '90px', render: (val) => <span className={`badge ${val ? 'success' : 'danger'}`}>{val ? 'In Stock' : 'Out of Stock'}</span> },
    { key: 'source_chain', label: 'Source', width: '100px', render: (val) => <span className="badge secondary">{val}</span> },
    { key: 'city', label: 'City', width: '90px' },
    { key: 'scrape_date', label: 'Date', width: '100px' }
  ];

  return (
    <div className="fade-in">
      <div className="charts-grid">
        {/* Price Distribution */}
        <div className="chart-card glass">
          <div className="chart-title">
            <div>
              Price Range Distribution
              <div className="chart-subtitle">Count of products across price segments</div>
            </div>
          </div>
          <div className="chart-wrapper">
            <ChartContainer options={priceChartOption} />
          </div>
        </div>

        {/* Brand Ratings */}
        <div className="chart-card glass">
          <div className="chart-title">
            <div>
              Brand Rating Index
              <div className="chart-subtitle">Average customer ratings (top 8 brands)</div>
            </div>
          </div>
          <div className="chart-wrapper">
            <ChartContainer options={ratingChartOption} />
          </div>
        </div>
      </div>
      
      {distinctTitles.length > 0 && (
        <div className="chart-card glass" style={{ marginTop: '24px', padding: '24px' }}>
          <div className="chart-title" style={{ marginBottom: '16px' }}>
            <div>
              Distinct Catalog Titles (PostgreSQL Query Results)
              <div className="chart-subtitle">Fetched using: <code>SELECT DISTINCT LOWER(title) FROM public.raw_data;</code></div>
            </div>
          </div>
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: '8px', 
            maxHeight: '150px', 
            overflowY: 'auto',
            padding: '12px',
            background: 'rgba(255, 255, 255, 0.02)',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.05)'
          }}>
            {distinctTitles.map((title, idx) => (
              <span key={idx} className="badge secondary" style={{ 
                fontSize: '0.8rem',
                padding: '6px 12px',
                background: 'rgba(99, 102, 241, 0.1)',
                color: '#a5b4fc',
                border: '1px solid rgba(99, 102, 241, 0.2)'
              }}>
                {title}
              </span>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginTop: '24px' }}>
        <h2 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-heading)', color: '#fff', marginBottom: '16px' }}>Product Listings Directory</h2>
        <DataTable 
          data={productListings} 
          columns={columns} 
          searchPlaceholder="Search products by brand, title, source, city..."
        />
      </div>
    </div>
  );
}
