// api/report-win.js - ПРАВИЛЬНАЯ ВЕРСИЯ
import { kv } from '@vercel/kv';
import crypto from 'crypto';

export default async function handler(req, res) {
  // 1. Принимаем только POST запросы
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 2. Получаем данные и токен
  const { initData } = req.body;
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

  // 3. Проверяем наличие данных
  if (!initData || !BOT_TOKEN) {
    console.error('Validation check failed: Missing initData or BOT_TOKEN.');
    return res.status(400).json({ error: 'Missing initData or bot token' });
  }

  // 4. Валидация initData
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

  // 5. Сравнение хешей
  if (calculatedHash !== hash) {
    console.error('Validation Failed: Invalid hash');
    return res.status(403).json({ error: 'Invalid hash. Unauthorized.' });
  }

  // 6. Если все ОК, работаем с базой
  try {
    const user = JSON.parse(params.get('user'));
    const userId = user.id;

    console.log(`Validation OK. Incrementing score for user: ${userId}`);
    
    // Увеличиваем счет игрока на 1
    const newScore = await kv.zincrby('leaderboard', 1, userId);

    res.status(200).json({ success: true, newScore: newScore });
  } catch (error) {
    console.error('Error in KV operation:', error);
    res.status(500).json({ error: 'Failed to report win' });
  }
}