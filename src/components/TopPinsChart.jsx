import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';

Chart.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

function groupByPinAndSale(data) {
  const result = {};
  
  data.forEach(row => {
    const set = row['nft_edition_set_truncatedName'] || 'Unknown';
    const shape = row['nft_edition_shape_name'] || 'Unknown';
    const variant = row['nft_edition_variant'] || 'Unknown';
    const price = parseFloat(row['price']) || 0;
    const timestamp = row['updated_at_block_time'] || '';
    const buyer = row['receiver_username'] || 'Unknown';
    const seller = row['seller_username'] || 'Unknown';
    
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
      buyer,
      seller,
      saleId: `${pinKey}_${timestamp}_${price}_${buyer}_${seller}`
    });
  });
  
  return result;
}

export default function TopPinsChart({ data }) {
  const grouped = groupByPinAndSale(data);
  
  // Sort by total sales descending and take top 10
  const topPins = Object.entries(grouped)
    .sort(([,a], [,b]) => b.totalSales - a.totalSales)
    .slice(0, 10);
  
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

  // Create alternating colors for each bar
  const alternatingColors = [
    '#4A90E2', // Blue
    '#8B5CF6', // Purple
    '#4A90E2', // Blue
    '#8B5CF6', // Purple
    '#4A90E2', // Blue
    '#8B5CF6', // Purple
    '#4A90E2', // Blue
    '#8B5CF6', // Purple
    '#4A90E2', // Blue
    '#8B5CF6'  // Purple
  ];

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Total Sales',
        data: topPins.map(([, pinData]) => pinData.totalSales),
        backgroundColor: alternatingColors,
        borderColor: alternatingColors.map(color => color.replace('0.8', '1')),
        borderWidth: 1,
      },
    ],
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
                return `Total Sales: $${context.parsed.x.toLocaleString()}`;
              },
              afterBody: function(context) {
                const pinData = topPins[context[0].dataIndex][1];
                const totalSales = pinData.sales.reduce((sum, sale) => sum + sale.price, 0);
                
                // Show recent sales with buyer/seller info
                const recentSales = pinData.sales.slice(-3); // Last 3 sales
                const salesInfo = recentSales.map(sale => 
                  `• $${sale.price} - ${sale.buyer} → ${sale.seller}`
                );
                
                return [
                  '',
                  `Number of Sales: ${pinData.sales.length}`,
                  `Set: ${pinData.set}`,
                  `Shape: ${pinData.shape}`,
                  `Variant: ${pinData.variant}`,
                  '',
                  'Recent Sales:',
                  ...salesInfo,
                  pinData.sales.length > 3 ? `... and ${pinData.sales.length - 3} more` : ''
                ].filter(Boolean);
              }
            }
          }
        },
        scales: { 
          x: { 
            title: { display: true, text: 'Sales Amount ($)' },
            beginAtZero: true
          }, 
          y: { 
            title: { display: true, text: 'Pin (Set - Shape - Variant)' }
          } 
        }
      }} />
    </div>
  );
} 