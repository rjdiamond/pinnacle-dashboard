import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';

Chart.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

function groupByPinAndSale(data) {
  const result = {};
  const colorMap = {};
  let colorIndex = 0;
  
  data.forEach(row => {
    const set = row['nft_edition_set_truncatedName'] || 'Unknown';
    const shape = row['nft_edition_shape_name'] || 'Unknown';
    const variant = row['nft_edition_variant'] || 'Unknown';
    const price = parseFloat(row['price']) || 0;
    const timestamp = row['updated_at_block_time'] || '';
    
    // Create a unique identifier for each pin
    const pinKey = `${set} - ${shape} - ${variant}`;
    
    if (!result[pinKey]) {
      result[pinKey] = {
        totalSales: 0,
        sales: [],
        set,
        shape,
        variant
      };
    }
    
    result[pinKey].totalSales += price;
    result[pinKey].sales.push({
      price,
      timestamp,
      saleId: `${pinKey}_${timestamp}_${price}`
    });
    
    // Assign colors to individual sales
    const saleKey = `${pinKey}_${timestamp}_${price}`;
    if (!colorMap[saleKey]) {
      const colors = [
        '#4f8cff', '#ffb347', '#6ee7b7', '#f87171', '#a78bfa', 
        '#fbbf24', '#34d399', '#f472b6', '#60a5fa', '#facc15',
        '#ef4444', '#10b981', '#8b5cf6', '#f59e0b', '#06b6d4',
        '#84cc16', '#f97316', '#ec4899', '#14b8a6', '#6366f1'
      ];
      colorMap[saleKey] = colors[colorIndex % colors.length];
      colorIndex++;
    }
  });
  
  return { result, colorMap };
}

export default function TopPinsChart({ data }) {
  const { result: grouped, colorMap } = groupByPinAndSale(data);
  
  // Sort by total sales descending and take top 10
  const topPins = Object.entries(grouped)
    .sort(([,a], [,b]) => b.totalSales - a.totalSales)
    .slice(0, 10);
  
  // Get all unique sales across all pins
  const allSales = new Set();
  topPins.forEach(([pinKey, pinData]) => {
    pinData.sales.forEach(sale => {
      allSales.add(sale.saleId);
    });
  });
  const uniqueSales = Array.from(allSales);
  
  // Create datasets for each individual sale
  const datasets = uniqueSales.map(saleId => {
    const [pinKey, timestamp, price] = saleId.split('_');
    return {
      label: `$${parseFloat(price).toLocaleString()}`,
      data: topPins.map(([pin, pinData]) => {
        const matchingSale = pinData.sales.find(sale => sale.saleId === saleId);
        return matchingSale ? matchingSale.price : 0;
      }),
      backgroundColor: colorMap[saleId],
      stack: 'Stack 0',
    };
  });
  
  const labels = topPins.map(([pinKey, pinData]) => {
    // Split the pin key into set and shape/variant
    const parts = pinKey.split(' - ');
    const set = parts[0] || '';
    const shapeVariant = parts.slice(1).join(' - ') || '';
    
    // Truncate long set names
    const displaySet = set.length > 30 ? set.substring(0, 27) + '...' : set;
    const displayShapeVariant = shapeVariant.length > 20 ? shapeVariant.substring(0, 17) + '...' : shapeVariant;
    
    // Return two-line label
    return [displaySet, displayShapeVariant];
  });

  const chartData = {
    labels,
    datasets,
  };

  return (
    <div style={{ margin: '2rem 0' }}>
      <h2>Top 10 Pins by Sales Volume</h2>
      <Bar data={chartData} options={{
        indexAxis: 'y', // This makes it horizontal
        responsive: true,
        plugins: { 
          legend: { display: false },
          tooltip: {
            callbacks: {
              title: function(context) {
                const pinKey = topPins[context[0].dataIndex][0];
                return pinKey;
              },
              label: function(context) {
                if (context.parsed.x > 0) {
                  return `Sale: $${context.parsed.x.toLocaleString()}`;
                }
                return null;
              },
              afterBody: function(context) {
                const pinData = topPins[context[0].dataIndex][1];
                const totalSales = pinData.sales.reduce((sum, sale) => sum + sale.price, 0);
                return [
                  '',
                  `Total Sales: $${totalSales.toLocaleString()}`,
                  `Number of Sales: ${pinData.sales.length}`,
                  `Set: ${pinData.set}`,
                  `Shape: ${pinData.shape}`,
                  `Variant: ${pinData.variant}`
                ];
              }
            }
          }
        },
        scales: { 
          x: { 
            title: { display: true, text: 'Sales Amount ($)' },
            beginAtZero: true,
            stacked: true
          }, 
          y: { 
            title: { display: true, text: 'Pin (Set - Shape - Variant)' },
            stacked: true
          } 
        }
      }} />
    </div>
  );
} 