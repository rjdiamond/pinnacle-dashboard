import Papa from 'papaparse';

// Use a generic API endpoint that doesn't reveal the data source
const API_ENDPOINT = '/api/analytics-data';

// Fallback to local data
const LOCAL_DATA_URL = '/pinnacle_events.csv';

// Secure data fetching with incremental support
export async function fetchSheetData(sinceTimestamp = null) {
  try {
    let url = API_ENDPOINT;
    if (sinceTimestamp) {
      url += `?since=${encodeURIComponent(sinceTimestamp)}`;
    }
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (response.ok) {
      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        // API returns JSON array (no CSV)
        return result.data;
      }
    }
  } catch (error) {
    console.warn('Analytics service temporarily unavailable, falling back to local CSV');
  }

  // Fallback: load and parse local CSV file
  try {
    const response = await fetch(LOCAL_DATA_URL);
    if (response.ok) {
      const csv = await response.text();
      // Lazy-load Papa in fallback only
      const Papa = (await import('papaparse')).default;
      return new Promise((resolve, reject) => {
        Papa.parse(csv, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            resolve(results.data);
          },
          error: reject,
        });
      });
    }
  } catch (error) {
    console.warn('Local analytics data unavailable, using sample data');
  }

  // Final fallback: Return sample data structure
  return [
    {
      updated_at_block_time: '2025-07-12T19:08:10.735715Z',
      nft_id: '1468906216',
      price: '149',
      commission_amount: '10.93',
      receiver_username: 'kokishin',
      receiver_flowAddress: '99c84934165be2c2',
      seller_username: 'failed',
      seller_flowAddress: '4573d21f758f5085',
      nft_edition_set_truncatedName: 'Disney Princess Vol.1',
      nft_edition_shape_name: 'Ariel',
      nft_edition_shape_render_id: 'OEV1-PRIN-ARIE',
      nft_edition_shape_edition_type: 'Open Edition',
      nft_edition_chaser: 'FALSE',
      nft_edition_series_name: '2023',
      nft_edition_total_burned: '0',
      nft_edition_total_minted: '322',
      nft_edition_variant: 'Digital Display',
      cursor: 'sample_cursor'
    }
  ];
}
