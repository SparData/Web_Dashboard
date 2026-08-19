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
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '5%', containLabel: true },
    xAxis: {
      type: 'value',
      axisLabel: { color: '#9ca3af', fontSize: 10 },
      splitLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.05)' } }
    },
    yAxis: {
      type: 'category',
      data: positions,
      axisLabel: { color: '#9ca3af', fontSize: 11 },
      axisLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.08)' } }
    },
    series: [
      {
        name: 'Ads Count',
        type: 'bar',
        barWidth: '40%',
        data: positionValues,
        itemStyle: {
          color: '#06b6d4',
          borderRadius: [0, 4, 4, 0]
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
