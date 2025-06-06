// api/report-win.js - ВЕРСИЯ С СОХРАНЕНИЕМ ИМЕНИ
import { kv } from '@vercel/kv';
import crypto from 'crypto';

export default async function handler(req, res) {
  // 1. Проверяем, что это POST запрос
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 2. Получаем данные и токен
  const { initData } = req.body;
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

  if (!initData || !BOT_TOKEN) {
    return res.status(400).json({ error: 'Missing required data' });
  }

  // 3. Валидация initData
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

    // Если хеши не совпадают, это поддельный запрос
    if (calculatedHash !== hash) {
      return res.status(403).json({ error: 'Invalid hash' });
    }

    // 4. Валидация прошла, работаем с данными
    const user = JSON.parse(params.get('user'));
    const userId = user.id.toString(); // Преобразуем ID в строку на всякий случай

    // --- НАЧАЛО ИЗМЕНЕНИЙ ---
    // Собираем полное имя или используем username/firstname
    const userName = user.first_name + (user.last_name ? ` ${user.last_name}` : '') || user.username || `Player ${userId}`;

    // 1. Увеличиваем счет в лидерборде (отсортированный список)
    const newScore = await kv.zincrby('leaderboard', 1, userId);
    
    // 2. Сохраняем имя пользователя в отдельном "справочнике" (хеш-таблица)
    // Ключ справочника 'user_details', поле - ID пользователя, значение - его имя.
    await kv.hset('user_details', { [userId]: userName });
    // --- КОНЕЦ ИЗМЕНЕНИЙ ---

    res.status(200).json({ success: true, newScore });
  } catch (error) {
    console.error('Error in /api/report-win:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}