import React, { useState, useMemo, useCallback } from 'react';
import rawData from '../skuAvailabilityData.json';
import matrixData from '../skuStoreMatrixData.json';
import {
  Table as TableIcon,
  Tag,
  Layers,
  Store,
  Search,
  X,
  Download,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  RotateCcw
} from 'lucide-react';

// Memoized table row component to prevent re-rendering unchanged rows
const SkuTableRow = React.memo(function SkuTableRow({ row }) {
  const isBlinkit = row.chain === 'Blinkit';
  return (
    <tr>
      {/* Chain Badge */}
      <td>
        <span
          style={{
            display: 'inline-block',
            padding: '3px 8px',
            fontSize: '0.72rem',
            fontWeight: 700,
            borderRadius: '6px',
            background: isBlinkit ? '#fef3c7' : '#f3e8ff',
            color: isBlinkit ? '#92400e' : '#6b21a8',
            border: `1px solid ${isBlinkit ? '#fde68a' : '#e9d5ff'}`
          }}
        >
          {row.chain}
        </span>
      </td>

      {/* SKU name */}
      <td>
        <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.82rem', lineHeight: 1.35 }}>
          {row.sku}
        </div>
        <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '2px' }}>
          Category: <strong>{row.category}</strong> • Brand: <strong>{row.brand}</strong>
        </div>
      </td>

      {/* City */}
      <td style={{ color: '#334155', fontWeight: 500, fontSize: '0.8rem' }}>
        {row.city}
      </td>

      {/* Pin Code */}
      <td>
        <code style={{ fontSize: '0.76rem', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', color: '#475569' }}>
          {row.pin}
        </code>
      </td>

      {/* Date Availability Columns: Available vs NR */}
      {row.statuses.map((st, sIdx) => {
        const isAvail = st === 1;
        const isLatest = sIdx === row.statuses.length - 1;
        return (
          <td
            key={sIdx}
            style={{
              textAlign: 'center',
              background: isLatest ? (isAvail ? '#f0fdf4' : '#fff1f2') : 'transparent',
              borderLeft: isLatest ? '1px solid #e2e8f0' : 'none'
            }}
          >
            {isAvail ? (
              <span
                className="badge success"
                style={{
                  fontSize: '0.7rem',
                  padding: '2px 8px',
                  fontWeight: 600,
                  display: 'inline-block'
                }}
              >
                Available
              </span>
            ) : (
              <span
                style={{
                  fontSize: '0.68rem',
                  padding: '2px 8px',
                  borderRadius: '99px',
                  background: '#f1f5f9',
                  color: '#94a3b8',
                  fontWeight: 500,
                  display: 'inline-block'
                }}
              >
                NR
              </span>
            )}
          </td>
        );
      })}

      {/* Total Availability from Start to End Date (Placed in the Last Column) */}
      <td style={{
        textAlign: 'center',
        background: '#fcfdfd',
        borderLeft: '2px solid #bbf7d0',
        padding: '8px 10px'
      }}>
        <div style={{
          fontWeight: 700,
          fontSize: '0.86rem',
          color: row.totalAvailPct >= 50 ? '#059669' : row.totalAvailPct > 0 ? '#0284c7' : '#94a3b8'
        }}>
          {row.totalAvailPct}%
        </div>
        <div style={{ fontSize: '0.66rem', color: '#64748b', marginTop: '1px' }}>
          ({row.avCnt}/{row.totCnt} dates)
        </div>
        <div style={{ width: '100%', height: '4px', background: '#f1f5f9', borderRadius: '2px', marginTop: '3px' }}>
          <div
            style={{
              width: `${Math.min(100, row.totalAvailPct)}%`,
              height: '100%',
              background: row.totalAvailPct >= 50 ? '#10b981' : row.totalAvailPct > 0 ? '#0284c7' : '#cbd5e1',
              borderRadius: '2px'
            }}
          />
        </div>
      </td>
    </tr>
  );
});

export default function SkuAvailabilityTable() {
  const { categories, hierarchy } = rawData;
  const { dates, sheets } = matrixData;

  // 1. Filter 1: Category (Atta, Biscuits, Edible Oil, Noodles)
  const [selectedCategory, setSelectedCategory] = useState('Atta');

  // Available brands in the selected category, always starting with 'All'
  const availableBrands = useMemo(() => {
    const list = hierarchy[selectedCategory] || [];
    const brandsWithoutAll = list.filter(b => b.toLowerCase() !== 'all');
    return ['All', ...brandsWithoutAll];
  }, [selectedCategory, hierarchy]);

  // 2. Filter 2: Brand within that category (defaults to 'All')
  const [selectedBrand, setSelectedBrand] = useState('All');

  // Secondary Filters
  const [selectedChain, setSelectedChain] = useState('all'); // 'all', 'Blinkit', 'Zepto'
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination & Sorting
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // Format dates for table headers (e.g. '2026-11-12' -> '12-11-2026')
  const formattedDates = useMemo(() => {
    return dates.map(d => {
      const parts = d.split('-');
      return {
        raw: d,
        display: parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : d
      };
    });
  }, [dates]);

  // Helper date formatter
  const formatDateDDMMYYYY = useCallback((dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateStr;
  }, []);

  // When Category changes, auto-select 'All'
  const handleCategoryChange = useCallback((newCat) => {
    setSelectedCategory(newCat);
    setSelectedBrand('All');
    setCurrentPage(1);
  }, []);

  // When Brand changes, reset page
  const handleBrandChange = useCallback((newBrand) => {
    setSelectedBrand(newBrand);
    setCurrentPage(1);
  }, []);

  // When Chain changes
  const handleChainChange = useCallback((e) => {
    setSelectedChain(e.target.value);
    setCurrentPage(1);
  }, []);

  // When Search changes
  const handleSearchChange = useCallback((e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  }, []);

  // Clear search
  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    setCurrentPage(1);
  }, []);

  // Page navigation callbacks
  const handlePrevPage = useCallback(() => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  }, []);

  const handlePageSizeChange = useCallback((e) => {
    setPageSize(Number(e.target.value));
    setCurrentPage(1);
  }, []);

  // Active sheets matching the selected Category and Brand
  const activeSheets = useMemo(() => {
    return Object.values(sheets).filter(s => {
      if (s.category !== selectedCategory) return false;
      if (selectedBrand !== 'All' && selectedBrand !== 'all') {
        if (s.brand !== selectedBrand) return false;
      }
      return true;
    });
  }, [sheets, selectedCategory, selectedBrand]);

  // Active sheet metadata: start date, end date, total dates
  const activeSheetMeta = useMemo(() => {
    if (!activeSheets.length) return null;
    let minStart = activeSheets[0].start_date;
    let maxEnd = activeSheets[0].end_date;
    let maxDates = activeSheets[0].total_dates_count;
    activeSheets.forEach(s => {
      if (s.start_date && s.start_date < minStart) minStart = s.start_date;
      if (s.end_date && s.end_date > maxEnd) maxEnd = s.end_date;
      if (s.total_dates_count && s.total_dates_count > maxDates) maxDates = s.total_dates_count;
    });
    return {
      startDate: formatDateDDMMYYYY(minStart),
      endDate: formatDateDDMMYYYY(maxEnd),
      totalDates: maxDates
    };
  }, [activeSheets, formatDateDDMMYYYY]);

  // Filter rows matching Chain and Search query
  const filteredRows = useMemo(() => {
    const list = [];
    const lowerQuery = searchQuery.trim().toLowerCase();
    const hasChainFilter = selectedChain !== 'all';

    activeSheets.forEach(s => {
      s.rows.forEach(r => {
        const [chain, sku, city, pin, statuses, totalAvailPct = 0, avCnt = 0, totCnt = 0] = r;

        // Chain filter
        if (hasChainFilter && chain !== selectedChain) return;

        // Search query filter (matches SKU, city, or pincode)
        if (lowerQuery) {
          const matchSku = sku.toLowerCase().includes(lowerQuery);
          const matchCity = city.toLowerCase().includes(lowerQuery);
          const matchPin = pin.includes(lowerQuery);
          if (!matchSku && !matchCity && !matchPin) return;
        }

        const availCount = statuses.filter(st => st === 1).length;
        const totalRecentDates = statuses.length || 1;
        const isFullRecentAvail = availCount === totalRecentDates;
        const latestStatus = statuses[statuses.length - 1] === 1 ? 1 : 0;
        const totalPctNum = typeof totalAvailPct === 'number' ? totalAvailPct : parseFloat(totalAvailPct) || 0;

        list.push({
          chain,
          sku,
          city,
          pin,
          sheet: s.sheet,
          category: s.category,
          brand: s.brand,
          statuses,
          availCount,
          totalRecentDates,
          isFullRecentAvail,
          latestStatus,
          totalAvailPct: totalPctNum,
          avCnt,
          totCnt
        });
      });
    });

    // Sorting: user-selected or default (SKUs with full availability come 1st)
    if (sortConfig.key) {
      if (sortConfig.key.startsWith('date_')) {
        const dIdx = parseInt(sortConfig.key.split('_')[1], 10);
        list.sort((a, b) => {
          const valA = a.statuses[dIdx] || 0;
          const valB = b.statuses[dIdx] || 0;
          if (valA !== valB) {
            return sortConfig.direction === 'asc' ? valA - valB : valB - valA;
          }
          return b.totalAvailPct - a.totalAvailPct;
        });
      } else {
        list.sort((a, b) => {
          let valA = a[sortConfig.key];
          let valB = b[sortConfig.key];
          if (typeof valA === 'string') {
            valA = valA.toLowerCase();
            valB = valB.toLowerCase();
          }
          if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
          if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
          return 0;
        });
      }
    } else {
      // Default Sort: SKUs with full total availability from start to end date come 1st!
      // High-performance comparison without localeCompare overhead across large lists
      list.sort((a, b) => {
        // 1. Highest total availability % first (from start date to end date)
        if (b.totalAvailPct !== a.totalAvailPct) {
          return b.totalAvailPct - a.totalAvailPct;
        }
        // 2. Highest recent dates availability count
        if (b.availCount !== a.availCount) {
          return b.availCount - a.availCount;
        }
        // 3. Latest date Available first
        if (b.latestStatus !== a.latestStatus) {
          return b.latestStatus - a.latestStatus;
        }
        // 4. SKU name alphabetically (fast string comparison)
        if (a.sku < b.sku) return -1;
        if (a.sku > b.sku) return 1;
        // 5. City alphabetically
        if (a.city < b.city) return -1;
        if (a.city > b.city) return 1;
        return 0;
      });
    }

    return list;
  }, [activeSheets, selectedChain, searchQuery, sortConfig]);

  // Pagination slice
  const totalRecords = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, currentPage, pageSize]);

  // Next page callback with totalPages dependency
  const handleNextPage = useCallback(() => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  }, [totalPages]);

  // Sorting handler
  const handleSort = useCallback((key) => {
    setSortConfig(prev => {
      const direction = prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc';
      return { key, direction };
    });
    setCurrentPage(1);
  }, []);

  // Reset filters
  const handleResetFilters = useCallback(() => {
    setSelectedCategory('Atta');
    setSelectedBrand('All');
    setSelectedChain('all');
    setSearchQuery('');
    setCurrentPage(1);
  }, []);

  // Export CSV of current sheet table
  const handleExportCSV = useCallback(() => {
    const dateHeaders = formattedDates.map(d => d.display).join(',');
    const rangeLabel = activeSheetMeta
      ? `Total Avail % (${activeSheetMeta.startDate} to ${activeSheetMeta.endDate}),In-Stock Dates,Total Dates`
      : 'Total Avail %,In-Stock Dates,Total Dates';
    const csvHeader = `Chain,SKU name,City,Pin Code,${dateHeaders},${rangeLabel}\n`;
    const csvRows = filteredRows.map(r => {
      const statusesStr = r.statuses.map(s => s === 1 ? 'Available' : 'NR').join(',');
      const cleanSku = `"${r.sku.replace(/"/g, '""')}"`;
      return `"${r.chain}",${cleanSku},"${r.city}","${r.pin}",${statusesStr},${r.totalAvailPct}%,${r.avCnt},${r.totCnt}`;
    }).join('\n');

    const blob = new Blob([csvHeader + csvRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `SKUs_Availability_Status_${selectedCategory}_${selectedBrand}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [filteredRows, formattedDates, activeSheetMeta, selectedCategory, selectedBrand]);

  const isResetActive = useMemo(() => {
    return selectedCategory !== 'Atta' || selectedBrand !== 'All' || selectedChain !== 'all' || Boolean(searchQuery);
  }, [selectedCategory, selectedBrand, selectedChain, searchQuery]);

  return (
    <div className="table-card glass fade-in" style={{ marginBottom: '28px', padding: '24px' }}>
      
      {/* 1. Header (Matching Excel Sheet Title) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h3 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 700, color: '#002f6c', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TableIcon size={22} style={{ color: '#0284c7' }} />
              SKUs - Availability Status
            </h3>
            <span style={{ background: '#e0f2fe', color: '#0369a1', fontSize: '0.75rem', fontWeight: 700, padding: '3px 12px', borderRadius: '99px', border: '1px solid #bae6fd' }}>
              Sheet: {selectedCategory}({selectedBrand}) • {totalRecords.toLocaleString()} Rows
              {activeSheetMeta && ` • (${activeSheetMeta.startDate} to ${activeSheetMeta.endDate})`}
            </span>
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Availability across Zepto and Blinkit
          </div>
        </div>

        {/* Export CSV Button */}
        <button
          type="button"
          onClick={handleExportCSV}
          className="filter-btn"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 14px',
            fontSize: '0.78rem',
            fontWeight: 600,
            background: '#ffffff',
            color: '#002f6c',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
          title="Download current table as CSV"
        >
          <Download size={14} />
          Export CSV
        </button>
      </div>

      {/* 2. Cascading Filters Toolbar: Filter 1 (Category) & Filter 2 (Brand) */}
      <div style={{
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '14px 18px',
        marginBottom: '20px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '18px'
      }}>
        {/* FILTER 1: CATEGORY */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Tag size={12} style={{ color: '#0284c7' }} />
            1. Category
          </label>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {categories.map(cat => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => handleCategoryChange(cat)}
                  style={{
                    padding: '5px 14px',
                    fontSize: '0.8rem',
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
        <div style={{ width: '1px', height: '36px', background: '#cbd5e1' }} />

        {/* FILTER 2: BRAND WITHIN CATEGORY */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', minWidth: '180px' }}>
          <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Layers size={12} style={{ color: '#0284c7' }} />
            2. Brand ({selectedCategory})
          </label>
          <select
            value={selectedBrand}
            onChange={(e) => handleBrandChange(e.target.value)}
            className="filter-control"
            style={{
              height: '32px',
              padding: '4px 10px',
              fontSize: '0.82rem',
              fontWeight: 600,
              minWidth: '170px',
              background: '#ffffff'
            }}
          >
            {availableBrands.map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>

        {/* PLATFORM CHAIN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', minWidth: '130px' }}>
          <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Store size={12} style={{ color: '#0284c7' }} />
            Chain
          </label>
          <select
            value={selectedChain}
            onChange={handleChainChange}
            className="filter-control"
            style={{ height: '32px', padding: '4px 10px', fontSize: '0.82rem', fontWeight: 600, background: '#ffffff' }}
          >
            <option value="all">All Chains</option>
            <option value="Blinkit">Blinkit</option>
            <option value="Zepto">Zepto</option>
          </select>
        </div>

        {/* SEARCH SKU / PINCODE / CITY */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginLeft: 'auto' }}>
          <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Search Table
          </label>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Filter by SKU, city, pin..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="search-input"
              style={{ height: '32px', fontSize: '0.8rem', padding: '4px 26px 4px 26px', width: '190px', background: '#ffffff' }}
            />
            <Search size={13} style={{ position: 'absolute', left: '8px', color: '#94a3b8' }} />
            {searchQuery && (
              <button
                type="button"
                onClick={handleClearSearch}
                style={{ position: 'absolute', right: '6px', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '2px', display: 'flex' }}
                title="Clear"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Reset Button */}
        {isResetActive && (
          <div style={{ display: 'flex', alignItems: 'flex-end', height: '100%', paddingTop: '18px' }}>
            <button
              type="button"
              onClick={handleResetFilters}
              className="filter-btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                height: '32px',
                padding: '4px 10px',
                fontSize: '0.76rem',
                fontWeight: 600,
                color: '#64748b',
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
              title="Reset filters"
            >
              <RotateCcw size={12} />
              Reset
            </button>
          </div>
        )}
      </div>

      {/* 3. The Tabular Spreadsheet */}
      <div className="table-wrapper" style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
        <table className="dashboard-table" style={{ width: '100%', minWidth: '920px' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #cbd5e1' }}>
              <th style={{ width: '110px', cursor: 'pointer' }} onClick={() => handleSort('chain')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Chain
                  <ArrowUpDown size={12} style={{ color: '#94a3b8' }} />
                </div>
              </th>
              <th style={{ width: '340px', cursor: 'pointer' }} onClick={() => handleSort('sku')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  SKU name
                  <ArrowUpDown size={12} style={{ color: '#94a3b8' }} />
                </div>
              </th>
              <th style={{ width: '130px', cursor: 'pointer' }} onClick={() => handleSort('city')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  City
                  <ArrowUpDown size={12} style={{ color: '#94a3b8' }} />
                </div>
              </th>
              <th style={{ width: '100px', cursor: 'pointer' }} onClick={() => handleSort('pin')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Pin Code
                  <ArrowUpDown size={12} style={{ color: '#94a3b8' }} />
                </div>
              </th>
              {formattedDates.map((d, dIdx) => {
                const isLatest = dIdx === formattedDates.length - 1;
                const sortKey = `date_${dIdx}`;
                const isSorted = sortConfig.key === sortKey;
                return (
                  <th
                    key={d.raw}
                    onClick={() => handleSort(sortKey)}
                    style={{
                      textAlign: 'center',
                      fontSize: '0.76rem',
                      minWidth: '92px',
                      cursor: 'pointer',
                      background: isSorted ? '#dbeafe' : (isLatest ? '#eff6ff' : 'transparent'),
                      color: isSorted ? '#1e40af' : (isLatest ? '#1d4ed8' : '#475569'),
                      fontWeight: (isLatest || isSorted) ? 700 : 600,
                      borderLeft: isLatest ? '1px solid #bfdbfe' : 'none'
                    }}
                    title="Click to sort by this date's availability"
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <span>{d.display}</span>
                        <ArrowUpDown size={11} style={{ opacity: isSorted ? 1 : 0.4 }} />
                      </div>
                      {isLatest && (
                        <span style={{ fontSize: '0.62rem', background: '#dbeafe', color: '#1e40af', padding: '1px 5px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Latest
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
              {/* TOTAL AVAILABILITY FROM START DATE TO END DATE (PLACED IN THE LAST COLUMN) */}
              <th
                style={{
                  width: '155px',
                  cursor: 'pointer',
                  background: sortConfig.key === 'totalAvailPct' ? '#dbeafe' : '#f0fdf4',
                  borderLeft: '2px solid #bbf7d0',
                  textAlign: 'center'
                }}
                onClick={() => handleSort('totalAvailPct')}
                title="Total availability percentage from start date to end date"
              >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#15803d', fontWeight: 700 }}>
                    <span>Total Availability</span>
                    <ArrowUpDown size={12} style={{ opacity: sortConfig.key === 'totalAvailPct' ? 1 : 0.6 }} />
                  </div>
                  {activeSheetMeta && (
                    <span style={{ fontSize: '0.62rem', color: '#166534', fontWeight: 600 }}>
                      {activeSheetMeta.startDate} → {activeSheetMeta.endDate}
                    </span>
                  )}
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedRows.length === 0 ? (
              <tr>
                <td colSpan={5 + formattedDates.length} style={{ textAlign: 'center', padding: '36px', color: '#94a3b8' }}>
                  No rows found matching the selected category, brand, or search filters.
                </td>
              </tr>
            ) : (
              paginatedRows.map((row, idx) => (
                <SkuTableRow key={`${row.chain}-${row.pin}-${row.sku}-${idx}`} row={row} />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 4. Table Pagination Controls */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        marginTop: '16px',
        paddingTop: '14px',
        borderTop: '1px solid #f1f5f9'
      }}>
        {/* Page size & row count */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
            Showing <strong>{totalRecords > 0 ? (currentPage - 1) * pageSize + 1 : 0}</strong> to <strong>{Math.min(currentPage * pageSize, totalRecords)}</strong> of <strong>{totalRecords.toLocaleString()}</strong> rows
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.76rem', color: '#94a3b8' }}>Rows per page:</span>
            <select
              value={pageSize}
              onChange={handlePageSizeChange}
              className="filter-control"
              style={{ height: '28px', padding: '2px 8px', fontSize: '0.76rem' }}
            >
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        {/* Pagination buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            type="button"
            onClick={handlePrevPage}
            disabled={currentPage === 1}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 10px',
              fontSize: '0.76rem',
              fontWeight: 600,
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              color: currentPage === 1 ? '#cbd5e1' : '#334155'
            }}
          >
            <ChevronLeft size={14} />
            Previous
          </button>

          <span style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 600, padding: '0 8px' }}>
            Page {currentPage} of {totalPages}
          </span>

          <button
            type="button"
            onClick={handleNextPage}
            disabled={currentPage === totalPages || totalRecords === 0}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 10px',
              fontSize: '0.76rem',
              fontWeight: 600,
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              cursor: (currentPage === totalPages || totalRecords === 0) ? 'not-allowed' : 'pointer',
              color: (currentPage === totalPages || totalRecords === 0) ? '#cbd5e1' : '#334155'
            }}
          >
            Next
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

    </div>
  );
}
