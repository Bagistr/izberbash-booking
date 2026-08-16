import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ verified: false });
    }

    const rows = await sql`
      SELECT * FROM telegram_verifications
      WHERE session_token = ${token}
      LIMIT 1
    `;

    if (rows.length === 0 || !rows[0].verified) {
      return NextResponse.json({ verified: false });
    }

    const session = rows[0];

    // Получаем пользователя
    const userRows = await sql`
      SELECT * FROM users 
      WHERE regexp_replace(phone, '\D', '', 'g') LIKE ${`%${session.phone.slice(-10)}`}
      LIMIT 1
    `;

    const user = userRows[0] || {
      name: session.first_name,
      phone: session.phone,
      role: session.role,
    };

    return NextResponse.json({ verified: true, user });
  } catch (err) {
    return NextResponse.json({ verified: false });
  }
}