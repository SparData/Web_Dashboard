import React, { useState, useMemo, useEffect, lazy, Suspense } from 'react';
import { LayoutDashboard, CheckCircle2, ShoppingBag, LogOut } from 'lucide-react';
import Filters from './components/Filters';
import { bannerAdsData, productListingsData } from './data';

// Dynamic code-splitting: load page components on-demand
const DashboardOverview = lazy(() => import('./pages/DashboardOverview'));
const AdAnalysis = lazy(() => import('./pages/AdAnalysis'));
const ProductInsights = lazy(() => import('./pages/ProductInsights'));
const Login = lazy(() => import('./pages/Login'));

// Top-level date formatter utility
function formatDateStr(dateVal) {
  if (!dateVal) return '';
  if (typeof dateVal === 'string') {
    return dateVal.includes('T') ? dateVal.split('T')[0] : dateVal;
  }
  if (dateVal instanceof Date) {
    return dateVal.toISOString().split('T')[0];
  }
  return String(dateVal);
}

// Lightweight fallback spinner during chunk loading
function DashboardLoadingFallback() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '380px', gap: '16px' }}>
      <div style={{ width: '36px', height: '36px', border: '3px solid #e2e8f0', borderTop: '3px solid #002f6c', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <span style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: 600 }}>Loading dashboard analytics...</span>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('dashboard_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [activeTab, setActiveTab] = useState('overview');
  const [filters, setFilters] = useState({
    start_date: '',
    end_date: '',
    city_pincode: 'all',
    brand: 'all',
    category: 'all',
    source_chain: 'all',
    product: 'all'
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // States for database listings
  const [bannerAds, setBannerAds] = useState([]);
  const [productListings, setProductListings] = useState([]);
  const [distinctTitles, setDistinctTitles] = useState([]);
  const [dbDistinctBrands, setDbDistinctBrands] = useState([]);
  const [dbAvgPrice, setDbAvgPrice] = useState(null);
  const [dbAvgDiscount, setDbAvgDiscount] = useState(null);
  const [dbAvailabilityPercentage, setDbAvailabilityPercentage] = useState(null);
  const [dbAvgSearchRank, setDbAvgSearchRank] = useState(null);
  const [dbStatus, setDbStatus] = useState('connecting'); // 'connecting', 'connected', 'offline'

  // Fetch live database data on component mount
  useEffect(() => {
    async function loadData() {
      try {
        setDbStatus('connecting');
        // Fetch ads, products, distinct options, and consolidated KPIs concurrently
        const [adsRes, productsRes, distinctTitlesRes, distinctBrandsRes, kpisRes] = await Promise.all([
          fetch('http://localhost:5000/api/banner-ads'),
          fetch('http://localhost:5000/api/product-listings'),
          fetch('http://localhost:5000/api/distinct-titles'),
          fetch('http://localhost:5000/api/distinct-brands'),
          fetch('http://localhost:5000/api/kpis')
        ]);

        if (!adsRes.ok || !productsRes.ok || !distinctTitlesRes.ok || !distinctBrandsRes.ok || !kpisRes.ok) {
          throw new Error('Failed to fetch from API');
        }

        const [adsData, productsData, distinctTitlesData, distinctBrandsData, kpisData] = await Promise.all([
          adsRes.json(),
          productsRes.json(),
          distinctTitlesRes.json(),
          distinctBrandsRes.json(),
          kpisRes.json()
        ]);

        setBannerAds(adsData);
        setProductListings(productsData);
        setDistinctTitles(distinctTitlesData);
        setDbDistinctBrands(distinctBrandsData);
        setDbAvgPrice(kpisData.avgPrice);
        setDbAvgDiscount(kpisData.avgDiscount);
        setDbAvailabilityPercentage(kpisData.availabilityPercentage);
        setDbAvgSearchRank(kpisData.avgSearchRank);
        setDbStatus('connected');
      } catch (err) {
        console.warn('⚠️ Server connection failed. Falling back to local mock data.', err);
        setBannerAds(bannerAdsData);
        setProductListings(productListingsData);
        setDistinctTitles(Array.from(new Set(productListingsData.map(p => p.title?.toLowerCase()))).filter(Boolean).sort());
        setDbDistinctBrands(Array.from(new Set(productListingsData.map(p => p.brand?.toLowerCase()))).filter(Boolean).sort());

        // Single-pass fallback KPI calculation for mock data
        let mockTotalPrice = 0;
        let mockPriceCount = 0;
        let mockTotalDiscount = 0;
        let mockDiscountCount = 0;
        let mockAvailableCount = 0;
        let mockTotalRank = 0;
        let mockRankCount = 0;

        for (let i = 0; i < productListingsData.length; i++) {
          const p = productListingsData[i];
          const price = parseFloat(p.price);
          if (!isNaN(price)) {
            mockTotalPrice += price;
            mockPriceCount++;
          }
          let d = null;
          if (p.discount !== undefined && p.discount !== null) {
            const parsedD = parseFloat(p.discount);
            if (!isNaN(parsedD)) d = parsedD;
          }
          if (d === null) {
            const origPrice = parseFloat(p.original_price);
            if (!isNaN(price) && !isNaN(origPrice) && origPrice > 0) {
              d = ((origPrice - price) / origPrice) * 100;
            }
          }
          if (d !== null) {
            mockTotalDiscount += d;
            mockDiscountCount++;
          }
          const isAvail = p.availability === true || p.availability === 'true' || (typeof p.availability === 'string' && p.availability.trim().toLowerCase() === 'yes');
          if (isAvail) mockAvailableCount++;
          const rank = parseFloat(p.rank_num);
          if (!isNaN(rank)) {
            mockTotalRank += rank;
            mockRankCount++;
          }
        }

        setDbAvgPrice(mockPriceCount ? Math.round(mockTotalPrice / mockPriceCount) : 0);
        setDbAvgDiscount(mockDiscountCount ? parseFloat((mockTotalDiscount / mockDiscountCount).toFixed(1)) : 0.0);
        setDbAvailabilityPercentage(productListingsData.length ? parseFloat(((mockAvailableCount / productListingsData.length) * 100).toFixed(2)) : 0.0);
        setDbAvgSearchRank(mockRankCount ? Math.round(mockTotalRank / mockRankCount) : 0);
        setDbStatus('offline');
      }
    }
    loadData();
  }, []);

  // Single-pass computation for dynamic filter options
  const availableOptions = useMemo(() => {
    const datesSet = new Set();
    const cityPincodesMap = {};
    const brandsSet = new Set();
    const categoriesSet = new Set();
    const retailersSet = new Set();
    const searchKeywordsSet = new Set();

    const filterCityPin = filters.city_pincode !== 'all' ? filters.city_pincode.split('|') : null;
    const filterCity = filterCityPin ? filterCityPin[0].toLowerCase() : null;
    const filterPin = filterCityPin ? filterCityPin[1] : null;
    const brandLimitLower = user?.brandLimit ? user.brandLimit.toLowerCase() : null;

    for (let i = 0; i < productListings.length; i++) {
      const p = productListings[i];
      if (brandLimitLower && p.brand?.toLowerCase() !== brandLimitLower) continue;

      const dateStr = formatDateStr(p.scrape_date);
      const matchDate = (!filters.start_date || dateStr >= filters.start_date) && 
                        (!filters.end_date || dateStr <= filters.end_date);

      const itemCity = p.city?.trim() || '';
      const itemPin = p.pincode?.trim() || '';
      const matchCityPin = !filterCityPin || (
        filterPin === 'all' 
          ? itemCity.toLowerCase() === filterCity 
          : (itemCity.toLowerCase() === filterCity && itemPin === filterPin)
      );

      const matchBrand = filters.brand === 'all' || p.brand === filters.brand;
      const matchCategory = filters.category === 'all' || p.category === filters.category;
      const matchRetailer = filters.source_chain === 'all' || p.source_chain === filters.source_chain;
      const matchProduct = filters.product === 'all' || p.product === filters.product;

      // Faceted collection: an option for filter X is populated if item matches all other filters
      if (matchCityPin && matchBrand && matchCategory && matchRetailer && matchProduct) {
        if (dateStr) datesSet.add(dateStr);
      }
      if (matchDate && matchBrand && matchCategory && matchRetailer && matchProduct) {
        if (itemCity) {
          if (!cityPincodesMap[itemCity]) cityPincodesMap[itemCity] = new Set();
          if (itemPin) cityPincodesMap[itemCity].add(itemPin);
        }
      }
      if (matchDate && matchCityPin && matchCategory && matchRetailer && matchProduct) {
        if (p.brand) brandsSet.add(p.brand);
      }
      if (matchDate && matchCityPin && matchBrand && matchRetailer && matchProduct) {
        if (p.category) categoriesSet.add(p.category);
      }
      if (matchDate && matchCityPin && matchBrand && matchCategory && matchProduct) {
        if (p.source_chain) retailersSet.add(p.source_chain);
      }
      if (matchDate && matchCityPin && matchBrand && matchCategory && matchRetailer) {
        if (p.product) searchKeywordsSet.add(p.product);
      }
    }

    const cityPincodes = {};
    Object.keys(cityPincodesMap).sort().forEach(city => {
      cityPincodes[city] = Array.from(cityPincodesMap[city]).sort();
    });

    return {
      dates: Array.from(datesSet).sort(),
      cityPincodes,
      brands: Array.from(brandsSet).sort(),
      categories: Array.from(categoriesSet).sort(),
      retailers: Array.from(retailersSet).sort(),
      searchKeywords: Array.from(searchKeywordsSet).sort()
    };
  }, [productListings, user, filters]);

  // Filter datasets based on active filters & user brand limit
  const filteredBannerAds = useMemo(() => {
    const brandLimitLower = user?.brandLimit ? user.brandLimit.toLowerCase() : null;
    const result = [];

    for (let i = 0; i < bannerAds.length; i++) {
      const ad = bannerAds[i];
      if (brandLimitLower && ad.brand?.toLowerCase() !== brandLimitLower) continue;
      if (filters.brand !== 'all' && ad.brand !== filters.brand) continue;
      if (filters.category !== 'all' && ad.category !== filters.category) continue;
      if (filters.product !== 'all' && ad.search_keyword !== filters.product) continue;

      const dateStr = formatDateStr(ad.scrape_date);
      if (filters.start_date && dateStr < filters.start_date) continue;
      if (filters.end_date && dateStr > filters.end_date) continue;

      result.push(ad);
    }
    return result;
  }, [bannerAds, filters, user]);

  const filteredProductListings = useMemo(() => {
    const filterCityPin = filters.city_pincode !== 'all' ? filters.city_pincode.split('|') : null;
    const filterCity = filterCityPin ? filterCityPin[0].toLowerCase() : null;
    const filterPin = filterCityPin ? filterCityPin[1] : null;
    const brandLimitLower = user?.brandLimit ? user.brandLimit.toLowerCase() : null;

    const result = [];
    for (let i = 0; i < productListings.length; i++) {
      const p = productListings[i];
      if (brandLimitLower && p.brand?.toLowerCase() !== brandLimitLower) continue;
      if (filters.brand !== 'all' && p.brand !== filters.brand) continue;
      if (filters.category !== 'all' && p.category !== filters.category) continue;
      if (filters.source_chain !== 'all' && p.source_chain !== filters.source_chain) continue;
      if (filters.product !== 'all' && p.product !== filters.product) continue;

      const dateStr = formatDateStr(p.scrape_date);
      if (filters.start_date && dateStr < filters.start_date) continue;
      if (filters.end_date && dateStr > filters.end_date) continue;

      if (filterCityPin) {
        const itemCity = (p.city?.trim() || '').toLowerCase();
        const itemPin = p.pincode?.trim() || '';
        if (itemCity !== filterCity) continue;
        if (filterPin !== 'all' && itemPin !== filterPin) continue;
      }

      result.push(p);
    }
    return result;
  }, [productListings, filters, user]);

  // Single-pass computation for active statistics over filtered dataset
  const stats = useMemo(() => {
    let totalPrice = 0;
    let priceCount = 0;
    let totalRating = 0;
    let ratingCount = 0;
    let availableCount = 0;
    let totalDiscount = 0;
    let discountCount = 0;
    let totalRank = 0;
    let rankCount = 0;
    const distinctProductTitles = new Set();
    const distinctFilteredBrands = new Set();

    const len = filteredProductListings.length;
    for (let i = 0; i < len; i++) {
      const p = filteredProductListings[i];

      // Price aggregation
      if (p.price !== undefined && p.price !== null) {
        const price = parseFloat(p.price);
        if (!isNaN(price)) {
          totalPrice += price;
          priceCount++;
        }
      }

      // Rating aggregation
      if (p.rating_of_5 !== undefined && p.rating_of_5 !== null) {
        const r = parseFloat(p.rating_of_5);
        if (!isNaN(r)) {
          totalRating += r;
          ratingCount++;
        }
      }

      // Search rank aggregation
      if (p.rank_num !== undefined && p.rank_num !== null) {
        const r = parseFloat(p.rank_num);
        if (!isNaN(r) && r > 0) {
          totalRank += r;
          rankCount++;
        }
      }

      // Availability check
      const isAvailable = p.availability === true || p.availability === 'true' || 
        (typeof p.availability === 'string' && p.availability.trim().toLowerCase() === 'yes');
      if (isAvailable) {
        availableCount++;
      }

      // Discount aggregation
      let d = null;
      if (p.discount !== undefined && p.discount !== null) {
        const parsedD = parseFloat(p.discount);
        if (!isNaN(parsedD)) d = parsedD;
      }
      if (d === null) {
        const price = parseFloat(p.price);
        const origPrice = parseFloat(p.original_price);
        if (!isNaN(price) && !isNaN(origPrice) && origPrice > 0) {
          d = ((origPrice - price) / origPrice) * 100;
        }
      }
      if (d !== null) {
        totalDiscount += d;
        discountCount++;
      }

      // Distinct SKU & Brand sets
      if (p.title) distinctProductTitles.add(p.title.toLowerCase());
      if (p.brand) distinctFilteredBrands.add(p.brand.toLowerCase());
    }

    const hasActiveFilters = Boolean(filters.start_date) || 
                             Boolean(filters.end_date) || 
                             filters.city_pincode !== 'all' || 
                             filters.brand !== 'all' || 
                             filters.category !== 'all' || 
                             filters.source_chain !== 'all' || 
                             filters.product !== 'all';

    const isFiltered = Boolean(user?.brandLimit || hasActiveFilters);

    // Calculated metrics from active filtered dataset
    const calcAvgPrice = priceCount > 0 ? Math.round(totalPrice / priceCount) : 0;
    const calcAvgDiscount = discountCount > 0 ? parseFloat((totalDiscount / discountCount).toFixed(1)) : 0.0;
    const calcAvailabilityRate = len > 0 ? parseFloat(((availableCount / len) * 100).toFixed(2)) : 0.0;
    const calcOutOfStockRate = len > 0 ? parseFloat((100 - calcAvailabilityRate).toFixed(2)) : 0.0;
    const calcAvgRating = ratingCount > 0 ? (totalRating / ratingCount).toFixed(2) : "0.00";
    const calcAvgSearchRank = rankCount > 0 ? Math.round(totalRank / rankCount) : 0;

    // Values to display: use db summary if unfiltered, or calculated metrics if filters active
    const displayAvgPrice = isFiltered ? calcAvgPrice : (dbAvgPrice ?? calcAvgPrice);
    const displayAvgDiscount = isFiltered ? calcAvgDiscount : (dbAvgDiscount ?? calcAvgDiscount);
    const displayAvailabilityRate = isFiltered ? calcAvailabilityRate : (dbAvailabilityPercentage ?? calcAvailabilityRate);
    const displayOutOfStockRate = isFiltered ? calcOutOfStockRate : (dbAvailabilityPercentage !== null ? parseFloat((100 - dbAvailabilityPercentage).toFixed(2)) : calcOutOfStockRate);
    const displayAvgSearchRank = isFiltered ? calcAvgSearchRank : (dbAvgSearchRank ?? calcAvgSearchRank);

    let totalBrandsCount = dbDistinctBrands.length;
    if (user?.brandLimit) {
      const hasBrand = dbDistinctBrands.some(b => b.toLowerCase() === user.brandLimit.toLowerCase());
      totalBrandsCount = hasBrand ? 1 : 0;
    } else if (hasActiveFilters) {
      totalBrandsCount = distinctFilteredBrands.size;
    }

    return {
      distinctProducts: {
        value: distinctProductTitles.size,
        label: 'Total Products',
        unit: 'products'
      },
      totalBrands: {
        value: totalBrandsCount,
        label: 'Total Brands',
        unit: 'brands'
      },
      avgPrice: {
        value: displayAvgPrice,
        label: 'Avg Product Price',
        unit: '₹'
      },
      avgRating: {
        value: calcAvgRating,
        label: 'Average Rating',
        unit: '/ 5 ★'
      },
      availabilityRate: {
        value: displayAvailabilityRate,
        label: 'Active Product %',
        unit: '%'
      },
      avgDiscount: {
        value: displayAvgDiscount,
        label: 'Avg Discount',
        unit: '%'
      },
      outOfStockRate: {
        value: displayOutOfStockRate,
        label: 'Out of Stock %',
        unit: '%'
      },
      avgSearchRank: {
        value: displayAvgSearchRank,
        label: 'Avg Search Rank',
        unit: '#'
      }
    };
  }, [filteredProductListings, dbDistinctBrands, dbAvgPrice, dbAvgDiscount, dbAvailabilityPercentage, dbAvgSearchRank, user, filters]);

  const handleKpiClick = (kpiKey) => {
    if (['avgPrice', 'avgRating', 'avgDiscount', 'availabilityRate', 'totalBrands', 'distinctProducts', 'outOfStockRate'].includes(kpiKey)) {
      if (user?.dashboardId === 'full' || user?.dashboardId === 'catalog-focus') {
        setActiveTab('products');
      }
    }
  };

  const renderActiveContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <DashboardOverview 
            bannerAds={filteredBannerAds} 
            productListings={filteredProductListings} 
            stats={stats} 
            onKpiClick={handleKpiClick}
          />
        );
      case 'ads':
        return (
          <AdAnalysis 
            bannerAds={filteredBannerAds} 
            productListings={filteredProductListings} 
            stats={stats} 
            onKpiClick={handleKpiClick}
          />
        );
      case 'products':
        return <ProductInsights productListings={filteredProductListings} distinctTitles={distinctTitles} />;
      default:
        return null;
    }
  };

  if (!user) {
    return (
      <Suspense fallback={<DashboardLoadingFallback />}>
        <Login 
          onLogin={(userData) => {
            try {
              localStorage.setItem('dashboard_user', JSON.stringify(userData));
            } catch {}
            setUser(userData);
            setActiveTab('overview');
          }} 
        />
      </Suspense>
    );
  }

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className={`sidebar ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="sidebar-logo" style={{ background: '#ffffff', borderRadius: '8px', padding: '10px 14px', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '32px' }}>
          <img src="/logo.jpg" alt="SAPERE KROGNOS Logo" style={{ height: '36px', maxWidth: '100%', objectFit: 'contain' }} />
        </div>

        <nav style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          <ul className="nav-links" style={{ height: '100%' }}>
            <li>
              <div 
                className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => { setActiveTab('overview'); setMobileMenuOpen(false); }}
              >
                <LayoutDashboard size={18} />
                <span>Overall Insights</span>
              </div>
            </li>
            {(user.dashboardId === 'full' || user.dashboardId === 'ads-focus') && (
              <li>
                <div 
                  className={`nav-item ${activeTab === 'ads' ? 'active' : ''}`}
                  onClick={() => { setActiveTab('ads'); setMobileMenuOpen(false); }}
                >
                  <CheckCircle2 size={18} />
                  <span>Availability</span>
                </div>
              </li>
            )}
            {(user.dashboardId === 'full' || user.dashboardId === 'catalog-focus') && (
              <li>
                <div 
                  className={`nav-item ${activeTab === 'products' ? 'active' : ''}`}
                  onClick={() => { setActiveTab('products'); setMobileMenuOpen(false); }}
                >
                  <ShoppingBag size={18} />
                  <span>SKU Specific Data</span>
                </div>
              </li>
            )}
            <li style={{ marginTop: 'auto' }}>
              <div 
                className="nav-item"
                style={{ color: 'var(--danger)', marginTop: '24px' }}
                onClick={() => {
                  try {
                    localStorage.removeItem('dashboard_user');
                  } catch {}
                  setUser(null);
                }}
              >
                <LogOut size={18} />
                <span>Sign Out</span>
              </div>
            </li>
          </ul>
        </nav>

        <div className="sidebar-footer">
          v1.0.0 (Vite + React)
        </div>
      </aside>

      {/* Main Workspace */}
      <main className="main-content">
        <header className="top-header">
          <div className="header-title">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h1>Automated BI Dashboard</h1>
              {dbStatus === 'connected' ? (
                <span className="badge success" style={{ fontSize: '0.75rem', padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: '6px' }} title="Connected to PostgreSQL database: Analytics_DB on port 5000">
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }} />
                  Live Database
                </span>
              ) : dbStatus === 'connecting' ? (
                <span className="badge warning" style={{ fontSize: '0.75rem', padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: '6px' }} title="Fetching records from PostgreSQL...">
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#f59e0b', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
                  Connecting DB...
                </span>
              ) : (
                <span className="badge danger" style={{ fontSize: '0.75rem', padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: '6px' }} title="Backend server at http://localhost:5000 is not reachable">
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#ef4444', display: 'inline-block' }} />
                  Offline (Demo Mode)
                </span>
              )}
            </div>
            <p>Comprehensive insights for Digital Shelf Share, Banner Ads, and Product Listings</p>
          </div>

          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#000000' }}>{user.email}</span>
              <span style={{ fontSize: '0.72rem', color: '#0284c7', fontWeight: 600 }}>{user.role}</span>
            </div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>|</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Last Sync: {dbStatus === 'connected' ? 'Live' : 'Mock Data'}
            </span>
          </div>
        </header>

        {/* Global Interactive Filters */}
        <Filters 
          filters={filters} 
          onFilterChange={setFilters} 
          availableOptions={availableOptions} 
        />

        {/* Dynamic Page Views */}
        <div style={{ minHeight: '60vh' }}>
          <Suspense fallback={<DashboardLoadingFallback />}>
            {renderActiveContent()}
          </Suspense>
        </div>
      </main>
    </div>
  );
}
