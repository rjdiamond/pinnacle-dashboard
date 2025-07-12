import React from 'react';
import './RecentSalesTable.css';

export default function RecentSalesTable({ data, fullData }) {
  // Calculate average prices for unique pins using FULL CSV data
  const calculateAveragePrice = (fullData) => {
    const pinAverages = {};
    
    fullData.forEach(sale => {
      const set = sale.nft_edition_set_truncatedName || 'Unknown';
      const shape = sale.nft_edition_shape_name || 'Unknown';
      const variant = sale.nft_edition_variant || 'Unknown';
      const price = parseFloat(sale.price) || 0;
      
      const pinKey = `${set} - ${shape} - ${variant}`;
      
      if (!pinAverages[pinKey]) {
        pinAverages[pinKey] = {
          total: 0,
          count: 0,
          average: 0
        };
      }
      
      pinAverages[pinKey].total += price;
      pinAverages[pinKey].count += 1;
      pinAverages[pinKey].average = pinAverages[pinKey].total / pinAverages[pinKey].count;
    });
    
    return pinAverages;
  };

  // Use fullData if available, otherwise fall back to filtered data
  const dataForAverages = fullData || data;
  const pinAverages = calculateAveragePrice(dataForAverages);

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
    return `$${parseFloat(price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getAveragePrice = (sale) => {
    const set = sale.nft_edition_set_truncatedName || 'Unknown';
    const shape = sale.nft_edition_shape_name || 'Unknown';
    const variant = sale.nft_edition_variant || 'Unknown';
    const pinKey = `${set} - ${shape} - ${variant}`;
    
    const avgData = pinAverages[pinKey];
    if (avgData && avgData.count > 1) {
      return formatPrice(avgData.average);
    }
    return 'N/A';
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
              <th>Average Price (All Events)</th>
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
                <td className="avg-price">
                  {getAveragePrice(sale)}
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