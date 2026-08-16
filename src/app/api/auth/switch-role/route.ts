import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { phone, newRole = 'landlord' } = await request.json();

    if (!phone) {
      return NextResponse.json({ error: 'Номер телефона обязателен' }, { status: 400 });
    }

    const clean10 = phone.replace(/\D/g, '').slice(-10);

    const updated = await sql`
      UPDATE users
      SET role = ${newRole}
      WHERE regexp_replace(phone, '\D', '', 'g') LIKE ${`%${clean10}`}
      RETURNING id, name, phone, role
    `;

    if (updated.length === 0) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
    }

    return NextResponse.json({ success: true, user: updated[0] });
  } catch (err: any) {
    console.error('Ошибка обновления роли:', err);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}