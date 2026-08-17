import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { sql } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { id, first_name, last_name, username, auth_date, hash, role = 'guest' } = data;

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      return NextResponse.json({ error: 'TELEGRAM_BOT_TOKEN не задан' }, { status: 500 });
    }

    // Проверка HMAC подписи Telegram
    const secret = crypto.createHash('sha256').update(botToken).digest();
    const checkString = Object.keys(data)
      .filter((k) => k !== 'hash' && k !== 'role')
      .sort()
      .map((k) => `${k}=${data[k]}`)
      .join('\n');

    const hmac = crypto.createHmac('sha256', secret).update(checkString).digest('hex');

    if (hmac !== hash) {
      return NextResponse.json({ error: 'Ошибка проверки подписи Telegram' }, { status: 403 });
    }

    const fullName = [first_name, last_name].filter(Boolean).join(' ') || username || `Пользователь #${id}`;
    const telegramPhone = `tg_${id}`;

    // Проверяем наличие пользователя или создаем нового
    const existingUsers = await sql`
      SELECT id, name, phone, role FROM users 
      WHERE phone = ${telegramPhone} OR telegram_id = ${String(id)}
      LIMIT 1
    `;

    let userObj;
    if (existingUsers.length > 0) {
      userObj = existingUsers[0];
    } else {
      const inserted = await sql`
        INSERT INTO users (name, phone, role)
        VALUES (${fullName}, ${telegramPhone}, ${role})
        RETURNING id, name, phone, role
      `;
      userObj = inserted[0];
    }

    return NextResponse.json({
      success: true,
      user: {
        id: userObj.id,
        name: userObj.name,
        phone: userObj.phone,
        role: userObj.role || role,
      },
    });
  } catch (err: any) {
    console.error('Ошибка Telegram авторизации:', err);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}