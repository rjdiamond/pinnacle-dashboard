import React from 'react';
import './RecentSalesTable.css';

export default function RecentSalesTable({ data }) {
  // Sort data by timestamp (most recent first) and take the latest 20 sales
  const recentSales = [...data]
    .sort((a, b) => new Date(b.updated_at_block_time) - new Date(a.updated_at_block_time))
    .slice(0, 20);

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatPrice = (price) => {
    return `$${parseFloat(price).toLocaleString()}`;
  };

  return (
    <div className="recent-sales-container">
      <h2>Recent Sales</h2>
      <div className="table-container">
        <table className="recent-sales-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Price</th>
              <th>Buyer</th>
              <th>Seller</th>
              <th>Pin Details</th>
            </tr>
          </thead>
          <tbody>
            {recentSales.map((sale, index) => (
              <tr key={`${sale.nft_id}_${sale.updated_at_block_time}_${index}`}>
                <td className="timestamp">
                  {formatTimestamp(sale.updated_at_block_time)}
                </td>
                <td className="price">
                  {formatPrice(sale.price)}
                </td>
                <td className="buyer">
                  {sale.receiver_username || 'Unknown'}
                </td>
                <td className="seller">
                  {sale.seller_username || 'Unknown'}
                </td>
                <td className="pin-details">
                  <div className="pin-info">
                    <div className="set-name">
                      {sale.nft_edition_set_truncatedName || 'Unknown'}
                    </div>
                    <div className="shape-variant">
                      {sale.nft_edition_shape_name || 'Unknown'} 
                      {sale.nft_edition_variant && ` (${sale.nft_edition_variant})`}
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 