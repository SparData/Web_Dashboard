import React, { useState, useMemo, useCallback } from 'react';
import { Search, ArrowUpDown, ChevronLeft, ChevronRight, Calendar, Download, Sparkles, X, RotateCcw } from 'lucide-react';

// Helper to extract YYYY-MM-DD date key
function formatDateKey(dateVal) {
  if (!dateVal) return '';
  if (typeof dateVal === 'string') {
    return dateVal.includes('T') ? dateVal.split('T')[0] : dateVal.trim();
  }
  if (dateVal instanceof Date) {
    return dateVal.toISOString().split('T')[0];
  }
  return String(dateVal).trim();
}

// Helper for human-friendly date header
function formatDateLabel(dateStr) {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      }
    }
  } catch {}
  return dateStr;
}

function BrandAvailabilityTable({ productListings = [] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'periodRate', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  // Date Slicers State
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

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

  // 3a. Aggregate availability by brand across all dates once (depends only on productListings)
  const brandMap = useMemo(() => {
    const map = {};
    const ignoredBrands = new Set(['others', 'other', 'unknown', 'n/a', 'na', 'none', 'null', 'undefined']);

    productListings.forEach(p => {
      const rawBrand = p.brand?.trim();
      const dateKey = formatDateKey(p.scrape_date);
      if (!rawBrand || !dateKey) return;

      const brandKey = rawBrand.toLowerCase();
      if (ignoredBrands.has(brandKey)) return;

      if (!map[brandKey]) {
        map[brandKey] = {
          brandKey,
          brandName: rawBrand,
          dates: {},
          overallTotal: 0,
          overallAvailable: 0
        };
      }

      if (!map[brandKey].dates[dateKey]) {
        map[brandKey].dates[dateKey] = { total: 0, available: 0 };
      }

      const isAvailable = p.availability === true || p.availability === 'true' || (typeof p.availability === 'string' && p.availability.trim().toLowerCase() === 'yes');

      map[brandKey].dates[dateKey].total++;
      map[brandKey].overallTotal++;
      if (isAvailable) {
        map[brandKey].dates[dateKey].available++;
        map[brandKey].overallAvailable++;
      }
    });

    return map;
  }, [productListings]);

  // 3b. Compute sliced period metrics on the pre-aggregated brandMap (O(brands * dates) - sub-millisecond)
  const brandRows = useMemo(() => {
    const rows = Object.values(brandMap).map(brand => {
      const dateRates = {};
      allDates.forEach(d => {
        const item = brand.dates[d];
        if (item && item.total > 0) {
          dateRates[d] = {
            rate: parseFloat(((item.available / item.total) * 100).toFixed(1)),
            available: item.available,
            total: item.total
          };
        } else {
          dateRates[d] = null;
        }
      });

      // Calculate availability specifically for the sliced date range
      let periodAvailable = 0;
      let periodTotal = 0;
      slicedDates.forEach(d => {
        const item = brand.dates[d];
        if (item) {
          periodAvailable += item.available;
          periodTotal += item.total;
        }
      });

      const periodRate = periodTotal > 0
        ? parseFloat(((periodAvailable / periodTotal) * 100).toFixed(1))
        : 0.0;

      const overallRate = brand.overallTotal > 0 
        ? parseFloat(((brand.overallAvailable / brand.overallTotal) * 100).toFixed(1)) 
        : 0.0;

      return {
        brandKey: brand.brandKey,
        brandName: brand.brandName,
        dateRates,
        periodRate,
        periodAvailable,
        periodTotal,
        overallRate,
        overallAvailable: brand.overallAvailable,
        overallTotal: brand.overallTotal
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
        } else if (key === 'periodRate' || key === 'overallRate') {
          valA = a.periodRate;
          valB = b.periodRate;
        } else {
          // Specific date key
          valA = a.dateRates[key]?.rate !== undefined && a.dateRates[key]?.rate !== null ? a.dateRates[key].rate : -1;
          valB = b.dateRates[key]?.rate !== undefined && b.dateRates[key]?.rate !== null ? b.dateRates[key].rate : -1;
        }

        if (valA < valB) return direction === 'asc' ? -1 : 1;
        if (valA > valB) return direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [brandRows, searchTerm, sortConfig]);

  // Pagination
  const totalPages = Math.ceil(processedRows.length / (pageSize === 'all' ? (processedRows.length || 1) : pageSize));
  const paginatedRows = useMemo(() => {
    if (pageSize === 'all') return processedRows;
    const start = (currentPage - 1) * pageSize;
    return processedRows.slice(start, start + pageSize);
  }, [processedRows, currentPage, pageSize]);

  // Export to CSV with sliced columns
  const handleExportCSV = useCallback(() => {
    if (brandRows.length === 0 || slicedDates.length === 0) return;
    const avgHeader = isSliced ? 'Period Avg Availability %' : 'Overall Availability %';
    const headers = ['Brand', ...slicedDates.map(d => formatDateLabel(d)), avgHeader];
    const csvLines = [headers.join(',')];

    processedRows.forEach(row => {
      const line = [
        `"${row.brandName.replace(/"/g, '""')}"`,
        ...slicedDates.map(d => row.dateRates[d] ? `${row.dateRates[d].rate}%` : 'No Product Found'),
        `${row.periodRate}%`
      ];
      csvLines.push(line.join(','));
    });

    const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const dateRangeSuffix = isSliced ? `_${startDate || 'start'}_to_${endDate || 'end'}` : '';
    link.setAttribute('download', `brand_availability_share${dateRangeSuffix}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [brandRows.length, slicedDates, processedRows, isSliced, startDate, endDate]);

  // Helper to render percentage badge
  const renderRateBadge = (cellData) => {
    if (!cellData) {
      return (
        <span 
          style={{ 
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '3px 8px',
            borderRadius: '6px',
            fontSize: '0.7rem',
            fontWeight: 600,
            background: '#f8fafc',
            color: '#94a3b8',
            border: '1px solid #e2e8f0',
            whiteSpace: 'nowrap'
          }}
          title="No product found / scraped on this date"
        >
          No Product Found
        </span>
      );
    }

    const { rate, available, total } = cellData;
    let badgeStyle = {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '4px 10px',
      borderRadius: '6px',
      fontSize: '0.8rem',
      fontWeight: 700,
      minWidth: '64px',
      letterSpacing: '0.2px'
    };

    if (rate >= 100) {
      badgeStyle = {
        ...badgeStyle,
        background: '#ecfdf5',
        color: '#047857',
        border: '1px solid #a7f3d0'
      };
    } else if (rate >= 95) {
      badgeStyle = {
        ...badgeStyle,
        background: '#eff6ff',
        color: '#1d4ed8',
        border: '1px solid #bfdbfe'
      };
    } else if (rate >= 80) {
      badgeStyle = {
        ...badgeStyle,
        background: '#fffbeb',
        color: '#b45309',
        border: '1px solid #fde68a'
      };
    } else {
      badgeStyle = {
        ...badgeStyle,
        background: '#fff1f2',
        color: '#be123c',
        border: '1px solid #fecdd3'
      };
    }

    return (
      <span 
        style={badgeStyle} 
        title={`In Stock: ${available} / ${total} products (${rate}%)`}
      >
        {rate.toFixed(1)}%
      </span>
    );
  };

  return (
    <div className="table-card glass fade-in" style={{ marginTop: '32px', marginBottom: '32px', padding: '24px' }}>
      {/* Title & Top Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '18px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h3 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Share of Availability Brand-wise
            </h3>
            <span style={{ 
              background: '#e0f2fe', 
              color: '#0369a1', 
              fontSize: '0.72rem', 
              fontWeight: 700, 
              padding: '2px 8px', 
              borderRadius: '99px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <Sparkles size={11} /> {brandRows.length} Brands
            </span>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Share of Availability percentage trend for all the brands.
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Search Box */}
          <div className="search-box" style={{ width: 'auto' }}>
            <input 
              type="text" 
              className="search-input" 
              placeholder="Search brands..." 
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              style={{ width: '220px', padding: '8px 12px 8px 36px', height: '36px' }}
            />
            <Search size={15} className="search-icon" />
          </div>

          {/* Rows Per Page */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            <span>Show:</span>
            <select 
              className="filter-control" 
              style={{ minWidth: '75px', padding: '6px 8px', height: '36px', borderRadius: '8px' }}
              value={pageSize}
              onChange={(e) => {
                const val = e.target.value === 'all' ? 'all' : Number(e.target.value);
                setPageSize(val);
                setCurrentPage(1);
              }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value="all">All</option>
            </select>
          </div>

          {/* Export CSV Button */}
          <button 
            className="btn" 
            onClick={handleExportCSV}
            disabled={slicedDates.length === 0 || brandRows.length === 0}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              height: '36px', 
              padding: '0 12px',
              fontSize: '0.8rem',
              fontWeight: 600,
              color: '#002f6c',
              borderColor: '#cbd5e1'
            }}
            title="Download availability data as CSV"
          >
            <Download size={14} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Date Slicers Control Toolbar */}
      <div className="slicer-toolbar">
        {/* Slicer Label */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#002f6c', fontWeight: 700, fontSize: '0.82rem' }}>
          <Calendar size={16} />
          <span>Date Slicers:</span>
        </div>

        {/* Start Date Slicer */}
        <div className="slicer-group">
          <label className="slicer-label">
            Start Date
          </label>
          <div className="slicer-input-wrapper">
            <input 
              type="date" 
              className={`slicer-date-input ${startDate ? 'active' : ''}`}
              value={startDate}
              min={allDates[0] || ''}
              max={endDate || (allDates.length > 0 ? allDates[allDates.length - 1] : '')}
              onChange={(e) => {
                setStartDate(e.target.value);
                setCurrentPage(1);
              }}
              title="Select Start Date"
            />
            {startDate && (
              <button 
                type="button" 
                className="slicer-clear-btn" 
                onClick={() => {
                  setStartDate('');
                  setCurrentPage(1);
                }}
                title="Clear Start Date"
              >
                <X size={10} />
              </button>
            )}
          </div>
        </div>

        {/* Range Separator */}
        <span style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 700 }}>→</span>

        {/* End Date Slicer */}
        <div className="slicer-group">
          <label className="slicer-label">
            End Date
          </label>
          <div className="slicer-input-wrapper">
            <input 
              type="date" 
              className={`slicer-date-input ${endDate ? 'active' : ''}`}
              value={endDate}
              min={startDate || (allDates.length > 0 ? allDates[0] : '')}
              max={allDates.length > 0 ? allDates[allDates.length - 1] : ''}
              onChange={(e) => {
                setEndDate(e.target.value);
                setCurrentPage(1);
              }}
              title="Select End Date"
            />
            {endDate && (
              <button 
                type="button" 
                className="slicer-clear-btn" 
                onClick={() => {
                  setEndDate('');
                  setCurrentPage(1);
                }}
                title="Clear End Date"
              >
                <X size={10} />
              </button>
            )}
          </div>
        </div>

        {/* Quick Slicer Presets */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginLeft: '4px' }}>
          <button 
            type="button" 
            className={`slicer-preset-btn ${!startDate && !endDate ? 'active' : ''}`}
            onClick={handleResetDates}
          >
            All Dates ({allDates.length})
          </button>
          {allDates.length >= 3 && (
            <button 
              type="button" 
              className="slicer-preset-btn"
              onClick={() => handleLastNDates(3)}
            >
              Last 3 Days
            </button>
          )}
          {allDates.length >= 5 && (
            <button 
              type="button" 
              className="slicer-preset-btn"
              onClick={() => handleLastNDates(5)}
            >
              Last 5 Days
            </button>
          )}
          {allDates.length >= 7 && (
            <button 
              type="button" 
              className="slicer-preset-btn"
              onClick={() => handleLastNDates(7)}
            >
              Last 7 Days
            </button>
          )}
          {isSliced && (
            <button 
              type="button" 
              className="slicer-preset-btn"
              onClick={handleResetDates}
              style={{ color: '#be123c', borderColor: '#fecdd3', background: '#fff1f2', display: 'flex', alignItems: 'center', gap: '4px' }}
              title="Reset date slicers"
            >
              <RotateCcw size={11} /> Reset
            </button>
          )}
        </div>

        {/* Slicer Summary Badge */}
        <div style={{ marginLeft: 'auto' }}>
          {slicedDates.length > 0 ? (
            <span className="slicer-info-badge">
              <Calendar size={12} />
              <span>
                {isSliced ? `Showing ${slicedDates.length} of ${allDates.length} dates (${formatDateLabel(slicedDates[0])} – ${formatDateLabel(slicedDates[slicedDates.length - 1])})` : `All ${allDates.length} dates active (${formatDateLabel(allDates[0])} – ${formatDateLabel(allDates[allDates.length - 1])})`}
              </span>
            </span>
          ) : (
            <span className="slicer-info-badge" style={{ background: '#fff1f2', color: '#be123c', borderColor: '#fecdd3' }}>
              No dates match selected range
            </span>
          )}
        </div>
      </div>

      {/* Matrix Table */}
      <div className="table-wrapper" style={{ boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)', borderRadius: '10px' }}>
        <table className="dashboard-table" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
          <thead>
            <tr>
              {/* Brand Header */}
              <th 
                onClick={() => handleSort('brandName')}
                style={{ 
                  cursor: 'pointer', 
                  width: '240px',
                  minWidth: '200px',
                  position: 'sticky',
                  left: 0,
                  zIndex: 2,
                  background: '#f8fafc',
                  boxShadow: '2px 0 5px rgba(0,0,0,0.02)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Brand</span>
                  <ArrowUpDown size={12} style={{ color: sortConfig.key === 'brandName' ? '#002f6c' : '#94a3b8' }} />
                </div>
              </th>

              {/* Dynamic Sliced Date Headers */}
              {slicedDates.map(dateStr => (
                <th 
                  key={dateStr}
                  onClick={() => handleSort(dateStr)}
                  style={{ cursor: 'pointer', minWidth: '130px', textAlign: 'center' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <Calendar size={12} style={{ color: '#0369a1' }} />
                    <span>{formatDateLabel(dateStr)}</span>
                    <ArrowUpDown size={11} style={{ color: sortConfig.key === dateStr ? '#002f6c' : '#94a3b8' }} />
                  </div>
                </th>
              ))}

              {/* Period / Overall Average Availability Header */}
              <th 
                onClick={() => handleSort('periodRate')}
                style={{ cursor: 'pointer', minWidth: '150px', textAlign: 'center', background: '#f1f5f9' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <span style={{ color: '#002f6c', fontWeight: 700 }}>
                    {isSliced ? 'Period Avg %' : 'Overall Avg %'}
                  </span>
                  <ArrowUpDown size={12} style={{ color: (sortConfig.key === 'periodRate' || sortConfig.key === 'overallRate') ? '#002f6c' : '#94a3b8' }} />
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedRows.length > 0 && slicedDates.length > 0 ? (
              paginatedRows.map((row, idx) => {
                const rankNum = (currentPage - 1) * (pageSize === 'all' ? 0 : pageSize) + idx + 1;
                return (
                  <tr key={row.brandKey} style={{ transition: 'background-color 0.15s ease' }}>
                    {/* Brand Name Cell (Sticky Left) */}
                    <td style={{ 
                      position: 'sticky', 
                      left: 0, 
                      zIndex: 1, 
                      background: '#ffffff', 
                      boxShadow: '2px 0 5px rgba(0,0,0,0.02)',
                      fontWeight: 600,
                      color: '#1e293b'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ 
                          fontSize: '0.7rem', 
                          fontWeight: 700, 
                          color: '#64748b', 
                          background: '#f1f5f9', 
                          padding: '2px 6px', 
                          borderRadius: '4px',
                          minWidth: '24px',
                          textAlign: 'center'
                        }}>
                          #{rankNum}
                        </span>
                        <span style={{ color: '#002f6c', fontSize: '0.88rem' }}>{row.brandName}</span>
                      </div>
                    </td>

                    {/* Date Availability Percentage Cells */}
                    {slicedDates.map(dateStr => (
                      <td key={dateStr} style={{ textAlign: 'center', padding: '10px 14px' }}>
                        {renderRateBadge(row.dateRates[dateStr])}
                      </td>
                    ))}

                    {/* Period Avg Availability Cell */}
                    <td style={{ textAlign: 'center', padding: '10px 14px', background: '#f8fafc' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                        <span style={{ 
                          fontWeight: 800, 
                          fontSize: '0.88rem', 
                          color: row.periodRate >= 95 ? '#059669' : row.periodRate >= 80 ? '#002f6c' : '#be123c' 
                        }}>
                          {row.periodRate.toFixed(1)}%
                        </span>
                        <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                          {row.periodAvailable}/{row.periodTotal} In-Stock
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td 
                  colSpan={Math.max(slicedDates.length + 2, 3)} 
                  style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-secondary)' }}
                >
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                    {slicedDates.length === 0 ? 'No dates match the selected date range' : 'No brands found'}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '12px' }}>
                    {slicedDates.length === 0 ? 'Try widening your Start Date and End Date range.' : 'Try adjusting your search query or filters.'}
                  </div>
                  {slicedDates.length === 0 && (
                    <button 
                      className="btn" 
                      onClick={handleResetDates}
                      style={{ margin: '0 auto', fontSize: '0.8rem' }}
                    >
                      <RotateCcw size={13} /> Reset Date Slicers
                    </button>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && pageSize !== 'all' && (
        <div className="pagination" style={{ marginTop: '18px' }}>
          <div className="pagination-info">
            Showing <strong style={{ color: '#1e293b' }}>{(currentPage - 1) * pageSize + 1}</strong> to <strong style={{ color: '#1e293b' }}>{Math.min(currentPage * pageSize, processedRows.length)}</strong> of <strong style={{ color: '#1e293b' }}>{processedRows.length}</strong> brands
          </div>
          <div className="pagination-btn-group">
            <button 
              className="btn" 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', fontSize: '0.8rem' }}
            >
              <ChevronLeft size={15} />
              Prev
            </button>

            <span style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              padding: '0 12px', 
              fontSize: '0.8rem', 
              fontWeight: 600, 
              color: '#475569' 
            }}>
              Page {currentPage} of {totalPages}
            </span>

            <button 
              className="btn" 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', fontSize: '0.8rem' }}
            >
              Next
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default React.memo(BrandAvailabilityTable);
