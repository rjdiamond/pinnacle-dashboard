import React from 'react';
import './TopSalesTable.css';

export default function TopSalesTable({ data, fullData }) {
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

  // Sort data by price (highest first) and show top 10 sales
  const topSales = [...data]
    .sort((a, b) => parseFloat(b.price) - parseFloat(a.price))
    .slice(0, 10);
    
  // Debug logging
  console.log('TopSalesTable Debug:', {
    totalDataPoints: data.length,
    topSalesCount: topSales.length,
    highestPrice: topSales[0]?.price,
    highestPriceSale: topSales[0]
  });

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'America/Los_Angeles'
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

  const getTotalMinted = (sale) => {
    const set = sale.nft_edition_set_truncatedName || 'Unknown';
    const shape = sale.nft_edition_shape_name || 'Unknown';
    const variant = sale.nft_edition_variant || 'Unknown';
    
    // Find the matching sale in fullData to get the total_minted value
    const matchingSale = fullData.find(fullSale => 
      (fullSale.nft_edition_set_truncatedName || 'Unknown') === set &&
      (fullSale.nft_edition_shape_name || 'Unknown') === shape &&
      (fullSale.nft_edition_variant || 'Unknown') === variant
    );
    
    if (matchingSale && matchingSale.nft_edition_total_minted) {
      return parseInt(matchingSale.nft_edition_total_minted).toLocaleString();
    }
    return 'N/A';
  };

  const formatWalletAddress = (address) => {
    if (!address) return '';
    return address;
  };

  const getSerialNumber = (sale) => {
    if (sale.nft_serial_number !== null && sale.nft_serial_number !== undefined) {
      return `#${sale.nft_serial_number}`;
    }
    return '-';
  };

  return (
    <div className="top-sales-container">
      <h2>Top Sales (Full Event)</h2>
      <div className="table-container">
        <table className="top-sales-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Price</th>
              <th>Average Price (All Events)</th>
              <th>Total Minted</th>
              <th>Serial #</th> 
              <th>Buyer</th>
              <th>Seller</th>
              <th>Pin Details</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {topSales.map((sale, index) => (
              <tr key={`${sale.nft_id}_${sale.updated_at_block_time}_${index}`}>
                <td className="rank">
                  <div className="rank-badge">
                    {index + 1}
                  </div>
                </td>
                <td className="price">
                  {formatPrice(sale.price)}
                </td>
                <td className="avg-price">
                  {getAveragePrice(sale)}
                </td>
                <td className="total-minted">
                  {getTotalMinted(sale)}
                </td>
                <td className="serial-number">
                  {getSerialNumber(sale)}
                </td>
                <td className="buyer">
                  <div className="user-info">
                    <div className="username">
                      {sale.receiver_username || 'Unknown'}
                    </div>
                    <div className="wallet-address">
                      {formatWalletAddress(sale.receiver_flowAddress)}
                    </div>
                  </div>
                </td>
                <td className="seller">
                  <div className="user-info">
                    <div className="username">
                      {sale.seller_username || 'Unknown'}
                    </div>
                    <div className="wallet-address">
                      {formatWalletAddress(sale.seller_flowAddress)}
                    </div>
                  </div>
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
                <td className="timestamp">
                  {formatTimestamp(sale.updated_at_block_time)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 
