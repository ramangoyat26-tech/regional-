/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Transaction } from '../types';

const REGIONS = {
  Northeast: ['New York', 'Massachusetts', 'Pennsylvania', 'New Jersey', 'Connecticut'],
  Midwest: ['Illinois', 'Ohio', 'Michigan', 'Indiana', 'Wisconsin'],
  South: ['Texas', 'Florida', 'Georgia', 'North Carolina', 'Virginia'],
  West: ['California', 'Washington', 'Oregon', 'Colorado', 'Arizona'],
};

const CATEGORIES = {
  Technology: [
    { name: 'UltraBook Dynamic S7', basePrice: 1200, margin: 0.18 },
    { name: 'OmniRoute Pro Router', basePrice: 199, margin: 0.35 },
    { name: 'QuantumSync SSD 2TB', basePrice: 249, margin: 0.28 },
    { name: 'SmartVision 4K Display', basePrice: 450, margin: 0.22 },
    { name: 'NeoCharge Pro Multi-dock', basePrice: 89, margin: 0.40 },
  ],
  Furniture: [
    { name: 'AeroPosture Ergonomic Chair', basePrice: 380, margin: 0.12 },
    { name: 'ModuDesk Standing Workstation', basePrice: 550, margin: 0.08 },
    { name: 'Apex Timber Boardroom Table', basePrice: 1450, margin: 0.15 },
    { name: 'LumbarSupport Executive Throne', basePrice: 299, margin: 0.14 },
    { name: 'PixelShelf Modular Organizer', basePrice: 180, margin: 0.20 },
  ],
  'Office Supplies': [
    { name: 'EcoSheet Premium Recycled Ream', basePrice: 12, margin: 0.45 },
    { name: 'GelFlow Retractable Pens (24-Pack)', basePrice: 18, margin: 0.55 },
    { name: 'SafeGuard Cross-cut Shredder', basePrice: 120, margin: 0.30 },
    { name: 'SteelFrame Metal Desktop Trays', basePrice: 34, margin: 0.42 },
    { name: 'Magnetix Premium Mobile Whiteboard', basePrice: 160, margin: 0.38 },
  ],
};

const CUSTOMER_SEGMENTS = ['Consumer', 'Corporate', 'Home Office'] as const;
const STORE_TYPES = ['Online', 'Retail', 'Wholesale'] as const;

export function generateSalesData(): Transaction[] {
  const transactions: Transaction[] = [];

  // Seeded random number generator so the default data is stable across re-renders
  let seed = 12345;
  function random(): number {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  }

  function getRandomElement<T>(arr: T[] | readonly T[]): T {
    return arr[Math.floor(random() * arr.length)];
  }

  // Create transactions from 2024-01-01 to 2025-12-31 (2 full years)
  const startDate = new Date('2024-01-01');
  const endDate = new Date('2025-12-31');
  const totalDays = (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24);

  // Generate 1200 rows of transactions
  for (let i = 0; i < 1150; i++) {
    // Generate date with seasonality (more orders around Q4/holidays and mid-year June)
    let percentIdx = random();
    let dayOffset = percentIdx * totalDays;
    
    // Seasonality adjustment factor to bias dates toward Q4 (Nov-Dec)
    const seasonalBias = random();
    if (seasonalBias < 0.4) {
      // Pull date slightly later in the year
      dayOffset = Math.min(totalDays, dayOffset + (totalDays * 0.15));
    }

    const tDate = new Date(startDate.getTime() + dayOffset * 24 * 3600 * 1000);
    const dateStr = tDate.toISOString().split('T')[0];

    const region = getRandomElement(Object.keys(REGIONS)) as 'Northeast' | 'Midwest' | 'South' | 'West';
    const state = getRandomElement(REGIONS[region]);
    const category = getRandomElement(Object.keys(CATEGORIES)) as 'Technology' | 'Furniture' | 'Office Supplies';
    const productItem = getRandomElement(CATEGORIES[category]);

    const customerSegment = getRandomElement(CUSTOMER_SEGMENTS) as 'Consumer' | 'Corporate' | 'Home Office';
    const storeType = getRandomElement(STORE_TYPES) as 'Online' | 'Retail' | 'Wholesale';

    // Quantity range dependent on category & storeType
    let quantityRange = 4;
    if (storeType === 'Wholesale') {
      quantityRange = 15;
    }
    const quantity = Math.floor(random() * quantityRange) + 1;

    // Prices slightly drift with a small trend over time
    const timeTrend = 1 + (dayOffset / totalDays) * 0.05; // 5% inflation over 2 years
    const unitPrice = parseFloat((productItem.basePrice * timeTrend * (0.95 + random() * 0.1)).toFixed(2));
    const revenue = parseFloat((unitPrice * quantity).toFixed(2));

    // Calculate baseline cost based on product's standard profit margin
    const marginDeviation = (random() - 0.5) * 0.1; // +/- 5% margin variation per transaction
    const transactionMargin = Math.max(0.02, productItem.margin + marginDeviation);
    
    // Western region has higher overhead cost (e.g. shipping/labor), Northeast has slightly lower
    let regionCostAdjustment = 1.0;
    if (region === 'West') regionCostAdjustment = 1.04;
    if (region === 'Northeast') regionCostAdjustment = 0.98;

    const cost = parseFloat((revenue * (1 - transactionMargin) * regionCostAdjustment).toFixed(2));
    const profit = parseFloat((revenue - cost).toFixed(2));

    transactions.push({
      id: `TX-${24000 + i}`,
      date: dateStr,
      region,
      state,
      category,
      product: productItem.name,
      customerSegment,
      revenue,
      profit,
      cost,
      quantity,
      storeType,
    });
  }

  // Sort transactions by date ascending
  return transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}
