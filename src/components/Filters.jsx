import React, { useCallback } from 'react';
import { Calendar, Tag, MapPin, Layers, ShoppingBag, Search, X, RotateCcw } from 'lucide-react';

function Filters({ filters, onFilterChange, availableOptions }) {
  const handleChange = useCallback((key, value) => {
    onFilterChange({
      ...filters,
      [key]: value
    });
  }, [filters, onFilterChange]);

  const handleClearSingle = useCallback((key) => {
    onFilterChange({
      ...filters,
      [key]: (key === 'start_date' || key === 'end_date') ? '' : 'all'
    });
  }, [filters, onFilterChange]);

  const handleResetAll = useCallback(() => {
    onFilterChange({
      start_date: '',
      end_date: '',
      city_pincode: 'all',
      brand: 'all',
      category: 'all',
      source_chain: 'all',
      product: 'all'
    });
  }, [onFilterChange]);

  const minAvailableDate = availableOptions.dates?.[0] || '';
  const maxAvailableDate = availableOptions.dates?.length ? availableOptions.dates[availableOptions.dates.length - 1] : '';

  return (
    <div className="filter-panel glass fade-in">

      {/* 1. Date Slicers: Start Date & End Date */}
      <div className="filter-group" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
        {/* Start Date */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div className="filter-header">
            <label>
              <Calendar size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
              Start Date
            </label>
            {filters.start_date && (
              <button 
                type="button" 
                className="filter-clear-btn" 
                onClick={() => handleClearSingle('start_date')}
                title="Clear Start Date"
                aria-label="Clear Start Date"
              >
                <X size={10} />
              </button>
            )}
          </div>
          <input 
            type="date" 
            className={`filter-control ${filters.start_date ? 'active-filter' : ''}`}
            value={filters.start_date || ''} 
            min={minAvailableDate}
            max={filters.end_date || maxAvailableDate}
            onChange={(e) => handleChange('start_date', e.target.value)}
            style={{ minWidth: '130px' }}
          />
        </div>

        {/* Separator Arrow */}
        <span style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 700, marginTop: '18px' }}>→</span>

        {/* End Date */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div className="filter-header">
            <label>
              <Calendar size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
              End Date
            </label>
            {filters.end_date && (
              <button 
                type="button" 
                className="filter-clear-btn" 
                onClick={() => handleClearSingle('end_date')}
                title="Clear End Date"
                aria-label="Clear End Date"
              >
                <X size={10} />
              </button>
            )}
          </div>
          <input 
            type="date" 
            className={`filter-control ${filters.end_date ? 'active-filter' : ''}`}
            value={filters.end_date || ''} 
            min={filters.start_date || minAvailableDate}
            max={maxAvailableDate}
            onChange={(e) => handleChange('end_date', e.target.value)}
            style={{ minWidth: '130px' }}
          />
        </div>
      </div>

      {/* 2. City, Pincode Filter */}
      <div className="filter-group">
        <div className="filter-header">
          <label>
            <MapPin size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
            City, Pincode
          </label>
          {filters.city_pincode !== 'all' && (
            <button 
              type="button" 
              className="filter-clear-btn" 
              onClick={() => handleClearSingle('city_pincode')}
              title="Clear City/Pincode filter"
              aria-label="Clear City/Pincode filter"
            >
              <X size={10} />
            </button>
          )}
        </div>
        <select 
          className={`filter-control ${filters.city_pincode !== 'all' ? 'active-filter' : ''}`}
          value={filters.city_pincode} 
          onChange={(e) => handleChange('city_pincode', e.target.value)}
        >
          <option value="all">All Cities & Pincodes</option>
          {availableOptions.cityPincodes && Object.entries(availableOptions.cityPincodes).map(([city, pincodes]) => (
            <optgroup key={city} label={city}>
              <option value={`${city}|all`}>All {city}</option>
              {pincodes.map(pin => (
                <option key={pin} value={`${city}|${pin}`}>{pin}</option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      {/* 3. Brand Filter */}
      <div className="filter-group">
        <div className="filter-header">
          <label>
            <Tag size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
            Brand
          </label>
          {filters.brand !== 'all' && (
            <button 
              type="button" 
              className="filter-clear-btn" 
              onClick={() => handleClearSingle('brand')}
              title="Clear Brand filter"
              aria-label="Clear Brand filter"
            >
              <X size={10} />
            </button>
          )}
        </div>
        <select 
          className={`filter-control ${filters.brand !== 'all' ? 'active-filter' : ''}`}
          value={filters.brand} 
          onChange={(e) => handleChange('brand', e.target.value)}
        >
          <option value="all">All Brands</option>
          {availableOptions.brands.map(brand => (
            <option key={brand} value={brand}>{brand}</option>
          ))}
        </select>
      </div>

      {/* 4. Category Filter */}
      <div className="filter-group">
        <div className="filter-header">
          <label>
            <Layers size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
            Category
          </label>
          {filters.category !== 'all' && (
            <button 
              type="button" 
              className="filter-clear-btn" 
              onClick={() => handleClearSingle('category')}
              title="Clear Category filter"
              aria-label="Clear Category filter"
            >
              <X size={10} />
            </button>
          )}
        </div>
        <select 
          className={`filter-control ${filters.category !== 'all' ? 'active-filter' : ''}`}
          value={filters.category} 
          onChange={(e) => handleChange('category', e.target.value)}
        >
          <option value="all">All Categories</option>
          {availableOptions.categories.map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
      </div>

      {/* 5. Retailer Filter (source_chain) */}
      <div className="filter-group">
        <div className="filter-header">
          <label>
            <ShoppingBag size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
            Retailer
          </label>
          {filters.source_chain !== 'all' && (
            <button 
              type="button" 
              className="filter-clear-btn" 
              onClick={() => handleClearSingle('source_chain')}
              title="Clear Retailer filter"
              aria-label="Clear Retailer filter"
            >
              <X size={10} />
            </button>
          )}
        </div>
        <select 
          className={`filter-control ${filters.source_chain !== 'all' ? 'active-filter' : ''}`}
          value={filters.source_chain} 
          onChange={(e) => handleChange('source_chain', e.target.value)}
        >
          <option value="all">All Retailers</option>
          {availableOptions.retailers.map(retailer => (
            <option key={retailer} value={retailer}>{retailer}</option>
          ))}
        </select>
      </div>

      {/* 6. Search Keyword Filter (product) */}
      <div className="filter-group">
        <div className="filter-header">
          <label>
            <Search size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
            Search Keyword
          </label>
          {filters.product !== 'all' && (
            <button 
              type="button" 
              className="filter-clear-btn" 
              onClick={() => handleClearSingle('product')}
              title="Clear Search Keyword filter"
              aria-label="Clear Search Keyword filter"
            >
              <X size={10} />
            </button>
          )}
        </div>
        <select 
          className={`filter-control ${filters.product !== 'all' ? 'active-filter' : ''}`}
          value={filters.product} 
          onChange={(e) => handleChange('product', e.target.value)}
        >
          <option value="all">All Search Keywords</option>
          {availableOptions.searchKeywords.map(keyword => (
            <option key={keyword} value={keyword}>{keyword}</option>
          ))}
        </select>
      </div>

      {/* Reset Button */}
      <button 
        type="button"
        className="filter-reset-btn" 
        title="Reset all filters"
        onClick={handleResetAll}
      >
        <RotateCcw size={13} />
        Clear Filters
      </button>
    </div>
  );
}

export default React.memo(Filters);
