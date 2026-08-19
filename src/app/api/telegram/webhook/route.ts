import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const update = await request.json();

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
        console.error('Ошибка отправки в TG:', err);
      }
    };

    // ОБРАБОТКА ВХОДА С САЙТА: /start auth_токен
    if (text.startsWith('/start auth_')) {
      const token = text.replace('/start auth_', '').trim();

      // Проверяем наличие пользователя в базе
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

      // Обновляем сессию для сайта
      await sql`
        UPDATE telegram_auth_sessions
        SET status = 'authorized',
            user_id = ${currentUser.id}::uuid,
            user_data = ${JSON.stringify(currentUser)}::jsonb
        WHERE token = ${token}
      `;

      // Бот отправляет сообщение пользователю прямо в Telegram
      await sendMessage(
        chatId,
        `✅ <b>Авторизация прошла успешно!</b>\n\nРады видеть вас, <b>${fullName}</b>!\nВы можете вернуться на сайт <b>«Райский Пляж»</b> — вы уже вошли в свой профиль.`
      );

      return NextResponse.json({ ok: true });
    }

    // ОБЫЧНЫЙ /start
    if (text === '/start') {
      await sendMessage(
        chatId,
        `👋 Здравствуйте, <b>${fullName}</b>!\n\nЭто официальный бот сервиса <b>«Райский Пляж»</b>.\nЗдесь будут приходить уведомления о бронированиях.`
      );
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('Ошибка в webhook:', error);
    return NextResponse.json({ ok: true });
  }
}