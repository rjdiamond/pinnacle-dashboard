import React from 'react';
import './TopSalesTable.css';

export default function TopSellersByCount({ data }) {
  // Calculate seller counts and total earned
  const sellerStats = {};
  data.forEach(row => {
    const seller = row.seller_username || 'Unknown';
    const price = parseFloat(row.price) || 0;
    if (!sellerStats[seller]) {
      sellerStats[seller] = { count: 0, total: 0 };
    }
    sellerStats[seller].count += 1;
    sellerStats[seller].total += price;
  });

  // Sort by count (desc), then by total earned (desc)
  const sorted = Object.entries(sellerStats)
    .sort((a, b) => b[1].count - a[1].count || b[1].total - a[1].total)
    .slice(0, 10);

  return (
    <div className="top-sales-container">
      <h2>Top 15 Sellers by Count</h2>
      <div className="table-container">
        <table className="top-sales-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Username</th>
              <th>Count</th>
              <th>Total Earned</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(([seller, stats], idx) => (
              <tr key={seller}>
                <td className="rank"><div className="rank-badge">{idx + 1}</div></td>
                <td>{seller}</td>
                <td>{stats.count.toLocaleString()}</td>
                <td>${stats.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 