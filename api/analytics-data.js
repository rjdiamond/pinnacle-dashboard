// Vercel serverless function to proxy Google Sheets data
// This runs server-side and completely hides the data source from the client

const GOOGLE_SHEETS_URL = process.env.GOOGLE_SHEETS_URL || 'https://docs.google.com/spreadsheets/d/1Qb1NpuQi9_KMPhi7NpZ_9xhJW8xXP8_VCaV-ffM5tAE/export?format=csv&gid=1069134817';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    // Fetch data from Google Sheets server-side
    const response = await fetch(GOOGLE_SHEETS_URL);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const csvData = await response.text();
    
    // Return the CSV data as JSON
    res.status(200).json({
      success: true,
      data: csvData,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    
    // Return error response
    res.status(500).json({
      success: false,
      error: 'Analytics service temporarily unavailable',
      timestamp: new Date().toISOString()
    });
  }
} 