/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { DollarSign, TrendingUp, ShoppingBag, Percent, Target } from 'lucide-react';
import { KPIStats } from '../types';

interface KPICardsProps {
  stats: KPIStats;
  targetRevenue: number;
}

export default function KPICards({ stats, targetRevenue }: KPICardsProps) {
  const marginPercentage = stats.averageMargin * 100;
  
  const formattedRevenue = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(stats.totalRevenue);

  const formattedProfit = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(stats.totalProfit);

  const isProfitPositive = stats.totalProfit >= 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {/* Revenue Card */}
      <div className="bg-white p-6 border border-slate-200 rounded-xl transition-all duration-200 hover:border-blue-600/70">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Sales Revenue</p>
          <div className="p-1.5 bg-blue-50 text-blue-600 rounded">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-slate-900 tracking-tight">{formattedRevenue}</span>
          <span className="text-xs text-emerald-600 font-bold">+5.4% YoY</span>
        </div>
        <div className="text-[10px] text-slate-400 uppercase tracking-wider mt-2.5">
          vs. last cycle performance
        </div>
      </div>

      {/* Net Profit Card */}
      <div className="bg-white p-6 border border-slate-200 rounded-xl transition-all duration-200 hover:border-blue-600/70">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Net Profit</p>
          <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className={`text-2xl font-bold ${isProfitPositive ? 'text-slate-900' : 'text-rose-600'} tracking-tight`}>
            {formattedProfit}
          </span>
          <span className={`text-xs px-1.5 py-0.5 rounded font-bold ${isProfitPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
            Margin: {marginPercentage.toFixed(1)}%
          </span>
        </div>
        <div className="text-[10px] text-slate-400 uppercase tracking-wider mt-2.5">
          overall net corporate margin
        </div>
      </div>

      {/* Product Demand (Units) Card */}
      <div className="bg-white p-6 border border-slate-200 rounded-xl transition-all duration-200 hover:border-blue-600/70">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Product Demand</p>
          <div className="p-1.5 bg-blue-50 text-blue-600 rounded">
            <ShoppingBag className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-slate-900 tracking-tight">
            {stats.totalUnits.toLocaleString()}
          </span>
          <span className="text-xs text-slate-400 font-medium">units</span>
        </div>
        <div className="text-[10px] text-slate-400 uppercase tracking-wider mt-2.5 flex justify-between items-center">
          <span>{stats.transactionCount.toLocaleString()} Orders</span>
          <span className="font-mono text-slate-500 text-[9px] bg-slate-100 px-1 py-0.5 rounded">Avg: {Math.max(1, Math.round(stats.totalUnits / (stats.transactionCount || 1)))}/ord</span>
        </div>
      </div>

      {/* Target Achievement Card */}
      <div className="bg-white p-6 border border-slate-200 rounded-xl transition-all duration-200 hover:border-blue-600/70">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Target Achievement</p>
          <div className="p-1.5 bg-blue-50 text-blue-600 rounded">
            <Target className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-bold text-slate-900 tracking-tight">
            {(stats.performanceVsTarget * 100).toFixed(1)}%
          </span>
          <span className="text-[10px] font-mono text-slate-500">Goal: ${(targetRevenue / 1000).toFixed(0)}k</span>
        </div>
        {/* Target Progress Bar */}
        <div className="w-full bg-slate-100 h-1.5 rounded mt-3 overflow-hidden">
          <div 
            className="bg-blue-600 h-full rounded transition-all duration-500" 
            style={{ width: `${Math.min(100, stats.performanceVsTarget * 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
