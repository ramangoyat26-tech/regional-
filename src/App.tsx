/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  FileSpreadsheet, 
  Upload, 
  Download, 
  HelpCircle, 
  FilterX, 
  Grid, 
  LineChart, 
  Cpu, 
  Layers, 
  Clock, 
  AlertCircle,
  Undo,
  Search,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

import { Transaction, KPIStats, ScenarioParams, RegionalBreakdown, CategoryBreakdown } from './types';
import { generateSalesData } from './utils/dataGenerator';
import { parseCSV, convertToCSV } from './utils/csvParser';
import KPICards from './components/KPICards';
import DashboardCharts from './components/DashboardCharts';
import ScenarioSimulation from './components/ScenarioSimulation';
import AISmartinsights from './components/AISmartinsights';

export default function App() {
  // Load standard transaction row dataset (1000+ items)
  const initialData = useMemo(() => generateSalesData(), []);
  const [dataScope, setDataScope] = useState<Transaction[]>(initialData);
  const [fileName, setFileName] = useState<string>('Standard_Regional_Sales_2025.csv');
  const [fileError, setFileError] = useState<string | null>(null);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'dashboard' | 'sandbox' | 'raw_data'>('dashboard');

  // Filter state
  const [filters, setFilters] = useState({
    region: '',
    category: '',
    segment: '',
    storeType: '',
  });

  // Table Page state & Search for raw data spreadsheet
  const [tablePage, setTablePage] = useState<number>(1);
  const [tableSearch, setTableSearch] = useState<string>('');
  const tableRowsPerPage = 12;

  // Scenario parameters
  const [scenarioParams, setScenarioParams] = useState<ScenarioParams>({
    techPriceAdjustment: 0,
    furniturePriceAdjustment: 0,
    officePriceAdjustment: 0,
    shippingCostAdjustment: 0,
    marketDemandMultiplier: 1.0,
  });

  // Target Revenue (usually dynamically scaled to are filters or default baseline)
  const baseTargetRevenue = 410000;

  // Clean filters helper
  const handleResetFilters = () => {
    setFilters({
      region: '',
      category: '',
      segment: '',
      storeType: '',
    });
  };

  // 1. Calculate KPI Statistics recursively based on Active Filters + Basic parameters
  const baselineStats = useMemo(() => {
    let revenue = 0;
    let profit = 0;
    let units = 0;
    let count = 0;

    dataScope.forEach(item => {
      // Filter logic
      if (filters.region && item.region !== filters.region) return;
      if (filters.category && item.category !== filters.category) return;
      if (filters.segment && item.customerSegment !== filters.segment) return;
      if (filters.storeType && item.storeType !== filters.storeType) return;

      revenue += item.revenue;
      profit += item.profit;
      units += item.quantity;
      count++;
    });

    const averageMargin = revenue > 0 ? profit / revenue : 0;
    // Scale target according to region weights
    let regionalScaling = 1.0;
    if (filters.region === 'West') regionalScaling = 0.35;
    else if (filters.region === 'Northeast') regionalScaling = 0.25;
    else if (filters.region === 'Midwest') regionalScaling = 0.20;
    else if (filters.region === 'South') regionalScaling = 0.20;

    const dynamicTarget = baseTargetRevenue * regionalScaling;
    const performanceVsTarget = revenue / (dynamicTarget || 1);

    return {
      totalRevenue: revenue,
      totalProfit: profit,
      averageMargin,
      totalUnits: units,
      transactionCount: count,
      performanceVsTarget,
      targetLevel: dynamicTarget,
    };
  }, [dataScope, filters]);

  // 2. Calculate Simulated Projections recursively
  const simulatedStats = useMemo(() => {
    let revenue = 0;
    let profit = 0;
    let units = 0;
    let count = 0;

    dataScope.forEach(item => {
      // Filter logic
      if (filters.region && item.region !== filters.region) return;
      if (filters.category && item.category !== filters.category) return;
      if (filters.segment && item.customerSegment !== filters.segment) return;
      if (filters.storeType && item.storeType !== filters.storeType) return;

      // Adjust parameters based on Category adjustments
      let priceAdjustmentFactor = 0;
      if (item.category === 'Technology') priceAdjustmentFactor = scenarioParams.techPriceAdjustment;
      if (item.category === 'Furniture') priceAdjustmentFactor = scenarioParams.furniturePriceAdjustment;
      if (item.category === 'Office Supplies') priceAdjustmentFactor = scenarioParams.officePriceAdjustment;

      const simQty = item.quantity * scenarioParams.marketDemandMultiplier;
      const simRev = item.revenue * (1 + priceAdjustmentFactor) * scenarioParams.marketDemandMultiplier;
      const simCost = item.cost * (1 + scenarioParams.shippingCostAdjustment) * scenarioParams.marketDemandMultiplier;
      const simProf = simRev - simCost;

      revenue += simRev;
      profit += simProf;
      units += simQty;
      count++;
    });

    const averageMargin = revenue > 0 ? profit / revenue : 0;
    const performanceVsTarget = revenue / (baselineStats.targetLevel || 1);

    return {
      totalRevenue: revenue,
      totalProfit: profit,
      averageMargin,
      totalUnits: Math.round(units),
      transactionCount: count,
      performanceVsTarget,
    };
  }, [dataScope, filters, scenarioParams, baselineStats.targetLevel]);

  // 3. Compute Regional Share & Breakdown Matrices
  const regionalBreakdown = useMemo(() => {
    const regions: ('Northeast' | 'Midwest' | 'South' | 'West')[] = ['Northeast', 'Midwest', 'South', 'West'];
    
    return regions.map(reg => {
      let revenue = 0;
      let profit = 0;
      let units = 0;
      
      dataScope.forEach(item => {
        if (item.region !== reg) return;
        if (filters.category && item.category !== filters.category) return;
        if (filters.segment && item.customerSegment !== filters.segment) return;
        if (filters.storeType && item.storeType !== filters.storeType) return;

        // Apply scenario params dynamically for complete synchronization
        let priceAdj = 0;
        if (item.category === 'Technology') priceAdj = scenarioParams.techPriceAdjustment;
        if (item.category === 'Furniture') priceAdj = scenarioParams.furniturePriceAdjustment;
        if (item.category === 'Office Supplies') priceAdj = scenarioParams.officePriceAdjustment;

        const simQty = item.quantity * scenarioParams.marketDemandMultiplier;
        const simRev = item.revenue * (1 + priceAdj) * scenarioParams.marketDemandMultiplier;
        const simCost = item.cost * (1 + scenarioParams.shippingCostAdjustment) * scenarioParams.marketDemandMultiplier;

        revenue += simRev;
        profit += (simRev - simCost);
        units += simQty;
      });

      return {
        region: reg,
        revenue,
        profit,
        margin: revenue > 0 ? profit / revenue : 0,
        units: Math.round(units),
      };
    }).sort((a,b) => b.revenue - a.revenue);
  }, [dataScope, filters, scenarioParams]);

  // 4. Compute Product Category breakdown dynamically
  const categoryBreakdown = useMemo(() => {
    const categories: ('Technology' | 'Furniture' | 'Office Supplies')[] = ['Technology', 'Furniture', 'Office Supplies'];
    
    return categories.map(cat => {
      let revenue = 0;
      let profit = 0;
      let units = 0;

      dataScope.forEach(item => {
        if (item.category !== cat) return;
        if (filters.region && item.region !== filters.region) return;
        if (filters.segment && item.customerSegment !== filters.segment) return;
        if (filters.storeType && item.storeType !== filters.storeType) return;

        // Apply scenario params
        let priceAdj = 0;
        if (cat === 'Technology') priceAdj = scenarioParams.techPriceAdjustment;
        if (cat === 'Furniture') priceAdj = scenarioParams.furniturePriceAdjustment;
        if (cat === 'Office Supplies') priceAdj = scenarioParams.officePriceAdjustment;

        const simQty = item.quantity * scenarioParams.marketDemandMultiplier;
        const simRev = item.revenue * (1 + priceAdj) * scenarioParams.marketDemandMultiplier;
        const simCost = item.cost * (1 + scenarioParams.shippingCostAdjustment) * scenarioParams.marketDemandMultiplier;

        revenue += simRev;
        profit += (simRev - simCost);
        units += simQty;
      });

      return {
        category: cat,
        revenue,
        profit,
        units: Math.round(units),
      };
    });
  }, [dataScope, filters, scenarioParams]);

  // Top segment generator
  const topSegment = useMemo(() => {
    const segments: { [key: string]: number } = {};
    dataScope.forEach(item => {
      if (filters.region && item.region !== filters.region) return;
      segments[item.customerSegment] = (segments[item.customerSegment] || 0) + item.revenue;
    });
    let top = '';
    let max = 0;
    Object.keys(segments).forEach(k => {
      if (segments[k] > max) {
        max = segments[k];
        top = k;
      }
    });
    return top;
  }, [dataScope, filters]);

  // Read Uploaded Spreadsheet CSV
  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setFileError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      try {
        const parsed = parseCSV(text);
        if (parsed.length === 0) {
          throw new Error('No valid rows found. Please check your CSV column headers.');
        }
        setDataScope(parsed);
        setTablePage(1);
      } catch (err: any) {
        setFileError(err.message || 'Error parsing CSV file context');
      }
    };
    reader.readAsText(file);
  };

  // Restore Default standard data
  const handleRestoreDefaults = () => {
    setDataScope(initialData);
    setFileName('Standard_Regional_Sales_2025.csv');
    setFileError(null);
    setTablePage(1);
  };

  // Trigger Local Spreadsheet CSV Download containing active simulated/baseline configurations
  const triggerCSVDownload = () => {
    const csvContent = convertToCSV(dataScope);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Scenario_Sales_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter raw transactions for the searchable sub-table
  const filteredTableData = useMemo(() => {
    return dataScope.filter(item => {
      // Search
      const searchStr = tableSearch.toLowerCase();
      const matchesSearch = 
        item.product.toLowerCase().includes(searchStr) || 
        item.state.toLowerCase().includes(searchStr) ||
        item.category.toLowerCase().includes(searchStr) ||
        item.region.toLowerCase().includes(searchStr);

      const matchesRegion = !filters.region || item.region === filters.region;
      const matchesCategory = !filters.category || item.category === filters.category;
      const matchesSegment = !filters.segment || item.customerSegment === filters.segment;
      const matchesStoreType = !filters.storeType || item.storeType === filters.storeType;

      return matchesSearch && matchesRegion && matchesCategory && matchesSegment && matchesStoreType;
    });
  }, [dataScope, tableSearch, filters]);

  // Compute paginated table row subsets
  const paginatedTableData = useMemo(() => {
    const startIdx = (tablePage - 1) * tableRowsPerPage;
    return filteredTableData.slice(startIdx, startIdx + tableRowsPerPage);
  }, [filteredTableData, tablePage]);

  const totalPages = Math.ceil(filteredTableData.length / tableRowsPerPage) || 1;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between font-sans">
      
      {/* 1. Dashboard Corporate Header */}
      <header className="bg-white border-b border-slate-200 py-4 px-8 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center shrink-0">
              <div className="w-4 h-4 bg-white rounded-sm"></div>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap text-slate-900">
                <h1 className="text-lg font-bold tracking-tight leading-tight">Regional Analytics</h1>
                <span className="text-slate-400 font-normal text-sm">// Regional Sales Performance Portal</span>
              </div>
              <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest mt-0.5">Interactive BI & Scenario Simulator</p>
            </div>
          </div>

          {/* Interactive quick spreadsheet utilities */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Restore defaults */}
            {dataScope !== initialData && (
              <button
                onClick={handleRestoreDefaults}
                className="flex items-center gap-1 text-xs text-rose-600 hover:bg-rose-50 border border-rose-200 font-bold px-3 py-2 rounded transition-colors cursor-pointer"
              >
                <Undo className="w-3.5 h-3.5" />
                Reset Defaults
              </button>
            )}

          </div>

        </div>
      </header>

      {/* Main Body Grid */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6">

        {/* Upload feedback or warning warnings */}
        {fileError && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-4 text-xs mb-6 flex gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
            <div>
              <span className="font-bold">Parsing Error:</span> {fileError}. Make sure the sheet includes columns like `Revenue`, `Profit`, and `Region` correctly.
            </div>
          </div>
        )}

        <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Loaded Scope:</span>
            <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              {fileName} ({dataScope.length.toLocaleString()} rows)
            </span>
          </div>

          {/* Quick instructions on excel usage */}
          <div className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
            <HelpCircle className="w-3.5 h-3.5 text-slate-300" />
            <span>Connect views instantly using Excel/Power BI equivalents filters below.</span>
          </div>
        </div>

        {/* 2. Advanced Multi-Filter Control panel */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-blue-600" />
              Segment & Geography Filter Matrix
            </span>
            {(filters.region || filters.category || filters.segment || filters.storeType) && (
              <button 
                onClick={handleResetFilters}
                className="text-[11px] text-red-600 hover:text-red-700 font-bold flex items-center gap-1 bg-red-50 hover:bg-rose-100/55 px-2.5 py-1 rounded transition-colors"
              >
                <FilterX className="w-3.5 h-3.5" />
                Clear Filters
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Region select */}
            <div>
              <label className="text-[10px] text-slate-400 font-bold block mb-1.5 uppercase tracking-wider">Business Region</label>
              <select
                value={filters.region}
                onChange={(e) => setFilters(prev => ({ ...prev, region: e.target.value }))}
                className="w-full text-xs rounded border border-slate-300 bg-slate-50/50 px-3 py-2 text-slate-700 font-bold focus:ring-1 focus:ring-blue-600 focus:border-blue-600 focus:outline-none"
              >
                <option value="">All Regions</option>
                <option value="Northeast">Northeast Region</option>
                <option value="Midwest">Midwest Region</option>
                <option value="South">South Region</option>
                <option value="West">West Region</option>
              </select>
            </div>

            {/* Category select */}
            <div>
              <label className="text-[10px] text-slate-400 font-bold block mb-1.5 uppercase tracking-wider">Product Category</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                className="w-full text-xs rounded border border-slate-300 bg-slate-50/50 px-3 py-2 text-slate-700 font-bold focus:ring-1 focus:ring-blue-600 focus:border-blue-600 focus:outline-none"
              >
                <option value="">All Categories</option>
                <option value="Technology">Technology</option>
                <option value="Furniture">Furniture</option>
                <option value="Office Supplies">Office Supplies</option>
              </select>
            </div>

            {/* Customer Segment */}
            <div>
              <label className="text-[10px] text-slate-400 font-bold block mb-1.5 uppercase tracking-wider">Customer Segment</label>
              <select
                value={filters.segment}
                onChange={(e) => setFilters(prev => ({ ...prev, segment: e.target.value }))}
                className="w-full text-xs rounded border border-slate-300 bg-slate-50/50 px-3 py-2 text-slate-700 font-bold focus:ring-1 focus:ring-blue-600 focus:border-blue-600 focus:outline-none"
              >
                <option value="">All Segments</option>
                <option value="Consumer">Consumer Portfolios</option>
                <option value="Corporate">Corporate Accounts</option>
                <option value="Home Office">Home Office Clients</option>
              </select>
            </div>

            {/* Store type */}
            <div>
              <label className="text-[10px] text-slate-400 font-bold block mb-1.5 uppercase tracking-wider">Store Channel Type</label>
              <select
                value={filters.storeType}
                onChange={(e) => setFilters(prev => ({ ...prev, storeType: e.target.value }))}
                className="w-full text-xs rounded border border-slate-300 bg-slate-50/50 px-3 py-2 text-slate-700 font-bold focus:ring-1 focus:ring-blue-600 focus:border-blue-600 focus:outline-none"
              >
                <option value="">All Store Channels</option>
                <option value="Online">Online / Web Portal</option>
                <option value="Retail">Physical Retail Outlets</option>
                <option value="Wholesale">Wholesale Distribution</option>
              </select>
            </div>
          </div>
        </div>

        {/* 3. Metric KPI Cards Layer */}
        <KPICards stats={simulatedStats} targetRevenue={baselineStats.targetLevel} />

        {/* Tab switch Navigation (Segmented Design Pattern) */}
        <div className="inline-flex bg-slate-100 rounded-lg p-1 mb-6 self-start border border-slate-200/50">
          <button
            onClick={() => { setActiveTab('dashboard'); setTablePage(1); }}
            className={`px-4 py-1.5 rounded text-[11px] font-bold uppercase tracking-widest flex items-center gap-1.5 transition-all ${
              activeTab === 'dashboard' 
                ? 'bg-white shadow-xs text-blue-600 border border-slate-200/30 font-extrabold' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <LineChart className="w-3.5 h-3.5" />
            Interactive BI Dashboard
          </button>
          
          <button
            onClick={() => { setActiveTab('sandbox'); setTablePage(1); }}
            className={`px-4 py-1.5 rounded text-[11px] font-bold uppercase tracking-widest flex items-center gap-1.5 transition-all ${
              activeTab === 'sandbox' 
                ? 'bg-white shadow-xs text-blue-600 border border-slate-200/30 font-extrabold' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            Strategic Forecast Sandbox
          </button>

          <button
            onClick={() => { setActiveTab('raw_data'); setTablePage(1); }}
            className={`px-4 py-1.5 rounded text-[11px] font-bold uppercase tracking-widest flex items-center gap-1.5 transition-all ${
              activeTab === 'raw_data' 
                ? 'bg-white shadow-xs text-blue-600 border border-slate-200/30 font-extrabold' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            Spreadsheet Table Explorer
          </button>
        </div>

        {/* 4. Active Tab Content Layer */}
        {activeTab === 'dashboard' && (
          <DashboardCharts 
            transactions={dataScope}
            regionalBreakdown={regionalBreakdown}
            categoryBreakdown={categoryBreakdown}
          />
        )}

        {activeTab === 'sandbox' && (
          <ScenarioSimulation 
            params={scenarioParams}
            setParams={setScenarioParams}
            baselineStats={baselineStats}
            simulatedStats={simulatedStats}
          />
        )}

        {activeTab === 'raw_data' && (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="font-bold text-slate-800 uppercase tracking-widest text-xs">Transactional Database Ledger</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Detailed spreadsheet rows loaded in the active sandbox scope</p>
              </div>
              
              {/* Table search fields */}
              <div className="flex gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Search className="w-3.5 h-3.5 text-slate-400" />
                  </span>
                  <input
                    type="text"
                    value={tableSearch}
                    onChange={(e) => {
                      setTableSearch(e.target.value);
                      setTablePage(1);
                    }}
                    placeholder="Search by state or product..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 bg-slate-50/50"
                  />
                </div>
              </div>
            </div>

            {/* Main physical table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-widest text-[10px]">
                    <th className="p-3">Transaction ID</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Region</th>
                    <th className="p-3">State</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Product Description</th>
                    <th className="p-4 text-right">Units</th>
                    <th className="p-4 text-right">Revenue</th>
                    <th className="p-4 text-right">Profit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedTableData.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-400">
                        No transactions found matching active search parameter.
                      </td>
                    </tr>
                  ) : (
                    paginatedTableData.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/40 transition-colors">
                        <td className="p-3 font-mono font-bold text-slate-500">{item.id}</td>
                        <td className="p-3 text-slate-500">{item.date}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded border font-bold text-[10px] ${
                            item.region === 'Northeast' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            item.region === 'West' ? 'bg-teal-50 text-teal-700 border-teal-200' :
                            item.region === 'South' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}>
                            {item.region}
                          </span>
                        </td>
                        <td className="p-3 text-slate-700 font-semibold">{item.state}</td>
                        <td className="p-3 text-slate-500 font-medium">{item.category}</td>
                        <td className="p-3 text-slate-700 truncate max-w-[180px] font-medium" title={item.product}>
                          {item.product}
                        </td>
                        <td className="p-4 text-right font-mono text-slate-600 font-medium">{item.quantity}</td>
                        <td className="p-4 text-right font-mono font-bold text-slate-800">${Math.round(item.revenue).toLocaleString()}</td>
                        <td className={`p-4 text-right font-mono font-bold ${item.profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          ${Math.round(item.profit).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
            {filteredTableData.length > 0 && (
              <div className="flex items-center justify-between border-t border-slate-200 pt-4 mt-4">
                <span className="text-[11px] text-slate-400 font-medium">
                  Showing {((tablePage - 1) * tableRowsPerPage) + 1} to {Math.min(tablePage * tableRowsPerPage, filteredTableData.length)} of {filteredTableData.length.toLocaleString()} matching ledger lines
                </span>
                
                <div className="flex gap-1">
                  <button
                    onClick={() => setTablePage(p => Math.max(1, p - 1))}
                    disabled={tablePage === 1}
                    className="p-1 px-2 rounded border border-slate-300 hover:bg-slate-50 disabled:opacity-40 cursor-pointer text-slate-600 text-xs flex items-center justify-center"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-3 py-1 text-xs text-slate-600 font-bold bg-slate-50 rounded border border-slate-300">
                    Page {tablePage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setTablePage(p => Math.min(totalPages, p + 1))}
                    disabled={tablePage === totalPages}
                    className="p-1 px-2 rounded border border-slate-300 hover:bg-slate-50 disabled:opacity-40 cursor-pointer text-slate-600 text-xs flex items-center justify-center"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 5. AI Smart Advisor & Analytics Panel */}
        <div className="mt-8">
          <AISmartinsights 
            stats={simulatedStats}
            regionalBreakdown={regionalBreakdown}
            categoryBreakdown={categoryBreakdown}
            activeFilters={{
              region: filters.region,
              category: filters.category,
              segment: filters.segment,
              storeType: filters.storeType
            }}
          />
        </div>

      </main>

      {/* Dynamic Activity Status Footer */}
      <footer className="bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between px-8 py-4 mt-12 shrink-0 gap-4">
        <div className="flex flex-wrap gap-x-8 gap-y-2 text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span> 
            System Live
          </span>
          <span>Last Update: 14:02 EST</span>
          <span>User: <span className="text-slate-600 font-bold">ramangoyat26@gmail.com</span></span>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={triggerCSVDownload}
            className="text-[10px] bg-slate-900 text-white rounded px-3 py-1.5 font-bold tracking-wider uppercase hover:bg-slate-800 transition-colors"
          >
            DOWNLOAD REPORT
          </button>
        </div>
      </footer>

    </div>
  );
}
