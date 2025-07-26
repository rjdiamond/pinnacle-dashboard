const GOOGLE_APPS_SCRIPT_URL = process.env.GOOGLE_APPS_SCRIPT_URL || 'https://script.googleusercontent.com/macros/echo?user_content_key=AehSKLjuqaydOJxs7ZOVJVCdItC4AhWWa7pODYFfmkoWInV55aVCvx4h1TiMqTHKb8hDycYcnRw4d0gKEdOjqZyt3Mbm8-5W4O_gJLnhbfy5HQIW7-zdkPESVoNpPJsPNgHbnhRevorwZEQRVeguZLaZ0bipxNR-Q01oka9eB958teDUEwtFk8KfOkyqY3yJMLj8PkKa8DAni-qbFnfhe6XFJA_iyy4gs6_lxphoCKENFImz886ieyKk65W_r1nMBCsdcsmHnGMua69KT1yHV7gUPtMChb9XSVbFwm004bTD&lib=Mk9S-NPd3QfsG2ZPvCwfAPb3St75Ri_GE';

export default async function handler(req, res) {
  // CORS headers as before...

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    // Support passing ?since=timestamp from client
    const since = req.query.since;
    let url = GOOGLE_APPS_SCRIPT_URL;
    if (since) {
      url += `&since=${encodeURIComponent(since)}`;
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();

    res.status(200).json({
      success: true,
      data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    res.status(500).json({
      success: false,
      error: 'Analytics service temporarily unavailable',
      timestamp: new Date().toISOString()
    });
  }
}
