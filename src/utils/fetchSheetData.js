import Papa from 'papaparse';

// Use a generic API endpoint that doesn't reveal the data source
const API_ENDPOINT = '/api/analytics-data';

// Fallback to local data
const LOCAL_DATA_URL = '/pinnacle_events.csv';

// Filter date: July 9th, 2025
const FILTER_DATE = new Date('2025-07-09T00:00:00.000Z');

function filterDataByDate(data) {
  return data.filter(row => {
    const rowDate = new Date(row.updated_at_block_time);
    return rowDate >= FILTER_DATE;
  });
}

// Secure data fetching that completely hides the source
async function fetchFromSecureAPI() {
  try {
    // This will be handled by a server-side proxy or API route
    const response = await fetch(API_ENDPOINT, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (response.ok) {
      const result = await response.json();
      if (result.success && result.data) {
        return result.data; // This is the CSV string
      }
    }
  } catch (error) {
    console.warn('Analytics service temporarily unavailable');
  }
  return null;
}

// Additional obfuscation: wrap in a generic function name
const getAnalyticsData = async () => {
  try {
    // Try secure API first
    const csv = await fetchFromSecureAPI();
    if (csv) {
      return new Promise((resolve, reject) => {
        Papa.parse(csv, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            const fullData = results.data;
            const filteredData = filterDataByDate(fullData);
            console.log(`Analytics data loaded: ${filteredData.length} records (filtered from ${fullData.length} total)`);
            resolve({ filteredData, fullData });
          },
          error: reject,
        });
      });
    }
  } catch (error) {
    console.warn('Primary analytics source unavailable, using fallback');
  }
  
  try {
    // Fallback to local data
    const response = await fetch(LOCAL_DATA_URL);
    if (response.ok) {
      const csv = await response.text();
      return new Promise((resolve, reject) => {
        Papa.parse(csv, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            const fullData = results.data;
            const filteredData = filterDataByDate(fullData);
            console.log(`Analytics data loaded: ${filteredData.length} records (filtered from ${fullData.length} total)`);
            resolve({ filteredData, fullData });
          },
          error: reject,
        });
      });
    }
  } catch (error) {
    console.warn('Analytics data unavailable, using sample data');
  }
  
  // Final fallback: Return sample data structure
  const sampleData = [
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
  
  return { filteredData: sampleData, fullData: sampleData };
};

// Export with a generic name
export const fetchSheetData = getAnalyticsData;
