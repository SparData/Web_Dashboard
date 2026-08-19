import React from 'react';
import MetricsGrid from '../components/MetricsGrid';
import ChartContainer from '../components/ChartContainer';

export default function DashboardOverview({ bannerAds, productListings, stats, onKpiClick }) {
  
  // 1. Calculate Brand Share of Shelf (Product count per brand)
  const brandCounts = {};
  productListings.forEach(p => {
    brandCounts[p.brand] = (brandCounts[p.brand] || 0) + 1;
  });
  const brandChartData = Object.entries(brandCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 7); // Show top 7

  const shareOfShelfOption = {
    tooltip: { trigger: 'item', formatter: '{b}: {c} products ({d}%)' },
    legend: { 
      orient: 'horizontal', 
      bottom: '0%', 
      textStyle: { color: '#9ca3af', fontSize: 11 } 
    },
    series: [
      {
        name: 'Share of Shelf',
        type: 'pie',
        radius: ['45%', '70%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 8,
          borderColor: '#060814',
          borderWidth: 2
        },
        label: { show: false },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold',
            color: '#fff'
          }
        },
        data: brandChartData.map((d, idx) => {
          const colors = ['#6366f1', '#06b6d4', '#d946ef', '#10b981', '#f59e0b', '#ef4444', '#a855f7'];
          return {
            ...d,
            itemStyle: { color: colors[idx % colors.length] }
          };
        })
      }
    ]
  };

  // 2. Calculate Ad Type share (Video vs. Display banners)
  const adTypeCounts = {};
  bannerAds.forEach(ad => {
    adTypeCounts[ad.ad_type] = (adTypeCounts[ad.ad_type] || 0) + 1;
  });
  const adTypeData = Object.entries(adTypeCounts).map(([name, value]) => ({ name, value }));

  const adTypeOption = {
    tooltip: { trigger: 'item', formatter: '{b}: {c} ads ({d}%)' },
    series: [
      {
        name: 'Ad Type Share',
        type: 'pie',
        radius: '65%',
        center: ['50%', '50%'],
        roseType: 'radius',
        itemStyle: {
          borderRadius: 6
        },
        label: {
          show: true,
          color: '#f3f4f6',
          formatter: '{b}\n{d}%',
          fontSize: 10
        },
        data: adTypeData.map((d, idx) => {
          const colors = ['#06b6d4', '#d946ef'];
          return {
            ...d,
            itemStyle: { color: colors[idx % colors.length] }
          };
        })
      }
    ]
  };

  // 3. Keyword Distribution in Products
  const kwCounts = {};
  productListings.forEach(p => {
    const key = p.category || 'General';
    kwCounts[key] = (kwCounts[key] || 0) + 1;
  });
  const kwData = Object.entries(kwCounts).sort((a, b) => b[1] - a[1]);

  const keywordOption = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '4%', right: '4%', bottom: '8%', top: '10%', containLabel: true },
    xAxis: {
      type: 'category',
      data: kwData.map(d => d[0]),
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
        data: kwData.map(d => d[1]),
        type: 'bar',
        barWidth: '35%',
        itemStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: '#8b5cf6' },
              { offset: 1, color: '#6366f1' }
            ]
          },
          borderRadius: [4, 4, 0, 0]
        }
      }
    ]
  };

  return (
    <div className="fade-in">
      <MetricsGrid stats={stats} onKpiClick={onKpiClick} />

      <div className="charts-grid">
        {/* Share of Shelf */}
        <div className="chart-card glass">
          <div className="chart-title">
            <div>
              Brand Share of Shelf
              <div className="chart-subtitle">Distribution of product listings by brand</div>
            </div>
          </div>
          <div className="chart-wrapper">
            <ChartContainer options={shareOfShelfOption} />
          </div>
        </div>

        {/* Ad Types Share */}
        <div className="chart-card glass">
          <div className="chart-title">
            <div>
              Ad Type Distribution
              <div className="chart-subtitle">Video Banners vs Display Banners</div>
            </div>
          </div>
          <div className="chart-wrapper">
            <ChartContainer options={adTypeOption} />
          </div>
        </div>
      </div>

      <div className="charts-grid" style={{ gridTemplateColumns: '1fr' }}>
        {/* Keyword distribution */}
        <div className="chart-card glass" style={{ minHeight: '380px' }}>
          <div className="chart-title">
            <div>
              Keyword Volume
              <div className="chart-subtitle">Product listings grouped by search keyword</div>
            </div>
          </div>
          <div className="chart-wrapper">
            <ChartContainer options={keywordOption} />
          </div>
        </div>
      </div>
    </div>
  );
}
