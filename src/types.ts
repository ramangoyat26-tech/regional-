/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  region: 'Northeast' | 'Midwest' | 'South' | 'West';
  state: string;
  category: 'Technology' | 'Furniture' | 'Office Supplies';
  product: string;
  customerSegment: 'Consumer' | 'Corporate' | 'Home Office';
  revenue: number;
  profit: number;
  cost: number;
  quantity: number;
  storeType: 'Online' | 'Retail' | 'Wholesale';
}

export interface KPIStats {
  totalRevenue: number;
  totalProfit: number;
  averageMargin: number;
  totalUnits: number;
  transactionCount: number;
  performanceVsTarget: number; // Percentage, e.g., 94.5%
}

export interface ChartDataPoint {
  label: string;
  revenue: number;
  profit: number;
  quantity: number;
}

export interface RegionalBreakdown {
  region: string;
  revenue: number;
  profit: number;
  margin: number;
  units: number;
}

export interface CategoryBreakdown {
  category: string;
  revenue: number;
  profit: number;
  units: number;
}

export interface ScenarioParams {
  techPriceAdjustment: number; // percentage change (-50% to +50%)
  furniturePriceAdjustment: number;
  officePriceAdjustment: number;
  shippingCostAdjustment: number; // cost reduction / increase
  marketDemandMultiplier: number; // overall multiplier
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  timestamp: string;
}
