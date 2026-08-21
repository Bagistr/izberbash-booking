import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { sql } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { phone, password } = await request.json();

    if (!phone || !password) {
      return NextResponse.json({ error: 'Укажите номер телефона и новый пароль' }, { status: 400 });
    }

    if (password.length < 4) {
      return NextResponse.json({ error: 'Пароль должен содержать не менее 4 символов' }, { status: 400 });
    }

    const digitsOnly = phone.replace(/\D/g, '');
    const clean10 = digitsOnly.slice(-10);

    if (clean10.length < 10) {
      return NextResponse.json({ error: 'Некорректный номер телефона' }, { status: 400 });
    }

    const users = await sql`
      SELECT id, name, phone, role FROM users
      WHERE regexp_replace(phone, '\D', '', 'g') LIKE ${`%${clean10}`}
      LIMIT 1
    `;

    if (users.length === 0) {
      return NextResponse.json({ error: 'Пользователь с таким номером не найден' }, { status: 404 });
    }

    const user = users[0];
    const hashedPassword = await bcrypt.hash(password, 10);

    await sql`
      UPDATE users
      SET password = ${hashedPassword}
      WHERE id = ${user.id}::uuid
    `;

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role || 'guest',
      },
      message: 'Пароль успешно изменен',
    });
  } catch (error: any) {
    console.error('Ошибка сброса пароля:', error);
    return NextResponse.json({ error: 'Ошибка сервера при сбросе пароля' }, { status: 500 });
  }
}
