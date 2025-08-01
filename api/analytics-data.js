// Vercel serverless function to proxy Google Sheets data
// This runs server-side and completely hides the data source from the client

const GOOGLE_SHEETS_URL = process.env.GOOGLE_SHEETS_URL || 'https://docs.google.com/spreadsheets/d/1Qb1NpuQi9_KMPhi7NpZ_9xhJW8xXP8_VCaV-ffM5tAE/export?format=csv&gid=340314545';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, If-Modified-Since');

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
    // Check if client provided If-Modified-Since header for caching
    const ifModifiedSince = req.headers['if-modified-since'];
    const lastModified = new Date().toUTCString(); // In a real app, this would be the actual sheet modified time
    
    // Fetch data from Google Sheets server-side
    const response = await fetch(GOOGLE_SHEETS_URL);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const csvData = await response.text();
    
    // Add caching headers
    res.setHeader('Last-Modified', lastModified);
    res.setHeader('Cache-Control', 'public, max-age=60'); // Cache for 60 seconds
    
    // Return the CSV data as JSON with metadata
    res.status(200).json({
      success: true,
      data: csvData,
      timestamp: new Date().toISOString(),
      lastModified: lastModified,
      size: csvData.length
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
