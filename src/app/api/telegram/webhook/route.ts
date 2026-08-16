import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const update = await request.json();
    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    if (!update.message) {
      return NextResponse.json({ ok: true });
    }

    const message = update.message;
    const chatId = message.chat.id;
    const text = message.text || '';

    // 1. Обработка команды /start с токеном: /start token_12345
    if (text.startsWith('/start ')) {
      const sessionToken = text.replace('/start ', '').trim();

      // Проверяем актуальность сессии
      const session = await sql`
        SELECT * FROM telegram_verifications
        WHERE session_token = ${sessionToken}
          AND expires_at > NOW()
          AND verified = FALSE
        LIMIT 1
      `;

      if (session.length > 0) {
        // Отправляем кнопку запроса контакта
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: `👋 Здравствуйте, ${message.from.first_name}!\n\nДля подтверждения входа на платформу **Райский Пляж** нажмите кнопку ниже, чтобы подтвердить свой номер телефона.`,
            reply_markup: {
              keyboard: [
                [
                  {
                    text: '📱 Подтвердить номер телефона',
                    request_contact: true,
                  },
                ],
              ],
              resize_keyboard: true,
              one_time_keyboard: true,
            },
          }),
        });

        // Запоминаем chat_id в сессии
        await sql`
          UPDATE telegram_verifications
          SET telegram_user_id = ${chatId}
          WHERE session_token = ${sessionToken}
        `;
      } else {
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: '⚠️ Ссылка устарела. Пожалуйста, запросите вход на сайте повторно.',
          }),
        });
      }
    }

    // 2. Обработка отправки контакта (пользователь нажал кнопку)
    if (message.contact) {
      let rawPhone = message.contact.phone_number.replace(/\D/g, '');
      if (rawPhone.length === 10) rawPhone = '7' + rawPhone;
      if (rawPhone.startsWith('8') && rawPhone.length === 11) rawPhone = '7' + rawPhone.slice(1);

      const tgUserId = message.from.id;
      const firstName = message.from.first_name || '';

      // Находим активную сессию
      const activeSession = await sql`
        SELECT * FROM telegram_verifications
        WHERE telegram_user_id = ${tgUserId}
          AND expires_at > NOW()
          AND verified = FALSE
        ORDER BY created_at DESC
        LIMIT 1
      `;

      if (activeSession.length > 0) {
        const session = activeSession[0];

        // Помечаем сессию подтвержденной
        await sql`
          UPDATE telegram_verifications
          SET phone = ${rawPhone},
              first_name = ${firstName},
              verified = TRUE
          WHERE id = ${session.id}::uuid
        `;

        // Создаем или находим пользователя в таблице users
        const existingUsers = await sql`
          SELECT * FROM users WHERE regexp_replace(phone, '\D', '', 'g') LIKE ${`%${rawPhone.slice(-10)}`} LIMIT 1
        `;

        if (existingUsers.length === 0) {
          await sql`
            INSERT INTO users (name, phone, role)
            VALUES (${firstName}, ${rawPhone}, ${session.role || 'guest'})
          `;
        }

        // Отправляем приятное сообщение об успехе
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: '✅ **Номер успешно подтвержден!**\n\nМожете вернуться в браузер — вход выполнен автоматически.',
            reply_markup: { remove_keyboard: true },
          }),
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Ошибка Webhook Telegram:', err);
    return NextResponse.json({ ok: true });
  }
}