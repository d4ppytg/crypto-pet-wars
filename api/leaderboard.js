// api/leaderboard.js - ВЕРСИЯ С ПОЛУЧЕНИЕМ ИМЕНИ
import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // 1. Получаем топ-10 ID игроков и их очки из отсортированного списка
    const leaderboardData = await kv.zrange('leaderboard', 0, 9, { withScores: true, rev: true });

    // --- НАЧАЛО ИЗМЕНЕНИЙ ---

    // 2. Собираем все ID в отдельный массив
    const userIds = [];
    for (let i = 0; i < leaderboardData.length; i += 2) {
      userIds.push(leaderboardData[i]);
    }
    
    let userNames = {};
    // Если есть хотя бы один лидер
    if (userIds.length > 0) {
      // 3. Делаем ОДИН запрос к базе, чтобы получить имена для ВСЕХ ID
      const names = await kv.hmget('user_details', ...userIds);
      
      // 4. Сопоставляем ID с полученными именами
      userIds.forEach((id, index) => {
        // Если имя для какого-то ID не нашлось, используем запасной вариант
        userNames[id] = names[index] || `Player ${id}`;
      });
    }

    // 5. Формируем финальный ответ, объединяя ранг, очки и имя
    const formattedLeaderboard = [];
    for (let i = 0; i < leaderboardData.length; i += 2) {
      const userId = leaderboardData[i];
      const score = leaderboardData[i + 1];
      formattedLeaderboard.push({
        rank: i / 2 + 1,
        name: userNames[userId], // Используем полученное имя
        score
      });
    }
    // --- КОНЕЦ ИЗМЕНЕНИЙ ---

    res.status(200).json(formattedLeaderboard);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
}