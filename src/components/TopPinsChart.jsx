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
  
  // Get all unique sales across all pins
  const allSales = new Set();
  topPins.forEach(([pinKey, pinData]) => {
    pinData.sales.forEach(sale => {
      allSales.add(sale.saleId);
    });
  });
  const uniqueSales = Array.from(allSales);
  
  // Create datasets for each individual sale with alternating colors
  const datasets = uniqueSales.map((saleId, index) => {
    const [pinKey, timestamp, price, buyer, seller] = saleId.split('_');
    const pinIndex = topPins.findIndex(([pin, pinData]) => pin === pinKey);
    
    // Alternate colors based on the pin's position (not the sale's position)
    const isEvenPin = pinIndex % 2 === 0;
    const baseColor = isEvenPin ? '#4A90E2' : '#8B5CF6'; // Blue for even, Purple for odd
    
    return {
      label: `$${parseFloat(price).toLocaleString()}`,
      data: topPins.map(([pin, pinData]) => {
        const matchingSale = pinData.sales.find(sale => sale.saleId === saleId);
        return matchingSale ? matchingSale.price : 0;
      }),
      backgroundColor: baseColor,
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
                  const saleId = uniqueSales[context.datasetIndex];
                  const [pinKey, timestamp, price, buyer, seller] = saleId.split('_');
                  return [
                    `Sale: $${context.parsed.x.toLocaleString()}`,
                    `Buyer: ${buyer}`,
                    `Seller: ${seller}`
                  ];
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