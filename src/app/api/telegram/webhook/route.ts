import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const update = await request.json();

    // Проверяем наличие сообщения
    if (!update || !update.message) {
      return NextResponse.json({ ok: true });
    }

    const message = update.message;
    const text = message.text || '';
    const chatId = message.chat.id;
    const telegramId = String(message.from.id);
    const firstName = message.from.first_name || '';
    const lastName = message.from.last_name || '';
    const username = message.from.username || '';
    const fullName = [firstName, lastName].filter(Boolean).join(' ') || username || 'Гость';

    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    // Вспомогательная функция отправки сообщения в Telegram
    const sendMessage = async (chat_id: number | string, replyText: string) => {
      if (!botToken) return;
      try {
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id,
            text: replyText,
            parse_mode: 'HTML',
          }),
        });
      } catch (err) {
        console.error('Ошибка отправки сообщения TG:', err);
      }
    };

    // 1. ОБРАБОТКА АВТОРИЗАЦИИ ПО ССЫЛКЕ С САЙТА (/start auth_...)
    if (text.startsWith('/start auth_')) {
      const token = text.replace('/start auth_', '').trim();

      // Проверяем, существует ли такая сессия ожидания
      const sessionRows = await sql`
        SELECT token, status FROM telegram_auth_sessions
        WHERE token = ${token} AND status = 'pending'
        LIMIT 1
      `;

      if (sessionRows.length === 0) {
        await sendMessage(
          chatId,
          '⚠️ <b>Время сессии авторизации истекло.</b>\nПожалуйста, вернитесь на сайт и нажмите кнопку «Войти через Telegram» заново.'
        );
        return NextResponse.json({ ok: true });
      }

      // Ищем или регистрируем пользователя в таблице users
      const existingUser = await sql`
        SELECT id, name, phone, role FROM users
        WHERE telegram_id = ${telegramId} OR phone = ${`tg_${telegramId}`}
        LIMIT 1
      `;

      let currentUser;
      if (existingUser.length > 0) {
        currentUser = existingUser[0];
      } else {
        const newUser = await sql`
          INSERT INTO users (name, phone, role, telegram_id)
          VALUES (${fullName}, ${`tg_${telegramId}`}, 'guest', ${telegramId})
          RETURNING id, name, phone, role
        `;
        currentUser = newUser[0];
      }

      // Обновляем статус сессии на authorized и сохраняем данные пользователя
      await sql`
        UPDATE telegram_auth_sessions
        SET status = 'authorized',
            user_id = ${currentUser.id}::uuid,
            user_data = ${JSON.stringify(currentUser)}::jsonb
        WHERE token = ${token}
      `;

      // Отправляем пользователю приятное подтверждение в чат
      await sendMessage(
        chatId,
        `🎉 <b>Добро пожаловать, ${fullName}!</b>\n\nВход на сайт <b>«Райский Пляж»</b> успешно выполнен.\nМожете возвращаться в браузер — ваша страница уже открыта!`
      );

      return NextResponse.json({ ok: true });
    }

    // 2. ОБЫЧНАЯ КОМАНДА /start (без параметров)
    if (text === '/start') {
      await sendMessage(
        chatId,
        `👋 Здравствуйте, <b>${fullName}</b>!\n\nЭто официальный бот сервиса бронирования <b>«Райский Пляж»</b>.\nЗдесь вы будете получать уведомления о бронированиях и можете авторизоваться на сайте в 1 клик.`
      );
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('Ошибка в telegram webhook:', error);
    return NextResponse.json({ ok: true }); // Всегда возвращаем 200/ok для Telegram, чтобы он не спамил повторами
  }
}