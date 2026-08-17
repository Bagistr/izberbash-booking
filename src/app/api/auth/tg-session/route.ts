import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { sql } from '@/lib/db';

// 1. Создание одноразовой сессии авторизации
export async function POST() {
  try {
    const token = crypto.randomBytes(24).toString('hex');

    await sql`
      INSERT INTO telegram_auth_sessions (token, status)
      VALUES (${token}, 'pending')
    `;

    const botName = process.env.NEXT_PUBLIC_TELEGRAM_BOT_NAME || 'вашь_бот';
    const tgUrl = `https://t.me/${botName}?start=auth_${token}`;

    return NextResponse.json({ token, tgUrl });
  } catch (err: any) {
    console.error('Ошибка создания TG сессии:', err);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

// 2. Проверка сайтом: нажал ли пользователь кнопку в Telegram
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Токен обязателен' }, { status: 400 });
    }

    const rows = await sql`
      SELECT status, user_data FROM telegram_auth_sessions
      WHERE token = ${token}
      LIMIT 1
    `;

    if (rows.length === 0) {
      return NextResponse.json({ status: 'not_found' });
    }

    return NextResponse.json({
      status: rows[0].status,
      user: rows[0].user_data,
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Ошибка проверки' }, { status: 500 });
  }
}