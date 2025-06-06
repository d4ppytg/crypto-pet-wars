// api/report-win.js
import { kv } from '@vercel/kv';
import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { initData } = req.body;
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

  // --- НОВЫЕ ЛОГИ ДЛЯ ОТЛАДКИ ---
  console.log('Received request body:', req.body);
  console.log('Is initData present?', !!initData);
  console.log('Is BOT_TOKEN present?', !!BOT_TOKEN);
  // --- КОНЕЦ НОВЫХ ЛОГОВ ---

  if (!initData || !BOT_TOKEN) {
    console.error('Validation check failed: Missing initData or BOT_TOKEN.');
    return res.status(400).json({ error: 'Missing initData or bot token' });
  }
  
  // ... остальной код
  }
  // --- КОНЕЦ ВАЛИДАЦИИ ---

  // Если валидация прошла, мы доверяем данным
  try {
    const user = JSON.parse(params.get('user'));
    const userId = user.id;

    // Увеличиваем счет игрока на 1 в отсортированном списке 'leaderboard'
    // Если игрока нет, он будет создан со счетом 1.
    const newScore = await kv.zincrby('leaderboard', 1, userId);

    res.status(200).json({ success: true, newScore: newScore });
  } catch (error) {
    console.error('Error reporting win:', error);
    res.status(500).json({ error: 'Failed to report win' });
  }
}// api/report-win.js
import { kv } from '@vercel/kv';
import crypto from 'crypto';

export default async function handler(req, res) {
  // 1. Принимаем только POST запросы
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 2. Получаем данные из тела запроса и токен бота из переменных окружения
  const { initData } = req.body;
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

  if (!initData || !BOT_TOKEN) {
    return res.status(400).json({ error: 'Missing initData or bot token' });
  }

  // 3. --- ВАЛИДАЦИЯ initData (самая важная часть) ---
  // Превращаем строку initData в объект
  const params = new URLSearchParams(initData);
  
  // Получаем хеш из запроса, который прислал Telegram
  const hash = params.get('hash');
  // Удаляем хеш из параметров, чтобы он не участвовал в проверке
  params.delete('hash');

  // Собираем все остальные параметры в массив для сортировки
  const dataCheckArr = [];
  for (const [key, value] of params.entries()) {
    dataCheckArr.push(`${key}=${value}`);
  }

  // Сортируем параметры в алфавитном порядке
  dataCheckArr.sort();
  
  // Соединяем отсортированные параметры в одну строку через перевод строки
  const dataCheckString = dataCheckArr.join('\n');

  // 4. --- Создаем наш собственный хеш для сравнения ---
  // Создаем секретный ключ на основе токена бота
  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest();
  
  // Создаем хеш из нашей строки с параметрами, используя секретный ключ
  const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

  // 5. --- Сравниваем хеши ---
  // Если наш хеш не совпадает с тем, что прислал Telegram, значит, запрос поддельный
  if (calculatedHash !== hash) {
    return res.status(403).json({ error: 'Invalid hash. Unauthorized.' });
  }

  // 6. --- Если валидация прошла, мы доверяем данным и работаем с базой ---
  try {
    const user = JSON.parse(params.get('user'));
    const userId = user.id;

    // Увеличиваем счет игрока (userId) на 1 в отсортированном списке 'leaderboard'.
    // Если игрока еще нет, он будет создан со счетом 1.
    const newScore = await kv.zincrby('leaderboard', 1, userId);

    // Отправляем успешный ответ
    res.status(200).json({ success: true, newScore: newScore });
  } catch (error) {
    console.error('Error reporting win:', error);
    res.status(500).json({ error: 'Failed to report win' });
  }
}