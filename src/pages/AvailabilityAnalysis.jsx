import React, { useMemo } from 'react';
import MetricsGrid from '../components/MetricsGrid';
import ChartContainer from '../components/ChartContainer';
import BrandAvailabilityTable from '../components/BrandAvailabilityTable';

// Helper date formatter at module scope
function formatDate(dateVal) {
  if (!dateVal) return '';
  if (typeof dateVal === 'string') {
    return dateVal.includes('T') ? dateVal.split('T')[0] : dateVal;
  }
  if (dateVal instanceof Date) {
    return dateVal.toISOString().split('T')[0];
  }
  return String(dateVal);
}

function AvailabilityAnalysis({ productListings = [], stats, onKpiClick }) {

  const overallAvailabilityRate = useMemo(() => {
    if (stats?.availabilityRate?.value !== undefined) {
      return parseFloat(stats.availabilityRate.value);
    }
    if (!productListings.length) return 99.96;
    let available = 0;
    for (let i = 0; i < productListings.length; i++) {
      const p = productListings[i];
      if (p.availability === true || p.availability === 'true' || (typeof p.availability === 'string' && p.availability.trim().toLowerCase() === 'yes')) {
        available++;
      }
    }
    return parseFloat(((available / productListings.length) * 100).toFixed(2));
  }, [stats?.availabilityRate?.value, productListings]);

  // 1. Calculate Availability % by Retailer across cities
  const availabilityByRetailerOption = useMemo(() => {
    const retailerStats = {};

    productListings.forEach(p => {
      const retailer = p.source_chain?.trim() || 'Unknown';
      const city = p.city?.trim();
      if (!retailer || retailer.toLowerCase() === 'others' || retailer.toLowerCase() === 'other') return;

      if (!retailerStats[retailer]) {
        retailerStats[retailer] = { total: 0, available: 0, cities: new Set() };
      }
      retailerStats[retailer].total++;
      if (city) {
        retailerStats[retailer].cities.add(city);
      }
      const isAvailable = p.availability === true || p.availability === 'true' || (typeof p.availability === 'string' && p.availability.trim().toLowerCase() === 'yes');
      if (isAvailable) {
        retailerStats[retailer].available++;
      }
    });

    const retailerAvailabilityList = Object.entries(retailerStats)
      .map(([retailer, data]) => ({
        name: retailer,
        availabilityRate: data.total > 0 ? parseFloat(((data.available / data.total) * 100).toFixed(2)) : 0.0,
        totalCount: data.total,
        availableCount: data.available,
        cityCount: data.cities.size
      }))
      .sort((a, b) => b.availabilityRate - a.availabilityRate || b.totalCount - a.totalCount);

    return {
    tooltip: { 
      trigger: 'axis', 
      axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#cbd5e1',
      borderWidth: 1,
      textStyle: { color: '#1e293b', fontSize: 12 },
      padding: [10, 14],
      extraCssText: 'border-radius: 8px; box-shadow: 0 4px 20px 0 rgba(0, 0, 0, 0.08);',
      formatter: (params) => {
        const p = params[0];
        const item = retailerAvailabilityList[p.dataIndex];
        if (!item) return '';
        const diff = (item.availabilityRate - overallAvailabilityRate).toFixed(2);
        const isPositive = parseFloat(diff) >= 0;
        return `
          <div style="font-weight: 700; color: #002f6c; font-size: 13px; margin-bottom: 6px;">
            ${item.name}
          </div>
          <div style="display: flex; justify-content: space-between; gap: 16px; margin-bottom: 3px;">
            <span style="color: #64748b;">Availability %:</span>
            <span style="font-weight: 700; color: #002f6c;">${item.availabilityRate}%</span>
          </div>
          <div style="display: flex; justify-content: space-between; gap: 16px; margin-bottom: 3px;">
            <span style="color: #64748b;">Overall Benchmark:</span>
            <span style="font-weight: 600; color: #f59e0b;">${overallAvailabilityRate}%</span>
          </div>
          <div style="display: flex; justify-content: space-between; gap: 16px; margin-bottom: 3px;">
            <span style="color: #64748b;">Benchmark Diff:</span>
            <span style="font-weight: 600; color: ${isPositive ? '#059669' : '#e11d48'};">
              ${isPositive ? '+' : ''}${diff}%
            </span>
          </div>
          <div style="font-size: 11px; color: #94a3b8; margin-top: 4px;">
            In Stock: ${item.availableCount} / ${item.totalCount} products (${item.cityCount} cit${item.cityCount === 1 ? 'y' : 'ies'})
          </div>
        `;
      }
    },
    grid: { 
      left: '3%', 
      right: '18%', 
      bottom: retailerAvailabilityList.length > 8 ? '16%' : '10%', 
      top: '14%', 
      containLabel: true 
    },
    dataZoom: [
      {
        type: 'slider',
        show: retailerAvailabilityList.length > 8,
        startValue: 0,
        endValue: Math.min(7, retailerAvailabilityList.length - 1),
        zoomLock: true,
        height: 12,
        bottom: '2%',
        borderColor: 'transparent',
        backgroundColor: '#f1f5f9',
        fillerColor: '#94a3b8',
        borderRadius: 6,
        handleIcon: 'none',
        handleSize: '0%',
        showDetail: false,
        showDataShadow: false,
        brushSelect: false
      }
    ],
    xAxis: {
      type: 'category',
      data: retailerAvailabilityList.map(d => d.name),
      axisLabel: { 
        color: '#475569', 
        fontSize: 10, 
        fontWeight: 600,
        rotate: retailerAvailabilityList.length > 5 ? 20 : 0,
        interval: 0,
        formatter: (val) => val.length > 14 ? val.slice(0, 13) + '…' : val
      },
      axisLine: { lineStyle: { color: '#e2e8f0' } },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      min: (value) => Math.max(0, Math.floor((value.min - 5) / 5) * 5),
      max: 100,
      axisLabel: { 
        color: '#64748b', 
        fontSize: 10,
        formatter: '{value}%'
      },
      splitLine: { lineStyle: { color: '#f1f5f9' } }
    },
    series: [
      {
        name: 'Availability %',
        type: 'bar',
        barWidth: 26,
        data: retailerAvailabilityList.map(d => ({
          value: d.availabilityRate,
          itemStyle: {
            borderRadius: [6, 6, 0, 0],
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: '#002f6c' }, // Primary Deep Navy
                { offset: 1, color: '#2563eb' }  // Royal / Accent Blue
              ]
            }
          }
        })),
        showBackground: true,
        backgroundStyle: {
          color: '#f8fafc',
          borderRadius: [6, 6, 0, 0]
        },
        label: {
          show: true,
          position: 'top',
          formatter: '{c}%',
          fontSize: 10,
          fontWeight: 700,
          color: '#1e293b',
          distance: 5
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 47, 108, 0.3)',
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: '#001e47' },
                { offset: 1, color: '#1d4ed8' }
              ]
            }
          }
        },
        markLine: {
          silent: true,
          symbol: 'none',
          label: {
            show: true,
            position: 'end',
            formatter: `Overall Avg: ${overallAvailabilityRate}%`,
            color: '#b45309',
            fontWeight: 700,
            fontSize: 10,
            backgroundColor: 'rgba(254, 243, 199, 0.95)',
            padding: [3, 6],
            borderRadius: 4,
            borderColor: '#f59e0b',
            borderWidth: 1
          },
          lineStyle: {
            color: '#f59e0b',
            type: 'dashed',
            width: 1.5
          },
          data: [
            { yAxis: overallAvailabilityRate }
          ]
        }
      }
    ]
  };
}, [productListings, overallAvailabilityRate]);

  // 2. Calculate Availability % by City
  const availabilityByCityOption = useMemo(() => {
    const cityStats = {};

    productListings.forEach(p => {
      const rawCity = p.city?.trim();
      if (!rawCity || rawCity.toLowerCase() === 'others' || rawCity.toLowerCase() === 'other' || rawCity.toLowerCase() === 'unknown' || rawCity.toLowerCase() === 'n/a' || rawCity.toLowerCase() === 'null') return;

      const cityKey = rawCity.toLowerCase();
      const displayName = rawCity.charAt(0).toUpperCase() + rawCity.slice(1);

      if (!cityStats[cityKey]) {
        cityStats[cityKey] = { name: displayName, total: 0, available: 0, retailers: new Set(), pincodes: new Set() };
      }
      cityStats[cityKey].total++;
      if (p.source_chain?.trim()) {
        cityStats[cityKey].retailers.add(p.source_chain.trim());
      }
      if (p.pincode) {
        cityStats[cityKey].pincodes.add(String(p.pincode).trim());
      }
      const isAvailable = p.availability === true || p.availability === 'true' || (typeof p.availability === 'string' && p.availability.trim().toLowerCase() === 'yes');
      if (isAvailable) {
        cityStats[cityKey].available++;
      }
    });

    const cityAvailabilityList = Object.values(cityStats)
      .map((data) => ({
        name: data.name,
        availabilityRate: data.total > 0 ? parseFloat(((data.available / data.total) * 100).toFixed(2)) : 0.0,
        totalCount: data.total,
        availableCount: data.available,
        retailerCount: data.retailers.size,
        pincodeCount: data.pincodes.size
      }))
      .sort((a, b) => b.availabilityRate - a.availabilityRate || b.totalCount - a.totalCount);

    return {
    tooltip: { 
      trigger: 'axis', 
      axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#cbd5e1',
      borderWidth: 1,
      textStyle: { color: '#1e293b', fontSize: 12 },
      padding: [10, 14],
      extraCssText: 'border-radius: 8px; box-shadow: 0 4px 20px 0 rgba(0, 0, 0, 0.08);',
      formatter: (params) => {
        const p = params[0];
        const item = cityAvailabilityList[p.dataIndex];
        if (!item) return '';
        const diff = (item.availabilityRate - overallAvailabilityRate).toFixed(2);
        const isPositive = parseFloat(diff) >= 0;
        return `
          <div style="font-weight: 700; color: #002f6c; font-size: 13px; margin-bottom: 6px;">
            <span style="display:inline-block; padding: 2px 6px; border-radius: 4px; background: #e0f2fe; color: #0369a1; font-size: 11px; margin-right: 6px; font-weight: 700;">Rank #${p.dataIndex + 1}</span>
            ${item.name}
          </div>
          <div style="display: flex; justify-content: space-between; gap: 16px; margin-bottom: 3px;">
            <span style="color: #64748b;">Availability %:</span>
            <span style="font-weight: 700; color: #002f6c;">${item.availabilityRate}%</span>
          </div>
          <div style="display: flex; justify-content: space-between; gap: 16px; margin-bottom: 3px;">
            <span style="color: #64748b;">Overall Benchmark:</span>
            <span style="font-weight: 600; color: #f59e0b;">${overallAvailabilityRate}%</span>
          </div>
          <div style="display: flex; justify-content: space-between; gap: 16px; margin-bottom: 3px;">
            <span style="color: #64748b;">Benchmark Diff:</span>
            <span style="font-weight: 600; color: ${isPositive ? '#059669' : '#e11d48'};">
              ${isPositive ? '+' : ''}${diff}%
            </span>
          </div>
          <div style="font-size: 11px; color: #94a3b8; margin-top: 4px;">
            In Stock: ${item.availableCount} / ${item.totalCount} products across ${item.pincodeCount} pincode${item.pincodeCount === 1 ? '' : 's'} (${item.retailerCount} retailer${item.retailerCount === 1 ? '' : 's'})
          </div>
        `;
      }
    },
    grid: { 
      left: '3%', 
      right: '18%', 
      bottom: cityAvailabilityList.length > 8 ? '16%' : '10%', 
      top: '14%', 
      containLabel: true 
    },
    dataZoom: [
      {
        type: 'slider',
        show: cityAvailabilityList.length > 8,
        startValue: 0,
        endValue: Math.min(7, cityAvailabilityList.length - 1),
        zoomLock: true,
        height: 12,
        bottom: '2%',
        borderColor: 'transparent',
        backgroundColor: '#f1f5f9',
        fillerColor: '#94a3b8',
        borderRadius: 6,
        handleIcon: 'none',
        handleSize: '0%',
        showDetail: false,
        showDataShadow: false,
        brushSelect: false
      }
    ],
    xAxis: {
      type: 'category',
      data: cityAvailabilityList.map(d => d.name),
      axisLabel: { 
        color: '#475569', 
        fontSize: 10, 
        fontWeight: 600,
        rotate: cityAvailabilityList.length > 5 ? 20 : 0,
        interval: 0,
        formatter: (val) => val.length > 14 ? val.slice(0, 13) + '…' : val
      },
      axisLine: { lineStyle: { color: '#e2e8f0' } },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      min: (value) => Math.max(0, Math.floor((value.min - 5) / 5) * 5),
      max: 100,
      axisLabel: { 
        color: '#64748b', 
        fontSize: 10,
        formatter: '{value}%'
      },
      splitLine: { lineStyle: { color: '#f1f5f9' } }
    },
    series: [
      {
        name: 'Availability %',
        type: 'bar',
        barWidth: 26,
        data: cityAvailabilityList.map(d => ({
          value: d.availabilityRate,
          itemStyle: {
            borderRadius: [6, 6, 0, 0],
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: '#002f6c' }, // Primary Deep Navy
                { offset: 1, color: '#2563eb' }  // Royal / Accent Blue
              ]
            }
          }
        })),
        showBackground: true,
        backgroundStyle: {
          color: '#f8fafc',
          borderRadius: [6, 6, 0, 0]
        },
        label: {
          show: true,
          position: 'top',
          formatter: '{c}%',
          fontSize: 10,
          fontWeight: 700,
          color: '#1e293b',
          distance: 5
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 47, 108, 0.3)',
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: '#001e47' },
                { offset: 1, color: '#1d4ed8' }
              ]
            }
          }
        },
        markLine: {
          silent: true,
          symbol: 'none',
          label: {
            show: true,
            position: 'end',
            formatter: `Overall Avg: ${overallAvailabilityRate}%`,
            color: '#b45309',
            fontWeight: 700,
            fontSize: 10,
            backgroundColor: 'rgba(254, 243, 199, 0.95)',
            padding: [3, 6],
            borderRadius: 4,
            borderColor: '#f59e0b',
            borderWidth: 1
          },
          lineStyle: {
            color: '#f59e0b',
            type: 'dashed',
            width: 1.5
          },
          data: [
            { yAxis: overallAvailabilityRate }
          ]
        }
      }
    ]
  };
}, [productListings, overallAvailabilityRate]);

  // 3. Calculate Availability Trends date-wise
  const availabilityTrendsOption = useMemo(() => {
    const dateGroups = {};
    productListings.forEach(p => {
      if (!p.scrape_date) return;
      const dateStr = formatDate(p.scrape_date);
      if (!dateGroups[dateStr]) {
        dateGroups[dateStr] = { total: 0, available: 0 };
      }
      dateGroups[dateStr].total++;
      const isAvailable = p.availability === true || p.availability === 'true' || (typeof p.availability === 'string' && p.availability.trim().toLowerCase() === 'yes');
      if (isAvailable) {
        dateGroups[dateStr].available++;
      }
    });

    const sortedDates = Object.keys(dateGroups).sort();
    const availabilityTrendData = sortedDates.map(dateStr => {
      const group = dateGroups[dateStr];
      const percentage = group.total > 0 ? parseFloat(((group.available / group.total) * 100).toFixed(2)) : 0.0;
      return { date: dateStr, percentage };
    });

    return {
    tooltip: { 
      trigger: 'axis', 
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#cbd5e1',
      borderWidth: 1,
      textStyle: { color: '#1e293b', fontSize: 12 },
      padding: [10, 14],
      extraCssText: 'border-radius: 8px; box-shadow: 0 4px 20px 0 rgba(0, 0, 0, 0.08);',
      formatter: (params) => {
        const item = params[0];
        return `Date: <span style="font-weight: 600; color: #1e293b;">${item.name}</span><br/>Avg Availability: <span style="font-weight: 600; color: #002f6c;">${item.value}%</span>`;
      }
    },
    grid: { left: '4%', right: '4%', bottom: '8%', top: '10%', containLabel: true },
    xAxis: {
      type: 'category',
      data: availabilityTrendData.map(d => d.date),
      axisLabel: { color: '#64748b', fontSize: 10 },
      axisLine: { lineStyle: { color: '#e2e8f0' } }
    },
    yAxis: {
      type: 'value',
      min: 'dataMin',
      max: 100,
      axisLabel: { 
        color: '#64748b', 
        fontSize: 10,
        formatter: '{value}%'
      },
      splitLine: { lineStyle: { color: '#f1f5f9' } }
    },
    series: [
      {
        name: 'Availability',
        data: availabilityTrendData.map(d => d.percentage),
        type: 'line',
        smooth: true,
        showSymbol: true,
        symbol: 'circle',
        symbolSize: 6,
        itemStyle: {
          color: '#002f6c'
        },
        lineStyle: {
          color: '#002f6c',
          width: 3,
          shadowColor: 'rgba(0, 47, 108, 0.15)',
          shadowBlur: 8,
          shadowOffsetY: 3
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(0, 47, 108, 0.12)' },
              { offset: 1, color: 'rgba(0, 47, 108, 0.0)' }
            ]
          }
        }
      }
    ]
  };
}, [productListings]);

  return (
    <div className="fade-in">
      <MetricsGrid stats={stats} onKpiClick={onKpiClick} />

      {/* Availability % by Retailer & Availability % by City */}
      <div className="charts-grid" style={{ marginBottom: '24px' }}>
        {/* Availability % by Retailer */}
        <div className="chart-card glass" style={{ minHeight: '380px' }}>
          <div className="chart-title">
            <div>
              Availability % by Retailer
              <div className="chart-subtitle">Distribution of Average availability percentage for all the retailers.</div>
            </div>
          </div>
          <div className="chart-wrapper">
            <ChartContainer options={availabilityByRetailerOption} />
          </div>
        </div>

        {/* Availability % by City */}
        <div className="chart-card glass" style={{ minHeight: '380px' }}>
          <div className="chart-title">
            <div>
              Availability % by City
              <div className="chart-subtitle">Distribution of Average availability percentage for all the cities.</div>
            </div>
          </div>
          <div className="chart-wrapper">
            <ChartContainer options={availabilityByCityOption} />
          </div>
        </div>
      </div>

      {/* Availability Trends Date-wise */}
      <div className="charts-grid" style={{ marginBottom: '24px', gridTemplateColumns: '1fr' }}>
        <div className="chart-card glass" style={{ minHeight: '380px' }}>
          <div className="chart-title">
            <div>
              Availability Trends
              <div className="chart-subtitle">Average availability percentage date-wise</div>
            </div>
          </div>
          <div className="chart-wrapper">
            <ChartContainer options={availabilityTrendsOption} />
          </div>
        </div>
      </div>

      {/* Share of Availability Brand-wise Table & Slicers */}
      <BrandAvailabilityTable productListings={productListings} />
    </div>
  );
}

export default React.memo(AvailabilityAnalysis);
