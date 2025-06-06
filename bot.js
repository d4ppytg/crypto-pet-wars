const TelegramBot = require('node-telegram-bot-api');

// Замените на ваш токен от @BotFather
const token = '7294935899:AAEfs50Vk2dLqpg2Cef2BGdVkR4ALwCfh6o';
const webAppUrl = 'https://crypto-pet-wars.vercel.app';

const bot = new TelegramBot(token, { polling: true });

// Команда /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const user = msg.from;
  
  const welcomeMessage = `
🐾 *Добро пожаловать в Crypto Pet Wars!*

Привет, ${user.first_name}! 

🎮 *Что вас ждет:*
• Коллекционирование уникальных питомцев
• Захватывающие бои в реальном времени  
• Система прокачки и эволюции
• Турниры и соревнования
• Торговля и обмен питомцами

💰 *Стартовый бонус:* 1000 монет!

Нажмите кнопку "🎮 Играть" чтобы начать!
  `;

  const options = {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: '🎮 Играть',
            web_app: { url: webAppUrl }
          }
        ],
        [
          {
            text: '📊 Статистика',
            callback_data: 'stats'
          },
          {
            text: '🏆 Рейтинг',
            callback_data: 'leaderboard'
          }
        ],
        [
          {
            text: '💬 Чат игроков',
            url: 't.me/crypto_pet_wars_chat'
          }
        ]
      ]
    }
  };

  bot.sendMessage(chatId, welcomeMessage, options);
});

// Команда /help
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  
  const helpMessage = `
🆘 *Помощь по игре*

🎮 *Основы игры:*
• Покупайте питомцев в магазине
• Прокачивайте их в боях
• Собирайте коллекцию редких питомцев

⚔️ *Бои:*
• Выберите питомца для боя
• Нажмите "Атаковать" в нужный момент
• Побеждайте и получайте награды

💰 *Экономика:*
• Зарабатывайте монеты в боях
• Покупайте новых питомцев
• Улучшайте существующих

🏆 *Редкость питомцев:*
• Обычные (серые)
• Редкие (синие) 
• Эпические (фиолетовые)
• Легендарные (золотые)

❓ Остались вопросы? Напишите /support
  `;

  bot.sendMessage(chatId, helpMessage, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: '🎮 Играть',
            web_app: { url: webAppUrl }
          }
        ]
      ]
    }
  });
});

// Обработка callback запросов
bot.on('callback_query', (callbackQuery) => {
  const message = callbackQuery.message;
  const data = callbackQuery.data;
  const chatId = message.chat.id;

  switch(data) {
    case 'stats':
      // Здесь можно получить статистику игрока из базы данных
      bot.sendMessage(chatId, `
📊 *Ваша статистика:*

🐾 Питомцев: 0
🏆 Побед: 0  
💰 Монет: 1000
⭐ Уровень: 1

_Начните играть, чтобы улучшить статистику!_
      `, { 
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[
            { text: '🎮 Играть', web_app: { url: webAppUrl }}
          ]]
        }
      });
      break;
      
    case 'leaderboard':
      bot.sendMessage(chatId, `
🏆 *Топ игроков:*

1. 👑 Player1 - 5000 побед
2. 🥈 Player2 - 4500 побед  
3. 🥉 Player3 - 4000 побед
4. 🏅 Player4 - 3500 побед
5. 🏅 Player5 - 3000 побед

_Сражайтесь больше, чтобы попасть в топ!_
      `, { 
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[
            { text: '🎮 Играть', web_app: { url: webAppUrl }}
          ]]
        }
      });
      break;
  }
  
  bot.answerCallbackQuery(callbackQuery.id);
});

// Команда /support
bot.onText(/\/support/, (msg) => {
  const chatId = msg.chat.id;
  
  bot.sendMessage(chatId, `
🆘 *Техническая поддержка*

Если у вас возникли проблемы:

1. 🔄 Попробуйте перезапустить игру
2. 📱 Обновите Telegram до последней версии  
3. 🌐 Проверьте интернет-соединение

💬 *Связаться с нами:*
• Напишите @your_support_username
• Email: support@cryptopetwars.com

⏱️ Время ответа: до 24 часов
  `, { parse_mode: 'Markdown' });
});

// Обработка текстовых сообщений
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  // Игнорируем команды (они обрабатываются отдельно)
  if (text && text.startsWith('/')) return;

  // Обработка сообщений из Web App
  if (msg.web_app_data) {
    try {
      const data = JSON.parse(msg.web_app_data.data);
      
      // Здесь обрабатывайте данные из игры
      console.log('Данные из Web App:', data);
      
      // Пример: сохранение результатов боя
      if (data.type === 'battle_result') {
        bot.sendMessage(chatId, `
🎉 *Результат боя!*

${data.won ? '🏆 Победа!' : '💀 Поражение'}
💰 Получено: ${data.coins} монет
⭐ Опыт: +${data.experience}
        `, { parse_mode: 'Markdown' });
      }
      
    } catch (error) {
      console.error('Ошибка обработки Web App данных:', error);
    }
    return;
  }

  // Ответ на обычные сообщения
  const responses = [
    'Привет! Готов к сражениям? 🎮',
    'Нажми кнопку "🎮 Играть" чтобы начать!',
    'Твои питомцы ждут тебя в игре! 🐾',
    'Время для эпических боев! ⚔️'
  ];
  
  const randomResponse = responses[Math.floor(Math.random() * responses.length)];
  
  bot.sendMessage(chatId, randomResponse, {
    reply_markup: {
      inline_keyboard: [[
        { text: '🎮 Играть', web_app: { url: webAppUrl }}
      ]]
    }
  });
});

// Обработка ошибок
bot.on('error', (error) => {
  console.error('Ошибка бота:', error);
});

console.log('🤖 Crypto Pet Wars Bot запущен!');
console.log('🌐 Web App URL:', webAppUrl);
