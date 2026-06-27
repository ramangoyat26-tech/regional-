/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Transaction } from '../types';

export function parseCSV(text: string): Transaction[] {
  const lines = text.split(/\r?\n/);
  if (lines.length < 2) return [];

  // Super easy RFC 4180 quote-aware CSV split helper
  function splitCSVLine(line: string): string[] {
    const result: string[] = [];
    let curVal = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(curVal.trim());
        curVal = '';
      } else {
        curVal += char;
      }
    }
    result.push(curVal.trim());
    return result;
  }

  // Get headers, map them to index lowercase
  const headers = splitCSVLine(lines[0]).map(h => h.replace(/^["']|["']$/g, '').toLowerCase().trim());
  
  const colMap = {
    id: headers.indexOf('id'),
    date: headers.indexOf('date'),
    region: headers.indexOf('region'),
    state: headers.indexOf('state'),
    category: headers.indexOf('category'),
    product: headers.indexOf('product'),
    customersegment: headers.findIndex(h => h.includes('segment')),
    revenue: headers.indexOf('revenue'),
    profit: headers.indexOf('profit'),
    cost: headers.indexOf('cost'),
    quantity: headers.indexOf('quantity'),
    storetype: headers.findIndex(h => h.includes('store') || h.includes('channel')),
  };

  const parsed: Transaction[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = splitCSVLine(line);
    if (values.length < 5) continue; // Skip incomplete lines

    const id = colMap.id !== -1 ? values[colMap.id] : `TX-UP-${10000 + i}`;
    const date = colMap.date !== -1 ? values[colMap.date] : '2025-01-01';
    
    // Normalize Region
    let regionRaw = colMap.region !== -1 ? values[colMap.region] : 'Northeast';
    if (!['Northeast', 'Midwest', 'South', 'West'].includes(regionRaw)) {
      regionRaw = 'Northeast';
    }
    const region = regionRaw as 'Northeast' | 'Midwest' | 'South' | 'West';

    const state = colMap.state !== -1 ? values[colMap.state] : 'New York';

    // Normalize Category
    let categoryRaw = colMap.category !== -1 ? values[colMap.category] : 'Technology';
    if (categoryRaw.toLowerCase().includes('tech')) categoryRaw = 'Technology';
    else if (categoryRaw.toLowerCase().includes('furn')) categoryRaw = 'Furniture';
    else categoryRaw = 'Office Supplies';
    const category = categoryRaw as 'Technology' | 'Furniture' | 'Office Supplies';

    const product = colMap.product !== -1 ? values[colMap.product].replace(/^["']|["']$/g, '') : 'Standard Item';

    // customerSegment
    let segmentRaw = colMap.customersegment !== -1 ? values[colMap.customersegment] : 'Consumer';
    if (segmentRaw.toLowerCase().includes('corp')) segmentRaw = 'Corporate';
    else if (segmentRaw.toLowerCase().includes('home')) segmentRaw = 'Home Office';
    else segmentRaw = 'Consumer';
    const customerSegment = segmentRaw as 'Consumer' | 'Corporate' | 'Home Office';

    const revenue = colMap.revenue !== -1 ? parseFloat(values[colMap.revenue].replace(/[$,\s]/g, '')) || 0 : 0;
    const profit = colMap.profit !== -1 ? parseFloat(values[colMap.profit].replace(/[$,\s]/g, '')) || 0 : 0;
    const cost = colMap.cost !== -1 ? parseFloat(values[colMap.cost].replace(/[$,\s]/g, '')) || 0 : parseFloat((revenue * 0.8).toFixed(2));
    const quantity = colMap.quantity !== -1 ? parseInt(values[colMap.quantity].replace(/[,\s]/g, ''), 10) || 1 : 1;

    let storeRaw = colMap.storetype !== -1 ? values[colMap.storetype] : 'Retail';
    if (storeRaw.toLowerCase().includes('web') || storeRaw.toLowerCase().includes('online')) storeRaw = 'Online';
    else if (storeRaw.toLowerCase().includes('wholesale')) storeRaw = 'Wholesale';
    else storeRaw = 'Retail';
    const storeType = storeRaw as 'Online' | 'Retail' | 'Wholesale';

    parsed.push({
      id,
      date,
      region,
      state,
      category,
      product,
      customerSegment,
      revenue,
      profit,
      cost,
      quantity,
      storeType,
    });
  }

  return parsed;
}

export function convertToCSV(transactions: Transaction[]): string {
  const headers = ['ID', 'Date', 'Region', 'State', 'Category', 'Product', 'Customer Segment', 'Revenue', 'Profit', 'Cost', 'Quantity', 'Store Type'];
  const rows = transactions.map(t => [
    t.id,
    t.date,
    t.region,
    t.state,
    t.category,
    `"${t.product.replace(/"/g, '""')}"`,
    t.customerSegment,
    t.revenue,
    t.profit,
    t.cost,
    t.quantity,
    t.storeType,
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}
