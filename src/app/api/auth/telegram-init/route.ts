import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const { role = 'guest' } = await request.json();
    const sessionToken = crypto.randomBytes(16).toString('hex');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 минут

    await sql`
      INSERT INTO telegram_verifications (session_token, role, expires_at)
      VALUES (${sessionToken}, ${role}, ${expiresAt})
    `;

    const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;
    const telegramUrl = `https://t.me/${botUsername}?start=${sessionToken}`;

    return NextResponse.json({ sessionToken, telegramUrl });
  } catch (err) {
    console.error('Ошибка инициализации Telegram auth:', err);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}