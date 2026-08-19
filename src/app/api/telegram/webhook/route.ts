import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const update = await request.json();

    if (!update || !update.message) {
      return NextResponse.json({ ok: true });
    }

    const message = update.message;
    const rawText = message.text || '';
    const chatId = message.chat.id;
    const fromUser = message.from || {};
    const telegramId = String(fromUser.id);
    
    // Формируем имя пользователя без ломающих спецсимволов
    const firstName = fromUser.first_name || '';
    const lastName = fromUser.last_name || '';
    const fullName = [firstName, lastName].filter(Boolean).join(' ') || fromUser.username || `Пользователь #${telegramId.slice(-4)}`;

    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    // Вспомогательная функция отправки сообщения в Telegram
    const sendReply = async (text: string) => {
      if (!botToken) {
        console.error('TELEGRAM_BOT_TOKEN не задан в переменных');
        return;
      }
      try {
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: text,
          }),
        });
      } catch (e) {
        console.error('Ошибка отправки в Telegram API:', e);
      }
    };

    // 1. АВТОРИЗАЦИЯ С САЙТА: /start auth_XXXXXXXX
    if (rawText.startsWith('/start auth_')) {
      const token = rawText.replace('/start auth_', '').trim();

      // Ищем или создаем пользователя в БД
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
        // Привязываем telegram_id если его не было
        await sql`
          UPDATE users 
          SET telegram_id = ${telegramId} 
          WHERE id = ${currentUser.id}::uuid
        `;
      }

      // Сохраняем авторизованную сессию в БД
      await sql`
        INSERT INTO telegram_auth_sessions (token, status, user_id, user_data)
        VALUES (${token}, 'authorized', ${currentUser.id}::uuid, ${JSON.stringify(currentUser)}::jsonb)
        ON CONFLICT (token) DO UPDATE 
        SET status = 'authorized',
            user_id = ${currentUser.id}::uuid,
            user_data = ${JSON.stringify(currentUser)}::jsonb
      `;

      // Отправляем подтверждение в чат боту
      await sendReply(
        `✅ Авторизация прошла успешно!\n\nЗдравствуйте, ${fullName}!\nВы успешно вошли на сайт «Райский Пляж».\n\nМожете возвращаться в браузер — сайт уже открыт в вашем профиле.`
      );

      return NextResponse.json({ ok: true });
    }

    // 2. ОБЫЧНЫЙ /start
    if (rawText === '/start') {
      await sendReply(
        `👋 Здравствуйте, ${fullName}!\n\nЭто официальный бот сервиса бронирования «Райский Пляж».\nЗдесь вы будете получать важные уведомления о статусе ваших бронирований.`
      );
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('Ошибка webhook Telegram:', error);
    return NextResponse.json({ ok: true });
  }
}