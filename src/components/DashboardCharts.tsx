/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Transaction, RegionalBreakdown, CategoryBreakdown } from '../types';

interface DashboardChartsProps {
  transactions: Transaction[];
  regionalBreakdown: RegionalBreakdown[];
  categoryBreakdown: CategoryBreakdown[];
}

export default function DashboardCharts({ 
  transactions, 
  regionalBreakdown, 
  categoryBreakdown 
}: DashboardChartsProps) {
  const [hoveredTrendIndex, setHoveredTrendIndex] = useState<number | null>(null);
  const [hoveredRegIndex, setHoveredRegIndex] = useState<number | null>(null);

  // 1. Group transactions by Year-Month for the Trend chart (limit to last 12 chronologically key periods)
  const monthlyDataMap: { [key: string]: { revenue: number; profit: number; quantity: number } } = {};
  
  transactions.forEach(t => {
    // e.g. "2024-05"
    const key = t.date.substring(0, 7);
    if (!monthlyDataMap[key]) {
      monthlyDataMap[key] = { revenue: 0, profit: 0, quantity: 0 };
    }
    monthlyDataMap[key].revenue += t.revenue;
    monthlyDataMap[key].profit += t.profit;
    monthlyDataMap[key].quantity += t.quantity;
  });

  const sortedMonths = Object.keys(monthlyDataMap).sort();
  
  // Clean months labels for display, e.g. "May 25"
  const monthLabels: { [key: string]: string } = {
    '01': 'Jan', '02': 'Feb', '03': 'Mar', '04': 'Apr',
    '05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Aug',
    '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dec'
  };

  const trendPoints = sortedMonths.map(m => {
    const [year, month] = m.split('-');
    const label = `${monthLabels[month] || month} '${year.substring(2)}`;
    return {
      monthKey: m,
      label,
      revenue: Math.round(monthlyDataMap[m].revenue),
      profit: Math.round(monthlyDataMap[m].profit),
      quantity: monthlyDataMap[m].quantity,
    };
  }).slice(-12); // Show the last 12 active months

  // Min/Max for Scaling Trend charts
  const maxRevenue = Math.max(...trendPoints.map(p => p.revenue), 1000);
  const maxProfit = Math.max(...trendPoints.map(p => p.profit), 100);
  const chartHeight = 160;
  const chartWidth = 560;
  const paddingX = 40;
  const paddingY = 20;

  // Compute SVG Points for Area (Revenue)
  const pointsCount = trendPoints.length;
  const xStep = pointsCount > 1 ? (chartWidth - paddingX * 2) / (pointsCount - 1) : 0;
  
  // Scales
  const getX = (index: number) => paddingX + index * xStep;
  const getY = (val: number, max: number) => {
    const range = chartHeight - paddingY * 2;
    // Cap minimum to prevent going negative below budget lines
    const pct = max > 0 ? val / max : 0;
    return paddingY + range * (1 - pct);
  };

  const revenuePointsStr = trendPoints.map((p, idx) => `${getX(idx)},${getY(p.revenue, maxRevenue)}`).join(' ');
  const profitPointsStr = trendPoints.map((p, idx) => `${getX(idx)},${getY(p.profit, maxRevenue)}`).join(' ');

  // Create area path under Revenue
  const revenueAreaPath = pointsCount > 0 
    ? `M ${getX(0)},${chartHeight - paddingY} L ${revenuePointsStr} L ${getX(pointsCount - 1)},${chartHeight - paddingY} Z` 
    : '';

  // 2. Compute Colors & Percentages for Regional Distribution (Donut style)
  const totalRegionalRevenue = regionalBreakdown.reduce((acc, r) => acc + r.revenue, 0) || 1;
  const regionColors: { [key: string]: string } = {
    Northeast: '#2563eb', // Blue-600 (theme primary)
    Midwest: '#60a5fa',  // Blue-400
    South: '#a855f7',    // Purple
    West: '#0d9488',     // Teal-600
  };

  // Build sequential list for regional shares
  let cumAngle = 0;
  const regionalSegments = regionalBreakdown.map((r, idx) => {
    const percentage = r.revenue / totalRegionalRevenue;
    const angle = percentage * 360;
    const startAngle = cumAngle;
    cumAngle += angle;
    return {
      name: r.region,
      percentage,
      startAngle,
      angle,
      color: regionColors[r.region] || '#94a3b8',
      revenue: r.revenue,
      profit: r.profit,
      margin: r.margin,
    };
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      
      {/* 1. Monthly Revenue & Profit Timeline Trend (2 cols width on desktop) */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 lg:col-span-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-2">
          <div>
            <h3 className="font-bold text-slate-800 uppercase tracking-widest text-xs">Sales Trend & Profitability Over Time</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Monthly aggregate visual performance for the selected scope</p>
          </div>
          {/* Legend */}
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-blue-600 inline-block" />
              <span className="text-slate-600 font-medium">Revenue</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block" />
              <span className="text-slate-600 font-medium">Net Profit</span>
            </div>
          </div>
        </div>

        {/* SVG Sparkline Area Chart */}
        <div className="relative w-full overflow-hidden" style={{ minHeight: '180px' }}>
          {trendPoints.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-400">
              No continuous date data found to chart.
            </div>
          ) : (
            <svg 
              viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
              className="w-full h-full overflow-visible"
              preserveAspectRatio="none"
            >
              {/* Horizontal Help lines */}
              <line x1={0} y1={getY(0, maxRevenue)} x2={chartWidth} y2={getY(0, maxRevenue)} stroke="#f1f5f9" strokeWidth={1} />
              <line x1={0} y1={getY(maxRevenue / 2, maxRevenue)} x2={chartWidth} y2={getY(maxRevenue / 2, maxRevenue)} stroke="#f8fafc" strokeWidth={1} strokeDasharray="3 3" />
              <line x1={0} y1={getY(maxRevenue, maxRevenue)} x2={chartWidth} y2={getY(maxRevenue, maxRevenue)} stroke="#f8fafc" strokeWidth={1} />

              {/* Revenue Area (Blue Gradient) */}
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity="0.01" />
                </linearGradient>
              </defs>
              <path d={revenueAreaPath} fill="url(#revenueGrad)" className="transition-all duration-300" />
              
              {/* Baseline Curves */}
              <polyline 
                fill="none" 
                stroke="#2563eb" 
                strokeWidth={2.5} 
                strokeLinecap="round"
                strokeLinejoin="round"
                points={revenuePointsStr} 
                className="transition-all duration-300"
              />
              <polyline 
                fill="none" 
                stroke="#10b981" 
                strokeWidth={2} 
                strokeLinecap="round"
                strokeLinejoin="round" 
                strokeDasharray="1 1"
                points={profitPointsStr} 
                className="transition-all duration-300"
              />

              {/* Point Markers & Tooltip Anchors */}
              {trendPoints.map((p, idx) => {
                const x = getX(idx);
                const yRev = getY(p.revenue, maxRevenue);
                const yProf = getY(p.profit, maxRevenue);
                const isHovered = hoveredTrendIndex === idx;

                return (
                  <g key={idx} className="cursor-pointer">
                    {/* Tick label */}
                    <text 
                      x={x} 
                      y={chartHeight - 3} 
                      className="text-[9px] font-mono text-slate-400" 
                      textAnchor="middle"
                    >
                      {p.label}
                    </text>

                    {/* Interactive hover line */}
                    {isHovered && (
                      <line 
                        x1={x} 
                        y1={paddingY} 
                        x2={x} 
                        y2={chartHeight - paddingY} 
                        stroke="#94a3b8" 
                        strokeWidth={1} 
                        strokeDasharray="2 2" 
                      />
                    )}

                    {/* Revenue dot */}
                    <circle 
                      cx={x} 
                      cy={yRev} 
                      r={isHovered ? 5 : 3.5} 
                      fill="#2563eb" 
                      stroke="#ffffff" 
                      strokeWidth={1.5}
                      onMouseEnter={() => setHoveredTrendIndex(idx)}
                      onMouseLeave={() => setHoveredTrendIndex(null)}
                    />

                    {/* Net profit dot */}
                    <circle 
                      cx={x} 
                      cy={yProf} 
                      r={isHovered ? 5 : 3} 
                      fill="#10b981" 
                      stroke="#ffffff" 
                      strokeWidth={1.5}
                      onMouseEnter={() => setHoveredTrendIndex(idx)}
                      onMouseLeave={() => setHoveredTrendIndex(null)}
                    />
                  </g>
                );
              })}
            </svg>
          )}

          {/* Floating Tooltip details */}
          {hoveredTrendIndex !== null && trendPoints[hoveredTrendIndex] && (
            <div className="absolute top-2 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white rounded-lg p-2 text-xs shadow-lg flex gap-4 pointer-events-none transition-opacity duration-200 border border-slate-700 bg-opacity-95">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Period</span>
                <span className="font-bold">{trendPoints[hoveredTrendIndex].label}</span>
              </div>
              <div className="border-l border-slate-700 pl-3">
                <span className="text-[10px] text-indigo-400 uppercase font-mono block">Revenue</span>
                <span className="font-bold font-mono">${trendPoints[hoveredTrendIndex].revenue.toLocaleString()}</span>
              </div>
              <div className="border-l border-slate-700 pl-3">
                <span className="text-[10px] text-emerald-400 uppercase font-mono block">Profit</span>
                <span className="font-bold font-mono">${trendPoints[hoveredTrendIndex].profit.toLocaleString()}</span>
              </div>
              <div className="border-l border-slate-700 pl-3">
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Margin</span>
                <span className="font-bold font-mono">
                  {((trendPoints[hoveredTrendIndex].profit / (trendPoints[hoveredTrendIndex].revenue || 1)) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. Regional Sales Share & Performance (1 col) */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-slate-800 uppercase tracking-widest text-xs">Regional Performance</h3>
          <p className="text-[11px] text-slate-400 mb-4 mt-0.5">Revenue share and average margin breakdown</p>
        </div>

        {/* SVG Custom Segment Donut Ring */}
        <div className="flex justify-center items-center relative py-2">
          <svg width="150" height="150" viewBox="0 0 40 40" className="transform -rotate-90">
            {/* Base Circle */}
            <circle cx="20" cy="20" r="15.915" fill="transparent" stroke="#f1f5f9" strokeWidth="5" />
            
            {/* Draw active segment arcs */}
            {regionalSegments.map((seg, idx) => {
              const r = 15.915;
              const circumference = 2 * Math.PI * r; // 100
              const strokeDasharray = `${seg.percentage * circumference} ${circumference}`;
              
              // Sum percentages before it
              const priorPercentage = regionalSegments.slice(0, idx).reduce((sum, s) => sum + s.percentage, 0);
              const strokeDashoffset = -priorPercentage * circumference;

              return (
                <circle 
                  key={idx}
                  cx="20"
                  cy="20"
                  r={r}
                  fill="transparent"
                  stroke={seg.color}
                  strokeWidth={hoveredRegIndex === idx ? '6.5' : '5'}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-200 cursor-pointer"
                  onMouseEnter={() => setHoveredRegIndex(idx)}
                  onMouseLeave={() => setHoveredRegIndex(null)}
                />
              );
            })}
          </svg>
          
          {/* Inner ring text */}
          <div className="absolute text-center">
            {hoveredRegIndex !== null && regionalSegments[hoveredRegIndex] ? (
              <>
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                  {regionalSegments[hoveredRegIndex].name}
                </span>
                <span className="text-base font-bold text-slate-800 block">
                  {(regionalSegments[hoveredRegIndex].percentage * 100).toFixed(1)}%
                </span>
              </>
            ) : (
              <>
                <span className="text-[10px] text-slate-400 uppercase tracking-widest block">Total Sales</span>
                <span className="text-lg font-bold text-blue-600 block">
                  ${(totalRegionalRevenue >= 1000 ? `${(totalRegionalRevenue / 1000).toFixed(0)}k` : totalRegionalRevenue)}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Regional Legends / Margins list */}
        <div className="space-y-2 mt-4">
          {regionalSegments.map((seq, idx) => (
            <div 
              key={idx} 
              className={`flex items-center justify-between text-xs p-1 rounded-lg transition-all ${hoveredRegIndex === idx ? 'bg-slate-50' : ''}`}
              onMouseEnter={() => setHoveredRegIndex(idx)}
              onMouseLeave={() => setHoveredRegIndex(null)}
            >
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: seq.color }} />
                <span className="font-medium text-slate-700">{seq.name}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-800 font-semibold block">${Math.round(seq.revenue).toLocaleString()}</span>
                <span className="text-[10px] text-slate-400 font-mono">Margin: {(seq.margin * 100).toFixed(1)}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Product Category Demand & Capacity (Full-width row on mobile or 3rd column) */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 lg:col-span-3">
        <h3 className="font-bold text-slate-800 uppercase tracking-widest text-xs mb-1">Product Category Performance Matrix</h3>
        <p className="text-[11px] text-slate-400 mb-6">Comparison of revenue generating capacity vs product margins and demand quantities</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {categoryBreakdown.map((item, idx) => {
            const margin = item.revenue > 0 ? (item.profit / item.revenue) * 100 : 0;
            // Max Category Revenue for progress bounds
            const maxCatRevenue = Math.max(...categoryBreakdown.map(c => c.revenue), 1);
            const percentageOfMax = (item.revenue / maxCatRevenue) * 100;

            let colorTheme = 'from-blue-500 to-blue-600 shadow-blue-100';
            if (item.category === 'Furniture') colorTheme = 'from-amber-400 to-amber-500 shadow-amber-50';
            if (item.category === 'Office Supplies') colorTheme = 'from-emerald-400 to-emerald-500 shadow-emerald-50';

            return (
              <div key={idx} className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex flex-col justify-between hover:border-slate-200 transition-all">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-slate-800">{item.category}</span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-medium ${
                      margin > 20 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      Margin: {margin.toFixed(1)}%
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs text-slate-400">Total Sales:</span>
                      <span className="text-sm font-semibold text-slate-800">${Math.round(item.revenue).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs text-slate-400">Total Profit:</span>
                      <span className="text-sm font-semibold text-slate-800">${Math.round(item.profit).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs text-slate-400">Units Demanded:</span>
                      <span className="text-sm font-semibold text-slate-800">{item.units.toLocaleString()} units</span>
                    </div>
                  </div>
                </div>

                {/* Progress bar tracking category dominance */}
                <div className="mt-4">
                  <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                    <span>Performance Share</span>
                    <span>{percentageOfMax.toFixed(0)}% of Max</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full bg-gradient-to-r ${colorTheme}`}
                      style={{ width: `${percentageOfMax}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
