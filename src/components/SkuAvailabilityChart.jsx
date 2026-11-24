import React, { useState, useMemo } from 'react';
import ChartContainer from './ChartContainer';
import rawData from '../skuAvailabilityData.json';
import matrixData from '../skuStoreMatrixData.json';
import { Tag, Layers, BarChart3, Table as TableIcon } from 'lucide-react';

export default function SkuAvailabilityChart() {
  const { categories, hierarchy, skus } = rawData;
  const { sheets } = matrixData;

  // 1. Filter 1: Category (Atta, Biscuits, Edible Oil, Noodles)
  const [selectedCategory, setSelectedCategory] = useState('Atta');

  // Available brands in the selected category
  const availableBrands = useMemo(() => {
    return hierarchy[selectedCategory] || [];
  }, [selectedCategory, hierarchy]);

  // 2. Filter 2: Brand within that category (defaults to first brand)
  const [selectedBrand, setSelectedBrand] = useState('Fortune');

  // View Mode: Simple Graph vs Simple Table
  const [viewMode, setViewMode] = useState('chart'); // 'chart' or 'table'

  // When category changes, reset brand to the first brand of that category
  const handleCategoryChange = (newCat) => {
    setSelectedCategory(newCat);
    const brands = hierarchy[newCat] || [];
    setSelectedBrand(brands[0] || 'all');
  };

  // SKUs belonging to the selected Category and Brand (sorted with full/highest availability 1st)
  const matchingSkus = useMemo(() => {
    const list = skus.filter(item => {
      if (item.category !== selectedCategory) return false;
      if (selectedBrand !== 'all' && item.brand !== selectedBrand) return false;
      return true;
    });
    list.sort((a, b) => b.overall_avail_pct - a.overall_avail_pct);
    return list;
  }, [skus, selectedCategory, selectedBrand]);

  // Table store rows for the selected category & brand (sorted with full availability 1st)
  const tableRows = useMemo(() => {
    if (viewMode !== 'table') return [];
    const rows = [];
    Object.values(sheets).forEach(s => {
      if (s.category !== selectedCategory) return;
      if (selectedBrand !== 'all' && s.brand !== selectedBrand) return;
      s.rows.forEach(r => {
        const [chain, sku, city, pin, statuses] = r;
        const availCount = statuses.filter(st => st === 1).length;
        const isLatestAvail = statuses[statuses.length - 1] === 1;
        rows.push({
          chain,
          sku,
          city,
          pin,
          availCount,
          isLatestAvail
        });
      });
    });
    rows.sort((a, b) => {
      if (b.availCount !== a.availCount) return b.availCount - a.availCount;
      return (b.isLatestAvail ? 1 : 0) - (a.isLatestAvail ? 1 : 0);
    });
    return rows;
  }, [sheets, selectedCategory, selectedBrand, viewMode]);

  // Clean SKU display name helper
  const getShortName = (fullName) => {
    if (!fullName) return 'Unknown';
    // Remove redundant noise if very long
    return fullName.length > 45 ? fullName.slice(0, 42) + '...' : fullName;
  };

  // ECharts Configuration for the simple graph
  const chartOption = useMemo(() => {
    if (!matchingSkus.length) {
      return {
        title: {
          text: 'No SKUs found for this selection',
          left: 'center',
          top: 'center',
          textStyle: { color: '#94a3b8', fontSize: 14 }
        }
      };
    }

    // Limit to top 20 if category has many SKUs so the chart stays clean and legible
    const displayList = matchingSkus.slice(0, 20);

    // Reverse for horizontal bars so highest is at top
    const rev = [...displayList].reverse();
    const skuNames = rev.map(d => getShortName(d.sku));

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: '#ffffff',
        borderColor: '#cbd5e1',
        borderWidth: 1,
        padding: [10, 14],
        extraCssText: 'border-radius: 8px; box-shadow: 0 6px 18px rgba(0,0,0,0.08); max-width: 380px;',
        formatter: (params) => {
          const idx = params[0].dataIndex;
          const item = rev[idx];
          return `
            <div style="font-weight: 700; color: #002f6c; font-size: 0.85rem; margin-bottom: 6px; line-height: 1.3;">
              ${item.sku}
            </div>
            <div style="font-size: 0.74rem; color: #64748b; margin-bottom: 8px;">
              Category: <strong>${item.category}</strong> • Brand: <strong>${item.brand}</strong>
            </div>
            <div style="display: flex; gap: 14px; background: #f8fafc; padding: 6px 10px; border-radius: 6px;">
              <div>
                <span style="font-size: 0.72rem; color: #d97706; font-weight: 600;">🟡 Blinkit:</span>
                <span style="font-weight: 700; color: #0f172a; margin-left: 4px;">${item.blinkit_avail_pct !== null ? item.blinkit_avail_pct + '%' : 'N/A'}</span>
              </div>
              <div>
                <span style="font-size: 0.72rem; color: #7c3aed; font-weight: 600;">🟣 Zepto:</span>
                <span style="font-weight: 700; color: #0f172a; margin-left: 4px;">${item.zepto_avail_pct !== null ? item.zepto_avail_pct + '%' : 'N/A'}</span>
              </div>
              <div>
                <span style="font-size: 0.72rem; color: #002f6c; font-weight: 600;">Overall:</span>
                <span style="font-weight: 700; color: #002f6c; margin-left: 4px;">${item.overall_avail_pct}%</span>
              </div>
            </div>
          `;
        }
      },
      legend: {
        data: ['Blinkit Availability', 'Zepto Availability'],
        top: 0,
        right: 15,
        textStyle: { color: '#475569', fontSize: 12, fontWeight: 600 }
      },
      grid: {
        left: '2%',
        right: '6%',
        bottom: '5%',
        top: 36,
        containLabel: true
      },
      xAxis: {
        type: 'value',
        min: 0,
        max: 100,
        axisLabel: { formatter: '{value}%', color: '#64748b', fontSize: 11 },
        splitLine: { lineStyle: { color: '#f1f5f9' } }
      },
      yAxis: {
        type: 'category',
        data: skuNames,
        axisLabel: {
          color: '#334155',
          fontSize: 11,
          fontWeight: 500,
          width: 250,
          overflow: 'truncate'
        },
        axisLine: { lineStyle: { color: '#cbd5e1' } }
      },
      series: [
        {
          name: 'Blinkit Availability',
          type: 'bar',
          barGap: '20%',
          barWidth: displayList.length > 8 ? '35%' : '24%',
          data: rev.map(d => d.blinkit_avail_pct || 0),
          itemStyle: {
            color: '#f59e0b', // Blinkit Amber/Yellow
            borderRadius: [0, 4, 4, 0]
          },
          label: {
            show: true,
            position: 'right',
            formatter: '{c}%',
            color: '#64748b',
            fontSize: 10,
            fontWeight: 600
          }
        },
        {
          name: 'Zepto Availability',
          type: 'bar',
          barWidth: displayList.length > 8 ? '35%' : '24%',
          data: rev.map(d => d.zepto_avail_pct || 0),
          itemStyle: {
            color: '#8b5cf6', // Zepto Purple
            borderRadius: [0, 4, 4, 0]
          },
          label: {
            show: true,
            position: 'right',
            formatter: '{c}%',
            color: '#64748b',
            fontSize: 10,
            fontWeight: 600
          }
        }
      ]
    };
  }, [matchingSkus]);

  // Dynamic height based on number of SKUs
  const chartHeight = Math.max(280, Math.min(650, matchingSkus.length * 52 + 80));

  return (
    <div className="chart-card glass fade-in" style={{ marginBottom: '28px', padding: '22px' }}>
      
      {/* 1. Simple Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '18px' }}>
        <div>
          <h3 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 700, color: '#002f6c', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart3 size={20} style={{ color: '#0284c7' }} />
            SKU Availability Status
          </h3>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '3px' }}>
            In-stock fulfillment percentage across Blinkit and Zepto dark stores
          </div>
        </div>

        {/* View Switcher: Graph vs Table */}
        <div style={{ background: '#f1f5f9', padding: '3px', borderRadius: '8px', display: 'inline-flex', border: '1px solid #e2e8f0' }}>
          <button
            type="button"
            onClick={() => setViewMode('chart')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '6px 14px',
              fontSize: '0.78rem',
              fontWeight: 600,
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              background: viewMode === 'chart' ? '#ffffff' : 'transparent',
              color: viewMode === 'chart' ? '#002f6c' : '#64748b',
              boxShadow: viewMode === 'chart' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <BarChart3 size={14} />
            Graph
          </button>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '6px 14px',
              fontSize: '0.78rem',
              fontWeight: 600,
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              background: viewMode === 'table' ? '#ffffff' : 'transparent',
              color: viewMode === 'table' ? '#002f6c' : '#64748b',
              boxShadow: viewMode === 'table' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <TableIcon size={14} />
            Table
          </button>
        </div>
      </div>

      {/* 2. The Two Simple Filters (Filter 1: Category, Filter 2: Brand) */}
      <div style={{
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '10px',
        padding: '12px 16px',
        marginBottom: '20px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '20px'
      }}>
        {/* FILTER 1: CATEGORY */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', textTransform: 'uppercase' }}>
            <Tag size={12} style={{ color: '#0284c7' }} />
            Category:
          </span>
          <div style={{ display: 'flex', gap: '6px' }}>
            {categories.map(cat => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => handleCategoryChange(cat)}
                  style={{
                    padding: '5px 12px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    borderRadius: '20px',
                    border: '1px solid',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    background: isActive ? '#002f6c' : '#ffffff',
                    color: isActive ? '#ffffff' : '#334155',
                    borderColor: isActive ? '#002f6c' : '#cbd5e1',
                    boxShadow: isActive ? '0 2px 5px rgba(0, 47, 108, 0.2)' : 'none'
                  }}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Separator */}
        <div style={{ width: '1px', height: '28px', background: '#cbd5e1' }} />

        {/* FILTER 2: BRAND WITHIN CATEGORY */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', textTransform: 'uppercase' }}>
            <Layers size={12} style={{ color: '#0284c7' }} />
            Brand:
          </span>
          <select
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value)}
            className="filter-control"
            style={{
              height: '32px',
              padding: '3px 10px',
              fontSize: '0.8rem',
              fontWeight: 600,
              minWidth: '160px',
              background: '#ffffff'
            }}
          >
            {availableBrands.map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>

        {/* SKU Count Badge */}
        <div style={{ marginLeft: 'auto', fontSize: '0.76rem', color: '#64748b', fontWeight: 600 }}>
          Showing <strong>{matchingSkus.length}</strong> SKUs
        </div>
      </div>

      {/* 3. The Content: Simple Graph or Simple Table */}
      {viewMode === 'chart' ? (
        <div style={{ width: '100%', height: `${chartHeight}px`, position: 'relative' }}>
          <ChartContainer options={chartOption} />
        </div>
      ) : (
        /* SIMPLE TABLE */
        <div className="table-wrapper" style={{ maxHeight: '450px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
          <table className="dashboard-table">
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th style={{ width: '100px' }}>Chain</th>
                <th>SKU Name</th>
                <th style={{ width: '120px' }}>City</th>
                <th style={{ width: '100px' }}>Pin Code</th>
                <th style={{ width: '110px', textAlign: 'center' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.slice(0, 100).map((r, i) => (
                <tr key={i}>
                  <td>
                    <span 
                      style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        background: r.chain === 'Blinkit' ? '#fef3c7' : '#f3e8ff',
                        color: r.chain === 'Blinkit' ? '#92400e' : '#6b21a8'
                      }}
                    >
                      {r.chain}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.82rem' }}>
                    {r.sku}
                  </td>
                  <td style={{ color: '#475569', fontSize: '0.8rem' }}>{r.city}</td>
                  <td>
                    <code style={{ fontSize: '0.75rem', background: '#f1f5f9', padding: '2px 5px', borderRadius: '4px' }}>
                      {r.pin}
                    </code>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {r.isLatestAvail ? (
                      <span className="badge success" style={{ fontSize: '0.7rem' }}>Available</span>
                    ) : (
                      <span style={{ fontSize: '0.7rem', color: '#94a3b8', background: '#f1f5f9', padding: '2px 7px', borderRadius: '99px' }}>NR</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}
