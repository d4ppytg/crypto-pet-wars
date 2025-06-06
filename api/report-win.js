// api/report-win.js -- ОТЛАДОЧНАЯ ВЕРСИЯ

export default async function handler(req, res) {
  console.log('--- DEBUG START ---');
  
  // Логируем тело запроса
  try {
    const { initData } = req.body;
    console.log('Received initData:', initData ? 'Yes' : 'No');
    if (initData) {
      console.log('initData length:', initData.length);
    }
  } catch (e) {
    console.log('Error parsing req.body:', e.message);
  }

  // Логируем переменную окружения
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  console.log('Received BOT_TOKEN from env:', botToken ? `Yes, ends with ...${botToken.slice(-6)}` : 'No, it is undefined');
  
  console.log('--- DEBUG END ---');

  // Временно всегда отвечаем ошибкой, чтобы не записывать данные
  return res.status(422).json({
    message: 'This is a debug response. Check Vercel logs.',
    initDataReceived: !!req.body.initData,
    tokenReceived: !!process.env.TELEGRAM_BOT_TOKEN
  });
}