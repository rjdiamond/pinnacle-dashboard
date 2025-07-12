import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';

Chart.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

function groupBySet(data) {
  const result = {};
  
  data.forEach(row => {
    const set = row['nft_edition_set_truncatedName'] || 'Unknown';
    const price = parseFloat(row['price']) || 0;
    const buyer = row['receiver_username'] || 'Unknown';
    const seller = row['seller_username'] || 'Unknown';
    const shape = row['nft_edition_shape_name'] || 'Unknown';
    const variant = row['nft_edition_variant'] || 'Unknown';
    const timestamp = row['updated_at_block_time'] || '';
    
    if (!result[set]) {
      result[set] = {
        totalSales: 0,
        transactionCount: 0,
        sales: [],
        uniquePins: new Set(),
        uniqueBuyers: new Set(),
        uniqueSellers: new Set()
      };
    }
    
    result[set].totalSales += price;
    result[set].transactionCount += 1;
    result[set].sales.push({
      price,
      buyer,
      seller,
      shape,
      variant,
      timestamp
    });
    result[set].uniquePins.add(`${shape} - ${variant}`);
    result[set].uniqueBuyers.add(buyer);
    result[set].uniqueSellers.add(seller);
  });
  
  // Convert Sets to arrays for easier handling
  Object.keys(result).forEach(setName => {
    result[setName].uniquePins = Array.from(result[setName].uniquePins);
    result[setName].uniqueBuyers = Array.from(result[setName].uniqueBuyers);
    result[setName].uniqueSellers = Array.from(result[setName].uniqueSellers);
  });
  
  return result;
}

export default function TopSetsChart({ data }) {
  const grouped = groupBySet(data);
  
  // Sort by total sales descending and take top 10
  const topSets = Object.entries(grouped)
    .sort(([,a], [,b]) => b.totalSales - a.totalSales)
    .slice(0, 10);
  
  const labels = topSets.map(([setName, setData]) => {
    // Truncate long labels for better display
    const displayName = setName.length > 40 ? setName.substring(0, 37) + '...' : setName;
    return displayName;
  });
  
  const values = topSets.map(([, setData]) => setData.totalSales);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Total Sales',
        data: values,
        backgroundColor: '#ffb347',
      },
    ],
  };

  return (
    <div style={{ margin: '2rem 0' }}>
      <h2>Top 10 Sets by Sales Volume</h2>
      <Bar data={chartData} options={{
        indexAxis: 'y', // This makes it horizontal
        responsive: true,
        plugins: { 
          legend: { display: false },
          tooltip: {
            enabled: true,
            mode: 'index',
            intersect: false,
            callbacks: {
              title: function(context) {
                const setName = topSets[context[0].dataIndex][0];
                return setName;
              },
              label: function(context) {
                const setData = topSets[context[0].dataIndex][1];
                return [
                  `Total Sales: $${context.parsed.x.toLocaleString()}`,
                  `Transactions: ${setData.transactionCount}`,
                  `Unique Pins: ${setData.uniquePins.length}`,
                  `Unique Buyers: ${setData.uniqueBuyers.length}`,
                  `Unique Sellers: ${setData.uniqueSellers.length}`
                ];
              },
              afterBody: function(context) {
                const setData = topSets[context[0].dataIndex][1];
                const recentSales = setData.sales.slice(-3); // Show last 3 sales
                
                if (recentSales.length === 0) return [];
                
                const salesInfo = recentSales.map(sale => 
                  `• ${sale.shape} (${sale.variant}) - $${sale.price} - ${sale.buyer} → ${sale.seller}`
                );
                
                const result = ['', 'Recent Sales:'];
                result.push(...salesInfo);
                
                if (setData.sales.length > 3) {
                  result.push(`... and ${setData.sales.length - 3} more`);
                }
                
                return result;
              }
            }
          }
        },
        interaction: {
          mode: 'index',
          intersect: false,
        },
        scales: { 
          x: { 
            title: { display: true, text: 'Total Sales ($)' },
            beginAtZero: true
          }, 
          y: { 
            title: { display: true, text: 'Edition Set' }
          } 
        }
      }} />
    </div>
  );
} 