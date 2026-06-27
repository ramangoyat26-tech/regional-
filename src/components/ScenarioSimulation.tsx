/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Sliders, RefreshCw, BarChart3, HelpCircle } from 'lucide-react';
import { ScenarioParams, KPIStats } from '../types';

interface ScenarioSimulationProps {
  params: ScenarioParams;
  setParams: React.Dispatch<React.SetStateAction<ScenarioParams>>;
  baselineStats: KPIStats;
  simulatedStats: KPIStats;
}

export default function ScenarioSimulation({
  params,
  setParams,
  baselineStats,
  simulatedStats,
}: ScenarioSimulationProps) {
  
  const resetParams = () => {
    setParams({
      techPriceAdjustment: 0,
      furniturePriceAdjustment: 0,
      officePriceAdjustment: 0,
      shippingCostAdjustment: 0,
      marketDemandMultiplier: 1.0,
    });
  };

  const handleSliderChange = (key: keyof ScenarioParams, val: number) => {
    setParams(prev => ({
      ...prev,
      [key]: val,
    }));
  };

  const formatDelta = (val: number, isPct = false) => {
    if (val === 0) return 'No Change';
    const sign = val > 0 ? '+' : '';
    if (isPct) {
      return `${sign}${(val * 100).toFixed(1)}%`;
    }
    return `${sign}${new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val)}`;
  };

  const revenueDelta = simulatedStats.totalRevenue - baselineStats.totalRevenue;
  const profitDelta = simulatedStats.totalProfit - baselineStats.totalProfit;
  const marginDelta = simulatedStats.averageMargin - baselineStats.averageMargin;

  return (
    <div className="bg-slate-900 text-slate-100 rounded-xl p-6 border border-slate-800 mb-6">
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-blue-400" />
          <div>
            <h3 className="font-bold uppercase tracking-widest text-xs text-slate-100">Strategic Decision Sandbox</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Simulate structural pricing / market parameters live</p>
          </div>
        </div>
        <button 
          onClick={resetParams}
          className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wider text-slate-400 hover:text-blue-400 transition-colors bg-slate-800 px-2.5 py-1.5 rounded border border-slate-700"
        >
          <RefreshCw className="w-3.5 h-3.5 animate-hover" />
          Reset Baseline
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Sliders Column */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Tech Price adjustment slider */}
          <div>
            <div className="flex justify-between text-xs mb-1 font-medium">
              <span className="text-slate-300">Technology Standard Unit Price</span>
              <span className="font-mono text-blue-400">{params.techPriceAdjustment > 0 ? '+' : ''}{(params.techPriceAdjustment * 100).toFixed(0)}%</span>
            </div>
            <input 
              type="range"
              min="-0.30"
              max="0.30"
              step="0.05"
              value={params.techPriceAdjustment}
              onChange={(e) => handleSliderChange('techPriceAdjustment', parseFloat(e.target.value))}
              className="w-full accent-blue-500 h-1.5 bg-slate-800 rounded cursor-pointer"
            />
          </div>

          {/* Furniture Price adjustment slider */}
          <div>
            <div className="flex justify-between text-xs mb-1 font-medium">
              <span className="text-slate-300">Furniture standard Unit Price</span>
              <span className="font-mono text-amber-400">{params.furniturePriceAdjustment > 0 ? '+' : ''}{(params.furniturePriceAdjustment * 100).toFixed(0)}%</span>
            </div>
            <input 
              type="range"
              min="-0.30"
              max="0.30"
              step="0.05"
              value={params.furniturePriceAdjustment}
              onChange={(e) => handleSliderChange('furniturePriceAdjustment', parseFloat(e.target.value))}
              className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* Office Supplies Price Adjustment */}
          <div>
            <div className="flex justify-between text-xs mb-1 font-medium">
              <span className="text-slate-300">Office Supplies Unit Price</span>
              <span className="font-mono text-emerald-400">{params.officePriceAdjustment > 0 ? '+' : ''}{(params.officePriceAdjustment * 100).toFixed(0)}%</span>
            </div>
            <input 
              type="range"
              min="-0.30"
              max="0.30"
              step="0.05"
              value={params.officePriceAdjustment}
              onChange={(e) => handleSliderChange('officePriceAdjustment', parseFloat(e.target.value))}
              className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* Cost of Goods / Overhead Margin scale */}
          <div>
            <div className="flex justify-between text-xs mb-1 font-medium">
              <span className="text-slate-300 flex items-center gap-1">
                COGS / Shipping Surcharges Adjustment
                <span className="text-[10px] text-slate-500 hover:text-slate-400 cursor-help" title="Lowers or increases absolute cost ratios on products.">
                  <HelpCircle className="w-3.5 h-3.5" />
                </span>
              </span>
              <span className="font-mono text-rose-400">
                {params.shippingCostAdjustment > 0 ? '+' : ''}{(params.shippingCostAdjustment * 100).toFixed(0)}% Surcharge
              </span>
            </div>
            <input 
              type="range"
              min="-0.30"
              max="0.30"
              step="0.05"
              value={params.shippingCostAdjustment}
              onChange={(e) => handleSliderChange('shippingCostAdjustment', parseFloat(e.target.value))}
              className="w-full accent-rose-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* Market Demand multi */}
          <div>
            <div className="flex justify-between text-xs mb-1 font-medium">
              <span className="text-slate-300">Global Customer Demand Velocity</span>
              <span className="font-mono text-teal-400">{params.marketDemandMultiplier.toFixed(2)}x Vol</span>
            </div>
            <input 
              type="range"
              min="0.70"
              max="1.50"
              step="0.05"
              value={params.marketDemandMultiplier}
              onChange={(e) => handleSliderChange('marketDemandMultiplier', parseFloat(e.target.value))}
              className="w-full accent-teal-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

        </div>

        {/* Projections Column */}
        <div className="bg-slate-800/80 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 mb-3">
              <BarChart3 className="w-3.5 h-3.5 text-blue-400" />
              Live Simulated Outcomes
            </span>
            
            {/* Projected Revenue */}
            <div className="mb-4">
              <span className="text-[11px] text-slate-400 block">Projected Revenue</span>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold font-mono text-slate-100">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                    maximumFractionDigits: 0,
                  }).format(simulatedStats.totalRevenue)}
                </span>
                <span className={`text-xs font-semibold ${revenueDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {formatDelta(revenueDelta)}
                </span>
              </div>
            </div>

            {/* Projected Profit */}
            <div className="mb-4">
              <span className="text-[11px] text-slate-400 block">Projected Net Profit</span>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold font-mono text-slate-100">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                    maximumFractionDigits: 0,
                  }).format(simulatedStats.totalProfit)}
                </span>
                <span className={`text-xs font-semibold ${profitDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {formatDelta(profitDelta)}
                </span>
              </div>
            </div>

            {/* Projected Margin */}
            <div>
              <span className="text-[11px] text-slate-400 block">Projected Net Margin</span>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold font-mono text-slate-100">
                  {(simulatedStats.averageMargin * 100).toFixed(1)}%
                </span>
                <span className={`text-xs font-semibold ${marginDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {formatDelta(marginDelta, true)}
                </span>
              </div>
            </div>

          </div>

          <div className="mt-4 pt-3 border-t border-slate-700/60 text-[10px] text-slate-500 leading-relaxed font-mono">
            *Parameters apply directly on standard transaction-level itemization weights recursively.
          </div>
        </div>

      </div>
    </div>
  );
}
