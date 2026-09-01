import React from 'react';
import DataTable from '../components/DataTable';
import ChartContainer from '../components/ChartContainer';

export default function AdAnalysis({ bannerAds }) {

  // Calculate position distribution using db column name 'banner_position'
  const positionCounts = {};
  bannerAds.forEach(ad => {
    const pos = ad.banner_position || 'Unknown';
    positionCounts[pos] = (positionCounts[pos] || 0) + 1;
  });
  const positions = Object.keys(positionCounts);
  const positionValues = Object.values(positionCounts);

  const positionChartOption = {
    tooltip: { 
      trigger: 'axis', 
      axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#cbd5e1',
      borderWidth: 1,
      textStyle: { color: '#1e293b', fontSize: 12 },
      padding: [10, 14],
      extraCssText: 'border-radius: 8px; box-shadow: 0 4px 20px 0 rgba(0, 0, 0, 0.08);'
    },
    grid: { left: '3%', right: '6%', bottom: '3%', top: '5%', containLabel: true },
    xAxis: {
      type: 'value',
      axisLabel: { color: '#64748b', fontSize: 10 },
      splitLine: { lineStyle: { color: '#f1f5f9' } }
    },
    yAxis: {
      type: 'category',
      data: positions,
      axisLabel: { color: '#64748b', fontSize: 11 },
      axisLine: { lineStyle: { color: '#e2e8f0' } }
    },
    series: [
      {
        name: 'Ads Count',
        type: 'bar',
        barWidth: '35%',
        data: positionValues,
        showBackground: true,
        backgroundStyle: {
          color: '#f1f5f9',
          borderRadius: [0, 6, 6, 0]
        },
        itemStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 1,
            y2: 0,
            colorStops: [
              { offset: 0, color: '#283890' },
              { offset: 1, color: '#f5a623' }
            ]
          },
          borderRadius: [0, 6, 6, 0],
          shadowBlur: 10,
          shadowColor: 'rgba(0, 47, 108, 0.1)'
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 15,
            shadowColor: 'rgba(0, 47, 108, 0.25)'
          }
        }
      }
    ]
  };

  // Table columns definition matching db columns exactly
  const columns = [
    { key: 's_no', label: 'S.No', width: '60px' },
    { key: 'scrape_date', label: 'Date', width: '120px' },
    { key: 'brand', label: 'Brand', width: '120px', render: (val) => <span className="badge primary">{val}</span> },
    { key: 'search_keyword', label: 'Keyword', width: '120px' },
    { key: 'ad_type', label: 'Ad Type', width: '140px', render: (val) => <span className={`badge ${val === 'Video Banner' ? 'magenta' : 'secondary'}`}>{val}</span> },
    { key: 'banner_position', label: 'Position', width: '100px', render: (val) => <span className="badge warning">{val}</span> },
    { key: 'banner_size', label: 'Size (WxH)', width: '100px' },
    { key: 'title', label: 'Title Ad Copy', render: (val) => <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>{val}</span> }
  ];

  return (
    <div className="fade-in">
      <div className="charts-grid" style={{ marginBottom: '24px', gridTemplateColumns: '1fr' }}>
        {/* Ad position visibility chart */}
        <div className="chart-card glass" style={{ minHeight: '280px' }}>
          <div className="chart-title">
            <div>
              Banner Placement Visibility
              <div className="chart-subtitle">Count of banner ads by page placement (Top, Left, Middle, Bottom)</div>
            </div>
          </div>
          <div className="chart-wrapper" style={{ minHeight: '180px' }}>
            <ChartContainer options={positionChartOption} />
          </div>
        </div>
      </div>

      <div style={{ marginTop: '24px' }}>
        <h2 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-heading)', color: '#fff', marginBottom: '16px' }}>Detailed Banner Ads Log</h2>
        <DataTable 
          data={bannerAds} 
          columns={columns} 
          searchPlaceholder="Search by brand, title, keyword or type..."
        />
      </div>
    </div>
  );
}
