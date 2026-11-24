# Web Dashboard — Complete Visualizations, Slicers, Filters & Code Maintenance Manual

> **Document Classification:** Master Technical Reference & Future Developer Guide  
> **Applicable Codebase:** `d:\Web Dashboard`  
> **Platform:** Quick Commerce & FMCG Digital Shelf Analytics (Blinkit & Zepto)  
> **Date of Generation:** November 2026

---

## Table of Contents
1. [Architecture Overview & Component Registry](#1-architecture-overview--component-registry)
2. [Complete Catalog of Graphs & Visualizations (15 Charts)](#2-complete-catalog-of-graphs--visualizations)
   - 2.1 [Share of Search by Top 10 Brands](#21-share-of-search-by-top-10-brands)
   - 2.2 [Availability Rate by Category](#22-availability-rate-by-category)
   - 2.3 [Retailer Share of Voice (Catalog Size)](#23-retailer-share-of-voice-catalog-size)
   - 2.4 [Average Price by Category](#24-average-price-by-category)
   - 2.5 [Brand Search Rank Matrix (Scatter Bubble)](#25-brand-search-rank-matrix-scatter-bubble)
   - 2.6 [Discount Distribution by Category](#26-discount-distribution-by-category)
   - 2.7 [Position of Banner Ads](#27-position-of-banner-ads)
   - 2.8 [Brand Search Rank Trend Chart (Multi-Line Inverted)](#28-brand-search-rank-trend-chart-multi-line-inverted)
   - 2.9 [Availability % by Retailer Across Cities](#29-availability--by-retailer-across-cities)
   - 2.10 [Retailer Presence Across Cities (Stacked Bar)](#210-retailer-presence-across-cities-stacked-bar)
   - 2.11 [Banner Share of Voice by Brand](#211-banner-share-of-voice-by-brand)
   - 2.12 [Banner Ad Types Distribution](#212-banner-ad-types-distribution)
   - 2.13 [Banner Ads Over Time (Area Timeline)](#213-banner-ads-over-time-area-timeline)
   - 2.14 [Availability Trends Date-wise (Area Line)](#214-availability-trends-date-wise-area-line)
   - 2.15 [Standalone SKU Availability Trend Chart](#215-standalone-sku-availability-trend-chart)
3. [Complete Guide to All Slicers & Filters](#3-complete-guide-to-all-slicers--filters)
   - 3.1 [Global Filters Bar (`Filters.jsx`)](#31-global-filters-bar-filtersjsx)
   - 3.2 [SKU Availability Table Filters (`SkuAvailabilityTable.jsx`)](#32-sku-availability-table-filters-skuavailabilitytablejsx)
   - 3.3 [Brand Search Rank Table Slicers (`BrandSearchRankTable.jsx`)](#33-brand-search-rank-table-slicers-brandsearchranktablejsx)
   - 3.4 [Brand Availability Table Slicers (`BrandAvailabilityTable.jsx`)](#34-brand-availability-table-slicers-brandavailabilitytablejsx)
   - 3.5 [Auto-Refresh & Polling Interval Slicer (`RefreshControl.jsx`)](#35-auto-refresh--polling-interval-slicer-refreshcontroljsx)
   - 3.6 [Directory Data Table Slicers (`DataTable.jsx`)](#36-directory-data-table-slicers-datatablejsx)
4. [KPI Cards & Metrics Grid (`MetricsGrid.jsx`)](#4-kpi-cards--metrics-grid-metricsgridjsx)
5. [Data Tables Architecture & Badge Logic](#5-data-tables-architecture--badge-logic)
6. [Developer Change Recipes (Future Modifications Cookbook)](#6-developer-change-recipes-future-modifications-cookbook)

---

## 1. Architecture Overview & Component Registry

The dashboard is structured into 3 primary view tabs accessible via the left navigation drawer:
1. **Overall Insights (`src/pages/DashboardOverview.jsx`):** High-level KPIs, category market distributions, pricing, discount analyses, search rank matrix, and banner placement breakdown.
2. **Availability (`src/pages/AvailabilityAnalysis.jsx`):** In-depth availability benchmarking between Blinkit and Zepto, city-level presence, and detailed banner advertising share-of-voice.
3. **SKU Specific Data (`src/pages/ProductInsights.jsx`):** The flagship store-level availability worksheet (`SkuAvailabilityTable.jsx`) mirroring FMCG field audit Excel sheets across dark stores.

### Component Map
| Component Name | File Path | Role & Visual Elements Hosted |
| :--- | :--- | :--- |
| **`DashboardOverview`** | `src/pages/DashboardOverview.jsx` | 7 ECharts, Top Metrics Grid, BrandSearchRankTable, Banner DataTable |
| **`AvailabilityAnalysis`** | `src/pages/AvailabilityAnalysis.jsx` | 6 ECharts, MetricsGrid, BrandAvailabilityTable |
| **`ProductInsights`** | `src/pages/ProductInsights.jsx` | Container for SkuAvailabilityTable |
| **`SkuAvailabilityTable`**| `src/components/SkuAvailabilityTable.jsx`| Flagship Excel-mirror worksheet (Cascading Category/Brand filters, Total Avail column) |
| **`SkuAvailabilityChart`**| `src/components/SkuAvailabilityChart.jsx`| Standalone bar/line visualizer for SKU availability |
| **`BrandSearchRankTable`**| `src/components/BrandSearchRankTable.jsx`| Matrix of daily search ranks + Multi-line trend chart |
| **`BrandAvailabilityTable`**| `src/components/BrandAvailabilityTable.jsx`| Matrix of daily availability % + 'No Product Found' badges |
| **`Filters`** | `src/components/Filters.jsx` | Global faceted 6-filter bar |
| **`MetricsGrid`** | `src/components/MetricsGrid.jsx` | 7 KPI summary cards |
| **`RefreshControl`** | `src/components/RefreshControl.jsx` | 5-tier polling interval dropdown, countdown, manual trigger |
| **`ChartContainer`** | `src/components/ChartContainer.jsx` | Generic responsive wrapper initializing Apache ECharts instances |
| **`DataTable`** | `src/components/DataTable.jsx` | Generic paginated table with column sorting and search |

---

## 2. Complete Catalog of Graphs & Visualizations

Every graph in this application is powered by **Apache ECharts** through the reusable `<ChartContainer options={...} />` component. Below is the comprehensive breakdown of each graph:

### 2.1. Share of Search by Top 10 Brands
- **Rendered In:** `src/pages/DashboardOverview.jsx`
- **Code Variable:** `shareOfSearchOption` (Lines 23–120)
- **Chart Type:** Horizontal Bar Chart (`type: 'bar'`)
- **What It Represents:** The percentage share of distinct SKUs that each top brand owns within the search results. Brands with more listed products command higher digital shelf space.
- **Data Source & Calculation:**
  - Inputs: `productListings` array.
  - For each product `p`, records `p.brand` and counts distinct SKU titles into a `Set`.
  - Formula: $\text{Share} = \frac{\text{Brand Distinct SKUs}}{\sum \text{Total Distinct SKUs}} \times 100$.
  - Filter: Excludes generic placeholders (`'others'`, `'unknown'`, `'n/a'`).
  - Limits to Top 10 using `.slice(0, 10)`.
- **Where Future Code Changes Can Be Made:**
  - *Change Number of Brands:* Modify `.slice(0, 10)` on line 51 to `.slice(0, 15)` or `.slice(0, 5)`.
  - *Change Bar Colors:* Adjust `color: '#002f6c'` on line 105 to any HEX or linear gradient.
  - *Toggle Percentage vs Count:* Change `p.percentage` on line 48 to `p.skuCount`.

### 2.2. Availability Rate by Category
- **Rendered In:** `src/pages/DashboardOverview.jsx`
- **Code Variable:** `availabilityByCategoryOption` (Lines 125–240)
- **Chart Type:** Horizontal Bar Chart with Benchmark MarkLine (`type: 'bar'`, `markLine`)
- **What It Represents:** Compares the in-stock percentage of each product category against the overall catalog benchmark.
- **Data Source & Calculation:**
  - Groups `productListings` by `category`.
  - Counts items where `availability === true` or `'yes'` versus total items per category.
  - Calculates category availability percentage and draws a dashed vertical red benchmark line indicating overall average.
- **Where Future Code Changes Can Be Made:**
  - *Adjust Benchmark Line:* Modify `markLine.data[0].xAxis` on line 210.
  - *Change Threshold Colors:* Color logic is controlled around line 185: green for $\ge 95\%$, blue for $\ge 90\%$, red for $< 90\%$.

### 2.3. Retailer Share of Voice (Catalog Size)
- **Rendered In:** `src/pages/DashboardOverview.jsx`
- **Code Variable:** `retailerShareOption` (Lines 245–340)
- **Chart Type:** Donut / Ring Chart (`type: 'pie'`, `radius: ['45%', '70%']`)
- **What It Represents:** Relative catalog volume and listing distribution between **Blinkit** and **Zepto**.
- **Data Source:** Counts occurrences of each `p.source_chain` in `productListings`.
- **Where Future Code Changes Can Be Made:**
  - *Make Solid Pie instead of Donut:* Change `radius: ['45%', '70%']` on line 315 to `radius: '65%'`.
  - *Change Brand Colors:* Adjust `color: ['#f59e0b', '#8b5cf6']` (Amber for Blinkit, Purple for Zepto).

### 2.4. Average Price by Category
- **Rendered In:** `src/pages/DashboardOverview.jsx`
- **Code Variable:** `priceByCategoryOption` (Lines 345–440)
- **Chart Type:** Vertical Bar Chart (`type: 'bar'`)
- **What It Represents:** The average listed selling price in Indian Rupees (₹) across product categories.
- **Data Source:** `AVG(p.price)` grouped by `p.category`.
- **Where Future Code Changes Can Be Made:**
  - *Add Median or Min/Max:* Add secondary series to the `series` array on line 420.
  - *Currency Formatting:* Update `formatter: '₹{value}'` in `axisLabel` on line 395.

### 2.5. Brand Search Rank Matrix (Scatter Bubble)
- **Rendered In:** `src/pages/DashboardOverview.jsx`
- **Code Variable:** `searchRankScatterOption` (Lines 445–560)
- **Chart Type:** Multi-dimensional Scatter Chart (`type: 'scatter'`)
- **What It Represents:** Evaluates competitive positioning by plotting Price (X-axis) against Search Rank (Y-axis, inverted so Rank #1 is at top), with bubble size reflecting product rating.
- **Data Source:** `[p.price, p.rank_num, p.rating_of_5, p.title, p.brand]`.
- **Where Future Code Changes Can Be Made:**
  - *Invert or Un-invert Axis:* `inverse: true` on line 510 controls whether Rank #1 is at the top.
  - *Bubble Size Ratio:* Modify `symbolSize: (data) => Math.pow(data[2], 1.8) * 3` on line 535.

### 2.6. Discount Distribution by Category
- **Rendered In:** `src/pages/DashboardOverview.jsx`
- **Code Variable:** `discountOption` (Lines 565–660)
- **Chart Type:** Bar Chart (`type: 'bar'`)
- **What It Represents:** Average percentage discount off MRP offered by dark stores across categories.
- **Data Source:** `p.discount` or `((p.original_price - p.price) / p.original_price) * 100`.
- **Where Future Code Changes Can Be Made:**
  - *Switch from Category to Retailer:* Change grouping key from `p.category` to `p.source_chain` on line 580.

### 2.7. Position of Banner Ads
- **Rendered In:** `src/pages/DashboardOverview.jsx`
- **Code Variable:** `positionChartOption` (Lines 665–760)
- **Chart Type:** Donut Chart (`type: 'pie'`, `radius: ['42%', '68%']`)
- **What It Represents:** The count of sponsored banner placements grouped by screen location (e.g. `Top`, `Middle`, `Bottom`, `Left Sidebar`).
- **Data Source:** `bannerAds` array, grouping by `b.banner_position``.
- **Where Future Code Changes Can Be Made:**
  - *Change to Bar Chart:* Change `type: 'pie'` to `type: 'bar'` and add an `xAxis` with position names.

### 2.8. Brand Search Rank Trend Chart (Multi-Line Inverted)
- **Rendered In:** `src/components/BrandSearchRankTable.jsx`
- **Code Variable:** `trendChartOption` (Lines 262–320)
- **Chart Type:** Multi-Series Spline Line Chart (`type: 'line'`, `smooth: true`, `yAxis.inverse: true`)
- **What It Represents:** Historical day-by-day rank movement for the top 8 brands across the sliced date range. Rank #1 is at the top of the chart.
- **Data Source:** Aggregated `brandMap` daily rank values (`cell.best` or `cell.avg`).
- **Where Future Code Changes Can Be Made:**
  - *Change Top N Brands:* Line 265: `const topBrands = processedRows.slice(0, 8);` Change `8` to `5` or `12`.
  - *Switch Straight Lines vs Curved:* Toggle `smooth: true` to `smooth: false` on line 290.
  - *Cap Y-Axis Range:* Set `yAxis.max = 20` or `yAxis.max = 50` on line 282.

### 2.9. Availability % by Retailer Across Cities
- **Rendered In:** `src/pages/AvailabilityAnalysis.jsx`
- **Code Variable:** `availabilityByRetailerOption` (Lines 36–120)
- **Chart Type:** Clustered Bar Chart (`type: 'bar'`)
- **What It Represents:** Side-by-side in-stock percentage comparison between Blinkit and Zepto across major Indian cities.
- **Data Source:** `productListings` grouped by `source_chain` and `city`.
- **Where Future Code Changes Can Be Made:**
  - *Filter Specific Cities:* Modify `selectedCities` array around line 60.

### 2.10. Retailer Presence Across Cities (Stacked Bar)
- **Rendered In:** `src/pages/AvailabilityAnalysis.jsx`
- **Code Variable:** `retailerCityPresenceOption` (Lines 125–220)
- **Chart Type:** Stacked Horizontal Bar Chart (`type: 'bar'`, `stack: 'total'`)
- **What It Represents:** Total SKU density of each retailer across individual cities, illustrating geographic footprints.
- **Data Source:** `productListings` count per `(city, source_chain)` pair.
- **Where Future Code Changes Can Be Made:**
  - *Unstack Bars:* Remove `stack: 'total'` on line 195 to display side-by-side grouped bars.

### 2.11. Banner Share of Voice by Brand
- **Rendered In:** `src/pages/AvailabilityAnalysis.jsx`
- **Code Variable:** `bannerBrandShareOption` (Lines 225–310)
- **Chart Type:** Donut Chart (`type: 'pie'`, `roseType: 'radius'`)
- **What It Represents:** Proportional ad spend presence: which brands are buying the most sponsored banners across apps.
- **Data Source:** `bannerAds` grouped by `b.brand`.
- **Where Future Code Changes Can Be Made:**
  - *Toggle Nightingale Rose View:* Remove `roseType: 'radius'` on line 285 for a standard uniform donut.

### 2.12. Banner Ad Types Distribution
- **Rendered In:** `src/pages/AvailabilityAnalysis.jsx`
- **Code Variable:** `bannerAdTypeOption` (Lines 315–400)
- **Chart Type:** Pie Chart (`type: 'pie'`)
- **What It Represents:** Breakdown of creative formats: Video Banners vs Static Image Banners vs Carousel Placements.
- **Data Source:** `bannerAds` grouped by `b.ad_type`.
- **Where Future Code Changes Can Be Made:**
  - *Custom Colors per Format:* Line 360: Map `'Video Banner'` to Magenta and `'Static Banner'` to Blue.

### 2.13. Banner Ads Over Time (Area Timeline)
- **Rendered In:** `src/pages/AvailabilityAnalysis.jsx`
- **Code Variable:** `bannerTimelineOption` (Lines 405–490)
- **Chart Type:** Area Line Chart (`type: 'line'`, `areaStyle: { opacity: 0.25 }`)
- **What It Represents:** Daily trend of live sponsored campaigns, highlighting marketing spikes (e.g., weekend promotions or festival sales).
- **Data Source:** `bannerAds` grouped by `scrape_date`.
- **Where Future Code Changes Can Be Made:**
  - *Change Fill Gradient:* Modify `areaStyle.color` on line 465.

### 2.14. Availability Trends Date-wise (Area Line)
- **Rendered In:** `src/pages/AvailabilityAnalysis.jsx`
- **Code Variable:** `availabilityTrendsOption` (Lines 495–565)
- **Chart Type:** Smooth Line Chart with Gradient Fill (`type: 'line'`, `smooth: true`)
- **What It Represents:** The overall catalog availability curve day-by-day.
- **Data Source:** Daily average in-stock % calculated across all products in `productListings`.
- **Where Future Code Changes Can Be Made:**
  - *Adjust Y-Axis Min/Max:* Change `min: 80` or `min: 'dataMin'` on line 535 to zoom in on micro-dips.

### 2.15. Standalone SKU Availability Trend Chart
- **Rendered In:** `src/components/SkuAvailabilityChart.jsx`
- **Code Variable:** `chartOption` (Lines 79–175)
- **Chart Type:** Horizontal Bar Chart (`type: 'bar'`)
- **What It Represents:** Top 20 SKUs ranked by overall availability percentage for any selected Category and Brand.
- **Data Source:** `rawData.skus` filtered by `selectedCategory` and `selectedBrand`.
- **Where Future Code Changes Can Be Made:**
  - *Adjust Limit:* Line 92: `matchingSkus.slice(0, 20)` can be modified to 10, 30, or 50.

---

## 3. Complete Guide to All Slicers & Filters

The application incorporates 6 distinct filtering and slicing modules across different pages:

### 3.1. Global Filters Bar (`Filters.jsx`)
- **Host File:** `src/components/Filters.jsx` (Imported and rendered globally in `src/App.jsx`).
- **Connected State:** `filters` object in `src/App.jsx`:
  ```js
  filters = {
    start_date: '',       // e.g. '2026-07-28'
    end_date: '',         // e.g. '2026-08-14'
    city_pincode: 'all',  // e.g. 'Delhi|110001' or 'Mumbai|all'
    brand: 'all',         // e.g. 'Fortune', 'Sunfeast'
    category: 'all',      // e.g. 'Atta', 'Biscuits'
    source_chain: 'all',  // e.g. 'Blinkit', 'Zepto'
    product: 'all'        // e.g. 'Cookies', 'Whole Wheat Atta'
  }
  ```
- **Individual Slicers Explained:**
  1. **Start Date & End Date Pickers:** HTML5 `<input type="date">` controls with interactive clear buttons (`X`). Constrained dynamically between `minAvailableDate` and `maxAvailableDate`.
  2. **City, Pincode Dropdown:** Hierarchical grouped selector. Formatted as `City|Pincode` (e.g. `Delhi|110001`) or `City|all` (e.g. `Delhi (All Pincodes)`).
  3. **Brand Dropdown:** Populates distinct brands. If an enterprise user has a brand restriction (`user.brandLimit`), the dropdown locks strictly to their brand.
  4. **Category Dropdown:** Lists high-level FMCG groups (`Atta`, `Biscuits`, `Edible Oil`, `Noodles`, etc.).
  5. **Chain (Retailer) Dropdown:** Options: `All Chains`, `Blinkit`, `Zepto`.
  6. **Search Keyword Dropdown:** Filters by the exact user search string entered on quick-commerce apps.
  7. **Clear Filters Button:** Resets all 7 dimensions back to initial defaults in one click.
- **How Options Are Extracted:**
  - In `src/App.jsx`, `availableOptions` uses a single-pass `useMemo` algorithm over `productListings` to dynamically compute valid options based on current selections.
- **How to Add a New Global Filter:**
  1. Add the new key to `filters` state in `src/App.jsx` (e.g. `pack_size: 'all'`).
  2. In `availableOptions` `useMemo`, add a collection set for `pack_size`.
  3. In `src/components/Filters.jsx`, add a `<div className="filter-group">` with a `<select>` bound to `filters.pack_size`.

### 3.2. SKU Availability Table Filters (`SkuAvailabilityTable.jsx`)
- **Host File:** `src/components/SkuAvailabilityTable.jsx` (on the SKU Specific Data page).
- **Connected States:**
  - `selectedCategory`: Default `'Atta'`. Options: `Atta`, `Biscuits`, `Edible Oil`, `Noodles`.
  - `selectedBrand`: Default `'All'`. Options: `'All'` + category-specific brands.
  - `selectedChain`: Default `'all'`. Options: `'all'`, `'Blinkit'`, `'Zepto'`.
  - `searchQuery`: String input for live SKU name / City / Pincode text search.
  - `pageSize`: Number of rows per page (15, 25, 50, 100).
- **Special Business Rules Implemented:**
  - **The `'All'` Brand Option:** Always placed at index 0 of the brand dropdown. When selected, it merges and displays all sheets in that category simultaneously.
  - **Automatic Brand Reset on Category Switch:** When a user clicks a new Category pill (e.g., switches from *Atta* to *Biscuits*), `handleCategoryChange` automatically selects `'All'` and resets the page to 1.
  - **Fast Multi-Column Search:** Evaluates lowercase text against SKU title, city name, and 6-digit postal code simultaneously.
- **How to Modify or Add Categories:**
  - Open `src/skuAvailabilityData.json` and add the category to `"categories"` and its brands to `"hierarchy"`.

### 3.3. Brand Search Rank Table Slicers (`BrandSearchRankTable.jsx`)
- **Host File:** `src/components/BrandSearchRankTable.jsx`.
- **Slicers Hosted:**
  1. **Date Slicers (Start & End Date):** Slices date columns displayed in the table.
  2. **Preset Date Quick-Buttons:**
     - `All Dates (14)`: Clears custom range and activates full history.
     - `Last 3 Days`: Automatically calculates `allDates.slice(-3)`.
     - `Last 5 Days`: Calculates `allDates.slice(-5)`.
     - `Last 7 Days`: Calculates `allDates.slice(-7)`.
  3. **Metric Mode Toggle (`metricMode`):**
     - `Best Rank`: Displays the minimum (best) organic rank achieved by the brand on that day (e.g. Rank 1).
     - `Avg Rank`: Displays the average rank across all products of that brand on that day.
  4. **View Mode Toggle (`viewMode`):**
     - `Table`: Displays the matrix grid only.
     - `Chart`: Displays the multi-line trend chart only.
     - `Both`: Displays both stacked vertically.
  5. **Brand Live Search:** Filters table rows instantly by brand name.

### 3.4. Brand Availability Table Slicers (`BrandAvailabilityTable.jsx`)
- **Host File:** `src/components/BrandAvailabilityTable.jsx`.
- **Slicers Hosted:**
  - Date Range Slicers (`startDate`, `endDate`).
  - Date Quick Presets (`All Dates`, `Last 3 Days`, `Last 5 Days`, `Last 7 Days`).
  - Brand Live Search Input (`searchTerm`).
  - Rows Per Page Selector (10, 25, 50, 100, All).
- **Special Display Rule (`No Product Found` Badge):**
  - When a brand had **0 listings scraped** on a particular date, `renderRateBadge` renders a clean badge labeled **`No Product Found`** with a tooltip explaining that no products were scraped, rather than showing `0%` or `-`.

### 3.5. Auto-Refresh & Polling Interval Slicer (`RefreshControl.jsx`)
- **Host File:** `src/components/RefreshControl.jsx` (rendered in `top-header`).
- **Interval Options Configured (`REFRESH_OPTIONS`):**
  - `0`: Off (Manual sync only)
  - `10`: 10 seconds (High frequency live monitoring)
  - `30`: 30 seconds (Default balanced setting)
  - `60`: 1 minute (Standard update)
  - `300`: 5 minutes (Low network usage)
- **Features:**
  - Live countdown pill: Shows real-time countdown seconds remaining until next fetch.
  - Background Tab Pause: When user minimizes the browser or switches tabs, polling automatically pauses to conserve network bandwidth.
  - Instant Sync on Return: When user tabs back to the dashboard, it immediately refreshes data.
  - Manual Refresh Button: Triggers immediate cache-busted fetch (`?refresh=true`).
  - Relative Time Tracker: Shows dynamic timestamps like `"Just now"`, `"45s ago"`, `"2m ago"`.

### 3.6. Directory Data Table Slicers (`DataTable.jsx`)
- **Host File:** `src/components/DataTable.jsx` (Used for Banner Ads log on DashboardOverview).
- **Slicers Hosted:**
  - Date range filters (`enableDateFilter=true`).
  - Keyword dropdown filter (`enableKeywordFilter=true`).
  - Real-time search across all columns.
  - Dynamic rows per page (10, 25, 50, 100).

---

## 4. KPI Cards & Metrics Grid (`MetricsGrid.jsx`)

Located at `src/components/MetricsGrid.jsx`. Displays 7 executive metric cards. Each card is interactive and clickable (`onKpiClick`), auto-navigating to the underlying detailed view:

| KPI Key | Label | Formula / Source | Normal / Target Range | Alert Trigger | Click Destination |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `distinctProducts` | Total Products | Count of unique SKU titles | N/A | None | SKU Specific Data |
| `totalBrands` | Total Brands | Count of distinct brands | N/A | None | SKU Specific Data |
| `avgPrice` | Avg Product Price | `AVG(price)` | ₹100 – ₹500 | None | SKU Specific Data |
| `avgRating` | Average Rating | `AVG(rating_of_5)` | 4.0 – 5.0 ★ | `< 4.0 ★` | SKU Specific Data |
| `availabilityRate` | Active Product % | `(InStock / Total) * 100` | $\ge 95\%$ | `< 90\%` (Turns Red) | SKU Specific Data |
| `avgDiscount` | Avg Discount | `AVG(discount %)` | 5% – 25% | None | SKU Specific Data |
| `outOfStockRate` | Out of Stock % | `100 - ActiveProduct%` | $\le 5\%$ | `> 10\%` (Turns Red) | SKU Specific Data |

### How to Add a New KPI Card:
1. In `src/App.jsx` under `stats` `useMemo` (lines 480–525), compute your metric value.
2. Open `src/components/MetricsGrid.jsx` and add an object to the `cards` array:
   ```jsx
   {
     key: 'myMetric',
     label: 'My New Metric',
     value: stats.myMetric.value,
     unit: '%',
     className: 'green',
     icon: <TrendingUp size={18} style={{ color: 'var(--success)' }} />
   }
   ```

---

## 5. Data Tables Architecture & Badge Logic

### 5.1. `SkuAvailabilityTable.jsx` (Core Store Worksheet)
- **Data Schema:** Each row is a compact array: `[chain, sku, city, pin, recent_statuses, totalAvailPct, avCnt, totCnt]`.
- **Date Badge Logic:**
  - `status === 1`: Green `<span className="badge success">Available</span>`.
  - `status === 0`: Neutral `<span className="badge">NR</span>` (Not Reported / Out of Stock).
- **Total Availability Column (Last Column):**
  - Displays total percentage: `totalAvailPct` (e.g. `100%`).
  - Displays count ratio: `(avCnt/totCnt dates)``.
  - Displays mini visual progress bar with dynamic width: `width: ${totalAvailPct}%`.
- **Full Availability 1st Sorting Logic:**
  - In `filteredRows` `useMemo`:
    ```javascript
    if (b.totalAvailPct !== a.totalAvailPct) {
      return b.totalAvailPct - a.totalAvailPct; // 100% comes first
    }
    if (b.availCount !== a.availCount) {
      return b.availCount - a.availCount;       // Highest recent count second
    }
    ```

### 5.2. `BrandAvailabilityTable.jsx` (Brand-wise Matrix)
- **Badge Rules (`renderRateBadge`):**
  - `rate >= 100`: Dark Green badge (`#ecfdf5`, text `#047857`).
  - `95 <= rate < 100`: Blue badge (`#eff6ff`, text `#1d4ed8`).
  - `80 <= rate < 95`: Amber badge (`#fffbeb`, text `#b45309`).
  - `rate < 80`: Rose / Red badge (`#fff1f2`, text `#be123c`).
  - **`No Product Found`**: When no products were scraped for that brand on that date (`!cellData`), renders a soft gray badge (`#f8fafc`, text `#94a3b8`) with tooltip *"No product found / scraped on this date"*.

---

## 6. Developer Change Recipes (Future Modifications Cookbook)

### Recipe 1: How to Change Chart Colors & Themes
Open the relevant page (e.g. `src/pages/DashboardOverview.jsx` or `src/pages/AvailabilityAnalysis.jsx`). Find the ECharts option object. All color schemes are declared in the `color` property:
```javascript
// Change palette of any chart:
color: ['#002f6c', '#0284c7', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899']
```

### Recipe 2: How to Add a New Category or Brand to the SKU Table
1. Open `src/skuAvailabilityData.json`.
2. Add the category to `categories: [...]`.
3. Add the category key and brand list to `hierarchy: { ... }`.
4. In `src/skuStoreMatrixData.json`, ensure your new sheets specify matching `category` and `brand` attributes.

### Recipe 3: How to Adjust the Default Page Size in Tables
In `src/components/SkuAvailabilityTable.jsx` line 41, or `src/components/DataTable.jsx` line 23:
```javascript
const [pageSize, setPageSize] = useState(25); // Change 15 to 25 or 50
```

### Recipe 4: How to Add a New Target Date to the Store Matrix
1. Open `scratch/add_total_avail_to_matrix.py`.
2. Add the new date string (YYYY-MM-DD) to `target_dates = [...]` on line 18.
3. Run `python scratch/add_total_avail_to_matrix.py`.
4. The table headers, badges, and total availability will update automatically across all 63,000+ rows.

### Recipe 5: How to Modify the 'No Product Found' Badge Text or Styling
In `src/components/BrandAvailabilityTable.jsx` around line 254:
```jsx
const renderRateBadge = (cellData) => {
  if (!cellData) {
    return (
      <span style={{ ...badgeStyle, background: '#f8fafc', color: '#94a3b8' }}>
        No Product Found
      </span>
    );
  }
  // ...
}
```

---
*Manual compiled for incoming software engineers, product owners, and data teams.*
