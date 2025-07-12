import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';

Chart.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

function processBuyerData(data, topN = 15) {
  const buyerStats = {};
  
  data.forEach(row => {
    const username = row.receiver_username || 'Unknown';
    const price = parseFloat(row.price) || 0;
    const timestamp = row.updated_at_block_time;
    const pinDetails = `${row.nft_edition_set_truncatedName || 'Unknown'} - ${row.nft_edition_shape_name || 'Unknown'}`;
    const seller = row.seller_username || 'Unknown';
    
    if (!buyerStats[username]) {
      buyerStats[username] = {
        totalSpend: 0,
        transactionCount: 0,
        purchases: [],
        walletAddress: row.receiver_flowAddress || 'N/A'
      };
    }
    
    buyerStats[username].totalSpend += price;
    buyerStats[username].transactionCount += 1;
    buyerStats[username].purchases.push({
      price,
      timestamp,
      pinDetails,
      seller,
      date: new Date(timestamp)
    });
  });
  
  // Sort purchases by date (most recent first) for each buyer
  Object.values(buyerStats).forEach(buyer => {
    buyer.purchases.sort((a, b) => b.date - a.date);
  });
  
  // Sort buyers by total spend and get top N
  return Object.entries(buyerStats)
    .sort((a, b) => b[1].totalSpend - a[1].totalSpend)
    .slice(0, topN);
}

export default function TopReceiversChart({ data }) {
  const topBuyers = processBuyerData(data, 15);
  const labels = topBuyers.map(([name]) => name);
  const values = topBuyers.map(([, stats]) => stats.totalSpend);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Total Spend',
        data: values,
        backgroundColor: '#34d399',
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
      <h2>Top 15 Buyers by Spend</h2>
      <div style={{ width: '100%', height: '500px' }}>
        <Bar data={chartData} options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: { 
            legend: { display: false },
            tooltip: {
              callbacks: {
                title: function(context) {
                  const buyerName = context[0].label;
                  const buyerData = topBuyers.find(([name]) => name === buyerName);
                  return buyerData ? buyerData[1].walletAddress : buyerName;
                },
                label: function(context) {
                  const buyerName = context.label;
                  const buyerData = topBuyers.find(([name]) => name === buyerName);
                  if (!buyerData) return context.parsed.x;
                  
                  const stats = buyerData[1];
                  const last3Purchases = stats.purchases.slice(0, 3);
                  
                  let tooltipText = [
                    `👤 ${buyerName}`,
                    `💰 Total Spend: ${formatPrice(stats.totalSpend)}`,
                    `🛒 Transactions: ${stats.transactionCount}`,
                    `📊 Avg Purchase: ${formatPrice(stats.totalSpend / stats.transactionCount)}`,
                    '',
                    '🕒 Last 3 Purchases:'
                  ];
                  
                  last3Purchases.forEach((purchase, index) => {
                    tooltipText.push(
                      `${index + 1}. ${formatPrice(purchase.price)} - ${purchase.pinDetails}`,
                      `   From: ${purchase.seller} (${formatDate(purchase.timestamp)})`
                    );
                  });
                  
                  if (stats.purchases.length > 3) {
                    tooltipText.push(`   ... and ${stats.purchases.length - 3} more`);
                  }
                  
                  return tooltipText;
                }
              }
            }
          },
          indexAxis: 'y',
          scales: { 
            x: { 
              title: { display: true, text: 'Total Spend ($)' },
              beginAtZero: true
            }, 
            y: { 
              title: { display: true, text: 'Buyer' } 
            } 
          }
        }} />
      </div>
    </div>
  );
} 