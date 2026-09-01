import React from 'react';
import MetricsGrid from '../components/MetricsGrid';
import ChartContainer from '../components/ChartContainer';

export default function DashboardOverview({ bannerAds, productListings, stats, onKpiClick }) {
  
  // 1. Calculate Share of Search by Top 10 Brands (Distinct SKUs per brand, ranked order, excluding 'Others')
  const brandDistinctSkus = {};
  const brandDisplayNames = {};
  const ignoredBrands = new Set(['others', 'other', 'unknown', 'n/a', 'na', 'none', 'null', 'undefined']);

  productListings.forEach(p => {
    const rawBrand = p.brand?.trim();
    const sku = (p.sku || p.title)?.trim();
    if (!rawBrand || !sku) return;

    const brandKey = rawBrand.toLowerCase();
    if (ignoredBrands.has(brandKey)) return;

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
    .slice(0, 10); // Ranked in order #1 to #10

  const shareOfSearchOption = {
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
      inverse: true, // Rank #1 at top
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
                { offset: 0, color: '#002f6c' }, // Primary Deep Navy
                { offset: 1, color: '#2563eb' }  // Royal / Accent Blue
              ]
            }
          }
        }))
      }
    ]
  };

  // 2. Calculate Average Rating by Brands with respect to overall ratings (excluding 'Others')
  const brandSkuRatings = {};
  const brandRatingDisplayNames = {};

  productListings.forEach(p => {
    const rawBrand = p.brand?.trim();
    const sku = (p.sku || p.title)?.trim();
    const rating = parseFloat(p.rating_of_5) || 0;
    if (!rawBrand || !sku || rating <= 0) return;

    const brandKey = rawBrand.toLowerCase();
    if (ignoredBrands.has(brandKey)) return;

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

  const avgRatingOption = {
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

  // 3. Calculate Average Price by Brand (for all brands, excluding 'Others')
  const brandSkuPrices = {};
  const brandPriceDisplayNames = {};

  productListings.forEach(p => {
    const rawBrand = p.brand?.trim();
    const sku = (p.sku || p.title)?.trim();
    const price = parseFloat(p.price);
    if (!rawBrand || !sku || isNaN(price) || price <= 0) return;

    const brandKey = rawBrand.toLowerCase();
    if (ignoredBrands.has(brandKey)) return;

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

  const avgPriceOption = {
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

  // 4. Calculate Average Discount % by Brand (for all brands, excluding 'Others')
  const brandSkuDiscounts = {};
  const brandDiscountDisplayNames = {};

  productListings.forEach(p => {
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
    if (ignoredBrands.has(brandKey)) return;

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

  const avgDiscountOption = {
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

  // 5. Calculate Availability % by Retailer across cities
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

  const overallAvailabilityRate = stats?.availabilityRate?.value !== undefined
    ? parseFloat(stats.availabilityRate.value)
    : (productListings.length > 0
        ? parseFloat(((productListings.filter(p => p.availability === true || p.availability === 'true' || (typeof p.availability === 'string' && p.availability.trim().toLowerCase() === 'yes')).length / productListings.length) * 100).toFixed(2))
        : 99.96);

  const availabilityByRetailerOption = {
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

  const formatDate = (dateVal) => {
    if (!dateVal) return '';
    if (typeof dateVal === 'string') {
      return dateVal.includes('T') ? dateVal.split('T')[0] : dateVal;
    }
    if (dateVal instanceof Date) {
      return dateVal.toISOString().split('T')[0];
    }
    return String(dateVal);
  };

  // 4. Calculate Availability Trends date-wise
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

  const availabilityTrendsOption = {
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

      <div className="charts-grid">
        {/* Availability % by Retailer */}
        <div className="chart-card glass" style={{ minHeight: '380px' }}>
          <div className="chart-title">
            <div>
              Availability % by Retailer
              <div className="chart-subtitle">Distribution of Average availability percentage for all the cities.</div>
            </div>
          </div>
          <div className="chart-wrapper">
            <ChartContainer options={availabilityByRetailerOption} />
          </div>
        </div>

        {/* Availability Trends */}
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
    </div>
  );
}
