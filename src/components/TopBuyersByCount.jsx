import React from 'react';
import './TopSalesTable.css';

export default function TopBuyersByCount({ data }) {
  // Calculate buyer counts and total spent
  const buyerStats = {};
  data.forEach(row => {
    const buyer = row.receiver_username || 'Unknown';
    const price = parseFloat(row.price) || 0;
    if (!buyerStats[buyer]) {
      buyerStats[buyer] = { count: 0, total: 0 };
    }
    buyerStats[buyer].count += 1;
    buyerStats[buyer].total += price;
  });

  // Sort by count (desc), then by total spent (desc)
  const sorted = Object.entries(buyerStats)
    .sort((a, b) => b[1].count - a[1].count || b[1].total - a[1].total)
    .slice(0, 10);

  return (
    <div className="top-sales-container">
      <h2>Top 15 Buyers by Count</h2>
      <div className="table-container">
        <table className="top-sales-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Username</th>
              <th>Count</th>
              <th>Total Spent</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(([buyer, stats], idx) => (
              <tr key={buyer}>
                <td className="rank"><div className="rank-badge">{idx + 1}</div></td>
                <td>{buyer}</td>
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