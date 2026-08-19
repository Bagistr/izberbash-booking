import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const update = await request.json();

    if (!update || !update.message) {
      return NextResponse.json({ ok: true });
    }

    const message = update.message;
    const text = (message.text || '').trim();
    const chatId = message.chat.id;
    const telegramId = String(message.from.id);
    const firstName = message.from.first_name || '';
    const lastName = message.from.last_name || '';
    const username = message.from.username || '';
    const fullName = [firstName, lastName].filter(Boolean).join(' ') || username || 'Гость';

    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    const sendMessage = async (replyText: string) => {
      if (!botToken) return;
      try {
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: replyText,
            parse_mode: 'HTML',
          }),
        });
      } catch (err) {
        console.error('Ошибка sendMessage TG:', err);
      }
    };

    // 1. АВТОРИЗАЦИЯ С САЙТА: /start auth_XXXXXXXX
    if (text.startsWith('/start auth_')) {
      const token = text.replace('/start auth_', '').trim();

      // Создаем пользователя в БД, если его еще нет
      let userRows = await sql`
        SELECT id, name, phone, role FROM users
        WHERE telegram_id = ${telegramId} OR phone = ${`tg_${telegramId}`}
        LIMIT 1
      `;

      let currentUser;
      if (userRows.length === 0) {
        const inserted = await sql`
          INSERT INTO users (name, phone, role, telegram_id)
          VALUES (${fullName}, ${`tg_${telegramId}`}, 'guest', ${telegramId})
          RETURNING id, name, phone, role
        `;
        currentUser = inserted[0];
      } else {
        currentUser = userRows[0];
      }

      // Сохраняем сессию как авторизованную
      await sql`
        INSERT INTO telegram_auth_sessions (token, status, user_id, user_data)
        VALUES (${token}, 'authorized', ${currentUser.id}::uuid, ${JSON.stringify(currentUser)}::jsonb)
        ON CONFLICT (token) DO UPDATE 
        SET status = 'authorized',
            user_id = ${currentUser.id}::uuid,
            user_data = ${JSON.stringify(currentUser)}::jsonb
      `;

      // Бот отправляет сообщение в диалог Telegram
      await sendMessage(
        `✅ <b>Авторизация прошла успешно!</b>\n\nЗдравствуйте, <b>${fullName}</b>!\nВы успешно вошли на сайт <b>«Райский Пляж»</b>.\n\nМожете возвращаться в браузер — сайт уже открыт в вашем профиле.`
      );

      return NextResponse.json({ ok: true });
    }

    // 2. ОБЫЧНАЯ КОМАНДА /start
    if (text === '/start') {
      await sendMessage(
        `👋 Здравствуйте, <b>${fullName}</b>!\n\nЭто официальный бот сервиса бронирования <b>«Райский Пляж»</b>.`
      );
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('Критическая ошибка Telegram Webhook:', error);
    return NextResponse.json({ ok: true });
  }
}