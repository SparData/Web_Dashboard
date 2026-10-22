import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Search, 
  Check, 
  X, 
  ChevronDown, 
  Layers, 
  LineChart as LineChartIcon, 
  BarChart3, 
  RotateCcw, 
  Sparkles, 
  AlertCircle,
  Tag
} from 'lucide-react';
import ChartContainer from './ChartContainer';

// Curated vibrant color palette for multi-series SKU tracking
const SKU_COLORS = [
  '#002f6c', // Primary Navy
  '#2563eb', // Royal Blue
  '#059669', // Emerald Green
  '#d97706', // Amber Gold
  '#7c3aed', // Purple Violet
  '#e11d48', // Crimson Red
  '#0891b2', // Teal Cyan
  '#c026d3', // Fuchsia Pink
  '#ea580c', // Tangerine Orange
  '#4f46e5'  // Indigo
];

export default function SkuAvailabilityTracker({ productListings = [] }) {
  const [viewMode, setViewMode] = useState('timeline'); // 'timeline' | 'retailer'
  const [searchTerm, setSearchTerm] = useState('');
  const [brandFilter, setBrandFilter] = useState('all');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Helper date formatter (YYYY-MM-DD)
  const formatDateKey = (dateVal) => {
    if (!dateVal) return '';
    if (typeof dateVal === 'string') {
      return dateVal.includes('T') ? dateVal.split('T')[0] : dateVal.trim();
    }
    if (dateVal instanceof Date) {
      return dateVal.toISOString().split('T')[0];
    }
    return String(dateVal).trim();
  };

  // Helper for human-friendly date header
  const formatDateLabel = (dateStr) => {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        if (!isNaN(d.getTime())) {
          return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
        }
      }
    } catch {}
    return dateStr;
  };

  // 1. Extract all distinct SKUs with metadata from productListings
  const allSkus = useMemo(() => {
    const skuMap = {};

    productListings.forEach(p => {
      const rawTitle = (p.sku || p.title)?.trim();
      if (!rawTitle) return;

      const skuKey = rawTitle.toLowerCase();
      const isAvailable = p.availability === true || p.availability === 'true' || (typeof p.availability === 'string' && p.availability.trim().toLowerCase() === 'yes');

      if (!skuMap[skuKey]) {
        skuMap[skuKey] = {
          key: skuKey,
          title: rawTitle,
          brand: p.brand?.trim() || 'Unknown',
          category: p.category?.trim() || 'General',
          totalCount: 0,
          availableCount: 0
        };
      }

      skuMap[skuKey].totalCount++;
      if (isAvailable) {
        skuMap[skuKey].availableCount++;
      }
    });

    return Object.values(skuMap).map(item => ({
      ...item,
      availabilityRate: item.totalCount > 0 ? parseFloat(((item.availableCount / item.totalCount) * 100).toFixed(1)) : 0.0
    })).sort((a, b) => b.totalCount - a.totalCount || b.availabilityRate - a.availabilityRate);
  }, [productListings]);

  // Distinct brands available among current SKUs
  const distinctSkuBrands = useMemo(() => {
    const brandsSet = new Set();
    allSkus.forEach(s => {
      if (s.brand && s.brand !== 'Unknown') brandsSet.add(s.brand);
    });
    return Array.from(brandsSet).sort();
  }, [allSkus]);

  // 2. Tracked SKUs state with localStorage persistence
  const [selectedSkus, setSelectedSkus] = useState(() => {
    try {
      const saved = localStorage.getItem('dashboard_tracked_skus_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [];
  });

  // Default selection when dataset loads if no valid selection exists
  useEffect(() => {
    if (allSkus.length > 0 && selectedSkus.length === 0) {
      // Pick top 4 SKUs by default
      const defaultPicks = allSkus.slice(0, 4).map(s => s.key);
      setSelectedSkus(defaultPicks);
    }
  }, [allSkus, selectedSkus.length]);

  // Persist selections to localStorage
  useEffect(() => {
    if (selectedSkus.length > 0) {
      try {
        localStorage.setItem('dashboard_tracked_skus_v1', JSON.stringify(selectedSkus));
      } catch {}
    }
  }, [selectedSkus]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtered list of SKUs inside the selector dropdown
  const filteredDropdownSkus = useMemo(() => {
    return allSkus.filter(s => {
      const matchBrand = brandFilter === 'all' || s.brand.toLowerCase() === brandFilter.toLowerCase();
      const matchSearch = !searchTerm.trim() || 
        s.title.toLowerCase().includes(searchTerm.trim().toLowerCase()) ||
        s.brand.toLowerCase().includes(searchTerm.trim().toLowerCase());
      return matchBrand && matchSearch;
    });
  }, [allSkus, brandFilter, searchTerm]);

  // Selected SKU objects
  const selectedSkuObjects = useMemo(() => {
    const map = new Map(allSkus.map(s => [s.key, s]));
    return selectedSkus
      .map(key => map.get(key))
      .filter(Boolean);
  }, [allSkus, selectedSkus]);

  // Handlers for SKU selection
  const toggleSku = (key) => {
    setSelectedSkus(prev => 
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const removeSku = (key) => {
    setSelectedSkus(prev => prev.filter(k => k !== key));
  };

  const handleSelectTopN = (n) => {
    const topKeys = allSkus.slice(0, n).map(s => s.key);
    setSelectedSkus(topKeys);
  };

  const handleSelectAllFiltered = () => {
    const filteredKeys = filteredDropdownSkus.map(s => s.key);
    setSelectedSkus(prev => Array.from(new Set([...prev, ...filteredKeys])));
  };

  const handleClearAll = () => {
    setSelectedSkus([]);
  };

  // 3. Extract Timeline Dates
  const allTimelineDates = useMemo(() => {
    const datesSet = new Set();
    productListings.forEach(p => {
      const d = formatDateKey(p.scrape_date);
      if (d) datesSet.add(d);
    });
    return Array.from(datesSet).sort();
  }, [productListings]);

  // 4. Extract Retailers
  const allRetailers = useMemo(() => {
    const retailersSet = new Set();
    productListings.forEach(p => {
      const r = p.source_chain?.trim();
      if (r && !['others', 'other', 'unknown', 'n/a'].includes(r.toLowerCase())) {
        retailersSet.add(r);
      }
    });
    return Array.from(retailersSet).sort();
  }, [productListings]);

  // 5. Compute Timeline Chart Data
  const timelineChartOption = useMemo(() => {
    if (selectedSkuObjects.length === 0 || allTimelineDates.length === 0) return null;

    // Build lookup table: skuKey -> { dateKey: { total, available } }
    const skuDateData = {};
    selectedSkuObjects.forEach(s => {
      skuDateData[s.key] = {};
      allTimelineDates.forEach(d => {
        skuDateData[s.key][d] = { total: 0, available: 0 };
      });
    });

    productListings.forEach(p => {
      const title = (p.sku || p.title)?.trim().toLowerCase();
      const dateKey = formatDateKey(p.scrape_date);
      if (!title || !dateKey || !skuDateData[title] || !skuDateData[title][dateKey]) return;

      skuDateData[title][dateKey].total++;
      const isAvailable = p.availability === true || p.availability === 'true' || (typeof p.availability === 'string' && p.availability.trim().toLowerCase() === 'yes');
      if (isAvailable) {
        skuDateData[title][dateKey].available++;
      }
    });

    const series = selectedSkuObjects.map((sku, index) => {
      const color = SKU_COLORS[index % SKU_COLORS.length];
      const data = allTimelineDates.map(d => {
        const stats = skuDateData[sku.key]?.[d];
        if (!stats || stats.total === 0) return null;
        return parseFloat(((stats.available / stats.total) * 100).toFixed(1));
      });

      return {
        name: sku.title.length > 32 ? sku.title.slice(0, 30) + '…' : sku.title,
        fullTitle: sku.title,
        brand: sku.brand,
        type: 'line',
        smooth: true,
        showSymbol: true,
        symbol: 'circle',
        symbolSize: 7,
        data,
        connectNulls: true,
        itemStyle: { color },
        lineStyle: {
          width: 3,
          color,
          shadowColor: `${color}33`,
          shadowBlur: 6,
          shadowOffsetY: 2
        },
        emphasis: {
          scale: true,
          lineStyle: { width: 4 }
        }
      };
    });

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'line',
          lineStyle: { color: '#94a3b8', width: 1, type: 'dashed' }
        },
        backgroundColor: 'rgba(255, 255, 255, 0.96)',
        borderColor: '#cbd5e1',
        borderWidth: 1,
        textStyle: { color: '#1e293b', fontSize: 12 },
        padding: [12, 16],
        extraCssText: 'border-radius: 10px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1); max-width: 420px;',
        formatter: (params) => {
          if (!params || params.length === 0) return '';
          const dateStr = params[0].axisValue;
          let html = `
            <div style="font-weight: 700; color: #002f6c; font-size: 13px; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">
              📅 Date: ${dateStr}
            </div>
          `;
          params.forEach(p => {
            const val = p.value !== undefined && p.value !== null ? `${p.value}%` : '<span style="color: #94a3b8;">No Crawl</span>';
            const color = p.color;
            const itemSeries = series[p.seriesIndex];
            html += `
              <div style="display: flex; align-items: center; justify-content: space-between; gap: 14px; margin-bottom: 5px;">
                <div style="display: flex; align-items: center; gap: 6px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 260px;">
                  <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background-color: ${color}; flex-shrink: 0;"></span>
                  <span style="font-size: 11px; color: #334155;" title="${itemSeries?.fullTitle || p.seriesName}">
                    <strong style="color: #0f172a;">[${itemSeries?.brand || 'SKU'}]</strong> ${p.seriesName}
                  </span>
                </div>
                <span style="font-weight: 700; color: ${p.value >= 90 ? '#059669' : (p.value >= 70 ? '#d97706' : '#e11d48')}; font-size: 12px;">
                  ${val}
                </span>
              </div>
            `;
          });
          return html;
        }
      },
      legend: {
        type: 'scroll',
        top: '2%',
        left: 'center',
        textStyle: { color: '#475569', fontSize: 11, fontWeight: 500 },
        pageIconColor: '#002f6c',
        pageTextStyle: { color: '#64748b' }
      },
      grid: {
        left: '3%',
        right: '4%',
        top: '16%',
        bottom: allTimelineDates.length > 8 ? '16%' : '10%',
        containLabel: true
      },
      dataZoom: [
        {
          type: 'slider',
          show: allTimelineDates.length > 8,
          startValue: 0,
          endValue: Math.min(10, allTimelineDates.length - 1),
          height: 12,
          bottom: '2%',
          borderColor: 'transparent',
          backgroundColor: '#f1f5f9',
          fillerColor: '#94a3b8',
          borderRadius: 6,
          showDetail: false
        }
      ],
      xAxis: {
        type: 'category',
        data: allTimelineDates.map(d => formatDateLabel(d)),
        axisLabel: { color: '#64748b', fontSize: 10, fontWeight: 600 },
        axisLine: { lineStyle: { color: '#e2e8f0' } },
        axisTick: { show: false }
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: 100,
        axisLabel: {
          color: '#64748b',
          fontSize: 10,
          formatter: '{value}%'
        },
        splitLine: { lineStyle: { color: '#f1f5f9' } }
      },
      series
    };
  }, [selectedSkuObjects, allTimelineDates, productListings]);

  // 6. Compute Retailer Breakdown Chart Data
  const retailerChartOption = useMemo(() => {
    if (selectedSkuObjects.length === 0 || allRetailers.length === 0) return null;

    // Build lookup table: skuKey -> { retailer: { total, available } }
    const skuRetailerData = {};
    selectedSkuObjects.forEach(s => {
      skuRetailerData[s.key] = {};
      allRetailers.forEach(r => {
        skuRetailerData[s.key][r] = { total: 0, available: 0 };
      });
    });

    productListings.forEach(p => {
      const title = (p.sku || p.title)?.trim().toLowerCase();
      const retailer = p.source_chain?.trim();
      if (!title || !retailer || !skuRetailerData[title] || !skuRetailerData[title][retailer]) return;

      skuRetailerData[title][retailer].total++;
      const isAvailable = p.availability === true || p.availability === 'true' || (typeof p.availability === 'string' && p.availability.trim().toLowerCase() === 'yes');
      if (isAvailable) {
        skuRetailerData[title][retailer].available++;
      }
    });

    const series = selectedSkuObjects.map((sku, index) => {
      const color = SKU_COLORS[index % SKU_COLORS.length];
      const data = allRetailers.map(r => {
        const stats = skuRetailerData[sku.key]?.[r];
        if (!stats || stats.total === 0) return 0;
        return parseFloat(((stats.available / stats.total) * 100).toFixed(1));
      });

      return {
        name: sku.title.length > 28 ? sku.title.slice(0, 26) + '…' : sku.title,
        fullTitle: sku.title,
        brand: sku.brand,
        type: 'bar',
        barMaxWidth: 28,
        data,
        itemStyle: {
          color,
          borderRadius: [4, 4, 0, 0]
        }
      };
    });

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: 'rgba(255, 255, 255, 0.96)',
        borderColor: '#cbd5e1',
        borderWidth: 1,
        textStyle: { color: '#1e293b', fontSize: 12 },
        padding: [12, 16],
        extraCssText: 'border-radius: 10px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1); max-width: 420px;',
        formatter: (params) => {
          if (!params || params.length === 0) return '';
          const retailerName = params[0].axisValue;
          let html = `
            <div style="font-weight: 700; color: #002f6c; font-size: 13px; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">
              🏪 Retailer: ${retailerName}
            </div>
          `;
          params.forEach(p => {
            const val = `${p.value}%`;
            const color = p.color;
            const itemSeries = series[p.seriesIndex];
            html += `
              <div style="display: flex; align-items: center; justify-content: space-between; gap: 14px; margin-bottom: 5px;">
                <div style="display: flex; align-items: center; gap: 6px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 260px;">
                  <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background-color: ${color}; flex-shrink: 0;"></span>
                  <span style="font-size: 11px; color: #334155;" title="${itemSeries?.fullTitle || p.seriesName}">
                    <strong style="color: #0f172a;">[${itemSeries?.brand || 'SKU'}]</strong> ${p.seriesName}
                  </span>
                </div>
                <span style="font-weight: 700; color: ${p.value >= 90 ? '#059669' : (p.value >= 70 ? '#d97706' : '#e11d48')}; font-size: 12px;">
                  ${val}
                </span>
              </div>
            `;
          });
          return html;
        }
      },
      legend: {
        type: 'scroll',
        top: '2%',
        left: 'center',
        textStyle: { color: '#475569', fontSize: 11, fontWeight: 500 },
        pageIconColor: '#002f6c',
        pageTextStyle: { color: '#64748b' }
      },
      grid: {
        left: '3%',
        right: '4%',
        top: '16%',
        bottom: '10%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: allRetailers,
        axisLabel: { color: '#475569', fontSize: 11, fontWeight: 600 },
        axisLine: { lineStyle: { color: '#e2e8f0' } },
        axisTick: { show: false }
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: 100,
        axisLabel: {
          color: '#64748b',
          fontSize: 10,
          formatter: '{value}%'
        },
        splitLine: { lineStyle: { color: '#f1f5f9' } }
      },
      series
    };
  }, [selectedSkuObjects, allRetailers, productListings]);

  return (
    <div className="chart-card glass fade-in" style={{ marginBottom: '28px', padding: '24px' }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h3 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Tracked SKUs Availability Track
            </h3>
            <span style={{ 
              background: '#e0f2fe', 
              color: '#0369a1', 
              fontSize: '0.75rem', 
              fontWeight: 700, 
              padding: '2px 9px', 
              borderRadius: '99px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <Sparkles size={11} /> {selectedSkus.length} Tracked {selectedSkus.length === 1 ? 'SKU' : 'SKUs'}
            </span>
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Monitor and compare stock availability trajectories for specific target SKUs over time or across retailers.
          </div>
        </div>

        {/* View Mode Switcher Toggle */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          background: '#f1f5f9', 
          padding: '3px', 
          borderRadius: '8px', 
          border: '1px solid #e2e8f0' 
        }}>
          <button
            type="button"
            onClick={() => setViewMode('timeline')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '0.78rem',
              fontWeight: viewMode === 'timeline' ? 700 : 500,
              border: 'none',
              cursor: 'pointer',
              background: viewMode === 'timeline' ? '#ffffff' : 'transparent',
              color: viewMode === 'timeline' ? '#002f6c' : '#64748b',
              boxShadow: viewMode === 'timeline' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <LineChartIcon size={14} /> Date Timeline
          </button>
          <button
            type="button"
            onClick={() => setViewMode('retailer')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '0.78rem',
              fontWeight: viewMode === 'retailer' ? 700 : 500,
              border: 'none',
              cursor: 'pointer',
              background: viewMode === 'retailer' ? '#ffffff' : 'transparent',
              color: viewMode === 'retailer' ? '#002f6c' : '#64748b',
              boxShadow: viewMode === 'retailer' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <BarChart3 size={14} /> Retailer Comparison
          </button>
        </div>
      </div>

      {/* Control Bar: SKU Selector & Quick Presets */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        flexWrap: 'wrap', 
        gap: '12px',
        padding: '12px 16px',
        background: '#f8fafc',
        borderRadius: '10px',
        border: '1px solid #e2e8f0',
        marginBottom: '16px'
      }}>
        {/* Left: Interactive Dropdown Trigger */}
        <div style={{ position: 'relative' }} ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsDropdownOpen(prev => !prev)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '7px 14px',
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              fontSize: '0.82rem',
              fontWeight: 600,
              color: '#1e293b',
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
            }}
          >
            <Layers size={14} color="#002f6c" />
            <span>Select SKUs to Track ({selectedSkus.length})</span>
            <ChevronDown size={14} color="#64748b" style={{ transform: isDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} />
          </button>

          {/* Searchable Multi-Select Dropdown Popover */}
          {isDropdownOpen && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              left: 0,
              width: '380px',
              maxHeight: '380px',
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '12px',
              boxShadow: '0 12px 28px -4px rgba(0, 47, 108, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.08)',
              zIndex: 100,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}>
              {/* Search & Brand Filter Header */}
              <div style={{ padding: '10px 12px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="Search SKU or title..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '6px 10px 6px 30px',
                      fontSize: '0.8rem',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      outline: 'none'
                    }}
                    autoFocus
                  />
                  <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm('')}
                      style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', color: '#94a3b8' }}
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                {distinctSkuBrands.length > 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Tag size={12} color="#64748b" />
                    <select
                      value={brandFilter}
                      onChange={(e) => setBrandFilter(e.target.value)}
                      style={{
                        fontSize: '0.75rem',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        border: '1px solid #cbd5e1',
                        background: '#ffffff',
                        color: '#334155',
                        flexGrow: 1
                      }}
                    >
                      <option value="all">All Brands ({distinctSkuBrands.length})</option>
                      {distinctSkuBrands.map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* SKU List with Checkboxes */}
              <div style={{ overflowY: 'auto', flexGrow: 1, padding: '6px 0', maxHeight: '240px' }}>
                {filteredDropdownSkus.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem' }}>
                    No matching SKUs found
                  </div>
                ) : (
                  filteredDropdownSkus.map((sku) => {
                    const isSelected = selectedSkus.includes(sku.key);
                    return (
                      <div
                        key={sku.key}
                        onClick={() => toggleSku(sku.key)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '7px 14px',
                          cursor: 'pointer',
                          background: isSelected ? 'rgba(0, 47, 108, 0.04)' : 'transparent',
                          transition: 'background 0.1s ease',
                          gap: '10px'
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) e.currentTarget.style.background = '#f8fafc';
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', flexGrow: 1 }}>
                          <div style={{
                            width: '16px',
                            height: '16px',
                            borderRadius: '4px',
                            border: isSelected ? '1px solid #002f6c' : '1px solid #cbd5e1',
                            background: isSelected ? '#002f6c' : '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            {isSelected && <Check size={11} color="#ffffff" strokeWidth={3} />}
                          </div>
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            <span style={{ fontSize: '0.78rem', color: '#1e293b', fontWeight: isSelected ? 600 : 400 }}>
                              {sku.title}
                            </span>
                            <div style={{ fontSize: '0.7rem', color: '#64748b', display: 'flex', gap: '6px', alignItems: 'center' }}>
                              <span style={{ color: '#002f6c', fontWeight: 600 }}>{sku.brand}</span>
                              <span>•</span>
                              <span>{sku.totalCount} listings</span>
                              <span>•</span>
                              <span style={{ color: sku.availabilityRate >= 90 ? '#059669' : '#d97706', fontWeight: 600 }}>{sku.availabilityRate}% Stock</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Bottom Actions inside Dropdown */}
              <div style={{
                padding: '8px 12px',
                borderTop: '1px solid #f1f5f9',
                background: '#f8fafc',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <button
                  type="button"
                  onClick={handleSelectAllFiltered}
                  style={{
                    border: 'none',
                    background: 'none',
                    color: '#002f6c',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Select All Filtered
                </button>
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(false)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    background: '#002f6c',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right: Quick Action Presets */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, marginRight: '2px' }}>Presets:</span>
          <button
            type="button"
            onClick={() => handleSelectTopN(5)}
            style={{
              padding: '4px 9px',
              borderRadius: '6px',
              border: '1px solid #e2e8f0',
              background: '#ffffff',
              color: '#334155',
              fontSize: '0.74rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Top 5 SKUs
          </button>
          <button
            type="button"
            onClick={() => handleSelectTopN(10)}
            style={{
              padding: '4px 9px',
              borderRadius: '6px',
              border: '1px solid #e2e8f0',
              background: '#ffffff',
              color: '#334155',
              fontSize: '0.74rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Top 10 SKUs
          </button>
          {selectedSkus.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 9px',
                borderRadius: '6px',
                border: '1px solid #fecdd3',
                background: '#fff1f2',
                color: '#e11d48',
                fontSize: '0.74rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <RotateCcw size={11} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Selected SKU Chips Strip */}
      {selectedSkuObjects.length > 0 && (
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: '6px', 
          marginBottom: '20px', 
          maxHeight: '90px', 
          overflowY: 'auto',
          padding: '4px 2px'
        }}>
          {selectedSkuObjects.map((sku, index) => {
            const color = SKU_COLORS[index % SKU_COLORS.length];
            return (
              <span
                key={sku.key}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '3px 8px 3px 10px',
                  borderRadius: '20px',
                  background: `${color}10`,
                  border: `1px solid ${color}35`,
                  color: '#1e293b',
                  fontSize: '0.74rem',
                  fontWeight: 500
                }}
              >
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: color, flexShrink: 0 }}></span>
                <strong style={{ color: color }}>[{sku.brand}]</strong>
                <span style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={sku.title}>
                  {sku.title}
                </span>
                <button
                  type="button"
                  onClick={() => removeSku(sku.key)}
                  style={{
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    color: '#64748b'
                  }}
                  title="Remove from tracked list"
                >
                  <X size={12} />
                </button>
              </span>
            );
          })}
        </div>
      )}

      {/* Main Chart Canvas or Empty State */}
      <div className="chart-wrapper" style={{ minHeight: '380px', position: 'relative' }}>
        {selectedSkus.length === 0 ? (
          <div style={{
            minHeight: '380px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f8fafc',
            borderRadius: '12px',
            border: '1px dashed #cbd5e1',
            padding: '40px 20px',
            textAlign: 'center'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: '#e0f2fe',
              color: '#0284c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '12px'
            }}>
              <AlertCircle size={24} />
            </div>
            <h4 style={{ margin: '0 0 6px 0', fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>
              No SKUs Selected for Tracking
            </h4>
            <p style={{ margin: '0 0 16px 0', fontSize: '0.82rem', color: '#64748b', maxWidth: '340px' }}>
              Choose target SKUs from the selector above or click below to automatically track the top 5 SKUs.
            </p>
            <button
              type="button"
              onClick={() => handleSelectTopN(5)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '8px',
                background: '#002f6c',
                color: '#ffffff',
                border: 'none',
                fontWeight: 600,
                fontSize: '0.82rem',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(0, 47, 108, 0.2)'
              }}
            >
              <Sparkles size={14} /> Track Top 5 SKUs
            </button>
          </div>
        ) : (
          viewMode === 'timeline' ? (
            timelineChartOption && <ChartContainer options={timelineChartOption} style={{ minHeight: '380px' }} />
          ) : (
            retailerChartOption && <ChartContainer options={retailerChartOption} style={{ minHeight: '380px' }} />
          )
        )}
      </div>
    </div>
  );
}
