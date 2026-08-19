import React from 'react';
import { Calendar, Filter, Tag, MapPin, Layers, ShoppingBag, Search, X } from 'lucide-react';

export default function Filters({ filters, onFilterChange, availableOptions }) {
  const handleChange = (key, value) => {
    onFilterChange({
      ...filters,
      [key]: value
    });
  };

  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    if (!year || !month || !day) return dateStr;
    const dateObj = new Date(year, month - 1, day);
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="filter-panel glass fade-in">


      {/* 1. Date Filter */}
      <div className="filter-group">
        <label>
          <Calendar size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
          Date
        </label>
        <select 
          className="filter-control" 
          value={filters.scrape_date} 
          onChange={(e) => handleChange('scrape_date', e.target.value)}
        >
          <option value="all">All Dates</option>
          {availableOptions.dates.map(date => (
            <option key={date} value={date}>{formatDisplayDate(date)}</option>
          ))}
        </select>
      </div>

      {/* 2. City, Pincode Filter */}
      <div className="filter-group">
        <label>
          <MapPin size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
          City, Pincode
        </label>
        <select 
          className="filter-control" 
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
        <label>
          <Tag size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
          Brand
        </label>
        <select 
          className="filter-control" 
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
        <label>
          <Layers size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
          Category
        </label>
        <select 
          className="filter-control" 
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
        <label>
          <ShoppingBag size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
          Retailer
        </label>
        <select 
          className="filter-control" 
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
        <label>
          <Search size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
          Search Keyword
        </label>
        <select 
          className="filter-control" 
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
        className="btn" 
        style={{ 
          marginLeft: 'auto',
          whiteSpace: 'nowrap',
          padding: '8px 12px',
          height: '34px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.8rem'
        }}
        onClick={() => onFilterChange({
          scrape_date: 'all',
          city_pincode: 'all',
          brand: 'all',
          category: 'all',
          source_chain: 'all',
          product: 'all'
        })}
      >
        Clear Filters
      </button>
    </div>
  );
}
