import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';

Chart.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

function processSellerData(data, topN = 15) {
  const sellerStats = {};
  
  data.forEach(row => {
    const username = row.seller_username || 'Unknown';
    const price = parseFloat(row.price) || 0;
    const timestamp = row.updated_at_block_time;
    const pinDetails = `${row.nft_edition_set_truncatedName || 'Unknown'} - ${row.nft_edition_shape_name || 'Unknown'}`;
    const buyer = row.receiver_username || 'Unknown';
    const commission = parseFloat(row.commission_amount) || 0;
    
    if (!sellerStats[username]) {
      sellerStats[username] = {
        totalSales: 0,
        totalCommission: 0,
        transactionCount: 0,
        sales: [],
        walletAddress: row.seller_flowAddress || 'N/A'
      };
    }
    
    sellerStats[username].totalSales += price;
    sellerStats[username].totalCommission += commission;
    sellerStats[username].transactionCount += 1;
    sellerStats[username].sales.push({
      price,
      commission,
      timestamp,
      pinDetails,
      buyer,
      date: new Date(timestamp)
    });
  });
  
  // Sort sales by date (most recent first) for each seller
  Object.values(sellerStats).forEach(seller => {
    seller.sales.sort((a, b) => b.date - a.date);
  });
  
  // Sort sellers by total sales and get top N
  return Object.entries(sellerStats)
    .sort((a, b) => b[1].totalSales - a[1].totalSales)
    .slice(0, topN);
}

export default function TopSellersChart({ data }) {
  const topSellers = processSellerData(data, 15);
  const labels = topSellers.map(([name]) => name);
  const values = topSellers.map(([, stats]) => stats.totalSales);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Total Sales',
        data: values,
        backgroundColor: '#f87171',
      },
    ],
  };

  const formatPrice = (price) => {
    return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div style={{ 
      margin: '2rem 0', 
      width: '100%', 
      textAlign: 'center', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      minWidth: 'auto'
    }}>
      <h2>Top 15 Sellers by Sales</h2>
      <div style={{ width: '100%', height: '500px' }}>
      <Bar data={chartData} options={{
        responsive: true,
          maintainAspectRatio: false,
          plugins: { 
            legend: { display: false },
            tooltip: {
              callbacks: {
                title: function(context) {
                  const sellerName = context[0].label;
                  const sellerData = topSellers.find(([name]) => name === sellerName);
                  return sellerData ? sellerData[1].walletAddress : sellerName;
                },
                label: function(context) {
                  const sellerName = context.label;
                  const sellerData = topSellers.find(([name]) => name === sellerName);
                  if (!sellerData) return context.parsed.x;
                  
                  const stats = sellerData[1];
                  const last3Sales = stats.sales.slice(0, 3);
                  
                  let tooltipText = [
                    `👤 ${sellerName}`,
                    `💰 Total Sales: ${formatPrice(stats.totalSales)}`,
                    `💸 Total Commission: ${formatPrice(stats.totalCommission)}`,
                    `🛒 Transactions: ${stats.transactionCount}`,
                    `📊 Avg Sale: ${formatPrice(stats.totalSales / stats.transactionCount)}`,
                    `📈 Commission Rate: ${((stats.totalCommission / stats.totalSales) * 100).toFixed(1)}%`,
                    '',
                    '🕒 Last 3 Sales:'
                  ];
                  
                  last3Sales.forEach((sale, index) => {
                    tooltipText.push(
                      `${index + 1}. ${formatPrice(sale.price)} - ${sale.pinDetails}`,
                      `   To: ${sale.buyer} (${formatDate(sale.timestamp)})`
                    );
                  });
                  
                  if (stats.sales.length > 3) {
                    tooltipText.push(`   ... and ${stats.sales.length - 3} more`);
                  }
                  
                  return tooltipText;
                }
              }
            }
          },
        indexAxis: 'y',
          scales: { 
            x: { 
              title: { display: true, text: 'Total Sales ($)' },
              beginAtZero: true
            }, 
            y: { 
              title: { display: true, text: 'Seller' } 
            } 
          }
      }} />
      </div>
    </div>
  );
} 