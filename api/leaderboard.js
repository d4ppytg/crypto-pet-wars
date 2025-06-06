// api/leaderboard.js
import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Получаем топ-10 игроков из отсортированного списка 'leaderboard'
    // rev: true означает, что мы сортируем от большего к меньшему
    const leaderboardData = await kv.zrange('leaderboard', 0, 9, { withScores: true, rev: true });

    // Преобразуем данные в удобный формат
    const formattedLeaderboard = [];
    for (let i = 0; i < leaderboardData.length; i += 2) {
      const userId = leaderboardData[i];
      const score = leaderboardData[i + 1];
      // Здесь мы пока используем userId, позже можно добавить имя
      formattedLeaderboard.push({ rank: i / 2 + 1, name: `Player ${userId}`, score });
    }

    res.status(200).json(formattedLeaderboard);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
}