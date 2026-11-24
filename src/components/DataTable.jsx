import React, { useState, useMemo, useCallback } from 'react';
import { ArrowUpDown, ChevronLeft, ChevronRight, Search, Calendar, X, RotateCcw, Tag } from 'lucide-react';

// Static date helper functions moved outside component scope
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

function formatDateDDMMYYYY(dateStr) {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const [year, month, day] = parts;
      return `${day.padStart(2, '0')}-${month.padStart(2, '0')}-${year}`;
    }
  } catch {}
  return dateStr;
}

function DataTable({ 
  data, 
  columns, 
  searchPlaceholder = "Search records...", 
  title, 
  subtitle, 
  badge, 
  icon,
  enableDateFilter = false,
  dateKey = 'scrape_date',
  onDateChange,
  enableKeywordFilter = false,
  keywordKey = 'product',
  onKeywordChange
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [keywordTerm, setKeywordTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Extract all unique dates
  const allDates = useMemo(() => {
    if (!enableDateFilter && !dateKey) return [];
    const datesSet = new Set();
    (data || []).forEach(row => {
      const d = formatDateKey(row[dateKey]);
      if (d) datesSet.add(d);
    });
    return Array.from(datesSet).sort();
  }, [data, enableDateFilter, dateKey]);

  // Extract all unique keywords
  const allKeywords = useMemo(() => {
    if (!enableKeywordFilter) return [];
    const keywordsSet = new Set();
    (data || []).forEach(row => {
      const kw = (row[keywordKey] || row.search_keyword || row.keyword || row.product || row.category);
      if (kw && typeof kw === 'string') {
        const trimmed = kw.trim();
        if (trimmed) keywordsSet.add(trimmed);
      }
    });
    return Array.from(keywordsSet).sort();
  }, [data, enableKeywordFilter, keywordKey]);

  // Reset pagination on search
  const handleSearchChange = useCallback((e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  }, []);

  // Sorting handler
  const handleSort = useCallback((key) => {
    setSortConfig(prev => {
      const direction = prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc';
      return { key, direction };
    });
  }, []);

  // Filter & Sort data
  const processedData = useMemo(() => {
    let result = [...(data || [])];

    // Date range filter
    if (enableDateFilter && (startDate || endDate)) {
      result = result.filter(row => {
        const d = formatDateKey(row[dateKey]);
        if (!d) return true;
        if (startDate && d < startDate) return false;
        if (endDate && d > endDate) return false;
        return true;
      });
    }

    // Keyword filter
    if (enableKeywordFilter && keywordTerm) {
      const lowerKw = keywordTerm.toLowerCase();
      result = result.filter(row => {
        const kw = (row[keywordKey] || row.search_keyword || row.keyword || row.product || row.category || '')?.toLowerCase();
        const title = (row.title || '')?.toLowerCase();
        return kw.includes(lowerKw) || title.includes(lowerKw);
      });
    }

    // Search filter
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(row => {
        const matchCol = columns.some(col => {
          const val = row[col.key];
          return val !== undefined && val !== null && String(val).toLowerCase().includes(lowerSearch);
        });
        const matchKw = (row[keywordKey] || row.search_keyword || row.keyword || row.product || row.category)
          ? String(row[keywordKey] || row.search_keyword || row.keyword || row.product || row.category).toLowerCase().includes(lowerSearch)
          : false;
        return matchCol || matchKw;
      });
    }

    // Sort
    if (sortConfig.key) {
      const { key, direction } = sortConfig;
      result.sort((a, b) => {
        let valA = a[key];
        let valB = b[key];

        // Handle numeric conversion where possible
        if (!isNaN(Number(valA)) && !isNaN(Number(valB))) {
          valA = Number(valA);
          valB = Number(valB);
        } else {
          valA = valA ? String(valA).toLowerCase() : '';
          valB = valB ? String(valB).toLowerCase() : '';
        }

        if (valA < valB) return direction === 'asc' ? -1 : 1;
        if (valA > valB) return direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [data, searchTerm, keywordTerm, sortConfig, columns, enableDateFilter, dateKey, startDate, endDate, enableKeywordFilter, keywordKey]);

  // Pagination calculations
  const totalPages = Math.ceil(processedData.length / pageSize);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedData.slice(start, start + pageSize);
  }, [processedData, currentPage, pageSize]);

  return (
    <div className="table-card glass fade-in">
      {title && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '20px',
          paddingBottom: '16px',
          borderBottom: '1px solid #e2e8f0'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h3 style={{
                margin: 0,
                fontFamily: 'var(--font-heading)',
                fontSize: '1.2rem',
                fontWeight: 700,
                color: '#002f6c',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                {icon}
                {title}
              </h3>
              <span style={{
                background: '#e0f2fe',
                color: '#0369a1',
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '2px 10px',
                borderRadius: '99px'
              }}>
                {badge 
                  ? ((startDate || endDate || searchTerm || keywordTerm) ? `${processedData.length} filtered (${badge})` : badge) 
                  : `${processedData.length} records`}
              </span>
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              {subtitle}
              {(startDate || endDate) && (
                <span style={{ color: '#0284c7', fontWeight: 600, marginLeft: '6px' }}>
                  • Date: {startDate ? formatDateDDMMYYYY(startDate) : (allDates[0] ? formatDateDDMMYYYY(allDates[0]) : '')} to {endDate ? formatDateDDMMYYYY(endDate) : (allDates.length > 0 ? formatDateDDMMYYYY(allDates[allDates.length - 1]) : '')}
                </span>
              )}
              {keywordTerm && (
                <span style={{ color: '#d97706', fontWeight: 600, marginLeft: '6px' }}>
                  • Keyword: &quot;{keywordTerm}&quot;
                </span>
              )}
            </div>
          </div>

          {/* Date Slicers */}
          {enableDateFilter && (
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#002f6c', fontWeight: 600, fontSize: '0.8rem' }}>
                <Calendar size={15} />
                <span>Date:</span>
              </div>

              {/* Start Date */}
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
                    if (onDateChange) onDateChange(e.target.value, endDate);
                  }}
                  title="Filter from Start Date"
                  style={{ height: '32px', fontSize: '0.78rem', padding: '4px 8px' }}
                />
                {startDate && (
                  <button 
                    type="button" 
                    className="slicer-clear-btn" 
                    onClick={() => {
                      setStartDate('');
                      setCurrentPage(1);
                      if (onDateChange) onDateChange('', endDate);
                    }}
                    title="Clear Start Date"
                  >
                    <X size={10} />
                  </button>
                )}
              </div>

              <span style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 700 }}>→</span>

              {/* End Date */}
              <div className="slicer-input-wrapper">
                <input 
                  type="date" 
                  className={`slicer-date-input ${endDate ? 'active' : ''}`}
                  value={endDate}
                  min={startDate || (allDates[0] || '')}
                  max={allDates.length > 0 ? allDates[allDates.length - 1] : ''}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setCurrentPage(1);
                    if (onDateChange) onDateChange(startDate, e.target.value);
                  }}
                  title="Filter to End Date"
                  style={{ height: '32px', fontSize: '0.78rem', padding: '4px 8px' }}
                />
                {endDate && (
                  <button 
                    type="button" 
                    className="slicer-clear-btn" 
                    onClick={() => {
                      setEndDate('');
                      setCurrentPage(1);
                      if (onDateChange) onDateChange(startDate, '');
                    }}
                    title="Clear End Date"
                  >
                    <X size={10} />
                  </button>
                )}
              </div>

              {/* Reset button */}
              {(startDate || endDate) && (
                <button
                  type="button"
                  onClick={() => {
                    setStartDate('');
                    setEndDate('');
                    setCurrentPage(1);
                    if (onDateChange) onDateChange('', '');
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 8px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: '#64748b',
                    background: '#f1f5f9',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                  title="Reset date filter"
                >
                  <RotateCcw size={12} />
                  Reset
                </button>
              )}
            </div>
          )}
        </div>
      )}
      <div className="table-header" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <div className="search-box" style={{ flex: '1 1 240px', position: 'relative' }}>
          <input 
            type="text" 
            className="search-input" 
            placeholder={searchPlaceholder} 
            value={searchTerm}
            onChange={handleSearchChange}
          />
          <Search size={16} className="search-icon" />
          {searchTerm && (
            <button 
              type="button" 
              onClick={() => { setSearchTerm(''); setCurrentPage(1); }}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: '#e2e8f0',
                border: 'none',
                borderRadius: '50%',
                cursor: 'pointer',
                color: '#64748b',
                width: '18px',
                height: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0
              }}
              title="Clear search"
            >
              <X size={10} />
            </button>
          )}
        </div>

        {enableKeywordFilter && (
          <div className="search-box" style={{ flex: '1 1 200px', position: 'relative' }}>
            <input 
              type="text" 
              list={`dt-keywords-${title ? title.replace(/\s+/g, '-') : 'list'}`}
              className="search-input" 
              placeholder="Filter by keyword..." 
              value={keywordTerm}
              onChange={(e) => {
                setKeywordTerm(e.target.value);
                setCurrentPage(1);
                if (onKeywordChange) onKeywordChange(e.target.value);
              }}
            />
            <datalist id={`dt-keywords-${title ? title.replace(/\s+/g, '-') : 'list'}`}>
              {allKeywords.map((kw, i) => (
                <option key={i} value={kw} />
              ))}
            </datalist>
            <Tag size={15} className="search-icon" style={{ color: '#0284c7' }} />
            {keywordTerm && (
              <button 
                type="button" 
                onClick={() => {
                  setKeywordTerm('');
                  setCurrentPage(1);
                  if (onKeywordChange) onKeywordChange('');
                }}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: '#e2e8f0',
                  border: 'none',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  color: '#64748b',
                  width: '18px',
                  height: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0
                }}
                title="Clear keyword filter"
              >
                <X size={10} />
              </button>
            )}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)', marginLeft: 'auto' }}>
          <span>Show:</span>
          <select 
            className="filter-control" 
            style={{ minWidth: '80px', padding: '6px 10px' }}
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
          >
            <option value={5}>5 rows</option>
            <option value={10}>10 rows</option>
            <option value={20}>20 rows</option>
            <option value={50}>50 rows</option>
          </select>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="dashboard-table">
          <thead>
            <tr>
              {columns.map(col => (
                <th 
                  key={col.key} 
                  onClick={() => col.sortable !== false && handleSort(col.key)}
                  style={{ cursor: col.sortable !== false ? 'pointer' : 'default', width: col.width }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {col.label}
                    {col.sortable !== false && (
                      <ArrowUpDown size={12} style={{ color: sortConfig.key === col.key ? 'var(--secondary)' : 'var(--text-muted)' }} />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length > 0 ? (
              paginatedData.map((row, idx) => (
                <tr key={idx}>
                  {columns.map(col => (
                    <td key={col.key}>
                      {col.render ? col.render(row[col.key], row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                  No matching records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <div className="pagination-info">
            Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, processedData.length)} of {processedData.length} records
          </div>
          <div className="pagination-btn-group">
            <button 
              className="btn" 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            >
              <ChevronLeft size={16} />
              Prev
            </button>
            <button 
              className="btn" 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default React.memo(DataTable);
