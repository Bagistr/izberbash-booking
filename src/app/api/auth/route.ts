import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { action, name, phone, password, role } = await request.json();
    const cleanPhone = phone?.trim().replace(/[^0-9+]/g, '');

    if (!cleanPhone || !password) {
      return NextResponse.json({ error: 'Укажите телефон и пароль' }, { status: 400 });
    }

    const userRole = role || 'guest'; // 'guest' или 'landlord'

    if (action === 'register') {
      const existing = await sql`SELECT id FROM users WHERE phone = ${cleanPhone}`;
      if (existing && existing.length > 0) {
        return NextResponse.json({ error: 'Пользователь с таким номером уже существует' }, { status: 400 });
      }

      const rows = await sql`
        INSERT INTO users (name, phone, password_hash, role)
        VALUES (${name || 'Пользователь'}, ${cleanPhone}, ${password}, ${userRole})
        RETURNING id, name, phone, role
      `;

      return NextResponse.json({ success: true, user: rows[0] });
    } else {
      // Вход (Login)
      const rows = await sql`
        SELECT id, name, phone, password_hash, role 
        FROM users 
        WHERE phone = ${cleanPhone}
      `;

      if (!rows || rows.length === 0 || rows[0].password_hash !== password) {
        return NextResponse.json({ error: 'Неверный номер телефона или пароль' }, { status: 401 });
      }

      const user = {
        id: rows[0].id,
        name: rows[0].name,
        phone: rows[0].phone,
        role: rows[0].role,
      };

      return NextResponse.json({ success: true, user });
    }
  } catch (err) {
    console.error('Ошибка аутентификации:', err);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}