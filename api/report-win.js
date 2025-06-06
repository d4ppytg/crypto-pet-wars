// api/report-win.js - ФИНАЛЬНАЯ РАБОЧАЯ ВЕРСИЯ
import { kv } from '@vercel/kv';
import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { initData } = req.body;
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

  if (!initData || !BOT_TOKEN) {
    return res.status(400).json({ error: 'Missing required data' });
  }

  try {
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    params.delete('hash');
    
    const dataCheckArr = [];
    for (const [key, value] of params.entries()) {
      dataCheckArr.push(`${key}=${value}`);
    }
    dataCheckArr.sort();
    
    const dataCheckString = dataCheckArr.join('\n');
    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest();
    const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

    if (calculatedHash !== hash) {
      return res.status(403).json({ error: 'Invalid hash' });
    }

    const user = JSON.parse(params.get('user'));
    const userId = user.id;

    const newScore = await kv.zincrby('leaderboard', 1, userId);

    res.status(200).json({ success: true, newScore });
  } catch (error) {
    console.error('Error in /api/report-win:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}