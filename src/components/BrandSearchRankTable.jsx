import React, { useState, useMemo } from 'react';
import { Search, ArrowUpDown, ChevronLeft, ChevronRight, Calendar, Download, X, RotateCcw, LineChart as LineChartIcon, Table as TableIcon } from 'lucide-react';
import ChartContainer from './ChartContainer';

export default function BrandSearchRankTable({ productListings = [] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'periodAvg', direction: 'asc' }); // Default asc (Rank #1 first)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [metricMode, setMetricMode] = useState('best'); // 'best' (Min Rank e.g. 1) or 'avg' (Average Rank)
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'chart' | 'both'
  
  // Date Slicers State
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Helper to extract YYYY-MM-DD date key
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

  // Format Date in DD-MM-YYYY format (e.g. 13-07-2026) matching screenshot
  const formatDateDDMMYYYY = (dateStr) => {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const [year, month, day] = parts;
        return `${day.padStart(2, '0')}-${month.padStart(2, '0')}-${year}`;
      }
    } catch {}
    return dateStr;
  };

  // 1. Extract all available unique dates from the dataset
  const allDates = useMemo(() => {
    const datesSet = new Set();
    productListings.forEach(p => {
      const dateKey = formatDateKey(p.scrape_date);
      if (dateKey) datesSet.add(dateKey);
    });
    return Array.from(datesSet).sort();
  }, [productListings]);

  // 2. Compute Sliced Dates (filtered by start date & end date slicers)
  const slicedDates = useMemo(() => {
    return allDates.filter(d => {
      if (startDate && d < startDate) return false;
      if (endDate && d > endDate) return false;
      return true;
    });
  }, [allDates, startDate, endDate]);

  const isSliced = Boolean(startDate || endDate);

  // 3a. Aggregate search ranks by brand across dates once (depends only on productListings)
  const brandMap = useMemo(() => {
    const map = {};
    const ignoredBrands = new Set(['others', 'other', 'unknown', 'n/a', 'na', 'none', 'null', 'undefined']);

    productListings.forEach(p => {
      const rawBrand = p.brand?.trim();
      const dateKey = formatDateKey(p.scrape_date);
      const rawRank = p.rank_num !== undefined && p.rank_num !== null ? parseFloat(p.rank_num) : (p.rank !== undefined ? parseFloat(p.rank) : null);

      if (!rawBrand || !dateKey || rawRank === null || isNaN(rawRank) || rawRank <= 0) return;

      const brandKey = rawBrand.toLowerCase();
      if (ignoredBrands.has(brandKey)) return;

      if (!map[brandKey]) {
        map[brandKey] = {
          brandKey,
          brandName: rawBrand,
          dates: {},
          allRanks: []
        };
      }

      if (!map[brandKey].dates[dateKey]) {
        map[brandKey].dates[dateKey] = [];
      }

      map[brandKey].dates[dateKey].push(rawRank);
      map[brandKey].allRanks.push(rawRank);
    });

    return map;
  }, [productListings]);

  // 3b. Compute sliced period metrics on the small pre-aggregated brandMap (O(brands * dates) - sub-millisecond)
  const brandRows = useMemo(() => {
    const rows = Object.values(brandMap).map(brand => {
      const dateRanks = {};
      
      allDates.forEach(d => {
        const ranks = brand.dates[d];
        if (ranks && ranks.length > 0) {
          const minRank = Math.min(...ranks);
          const avgRank = parseFloat((ranks.reduce((a, b) => a + b, 0) / ranks.length).toFixed(1));
          dateRanks[d] = {
            best: minRank,
            avg: avgRank,
            count: ranks.length,
            ranks
          };
        } else {
          dateRanks[d] = null;
        }
      });

      // Calculate period metrics specifically for sliced dates
      const periodRanks = [];
      slicedDates.forEach(d => {
        const item = dateRanks[d];
        if (item && item.ranks) {
          periodRanks.push(...item.ranks);
        }
      });

      const periodBest = periodRanks.length > 0 ? Math.min(...periodRanks) : null;
      const periodAvg = periodRanks.length > 0 
        ? parseFloat((periodRanks.reduce((a, b) => a + b, 0) / periodRanks.length).toFixed(1)) 
        : null;

      const overallBest = brand.allRanks.length > 0 ? Math.min(...brand.allRanks) : null;
      const overallAvg = brand.allRanks.length > 0 
        ? parseFloat((brand.allRanks.reduce((a, b) => a + b, 0) / brand.allRanks.length).toFixed(1)) 
        : null;

      return {
        brandKey: brand.brandKey,
        brandName: brand.brandName,
        dateRanks,
        periodBest,
        periodAvg,
        overallBest,
        overallAvg,
        totalSkusTracked: periodRanks.length
      };
    });

    return rows;
  }, [brandMap, allDates, slicedDates]);

  // Quick Preset Handlers
  const handleResetDates = () => {
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  const handleLastNDates = (n) => {
    if (allDates.length === 0) return;
    const startIndex = Math.max(0, allDates.length - n);
    setStartDate(allDates[startIndex]);
    setEndDate(allDates[allDates.length - 1]);
    setCurrentPage(1);
  };

  // Handle Column Sorting
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Filter & Sort rows
  const processedRows = useMemo(() => {
    let result = [...brandRows];

    // Search filter
    if (searchTerm.trim()) {
      const lower = searchTerm.trim().toLowerCase();
      result = result.filter(r => r.brandName.toLowerCase().includes(lower));
    }

    // Sort
    if (sortConfig.key) {
      const { key, direction } = sortConfig;
      result.sort((a, b) => {
        let valA, valB;

        if (key === 'brandName') {
          valA = a.brandName.toLowerCase();
          valB = b.brandName.toLowerCase();
          if (valA < valB) return direction === 'asc' ? -1 : 1;
          if (valA > valB) return direction === 'asc' ? 1 : -1;
          return 0;
        } else if (key === 'periodAvg') {
          valA = a.periodAvg !== null ? a.periodAvg : 99999;
          valB = b.periodAvg !== null ? b.periodAvg : 99999;
        } else if (key === 'periodBest') {
          valA = a.periodBest !== null ? a.periodBest : 99999;
          valB = b.periodBest !== null ? b.periodBest : 99999;
        } else {
          // Specific date key
          const cellA = a.dateRanks[key];
          const cellB = b.dateRanks[key];
          valA = cellA ? (metricMode === 'best' ? cellA.best : cellA.avg) : 99999;
          valB = cellB ? (metricMode === 'best' ? cellB.best : cellB.avg) : 99999;
        }

        if (valA < valB) return direction === 'asc' ? -1 : 1;
        if (valA > valB) return direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [brandRows, searchTerm, sortConfig, metricMode]);

  // Pagination
  const totalPages = Math.ceil(processedRows.length / (pageSize === 'all' ? (processedRows.length || 1) : pageSize));
  const paginatedRows = useMemo(() => {
    if (pageSize === 'all') return processedRows;
    const start = (currentPage - 1) * pageSize;
    return processedRows.slice(start, start + pageSize);
  }, [processedRows, currentPage, pageSize]);

  // Export to CSV
  const handleExportCSV = () => {
    if (brandRows.length === 0 || slicedDates.length === 0) return;
    const summaryHeader = metricMode === 'best' ? 'Best Search Rank' : 'Avg Search Rank';
    const headers = ['Brand', ...slicedDates.map(d => formatDateDDMMYYYY(d)), summaryHeader];
    const csvLines = [headers.join(',')];

    processedRows.forEach(row => {
      const line = [
        `"${row.brandName.replace(/"/g, '""')}"`,
        ...slicedDates.map(d => {
          const item = row.dateRanks[d];
          if (!item) return '-';
          return metricMode === 'best' ? item.best : item.avg;
        }),
        metricMode === 'best' ? (row.periodBest ?? '-') : (row.periodAvg ?? '-')
      ];
      csvLines.push(line.join(','));
    });

    const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const dateRangeSuffix = isSliced ? `_${startDate || 'start'}_to_${endDate || 'end'}` : '';
    link.setAttribute('download', `search_rank_by_brand${dateRangeSuffix}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Trend Chart Option (ECharts)
  const trendChartOption = useMemo(() => {
    if (slicedDates.length === 0 || processedRows.length === 0) return null;

    const topBrands = processedRows.slice(0, 8); // Top 8 brands for clarity
    const colors = ['#002f6c', '#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

    const series = topBrands.map((brand, idx) => {
      const data = slicedDates.map(dateStr => {
        const item = brand.dateRanks[dateStr];
        if (!item) return null;
        return metricMode === 'best' ? item.best : item.avg;
      });

      return {
        name: brand.brandName,
        type: 'line',
        smooth: true,
        connectNulls: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { width: 2.5, color: colors[idx % colors.length] },
        itemStyle: { color: colors[idx % colors.length] },
        data
      };
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
          if (!params || params.length === 0) return '';
          let html = `<div style="font-weight: 700; color: #002f6c; margin-bottom: 6px;">Date: ${formatDateDDMMYYYY(params[0].name)}</div>`;
          params
            .filter(p => p.value !== null && p.value !== undefined)
            .sort((a, b) => a.value - b.value)
            .forEach(p => {
              html += `
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 14px; font-size: 11px; margin-bottom: 3px;">
                  <span style="display:flex; align-items:center; gap: 6px;">
                    <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:${p.color};"></span>
                    <span style="color:#334155; font-weight:600;">${p.seriesName}</span>
                  </span>
                  <span style="font-weight: 700; color: #002f6c; background:#f1f5f9; padding: 1px 6px; border-radius: 4px;">#${p.value}</span>
                </div>
              `;
            });
          return html;
        }
      },
      legend: {
        data: topBrands.map(b => b.brandName),
        top: '2%',
        textStyle: { color: '#475569', fontSize: 11, fontWeight: 500 },
        icon: 'circle'
      },
      grid: {
        left: '4%',
        right: '4%',
        top: '16%',
        bottom: '8%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: slicedDates.map(d => formatDateDDMMYYYY(d)),
        axisLabel: { color: '#64748b', fontSize: 10, rotate: slicedDates.length > 8 ? 25 : 0 },
        axisLine: { lineStyle: { color: '#e2e8f0' } }
      },
      yAxis: {
        type: 'value',
        inverse: true, // Invert so Rank #1 is at the top!
        min: 1,
        axisLabel: {
          formatter: '#{value}',
          color: '#64748b',
          fontSize: 10
        },
        splitLine: { lineStyle: { color: '#f1f5f9' } }
      },
      series
    };
  }, [slicedDates, processedRows, metricMode]);

  return (
    <div className="chart-card glass" style={{ marginTop: '32px', padding: '24px', position: 'relative' }}>
      
      {/* Title & Controls Bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
        <div>
          <h2 style={{ 
            fontSize: '1.25rem', 
            fontWeight: 800, 
            fontFamily: 'var(--font-heading)', 
            color: '#002f6c', 
            margin: 0
          }}>
            Search Rank by Brand
          </h2>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Day-wise search result ranking matrix for brands (Position #1 is best)
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          
          {/* Best vs Avg Rank Metric Toggle */}
          <div style={{ 
            display: 'flex', 
            background: '#f1f5f9', 
            padding: '3px', 
            borderRadius: '8px',
            border: '1px solid #e2e8f0'
          }}>
            <button
              type="button"
              onClick={() => setMetricMode('best')}
              style={{
                padding: '4px 10px',
                fontSize: '0.75rem',
                fontWeight: 600,
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                background: metricMode === 'best' ? '#002f6c' : 'transparent',
                color: metricMode === 'best' ? '#ffffff' : '#64748b',
                boxShadow: metricMode === 'best' ? '0 1px 3px rgba(0,47,108,0.2)' : 'none'
              }}
              title="Display best (topmost) rank on that date"
            >
              Top/Best Rank
            </button>
            <button
              type="button"
              onClick={() => setMetricMode('avg')}
              style={{
                padding: '4px 10px',
                fontSize: '0.75rem',
                fontWeight: 600,
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                background: metricMode === 'avg' ? '#002f6c' : 'transparent',
                color: metricMode === 'avg' ? '#ffffff' : '#64748b',
                boxShadow: metricMode === 'avg' ? '0 1px 3px rgba(0,47,108,0.2)' : 'none'
              }}
              title="Display average rank on that date"
            >
              Average Rank
            </button>
          </div>

          {/* View Mode Toggle (Table / Chart) */}
          <div style={{ 
            display: 'flex', 
            background: '#f1f5f9', 
            padding: '3px', 
            borderRadius: '8px',
            border: '1px solid #e2e8f0'
          }}>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              style={{
                padding: '4px 8px',
                fontSize: '0.75rem',
                fontWeight: 600,
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                background: viewMode === 'table' ? '#ffffff' : 'transparent',
                color: viewMode === 'table' ? '#002f6c' : '#64748b',
                boxShadow: viewMode === 'table' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
              }}
              title="Table Matrix View"
            >
              <TableIcon size={13} /> Table
            </button>
            <button
              type="button"
              onClick={() => setViewMode('chart')}
              style={{
                padding: '4px 8px',
                fontSize: '0.75rem',
                fontWeight: 600,
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                background: viewMode === 'chart' ? '#ffffff' : 'transparent',
                color: viewMode === 'chart' ? '#002f6c' : '#64748b',
                boxShadow: viewMode === 'chart' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
              }}
              title="Trend Chart View"
            >
              <LineChartIcon size={13} /> Trend
            </button>
          </div>

          {/* Export CSV Button */}
          <button 
            type="button"
            className="btn" 
            style={{ 
              padding: '6px 12px', 
              fontSize: '0.75rem', 
              height: '32px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              borderRadius: '8px'
            }}
            onClick={handleExportCSV}
            title="Download CSV report"
          >
            <Download size={13} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Date Slicers & Quick Filter Toolbar */}
      <div style={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        alignItems: 'center', 
        gap: '12px', 
        padding: '12px 16px', 
        background: 'linear-gradient(135deg, rgba(248, 250, 252, 0.9), rgba(241, 245, 249, 0.6))', 
        borderRadius: '10px', 
        marginBottom: '20px',
        border: '1px solid #e2e8f0'
      }}>
        {/* Brand Search Input */}
        <div style={{ position: 'relative', width: '220px' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input 
            type="text" 
            placeholder="Search brands..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            style={{ 
              width: '100%', 
              padding: '6px 10px 6px 30px', 
              fontSize: '0.8rem', 
              borderRadius: '8px', 
              border: '1px solid #cbd5e1', 
              outline: 'none',
              background: '#ffffff'
            }}
          />
          {searchTerm && (
            <X 
              size={12} 
              style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', cursor: 'pointer' }} 
              onClick={() => setSearchTerm('')}
            />
          )}
        </div>

        {/* Date Range Inputs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>Date Range:</span>
          <input 
            type="date" 
            value={startDate} 
            onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
            style={{ padding: '5px 8px', fontSize: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff' }}
          />
          <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>→</span>
          <input 
            type="date" 
            value={endDate} 
            onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
            style={{ padding: '5px 8px', fontSize: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff' }}
          />
        </div>

        {/* Presets */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {allDates.length >= 5 && (
            <button 
              type="button" 
              className="slicer-preset-btn"
              onClick={() => handleLastNDates(5)}
              style={{ padding: '4px 8px', fontSize: '0.72rem' }}
            >
              Last 5 Days
            </button>
          )}
          {allDates.length >= 7 && (
            <button 
              type="button" 
              className="slicer-preset-btn"
              onClick={() => handleLastNDates(7)}
              style={{ padding: '4px 8px', fontSize: '0.72rem' }}
            >
              Last 7 Days
            </button>
          )}
          {isSliced && (
            <button 
              type="button" 
              className="slicer-preset-btn"
              onClick={handleResetDates}
              style={{ padding: '4px 8px', fontSize: '0.72rem', color: '#be123c', borderColor: '#fecdd3', background: '#fff1f2', display: 'flex', alignItems: 'center', gap: '3px' }}
              title="Reset date slicers"
            >
              <RotateCcw size={10} /> Reset
            </button>
          )}
        </div>

        {/* Slicer Summary Badge */}
        <div style={{ marginLeft: 'auto' }}>
          {slicedDates.length > 0 ? (
            <span className="slicer-info-badge" style={{ fontSize: '0.72rem', padding: '4px 10px' }}>
              <Calendar size={11} />
              <span>
                {slicedDates.length} date{slicedDates.length === 1 ? '' : 's'} ({formatDateDDMMYYYY(slicedDates[0])} – {formatDateDDMMYYYY(slicedDates[slicedDates.length - 1])})
              </span>
            </span>
          ) : (
            <span className="slicer-info-badge" style={{ background: '#fff1f2', color: '#be123c', borderColor: '#fecdd3', fontSize: '0.72rem' }}>
              No matching dates
            </span>
          )}
        </div>
      </div>

      {/* View 1: Trend Chart */}
      {viewMode === 'chart' && trendChartOption && (
        <div style={{ height: '380px', width: '100%', marginBottom: '20px' }}>
          <ChartContainer options={trendChartOption} />
        </div>
      )}

      {/* View 2: Table Matrix matching the user's design */}
      {viewMode === 'table' && (
        <div style={{ 
          border: '1px solid #0284c7', 
          borderRadius: '12px', 
          overflow: 'hidden',
          background: '#ffffff',
          boxShadow: '0 4px 20px -2px rgba(0, 47, 108, 0.08)'
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse', 
              textAlign: 'center',
              fontSize: '0.85rem'
            }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #0284c7', background: '#ffffff' }}>
                  {/* Brand Column Header */}
                  <th 
                    onClick={() => handleSort('brandName')}
                    style={{ 
                      textAlign: 'left', 
                      padding: '12px 16px', 
                      color: '#002f6c', 
                      fontWeight: 700, 
                      minWidth: '180px',
                      cursor: 'pointer',
                      borderRight: '1.5px solid #0284c7',
                      background: '#ffffff',
                      position: 'sticky',
                      left: 0,
                      zIndex: 2
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.9rem' }}>brand</span>
                      <ArrowUpDown size={12} style={{ color: sortConfig.key === 'brandName' ? '#002f6c' : '#94a3b8' }} />
                    </div>
                  </th>

                  {/* Date Column Headers (DD-MM-YYYY) */}
                  {slicedDates.map(dateStr => (
                    <th 
                      key={dateStr}
                      onClick={() => handleSort(dateStr)}
                      style={{ 
                        padding: '12px 16px', 
                        color: '#002f6c', 
                        fontWeight: 600, 
                        minWidth: '110px',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                        <span>{formatDateDDMMYYYY(dateStr)}</span>
                        <ArrowUpDown size={10} style={{ color: sortConfig.key === dateStr ? '#002f6c' : '#cbd5e1' }} />
                      </div>
                    </th>
                  ))}

                  {/* Summary Column */}
                  <th 
                    onClick={() => handleSort(metricMode === 'best' ? 'periodBest' : 'periodAvg')}
                    style={{ 
                      padding: '12px 16px', 
                      color: '#002f6c', 
                      fontWeight: 700, 
                      minWidth: '120px',
                      cursor: 'pointer',
                      background: '#f0f9ff',
                      borderLeft: '1px solid #bae6fd'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                      <span>{metricMode === 'best' ? 'Best Rank' : 'Avg Rank'}</span>
                      <ArrowUpDown size={11} style={{ color: (sortConfig.key === 'periodBest' || sortConfig.key === 'periodAvg') ? '#002f6c' : '#94a3b8' }} />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedRows.length > 0 && slicedDates.length > 0 ? (
                  paginatedRows.map((row, idx) => {
                    const isEven = idx % 2 === 1;
                    const rowBg = isEven ? '#f0f4f8' : '#ffffff';

                    return (
                      <tr 
                        key={row.brandKey} 
                        style={{ 
                          background: rowBg,
                          transition: 'background-color 0.15s ease'
                        }}
                      >
                        {/* Brand Name Cell (Sticky Left with Vertical Separator) */}
                        <td style={{ 
                          textAlign: 'left', 
                          padding: '10px 16px', 
                          fontWeight: 500, 
                          color: '#1e293b',
                          borderRight: '1.5px solid #0284c7',
                          position: 'sticky',
                          left: 0,
                          zIndex: 1,
                          background: rowBg,
                          boxShadow: '2px 0 5px rgba(0,0,0,0.02)'
                        }}>
                          <span style={{ fontSize: '0.88rem' }}>{row.brandName}</span>
                        </td>

                        {/* Date Search Rank Cells */}
                        {slicedDates.map(dateStr => {
                          const cellData = row.dateRanks[dateStr];
                          const rankValue = cellData ? (metricMode === 'best' ? cellData.best : cellData.avg) : null;

                          return (
                            <td 
                              key={dateStr} 
                              style={{ 
                                padding: '10px 16px', 
                                color: rankValue === 1 ? '#002f6c' : '#334155',
                                fontWeight: rankValue === 1 ? 700 : 500,
                                fontSize: '0.88rem'
                              }}
                            >
                              {rankValue !== null ? (
                                rankValue === 1 ? (
                                  <span style={{ 
                                    display: 'inline-block',
                                    color: '#002f6c',
                                    fontWeight: 700
                                  }}>
                                    1
                                  </span>
                                ) : (
                                  <span>{rankValue}</span>
                                )
                              ) : (
                                <span style={{ color: '#cbd5e1' }}>-</span>
                              )}
                            </td>
                          );
                        })}

                        {/* Summary Column Cell */}
                        <td style={{ 
                          padding: '10px 16px', 
                          fontWeight: 700, 
                          background: isEven ? '#e0f2fe' : '#f0f9ff',
                          color: '#002f6c',
                          borderLeft: '1px solid #bae6fd'
                        }}>
                          {metricMode === 'best' 
                            ? (row.periodBest !== null ? `#${row.periodBest}` : '-')
                            : (row.periodAvg !== null ? `#${row.periodAvg}` : '-')
                          }
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={slicedDates.length + 2} style={{ padding: '36px', color: '#94a3b8', textAlign: 'center' }}>
                      No search rank data found matching the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination Footer */}
      {processedRows.length > 0 && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginTop: '16px', 
          paddingTop: '12px',
          borderTop: '1px solid #e2e8f0',
          fontSize: '0.8rem',
          color: '#64748b',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div>
            Showing <strong style={{ color: '#1e293b' }}>{paginatedRows.length}</strong> of <strong style={{ color: '#1e293b' }}>{processedRows.length}</strong> brands
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Page Size Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>Show:</span>
              <select 
                value={pageSize}
                onChange={(e) => {
                  setPageSize(e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10));
                  setCurrentPage(1);
                }}
                style={{ 
                  padding: '4px 8px', 
                  borderRadius: '6px', 
                  border: '1px solid #cbd5e1', 
                  background: '#fff',
                  fontSize: '0.75rem',
                  outline: 'none'
                }}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value="all">All</option>
              </select>
            </div>

            {/* Pagination Controls */}
            {pageSize !== 'all' && totalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className="slicer-preset-btn"
                  style={{ padding: '4px 8px', display: 'flex', alignItems: 'center', opacity: currentPage === 1 ? 0.5 : 1 }}
                >
                  <ChevronLeft size={13} />
                </button>
                <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className="slicer-preset-btn"
                  style={{ padding: '4px 8px', display: 'flex', alignItems: 'center', opacity: currentPage === totalPages ? 0.5 : 1 }}
                >
                  <ChevronRight size={13} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
