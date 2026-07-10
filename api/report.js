const fetch = require('node-fetch');

const requestLog = new Map();

async function sendToTelegram(report) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  
  const timestamp = new Date().toLocaleString('en-US', {
    timeZone: 'Africa/Lagos',
    dateStyle: 'full',
    timeStyle: 'long'
  });
  
  const message = `♟️ *CHECKMATE REPORT*\n⏰ _${timestamp}_\n━━━━━━━━━━━━━━━━━━━━\n${report}\n━━━━━━━━━━━━━━━━━━━━\n🔒 _Checkmate by Supremee_`;

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
      parse_mode: 'Markdown',
      disable_web_page_preview: true
    })
  });
  
  const data = await response.json();
  
  if (!data.ok) {
    throw new Error(data.description || 'Telegram API error');
  }
  
  return { success: true };
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { report } = req.body;
    
    if (!report || report.length < 10) {
      return res.status(400).json({ error: 'Invalid report data' });
    }
    
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const now = Date.now();
    const windowMs = 60000;
    
    if (!requestLog.has(ip)) {
      requestLog.set(ip, []);
    }
    
    const timestamps = requestLog.get(ip).filter(t => now - t < windowMs);
    
    if (timestamps.length >= 5) {
      return res.status(429).json({ error: 'Too many requests' });
    }
    
    timestamps.push(now);
    requestLog.set(ip, timestamps);
    
    await sendToTelegram(report);
    
    res.json({ success: true, message: 'Report sent to Checkmate HQ' });
    
  } catch (error) {
    console.error('Report error:', error);
    res.status(500).json({ error: 'Failed to send report' });
  }
};