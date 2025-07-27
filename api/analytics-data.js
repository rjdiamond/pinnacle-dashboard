import { google } from 'googleapis';

export default async function handler(req, res) {
  const sheetId = '1Qb1NpuQi9_KMPhi7NpZ_9xhJW8xXP8_VCaV-ffM5tAE'; // e.g. '1Qb1NpuQi9_KMPhi7NpZ_9xhJW8xXP8_VCaV-ffM5tAE'
  const sheetName = 'cursor';      // e.g. 'cursor'
  const since = req.query.since;   // ISO string or undefined

  // Load service account credentials from Vercel env
  const serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);

  const auth = new google.auth.GoogleAuth({
    credentials: serviceAccount,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const sheets = google.sheets({ version: 'v4', auth: await auth.getClient() });

  try {
    // Fetch all rows (or use ranges for partial reads)
    const range = `${sheetName}`; // or `${sheetName}!A:Z` if you want specific columns
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range,
    });
    const rows = response.data.values;
    if (!rows || rows.length < 2) {
      return res.status(200).json([]);
    }
    const headers = rows[0];
    const dataRows = rows.slice(1);

    // Find timestamp column
    const timestampCol = headers.indexOf('updated_at_block_time');
    if (timestampCol === -1) {
      return res.status(500).json({ error: 'No updated_at_block_time column found' });
    }

    // Filter by timestamp
    let filtered = [];
    let sinceTime = since ? new Date(since).getTime() : null;
    for (const row of dataRows) {
      let rowTime = new Date(row[timestampCol]).getTime();
      if (!sinceTime || rowTime > sinceTime) {
        let obj = {};
        headers.forEach((header, i) => {
          obj[header] = row[i];
        });
        filtered.push(obj);
      } else if (sinceTime) {
        // If sorted DESC, break early
        break;
      }
    }

    res.status(200).json(filtered);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
