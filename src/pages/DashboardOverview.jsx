import React, { useMemo } from 'react';
import MetricsGrid from '../components/MetricsGrid';
import ChartContainer from '../components/ChartContainer';
import BrandSearchRankTable from '../components/BrandSearchRankTable';
import DataTable from '../components/DataTable';

const IGNORED_BRANDS = new Set(['others', 'other', 'unknown', 'n/a', 'na', 'none', 'null', 'undefined']);

const BANNER_COLUMNS = [
  { key: 's_no', label: 'S.No', width: '60px' },
  { key: 'scrape_date', label: 'Date', width: '120px' },
  { key: 'brand', label: 'Brand', width: '120px', render: (val) => <span className="badge primary">{val}</span> },
  { key: 'search_keyword', label: 'Keyword', width: '120px' },
  { key: 'ad_type', label: 'Ad Type', width: '140px', render: (val) => <span className={`badge ${val === 'Video Banner' ? 'magenta' : 'secondary'}`}>{val}</span> },
  { key: 'banner_position', label: 'Position', width: '100px', render: (val) => <span className="badge warning">{val}</span> },
  { key: 'banner_size', label: 'Size (WxH)', width: '100px' },
  { key: 'title', label: 'Title Ad Copy', render: (val) => <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>{val}</span> }
];

function DashboardOverview({ bannerAds, productListings, stats, onKpiClick }) {
  
  // 1. Calculate Share of Search by Top 10 Brands (Distinct SKUs per brand, ranked order, excluding 'Others')
  const shareOfSearchOption = useMemo(() => {
    const brandDistinctSkus = {};
    const brandDisplayNames = {};

    (productListings || []).forEach(p => {
      const rawBrand = p.brand?.trim();
      const sku = (p.sku || p.title)?.trim();
      if (!rawBrand || !sku) return;

      const brandKey = rawBrand.toLowerCase();
      if (IGNORED_BRANDS.has(brandKey)) return;

      if (!brandDistinctSkus[brandKey]) {
        brandDistinctSkus[brandKey] = new Set();
        brandDisplayNames[brandKey] = rawBrand;
      }
      brandDistinctSkus[brandKey].add(sku.toLowerCase());
    });

    const totalDistinctSkusAll = Object.values(brandDistinctSkus).reduce((acc, set) => acc + set.size, 0) || 1;

    const brandChartData = Object.entries(brandDistinctSkus)
      .map(([brandKey, skuSet]) => ({
        name: brandDisplayNames[brandKey] || brandKey,
        skuCount: skuSet.size,
        percentage: parseFloat(((skuSet.size / totalDistinctSkusAll) * 100).toFixed(1))
      }))
      .sort((a, b) => b.skuCount - a.skuCount)
      .slice(0, 10);

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
          const item = brandChartData[p.dataIndex];
          if (!item) return '';
          return `
            <div style="font-weight: 700; color: #002f6c; font-size: 13px; margin-bottom: 6px;">
              <span style="display:inline-block; padding: 2px 6px; border-radius: 4px; background: #e0f2fe; color: #0369a1; font-size: 11px; margin-right: 6px; font-weight: 700;">Rank #${p.dataIndex + 1}</span>
              ${item.name}
            </div>
            <div style="display: flex; justify-content: space-between; gap: 16px; margin-bottom: 3px;">
              <span style="color: #64748b;">Share of Search:</span>
              <span style="font-weight: 700; color: #002f6c;">${item.percentage}%</span>
            </div>
            <div style="display: flex; justify-content: space-between; gap: 16px;">
              <span style="color: #64748b;">Distinct SKUs:</span>
              <span style="font-weight: 600; color: #1e293b;">${item.skuCount}</span>
            </div>
          `;
        }
      },
      grid: { 
        left: '3%', 
        right: '15%', 
        top: '4%', 
        bottom: '6%', 
        containLabel: true 
      },
      xAxis: {
        type: 'value',
        axisLabel: { 
          formatter: '{value}%', 
          color: '#64748b', 
          fontSize: 10 
        },
        splitLine: { 
          lineStyle: { color: '#f1f5f9', type: 'dashed' } 
        },
        axisLine: { 
          lineStyle: { color: '#e2e8f0' } 
        }
      },
      yAxis: {
        type: 'category',
        inverse: true,
        data: brandChartData.map(d => d.name),
        axisLabel: {
          formatter: (value, index) => `#${index + 1}  ${value}`,
          color: '#1e293b',
          fontWeight: 600,
          fontSize: 11
        },
        axisLine: { show: false },
        axisTick: { show: false }
      },
      series: [
        {
          name: 'Share of Search',
          type: 'bar',
          barWidth: 14,
          showBackground: true,
          backgroundStyle: {
            color: '#f8fafc',
            borderRadius: [0, 6, 6, 0]
          },
          label: {
            show: true,
            position: 'right',
            formatter: (params) => {
              const item = brandChartData[params.dataIndex];
              return `${params.value}% (${item?.skuCount || 0} SKUs)`;
            },
            fontSize: 10,
            fontWeight: 600,
            color: '#475569',
            distance: 6
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowColor: 'rgba(0, 47, 108, 0.3)',
              color: {
                type: 'linear',
                x: 0, y: 0, x2: 1, y2: 0,
                colorStops: [
                  { offset: 0, color: '#001e47' },
                  { offset: 1, color: '#1d4ed8' }
                ]
              }
            }
          },
          data: brandChartData.map((d) => ({
            value: d.percentage,
            itemStyle: {
              borderRadius: [0, 6, 6, 0],
              color: {
                type: 'linear',
                x: 0, y: 0, x2: 1, y2: 0,
                colorStops: [
                  { offset: 0, color: '#002f6c' },
                  { offset: 1, color: '#2563eb' }
                ]
              }
            }
          }))
        }
      ]
    };
  }, [productListings]);

  // 2. Calculate Average Rating by Brands with respect to overall ratings (excluding 'Others')
  const avgRatingOption = useMemo(() => {
    const brandSkuRatings = {};
    const brandRatingDisplayNames = {};

    (productListings || []).forEach(p => {
      const rawBrand = p.brand?.trim();
      const sku = (p.sku || p.title)?.trim();
      const rating = parseFloat(p.rating_of_5) || 0;
      if (!rawBrand || !sku || rating <= 0) return;

      const brandKey = rawBrand.toLowerCase();
      if (IGNORED_BRANDS.has(brandKey)) return;

      if (!brandSkuRatings[brandKey]) {
        brandSkuRatings[brandKey] = {};
        brandRatingDisplayNames[brandKey] = rawBrand;
      }
    const skuKey = sku.toLowerCase();
    if (!brandSkuRatings[brandKey][skuKey]) {
      brandSkuRatings[brandKey][skuKey] = [];
    }
    brandSkuRatings[brandKey][skuKey].push(rating);
  });

  const brandAvgRatingList = [];
  let allSkuRatingSum = 0;
  let allSkuRatingCount = 0;

  Object.entries(brandSkuRatings).forEach(([brandKey, skus]) => {
    let brandSum = 0;
    let brandCount = 0;
    Object.values(skus).forEach(ratings => {
      const skuAvg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
      brandSum += skuAvg;
      brandCount++;
      allSkuRatingSum += skuAvg;
      allSkuRatingCount++;
    });
    if (brandCount > 0) {
      brandAvgRatingList.push({
        name: brandRatingDisplayNames[brandKey] || brandKey,
        avgRating: parseFloat((brandSum / brandCount).toFixed(2)),
        skuCount: brandCount
      });
    }
  });

  // Align overall benchmark with the KPI Average Rating card value
  const overallAvgRating = stats?.avgRating?.value 
    ? parseFloat(stats.avgRating.value) 
    : (allSkuRatingCount > 0 ? parseFloat((allSkuRatingSum / allSkuRatingCount).toFixed(2)) : 4.57);

  // Include ALL brands sorted by rating
  brandAvgRatingList.sort((a, b) => b.avgRating - a.avgRating);
  const displayBrandRatingList = brandAvgRatingList; // All brands included

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
        const item = displayBrandRatingList[p.dataIndex];
        if (!item) return '';
        const diff = (item.avgRating - overallAvgRating).toFixed(2);
        const isPositive = parseFloat(diff) >= 0;
        return `
          <div style="font-weight: 700; color: #002f6c; font-size: 13px; margin-bottom: 6px;">
            <span style="display:inline-block; padding: 2px 6px; border-radius: 4px; background: #e0f2fe; color: #0369a1; font-size: 11px; margin-right: 6px; font-weight: 700;">Rank #${p.dataIndex + 1}</span>
            ${item.name}
          </div>
          <div style="display: flex; justify-content: space-between; gap: 16px; margin-bottom: 3px;">
            <span style="color: #64748b;">Brand Avg Rating:</span>
            <span style="font-weight: 700; color: #10b981;">${item.avgRating} ★</span>
          </div>
          <div style="display: flex; justify-content: space-between; gap: 16px; margin-bottom: 3px;">
            <span style="color: #64748b;">Overall Benchmark:</span>
            <span style="font-weight: 600; color: #f59e0b;">${overallAvgRating} ★</span>
          </div>
          <div style="display: flex; justify-content: space-between; gap: 16px; margin-bottom: 3px;">
            <span style="color: #64748b;">Benchmark Diff:</span>
            <span style="font-weight: 600; color: ${isPositive ? '#059669' : '#e11d48'};">
              ${isPositive ? '+' : ''}${diff} ★
            </span>
          </div>
          <div style="font-size: 11px; color: #94a3b8; margin-top: 4px;">
            Based on ${item.skuCount} distinct SKU${item.skuCount > 1 ? 's' : ''}
          </div>
        `;
      }
    },
    grid: { 
      left: '3%', 
      right: '18%', 
      bottom: displayBrandRatingList.length > 10 ? '16%' : '10%', 
      top: '14%', 
      containLabel: true 
    },
    dataZoom: [
      {
        type: 'slider',
        show: displayBrandRatingList.length > 10,
        startValue: 0,
        endValue: Math.min(10, displayBrandRatingList.length - 1),
        zoomLock: true, // Lock zoom to act purely as a simple scrollbar
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
      data: displayBrandRatingList.map(d => d.name),
      axisLabel: { 
        color: '#475569', 
        fontSize: 10, 
        fontWeight: 600,
        rotate: 25,
        interval: 0,
        formatter: (val) => val.length > 12 ? val.slice(0, 11) + '…' : val
      },
      axisLine: { lineStyle: { color: '#e2e8f0' } },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      min: (value) => Math.max(0, Math.floor((value.min - 0.4) * 2) / 2),
      max: 5,
      axisLabel: { 
        color: '#64748b', 
        fontSize: 10,
        formatter: '{value} ★'
      },
      splitLine: { lineStyle: { color: '#f1f5f9' } }
    },
    series: [
      {
        name: 'Brand Avg Rating',
        type: 'bar',
        barWidth: 26,
        data: displayBrandRatingList.map(d => ({
          value: d.avgRating,
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
          formatter: '{c} ★',
          fontSize: 11,
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
            formatter: `Overall Avg: ${overallAvgRating} ★`,
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
            { yAxis: overallAvgRating }
          ]
        }
      }
    ]
  };
}, [productListings, stats?.avgRating?.value]);

  // 3. Calculate Average Price by Brand (for all brands, excluding 'Others')
  const avgPriceOption = useMemo(() => {
    const brandSkuPrices = {};
    const brandPriceDisplayNames = {};

    (productListings || []).forEach(p => {
      const rawBrand = p.brand?.trim();
      const sku = (p.sku || p.title)?.trim();
      const price = parseFloat(p.price);
      if (!rawBrand || !sku || isNaN(price) || price <= 0) return;

      const brandKey = rawBrand.toLowerCase();
      if (IGNORED_BRANDS.has(brandKey)) return;

      if (!brandSkuPrices[brandKey]) {
        brandSkuPrices[brandKey] = {};
        brandPriceDisplayNames[brandKey] = rawBrand;
      }
    const skuKey = sku.toLowerCase();
    if (!brandSkuPrices[brandKey][skuKey]) {
      brandSkuPrices[brandKey][skuKey] = [];
    }
    brandSkuPrices[brandKey][skuKey].push(price);
  });

  const brandAvgPriceList = [];
  let allSkuPriceSum = 0;
  let allSkuPriceCount = 0;

  Object.entries(brandSkuPrices).forEach(([brandKey, skus]) => {
    let brandSum = 0;
    let brandCount = 0;
    Object.values(skus).forEach(prices => {
      const skuAvg = prices.reduce((a, b) => a + b, 0) / prices.length;
      brandSum += skuAvg;
      brandCount++;
      allSkuPriceSum += skuAvg;
      allSkuPriceCount++;
    });
    if (brandCount > 0) {
      brandAvgPriceList.push({
        name: brandPriceDisplayNames[brandKey] || brandKey,
        avgPrice: Math.round(brandSum / brandCount),
        skuCount: brandCount
      });
    }
  });

  // Sort descending by average price
  brandAvgPriceList.sort((a, b) => b.avgPrice - a.avgPrice);

  const overallAvgPrice = stats?.avgPrice?.value !== undefined
    ? (typeof stats.avgPrice.value === 'string' ? parseFloat(stats.avgPrice.value.replace(/[^0-9.]/g, '')) : stats.avgPrice.value)
    : (allSkuPriceCount > 0 ? Math.round(allSkuPriceSum / allSkuPriceCount) : 0);

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
        const item = brandAvgPriceList[p.dataIndex];
        if (!item) return '';
        const diff = Math.round(item.avgPrice - overallAvgPrice);
        const isPositive = diff >= 0;
        return `
          <div style="font-weight: 700; color: #002f6c; font-size: 13px; margin-bottom: 6px;">
            <span style="display:inline-block; padding: 2px 6px; border-radius: 4px; background: #e0f2fe; color: #0369a1; font-size: 11px; margin-right: 6px; font-weight: 700;">Rank #${p.dataIndex + 1}</span>
            ${item.name}
          </div>
          <div style="display: flex; justify-content: space-between; gap: 16px; margin-bottom: 3px;">
            <span style="color: #64748b;">Brand Avg Price:</span>
            <span style="font-weight: 700; color: #002f6c;">₹${item.avgPrice.toLocaleString()}</span>
          </div>
          <div style="display: flex; justify-content: space-between; gap: 16px; margin-bottom: 3px;">
            <span style="color: #64748b;">Overall Benchmark:</span>
            <span style="font-weight: 600; color: #f59e0b;">₹${overallAvgPrice.toLocaleString()}</span>
          </div>
          <div style="display: flex; justify-content: space-between; gap: 16px; margin-bottom: 3px;">
            <span style="color: #64748b;">Benchmark Diff:</span>
            <span style="font-weight: 600; color: ${isPositive ? '#059669' : '#e11d48'};">
              ${isPositive ? '+' : ''}₹${diff.toLocaleString()}
            </span>
          </div>
          <div style="font-size: 11px; color: #94a3b8; margin-top: 4px;">
            Based on ${item.skuCount} distinct SKU${item.skuCount > 1 ? 's' : ''}
          </div>
        `;
      }
    },
    grid: { 
      left: '3%', 
      right: '18%', 
      bottom: brandAvgPriceList.length > 10 ? '16%' : '10%', 
      top: '14%', 
      containLabel: true 
    },
    dataZoom: [
      {
        type: 'slider',
        show: brandAvgPriceList.length > 10,
        startValue: 0,
        endValue: Math.min(10, brandAvgPriceList.length - 1),
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
      data: brandAvgPriceList.map(d => d.name),
      axisLabel: { 
        color: '#475569', 
        fontSize: 10, 
        fontWeight: 600,
        rotate: 25,
        interval: 0,
        formatter: (val) => val.length > 12 ? val.slice(0, 11) + '…' : val
      },
      axisLine: { lineStyle: { color: '#e2e8f0' } },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      axisLabel: { 
        color: '#64748b', 
        fontSize: 10,
        formatter: '₹{value}'
      },
      splitLine: { lineStyle: { color: '#f1f5f9' } }
    },
    series: [
      {
        name: 'Brand Avg Price',
        type: 'bar',
        barWidth: 26,
        data: brandAvgPriceList.map(d => ({
          value: d.avgPrice,
          itemStyle: {
            borderRadius: [6, 6, 0, 0],
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: '#002f6c' },
                { offset: 1, color: '#2563eb' }
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
          formatter: '₹{c}',
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
            formatter: `Overall Avg: ₹${overallAvgPrice}`,
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
            { yAxis: overallAvgPrice }
          ]
        }
      }
    ]
  };
}, [productListings, stats?.avgPrice?.value]);

  // 4. Calculate Average Discount % by Brand (for all brands, excluding 'Others')
  const avgDiscountOption = useMemo(() => {
    const brandSkuDiscounts = {};
    const brandDiscountDisplayNames = {};

    (productListings || []).forEach(p => {
      const rawBrand = p.brand?.trim();
      const sku = (p.sku || p.title)?.trim();
      if (!rawBrand || !sku) return;

      let discountVal = null;
      if (p.discount !== undefined && p.discount !== null && p.discount !== '') {
        const parsedD = parseFloat(p.discount);
        if (!isNaN(parsedD)) discountVal = parsedD;
      } else {
        const price = parseFloat(p.price);
        const originalPrice = parseFloat(p.original_price);
        if (!isNaN(price) && !isNaN(originalPrice) && originalPrice > 0 && originalPrice >= price) {
          discountVal = ((originalPrice - price) / originalPrice) * 100;
        }
      }

      if (discountVal === null || isNaN(discountVal) || discountVal < 0) return;

      const brandKey = rawBrand.toLowerCase();
      if (IGNORED_BRANDS.has(brandKey)) return;

      if (!brandSkuDiscounts[brandKey]) {
        brandSkuDiscounts[brandKey] = {};
        brandDiscountDisplayNames[brandKey] = rawBrand;
      }
    const skuKey = sku.toLowerCase();
    if (!brandSkuDiscounts[brandKey][skuKey]) {
      brandSkuDiscounts[brandKey][skuKey] = [];
    }
    brandSkuDiscounts[brandKey][skuKey].push(discountVal);
  });

  const brandAvgDiscountList = [];
  let allSkuDiscountSum = 0;
  let allSkuDiscountCount = 0;

  Object.entries(brandSkuDiscounts).forEach(([brandKey, skus]) => {
    let brandSum = 0;
    let brandCount = 0;
    Object.values(skus).forEach(discounts => {
      const skuAvg = discounts.reduce((a, b) => a + b, 0) / discounts.length;
      brandSum += skuAvg;
      brandCount++;
      allSkuDiscountSum += skuAvg;
      allSkuDiscountCount++;
    });
    if (brandCount > 0) {
      brandAvgDiscountList.push({
        name: brandDiscountDisplayNames[brandKey] || brandKey,
        avgDiscount: parseFloat((brandSum / brandCount).toFixed(1)),
        skuCount: brandCount
      });
    }
  });

  // Sort descending by average discount %
  brandAvgDiscountList.sort((a, b) => b.avgDiscount - a.avgDiscount);

  const overallAvgDiscount = stats?.avgDiscount?.value !== undefined
    ? (typeof stats.avgDiscount.value === 'string' ? parseFloat(stats.avgDiscount.value.replace(/[^0-9.]/g, '')) : stats.avgDiscount.value)
    : (allSkuDiscountCount > 0 ? parseFloat((allSkuDiscountSum / allSkuDiscountCount).toFixed(1)) : 0);

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
        const item = brandAvgDiscountList[p.dataIndex];
        if (!item) return '';
        const diff = (item.avgDiscount - overallAvgDiscount).toFixed(1);
        const isPositive = parseFloat(diff) >= 0;
        return `
          <div style="font-weight: 700; color: #002f6c; font-size: 13px; margin-bottom: 6px;">
            <span style="display:inline-block; padding: 2px 6px; border-radius: 4px; background: #e0f2fe; color: #0369a1; font-size: 11px; margin-right: 6px; font-weight: 700;">Rank #${p.dataIndex + 1}</span>
            ${item.name}
          </div>
          <div style="display: flex; justify-content: space-between; gap: 16px; margin-bottom: 3px;">
            <span style="color: #64748b;">Brand Avg Discount:</span>
            <span style="font-weight: 700; color: #002f6c;">${item.avgDiscount}%</span>
          </div>
          <div style="display: flex; justify-content: space-between; gap: 16px; margin-bottom: 3px;">
            <span style="color: #64748b;">Overall Benchmark:</span>
            <span style="font-weight: 600; color: #f59e0b;">${overallAvgDiscount}%</span>
          </div>
          <div style="display: flex; justify-content: space-between; gap: 16px; margin-bottom: 3px;">
            <span style="color: #64748b;">Benchmark Diff:</span>
            <span style="font-weight: 600; color: ${isPositive ? '#059669' : '#e11d48'};">
              ${isPositive ? '+' : ''}${diff}%
            </span>
          </div>
          <div style="font-size: 11px; color: #94a3b8; margin-top: 4px;">
            Based on ${item.skuCount} distinct SKU${item.skuCount > 1 ? 's' : ''}
          </div>
        `;
      }
    },
    grid: { 
      left: '3%', 
      right: '18%', 
      bottom: brandAvgDiscountList.length > 10 ? '16%' : '10%', 
      top: '14%', 
      containLabel: true 
    },
    dataZoom: [
      {
        type: 'slider',
        show: brandAvgDiscountList.length > 10,
        startValue: 0,
        endValue: Math.min(10, brandAvgDiscountList.length - 1),
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
      data: brandAvgDiscountList.map(d => d.name),
      axisLabel: { 
        color: '#475569', 
        fontSize: 10, 
        fontWeight: 600,
        rotate: 25,
        interval: 0,
        formatter: (val) => val.length > 12 ? val.slice(0, 11) + '…' : val
      },
      axisLine: { lineStyle: { color: '#e2e8f0' } },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      axisLabel: { 
        color: '#64748b', 
        fontSize: 10,
        formatter: '{value}%'
      },
      splitLine: { lineStyle: { color: '#f1f5f9' } }
    },
    series: [
      {
        name: 'Brand Avg Discount',
        type: 'bar',
        barWidth: 26,
        data: brandAvgDiscountList.map(d => ({
          value: d.avgDiscount,
          itemStyle: {
            borderRadius: [6, 6, 0, 0],
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: '#002f6c' },
                { offset: 1, color: '#2563eb' }
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
            formatter: `Overall Avg: ${overallAvgDiscount}%`,
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
            { yAxis: overallAvgDiscount }
          ]
        }
      }
    ]
  };
}, [productListings, stats?.avgDiscount?.value]);

  // 5. Calculate position distribution using db column name 'banner_position'
  const positionChartOption = useMemo(() => {
    const positionCounts = {};
    (bannerAds || []).forEach(ad => {
      const pos = ad.banner_position || 'Unknown';
      positionCounts[pos] = (positionCounts[pos] || 0) + 1;
    });
    const positions = Object.keys(positionCounts);
    const positionValues = Object.values(positionCounts);

  return {
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
}, [bannerAds]);

  // 6. Calculate Ads Share of Search % by Brand
  const adsSosOption = useMemo(() => {
    const adsBrandCounts = {};
    let totalAdsCount = 0;
    (bannerAds || []).forEach(ad => {
      const rawBrand = ad.brand?.trim();
      if (!rawBrand || IGNORED_BRANDS.has(rawBrand.toLowerCase())) return;
      adsBrandCounts[rawBrand] = (adsBrandCounts[rawBrand] || 0) + 1;
      totalAdsCount++;
    });

  const adsSosData = Object.entries(adsBrandCounts)
    .map(([brand, count]) => ({
      name: brand,
      count,
      percentage: totalAdsCount > 0 ? parseFloat(((count / totalAdsCount) * 100).toFixed(2)) : 0.0
    }))
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 10); // Top 10 brands

  const adsSosYAxisData = [...adsSosData].reverse().map(d => d.name);
  const adsSosSeriesData = [...adsSosData].reverse().map(d => d.percentage);

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
        const item = [...adsSosData].reverse()[p.dataIndex];
        if (!item) return '';
        return `
          <div style="font-weight: 700; color: #002f6c; font-size: 13px; margin-bottom: 6px;">
            ${item.name}
          </div>
          <div style="display: flex; justify-content: space-between; gap: 16px; margin-bottom: 3px;">
            <span style="color: #64748b;">Ads SOS %:</span>
            <span style="font-weight: 700; color: #002f6c;">${item.percentage}%</span>
          </div>
          <div style="display: flex; justify-content: space-between; gap: 16px; font-size: 11px; color: #64748b;">
            <span>Banner Ads Count:</span>
            <span style="font-weight: 600; color: #f5a623;">${item.count} ads</span>
          </div>
        `;
      }
    },
    grid: { 
      left: '3%', 
      right: '12%', 
      bottom: '5%', 
      top: '5%', 
      containLabel: true 
    },
    xAxis: {
      type: 'value',
      axisLabel: { 
        color: '#64748b', 
        fontSize: 11,
        formatter: '{value}%'
      },
      splitLine: { 
        lineStyle: { 
          color: '#e2e8f0',
          type: 'dotted'
        } 
      }
    },
    yAxis: {
      type: 'category',
      data: adsSosYAxisData,
      axisLabel: { 
        color: '#1e293b', 
        fontSize: 12,
        fontWeight: 600
      },
      axisLine: { lineStyle: { color: '#cbd5e1' } },
      axisTick: { show: false }
    },
    series: [
      {
        name: 'Ads SOS %',
        type: 'bar',
        barWidth: '45%',
        data: adsSosSeriesData,
        itemStyle: {
          color: '#21336a',
          borderRadius: [0, 4, 4, 0]
        },
        label: {
          show: true,
          position: 'right',
          formatter: '{c}%',
          color: '#64748b',
          fontSize: 11,
          fontWeight: 600,
          distance: 6
        },
        emphasis: {
          itemStyle: {
            color: '#1e3a8a',
            shadowBlur: 10,
            shadowColor: 'rgba(0, 47, 108, 0.25)'
          }
        }
      }
    ]
  };
}, [bannerAds]);

  return (
    <div className="fade-in">
      <MetricsGrid stats={stats} onKpiClick={onKpiClick} />

      <div className="charts-grid">
        {/* Share of Search by Top 10 Brands */}
        <div className="chart-card glass">
          <div className="chart-title">
            <div>
              Share of Search by Top 10 Brands
              <div className="chart-subtitle">Distribution percentage of top 10 brands</div>
            </div>
          </div>
          <div className="chart-wrapper">
            <ChartContainer options={shareOfSearchOption} />
          </div>
        </div>

        {/* Average Rating by Brands */}
        <div className="chart-card glass">
          <div className="chart-title">
            <div>
              Average Rating by Brands
              <div className="chart-subtitle">Distribution of average ratings by all the brands</div>
            </div>
          </div>
          <div className="chart-wrapper">
            <ChartContainer options={avgRatingOption} />
          </div>
        </div>
      </div>

      <div className="charts-grid">
        {/* Average Price by Brand */}
        <div className="chart-card glass" style={{ minHeight: '380px' }}>
          <div className="chart-title">
            <div>
              Average Price by Brand
              <div className="chart-subtitle">Distribution of average price for all the brands.</div>
            </div>
          </div>
          <div className="chart-wrapper">
            <ChartContainer options={avgPriceOption} />
          </div>
        </div>

        {/* Average Discount % by Brand */}
        <div className="chart-card glass" style={{ minHeight: '380px' }}>
          <div className="chart-title">
            <div>
              Average Discount % by Brand
              <div className="chart-subtitle">Distribution of Average discount percentage for all the brands</div>
            </div>
          </div>
          <div className="chart-wrapper">
            <ChartContainer options={avgDiscountOption} />
          </div>
        </div>
      </div>

      {/* Banner Analytics Grid: Ads SOS % by Brand & Position of Banner Ads */}
      <div className="charts-grid" style={{ marginBottom: '24px' }}>
        {/* Ads SOS % by Brand */}
        <div className="chart-card glass" style={{ minHeight: '340px' }}>
          <div className="chart-title">
            <div>
              Ads SOS % by Brand
              <div className="chart-subtitle">Distribution percentage of banner ads share of search by brand</div>
            </div>
          </div>
          <div className="chart-wrapper" style={{ minHeight: '220px' }}>
            <ChartContainer options={adsSosOption} />
          </div>
        </div>

        {/* Position of Banner Ads Chart */}
        <div className="chart-card glass" style={{ minHeight: '340px' }}>
          <div className="chart-title">
            <div>
              Position of Banner Ads
              <div className="chart-subtitle">Count of banner ads by page placement (Top, Left, Middle, Bottom)</div>
            </div>
          </div>
          <div className="chart-wrapper" style={{ minHeight: '220px' }}>
            <ChartContainer options={positionChartOption} />
          </div>
        </div>
      </div>

      {/* Search Rank by Brand Matrix Table & Trend Chart */}
      <BrandSearchRankTable productListings={productListings} />

      {/* Banner Ads Run by Position Table */}
      <div style={{ marginTop: '28px', marginBottom: '32px' }}>
        <DataTable 
          title="Banner Ads Run by Position"
          subtitle="Detailed log of all banner advertisements, placement positions, sizes, and ad copy"
          data={bannerAds || []} 
          columns={BANNER_COLUMNS} 
          enableDateFilter={true}
          dateKey="scrape_date"
          searchPlaceholder="Search by brand, title, keyword or type..."
        />
      </div>
    </div>
  );
}

export default React.memo(DashboardOverview);
