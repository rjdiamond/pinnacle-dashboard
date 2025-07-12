import Papa from 'papaparse';

// Data source URL
const DATA_URL = 'https://docs.google.com/spreadsheets/d/1Qb1NpuQi9_KMPhi7NpZ_9xhJW8xXP8_VCaV-ffM5tAE/export?format=csv&gid=340314545';

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

export async function fetchSheetData() {
  try {
    // Fetch from primary data source
    const response = await fetch(DATA_URL);
    if (response.ok) {
      const csv = await response.text();
      return new Promise((resolve, reject) => {
        Papa.parse(csv, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            const filteredData = filterDataByDate(results.data);
            console.log(`Loaded ${filteredData.length} transactions after July 9th, 2025`);
            resolve(filteredData);
          },
          error: reject,
        });
      });
    }
  } catch (error) {
    console.warn('Could not fetch from primary source, trying fallback:', error);
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
            const filteredData = filterDataByDate(results.data);
            console.log(`Loaded ${filteredData.length} transactions after July 9th, 2025`);
            resolve(filteredData);
          },
          error: reject,
        });
      });
    }
  } catch (error) {
    console.warn('Could not fetch data, using sample data:', error);
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
