import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { phone } = await request.json();

    if (!phone) {
      return NextResponse.json({ error: 'Укажите номер телефона' }, { status: 400 });
    }

    // Чистим номер до 10 последних цифр (например 9881234567)
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) {
      return NextResponse.json({ error: 'Введите корректный номер из 10 цифр' }, { status: 400 });
    }
    const clean10 = digits.slice(-10);
    const standardPhone = `8${clean10}`;

    // Проверяем, не зарегистрирован ли уже этот номер
    const existing = await sql`
      SELECT id FROM users 
      WHERE regexp_replace(phone, '\D', '', 'g') LIKE ${`%${clean10}`}
      LIMIT 1
    `;
    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'Пользователь с таким номером уже зарегистрирован. Перейдите во вкладку «Войти».' },
        { status: 400 }
      );
    }

    // Защита от спама (не чаще 1 раза в 45 сек)
    const recent = await sql`
      SELECT id FROM phone_verification_codes 
      WHERE phone = ${standardPhone} 
        AND created_at > NOW() - INTERVAL '45 seconds'
    `;
    if (recent.length > 0) {
      return NextResponse.json(
        { error: 'Повторный код можно запросить через 45 секунд' },
        { status: 429 }
      );
    }

    // Генерируем 4-значный код
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 минут

    await sql`
      INSERT INTO phone_verification_codes (phone, code, expires_at)
      VALUES (${standardPhone}, ${code}, ${expiresAt})
    `;

    // Отправляем код через Telegram Bot API (если есть chat_id или в сервисный лог)
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (botToken) {
      // Ищем привязанный telegram_user_id по номеру
      const tgUser = await sql`
        SELECT telegram_user_id FROM telegram_verifications
        WHERE phone LIKE ${`%${clean10}`} AND telegram_user_id IS NOT NULL
        ORDER BY created_at DESC LIMIT 1
      `;

      if (tgUser.length > 0 && tgUser[0].telegram_user_id) {
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: tgUser[0].telegram_user_id,
            text: `🔐 Ваш код подтверждения для Райский Пляж: **${code}**\n\nНикому не сообщайте этот код.`,
            parse_mode: 'Markdown',
          }),
        });
      }
    }

    // Для удобства разработки и тестирования дублируем в консоль сервера:
    console.log(`[AUTH CODE] Для номера ${standardPhone} код: ${code}`);

    return NextResponse.json({ 
      success: true, 
      message: 'Код отправлен',
      // В dev режиме возвращаем код для быстрого тестирования без Telegram
      devCode: process.env.NODE_ENV === 'development' ? code : undefined 
    });
  } catch (err) {
    console.error('Ошибка отправки кода:', err);
    return NextResponse.json({ error: 'Ошибка сервера при отправке кода' }, { status: 500 });
  }
}