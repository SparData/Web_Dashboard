import React, { useState, useMemo, useEffect } from 'react';
import { LayoutDashboard, Image, ShoppingBag, Menu, X, Database, LogOut } from 'lucide-react';
import Filters from './components/Filters';
import DashboardOverview from './pages/DashboardOverview';
import AdAnalysis from './pages/AdAnalysis';
import ProductInsights from './pages/ProductInsights';
import Login from './pages/Login';
import { bannerAdsData, productListingsData } from './data';

export default function App() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('dashboard_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [activeTab, setActiveTab] = useState('overview');
  const [filters, setFilters] = useState({
    scrape_date: 'all',
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
        const [adsRes, productsRes, distinctTitlesRes, distinctBrandsRes, avgPriceRes, avgDiscountRes, availabilityPercentageRes, avgSearchRankRes] = await Promise.all([
          fetch('http://localhost:5000/api/banner-ads'),
          fetch('http://localhost:5000/api/product-listings'),
          fetch('http://localhost:5000/api/distinct-titles'),
          fetch('http://localhost:5000/api/distinct-brands'),
          fetch('http://localhost:5000/api/avg-price'),
          fetch('http://localhost:5000/api/avg-discount'),
          fetch('http://localhost:5000/api/availability-percentage'),
          fetch('http://localhost:5000/api/avg-search-rank')
        ]);

        if (!adsRes.ok || !productsRes.ok || !distinctTitlesRes.ok || !distinctBrandsRes.ok || !avgPriceRes.ok || !avgDiscountRes.ok || !availabilityPercentageRes.ok || !avgSearchRankRes.ok) {
          throw new Error('Failed to fetch from API');
        }

        const adsData = await adsRes.json();
        const productsData = await productsRes.json();
        const distinctTitlesData = await distinctTitlesRes.json();
        const distinctBrandsData = await distinctBrandsRes.json();
        const avgPriceData = await avgPriceRes.json();
        const avgDiscountData = await avgDiscountRes.json();
        const availabilityPercentageData = await availabilityPercentageRes.json();
        const avgSearchRankData = await avgSearchRankRes.json();

        setBannerAds(adsData);
        setProductListings(productsData);
        setDistinctTitles(distinctTitlesData);
        setDbDistinctBrands(distinctBrandsData);
        setDbAvgPrice(avgPriceData.avgPrice);
        setDbAvgDiscount(avgDiscountData.avgDiscount);
        setDbAvailabilityPercentage(availabilityPercentageData.availabilityPercentage);
        setDbAvgSearchRank(avgSearchRankData.avgSearchRank);
        setDbStatus('connected');
      } catch (err) {
        console.warn('⚠️ Server connection failed. Falling back to local mock data.', err);
        setBannerAds(bannerAdsData);
        setProductListings(productListingsData);
        setDistinctTitles(Array.from(new Set(productListingsData.map(p => p.title?.toLowerCase()))).filter(Boolean).sort());
        setDbDistinctBrands(Array.from(new Set(productListingsData.map(p => p.brand?.toLowerCase()))).filter(Boolean).sort());
        const mockPrices = productListingsData.map(p => parseFloat(p.price)).filter(p => !isNaN(p));
        const mockAvgPrice = mockPrices.length ? Math.round(mockPrices.reduce((sum, p) => sum + p, 0) / mockPrices.length) : 0;
        setDbAvgPrice(mockAvgPrice);
        const mockDiscounts = productListingsData.map(p => {
          if (p.discount !== undefined && p.discount !== null) {
            const d = parseFloat(p.discount);
            if (!isNaN(d)) return d;
          }
          const price = parseFloat(p.price);
          const originalPrice = parseFloat(p.original_price);
          if (!isNaN(price) && !isNaN(originalPrice) && originalPrice > 0) {
            return ((originalPrice - price) / originalPrice) * 100;
          }
          return null;
        }).filter(d => d !== null);
        const mockAvgDiscount = mockDiscounts.length 
          ? parseFloat((mockDiscounts.reduce((sum, d) => sum + d, 0) / mockDiscounts.length).toFixed(1)) 
          : 0.0;
        setDbAvgDiscount(mockAvgDiscount);
        const mockAvailable = productListingsData.filter(p => p.availability === true || p.availability === 'true' || (typeof p.availability === 'string' && p.availability.trim().toLowerCase() === 'yes')).length;
        const mockAvailabilityPercentage = productListingsData.length 
          ? parseFloat(((mockAvailable / productListingsData.length) * 100).toFixed(2)) 
          : 0.0;
        setDbAvailabilityPercentage(mockAvailabilityPercentage);
        const mockRanks = productListingsData.map(p => parseFloat(p.rank_num)).filter(r => !isNaN(r));
        const mockAvgSearchRank = mockRanks.length ? Math.round(mockRanks.reduce((sum, r) => sum + r, 0) / mockRanks.length) : 0;
        setDbAvgSearchRank(mockAvgSearchRank);
        setDbStatus('offline');
      }
    }
    loadData();
  }, []);

  // Extract filter dropdown options dynamically & apply client brand limits
  const availableOptions = useMemo(() => {
    let products = productListings;

    if (user?.brandLimit) {
      products = products.filter(p => p.brand?.toLowerCase() === user.brandLimit.toLowerCase());
    }

    const formatDateStr = (dateVal) => {
      if (!dateVal) return '';
      if (typeof dateVal === 'string') {
        return dateVal.includes('T') ? dateVal.split('T')[0] : dateVal;
      }
      if (dateVal instanceof Date) {
        return dateVal.toISOString().split('T')[0];
      }
      return String(dateVal);
    };

    const dates = Array.from(new Set(
      products.map(p => formatDateStr(p.scrape_date))
    )).filter(Boolean).sort();

    const cityPincodesMap = {};
    products.forEach(p => {
      const city = p.city?.trim();
      const pin = p.pincode?.trim();
      if (city) {
        if (!cityPincodesMap[city]) {
          cityPincodesMap[city] = new Set();
        }
        if (pin) {
          cityPincodesMap[city].add(pin);
        }
      }
    });

    const cityPincodes = {};
    Object.keys(cityPincodesMap).sort().forEach(city => {
      cityPincodes[city] = Array.from(cityPincodesMap[city]).sort();
    });

    const brands = Array.from(new Set(
      products.map(p => p.brand)
    )).filter(Boolean).sort();

    const categories = Array.from(new Set(
      products.map(p => p.category)
    )).filter(Boolean).sort();

    const retailers = Array.from(new Set(
      products.map(p => p.source_chain)
    )).filter(Boolean).sort();

    const searchKeywords = Array.from(new Set(
      products.map(p => p.product)
    )).filter(Boolean).sort();

    return { dates, cityPincodes, brands, categories, retailers, searchKeywords };
  }, [productListings, user]);

  // Filter datasets based on active filters & user brand limit
  const filteredBannerAds = useMemo(() => {
    const formatDateStr = (dateVal) => {
      if (!dateVal) return '';
      if (typeof dateVal === 'string') {
        return dateVal.includes('T') ? dateVal.split('T')[0] : dateVal;
      }
      if (dateVal instanceof Date) {
        return dateVal.toISOString().split('T')[0];
      }
      return String(dateVal);
    };

    return bannerAds.filter(ad => {
      if (user?.brandLimit && ad.brand?.toLowerCase() !== user.brandLimit.toLowerCase()) {
        return false;
      }
      const matchDate = filters.scrape_date === 'all' || 
                        formatDateStr(ad.scrape_date) === filters.scrape_date;
      const matchBrand = filters.brand === 'all' || ad.brand === filters.brand;
      const matchCategory = filters.category === 'all' || ad.category === filters.category;
      const matchProduct = filters.product === 'all' || ad.search_keyword === filters.product;
      return matchDate && matchBrand && matchCategory && matchProduct;
    });
  }, [bannerAds, filters, user]);

  const filteredProductListings = useMemo(() => {
    const formatDateStr = (dateVal) => {
      if (!dateVal) return '';
      if (typeof dateVal === 'string') {
        return dateVal.includes('T') ? dateVal.split('T')[0] : dateVal;
      }
      if (dateVal instanceof Date) {
        return dateVal.toISOString().split('T')[0];
      }
      return String(dateVal);
    };

    return productListings.filter(p => {
      if (user?.brandLimit && p.brand?.toLowerCase() !== user.brandLimit.toLowerCase()) {
        return false;
      }
      const matchDate = filters.scrape_date === 'all' || 
                        formatDateStr(p.scrape_date) === filters.scrape_date;
      
      let matchCityPincode = true;
      if (filters.city_pincode !== 'all') {
        const [filterCity, filterPin] = filters.city_pincode.split('|');
        const itemCity = p.city?.trim() || '';
        const itemPin = p.pincode?.trim() || '';
        if (filterPin === 'all') {
          matchCityPincode = itemCity.toLowerCase() === filterCity.toLowerCase();
        } else {
          matchCityPincode = (itemCity.toLowerCase() === filterCity.toLowerCase()) && 
                             (itemPin === filterPin);
        }
      }
      
      const matchBrand = filters.brand === 'all' || p.brand === filters.brand;
      const matchCategory = filters.category === 'all' || p.category === filters.category;
      const matchPlatform = filters.source_chain === 'all' || p.source_chain === filters.source_chain;
      const matchProduct = filters.product === 'all' || p.product === filters.product;
      
      return matchDate && matchCityPincode && matchBrand && matchCategory && matchPlatform && matchProduct;
    });
  }, [productListings, filters, user]);

  // Dynamic Timeline Calculation for Sparklines and Trends (omitting the date filter)
  const timelineBannerAds = useMemo(() => {
    return bannerAds.filter(ad => {
      if (user?.brandLimit && ad.brand?.toLowerCase() !== user.brandLimit.toLowerCase()) {
        return false;
      }
      const matchBrand = filters.brand === 'all' || ad.brand === filters.brand;
      const matchCategory = filters.category === 'all' || ad.category === filters.category;
      const matchProduct = filters.product === 'all' || ad.search_keyword === filters.product;
      return matchBrand && matchCategory && matchProduct;
    });
  }, [bannerAds, filters.brand, filters.category, filters.product, user]);

  const timelineProductListings = useMemo(() => {
    return productListings.filter(p => {
      if (user?.brandLimit && p.brand?.toLowerCase() !== user.brandLimit.toLowerCase()) {
        return false;
      }
      
      let matchCityPincode = true;
      if (filters.city_pincode !== 'all') {
        const [filterCity, filterPin] = filters.city_pincode.split('|');
        const itemCity = p.city?.trim() || '';
        const itemPin = p.pincode?.trim() || '';
        if (filterPin === 'all') {
          matchCityPincode = itemCity.toLowerCase() === filterCity.toLowerCase();
        } else {
          matchCityPincode = (itemCity.toLowerCase() === filterCity.toLowerCase()) && 
                             (itemPin === filterPin);
        }
      }
      
      const matchBrand = filters.brand === 'all' || p.brand === filters.brand;
      const matchCategory = filters.category === 'all' || p.category === filters.category;
      const matchPlatform = filters.source_chain === 'all' || p.source_chain === filters.source_chain;
      const matchProduct = filters.product === 'all' || p.product === filters.product;
      
      return matchCityPincode && matchBrand && matchCategory && matchPlatform && matchProduct;
    });
  }, [productListings, filters.city_pincode, filters.brand, filters.category, filters.source_chain, filters.product, user]);

  const formatDateStr = (dateVal) => {
    if (!dateVal) return '';
    if (typeof dateVal === 'string') {
      return dateVal.includes('T') ? dateVal.split('T')[0] : dateVal;
    }
    if (dateVal instanceof Date) {
      return dateVal.toISOString().split('T')[0];
    }
    return String(dateVal);
  };

  const timelineDates = useMemo(() => {
    const dates = new Set([
      ...timelineBannerAds.map(ad => formatDateStr(ad.scrape_date)),
      ...timelineProductListings.map(p => formatDateStr(p.scrape_date))
    ]);
    return Array.from(dates).filter(Boolean).sort();
  }, [timelineBannerAds, timelineProductListings]);

  // Compute active statistics over the filtered dataset as a whole
  const stats = useMemo(() => {
    const computeKpis = (ads, products) => {
      const totalAds = ads.length;
      
      const prices = products.map(p => parseFloat(p.price)).filter(p => !isNaN(p));
      const avgPrice = prices.length 
        ? Math.round(prices.reduce((sum, p) => sum + p, 0) / prices.length) 
        : 0;

      const ratings = products.map(p => parseFloat(p.rating_of_5)).filter(r => !isNaN(r));
      const avgRating = ratings.length 
        ? (ratings.reduce((sum, r) => sum + r, 0) / ratings.length).toFixed(2)
        : "0.00";

      const totalProducts = products.length;
      const availableCount = products.filter(p => p.availability === true || p.availability === 'true' || (typeof p.availability === 'string' && p.availability.trim().toLowerCase() === 'yes')).length;
      const availabilityRate = totalProducts 
        ? parseFloat(((availableCount / totalProducts) * 100).toFixed(2)) 
        : 0.0;

      const discounts = products.map(p => {
        if (p.discount !== undefined && p.discount !== null) {
          const d = parseFloat(p.discount);
          if (!isNaN(d)) return d;
        }
        const price = parseFloat(p.price);
        const originalPrice = parseFloat(p.original_price);
        if (!isNaN(price) && !isNaN(originalPrice) && originalPrice > 0) {
          return ((originalPrice - price) / originalPrice) * 100;
        }
        return null;
      }).filter(d => d !== null);

      const avgDiscount = discounts.length 
        ? parseFloat((discounts.reduce((sum, d) => sum + d, 0) / discounts.length).toFixed(1)) 
        : 0.0;

      const distinctProducts = Array.from(new Set(products.map(p => p.title?.toLowerCase()))).filter(Boolean).length;

      const ranks = products.map(p => parseFloat(p.rank_num)).filter(r => !isNaN(r));
      const avgSearchRank = ranks.length 
        ? Math.round(ranks.reduce((sum, r) => sum + r, 0) / ranks.length) 
        : 0;

      return { totalAds, avgPrice, avgRating, availabilityRate, avgDiscount, distinctProducts, avgSearchRank };
    };

    const currentKpis = computeKpis(filteredBannerAds, filteredProductListings);

    // Compute total brands count respecting user brandLimit
    let totalBrandsCount = dbDistinctBrands.length;
    if (user?.brandLimit) {
      const hasBrand = dbDistinctBrands.some(b => b.toLowerCase() === user.brandLimit.toLowerCase());
      totalBrandsCount = hasBrand ? 1 : 0;
    }

    // Determine average price to display
    let displayAvgPrice = dbAvgPrice;
    if (user?.brandLimit) {
      // If brand limit is present, use the filtered products average
      const prices = filteredProductListings.map(p => parseFloat(p.price)).filter(p => !isNaN(p));
      displayAvgPrice = prices.length 
        ? Math.round(prices.reduce((sum, p) => sum + p, 0) / prices.length) 
        : 0;
    } else if (displayAvgPrice === null || displayAvgPrice === undefined) {
      displayAvgPrice = currentKpis.avgPrice;
    }

    // Determine average discount to display
    let displayAvgDiscount = dbAvgDiscount;
    if (user?.brandLimit) {
      // If brand limit is present, use the filtered products average discount
      const discounts = filteredProductListings.map(p => {
        if (p.discount !== undefined && p.discount !== null) {
          const d = parseFloat(p.discount);
          if (!isNaN(d)) return d;
        }
        const price = parseFloat(p.price);
        const originalPrice = parseFloat(p.original_price);
        if (!isNaN(price) && !isNaN(originalPrice) && originalPrice > 0) {
          return ((originalPrice - price) / originalPrice) * 100;
        }
        return null;
      }).filter(d => d !== null);
      displayAvgDiscount = discounts.length 
        ? parseFloat((discounts.reduce((sum, d) => sum + d, 0) / discounts.length).toFixed(1)) 
        : 0.0;
    } else if (displayAvgDiscount === null || displayAvgDiscount === undefined) {
      displayAvgDiscount = currentKpis.avgDiscount;
    }

    // Determine availability rate to display
    let displayAvailabilityRate = dbAvailabilityPercentage;
    if (user?.brandLimit) {
      // If brand limit is present, use the filtered products availability rate
      const totalBrandProducts = filteredProductListings.length;
      const availableCount = filteredProductListings.filter(p => p.availability === true || p.availability === 'true' || (typeof p.availability === 'string' && p.availability.trim().toLowerCase() === 'yes')).length;
      displayAvailabilityRate = totalBrandProducts 
        ? parseFloat(((availableCount / totalBrandProducts) * 100).toFixed(2)) 
        : 0.0;
    } else if (displayAvailabilityRate === null || displayAvailabilityRate === undefined) {
      displayAvailabilityRate = currentKpis.availabilityRate;
    }

    // Determine average search rank to display
    let displayAvgSearchRank = dbAvgSearchRank;
    if (user?.brandLimit) {
      const ranks = filteredProductListings.map(p => parseFloat(p.rank_num)).filter(r => !isNaN(r));
      displayAvgSearchRank = ranks.length 
        ? Math.round(ranks.reduce((sum, r) => sum + r, 0) / ranks.length) 
        : 0;
    } else if (displayAvgSearchRank === null || displayAvgSearchRank === undefined) {
      displayAvgSearchRank = currentKpis.avgSearchRank;
    }

    return {
      avgSearchRank: {
        value: displayAvgSearchRank,
        label: 'Average Search Rank',
        unit: ''
      },
      distinctProducts: {
        value: currentKpis.distinctProducts,
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
        value: currentKpis.avgRating,
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
      }
    };
  }, [filteredBannerAds, filteredProductListings, dbDistinctBrands, dbAvgPrice, dbAvgDiscount, dbAvailabilityPercentage, dbAvgSearchRank, user]);

  const handleKpiClick = (kpiKey) => {
    if (['avgPrice', 'avgRating', 'avgDiscount', 'availabilityRate', 'totalBrands', 'distinctProducts', 'avgSearchRank'].includes(kpiKey)) {
      if (user.dashboardId === 'full' || user.dashboardId === 'catalog-focus') {
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
        return <AdAnalysis bannerAds={filteredBannerAds} />;
      case 'products':
        return <ProductInsights productListings={filteredProductListings} distinctTitles={distinctTitles} />;
      default:
        return null;
    }
  };

  if (!user) {
    return (
      <Login 
        onLogin={(userData) => {
          localStorage.setItem('dashboard_user', JSON.stringify(userData));
          setUser(userData);
          setActiveTab('overview');
        }} 
      />
    );
  }

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className={`sidebar ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-icon">
            <Database size={20} style={{ color: '#fff' }} />
          </div>
          <span className="logo-text">BI Dashboard</span>
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
                  <Image size={18} />
                  <span>Availability Data</span>
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
                  localStorage.removeItem('dashboard_user');
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
                <span className="badge success" style={{ fontSize: '0.75rem', padding: '4px 10px' }}>Live Database</span>
              ) : dbStatus === 'connecting' ? (
                <span className="badge warning" style={{ fontSize: '0.75rem', padding: '4px 10px' }}>Connecting DB...</span>
              ) : (
                <span className="badge danger" style={{ fontSize: '0.75rem', padding: '4px 10px' }}>Offline (Demo Mode)</span>
              )}
            </div>
            <p>Real-time analytics for search ads, placements, and product catalogs</p>
          </div>

          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>{user.email}</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{user.role}</span>
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
          {renderActiveContent()}
        </div>
      </main>
    </div>
  );
}
