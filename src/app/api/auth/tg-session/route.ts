import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { sql } from '@/lib/db';

// Создание новой сессии
export async function POST() {
  try {
    const token = crypto.randomBytes(20).toString('hex');

    await sql`
      INSERT INTO telegram_auth_sessions (token, status)
      VALUES (${token}, 'pending')
      ON CONFLICT (token) DO NOTHING
    `;

    const botName = (process.env.NEXT_PUBLIC_TELEGRAM_BOT_NAME || 'rayskiy_plyazh_bot').replace('@', '').trim();
    const tgUrl = `https://t.me/${botName}?start=auth_${token}`;

    return NextResponse.json({ token, tgUrl });
  } catch (err: any) {
    console.error('Ошибка создания tg-session:', err);
    return NextResponse.json({ error: 'Ошибка сервера при создании сессии' }, { status: 500 });
  }
}

// Опрос статуса сессии
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Токен не передан' }, { status: 400 });
    }

    const rows = await sql`
      SELECT status, user_data FROM telegram_auth_sessions
      WHERE token = ${token}
      LIMIT 1
    `;

    if (rows.length === 0) {
      return NextResponse.json({ status: 'pending' });
    }

    return NextResponse.json({
      status: rows[0].status,
      user: rows[0].user_data,
    });
  } catch (err: any) {
    return NextResponse.json({ status: 'pending' });
  }
}