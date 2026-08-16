import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, name, phone, password, role, code } = body;

    if (!phone || !password) {
      return NextResponse.json({ error: 'Заполните номер телефона и пароль' }, { status: 400 });
    }

    const clean10 = phone.replace(/\D/g, '').slice(-10);
    const standardPhone = `8${clean10}`;

    // 1. ВХОД (Login)
    if (action === 'login') {
      const users = await sql`
        SELECT * FROM users
        WHERE regexp_replace(phone, '\D', '', 'g') LIKE ${`%${clean10}`}
        LIMIT 1
      `;

      if (users.length === 0) {
        return NextResponse.json(
          { error: 'Пользователь не найден. Пожалуйста, зарегистрируйтесь.' },
          { status: 404 }
        );
      }

      const user = users[0];

      if (user.password && user.password !== password) {
        return NextResponse.json({ error: 'Неверный пароль' }, { status: 401 });
      }

      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          phone: standardPhone,
          role: user.role || role || 'guest',
        },
      });
    }

    // 2. РЕГИСТРАЦИЯ (Register)
    if (action === 'register') {
      if (!name || !name.trim()) {
        return NextResponse.json({ error: 'Укажите ваше имя' }, { status: 400 });
      }

      if (!code || code.trim().length !== 4) {
        return NextResponse.json({ error: 'Введите 4-значный код подтверждения' }, { status: 400 });
      }

      // Поиск кода по последним 10 цифрам номера
      const validCodes = await sql`
        SELECT id FROM phone_verification_codes
        WHERE regexp_replace(phone, '\D', '', 'g') LIKE ${`%${clean10}`}
          AND code = ${code.trim()}
          AND verified = FALSE
          AND expires_at > NOW()
        ORDER BY created_at DESC
        LIMIT 1
      `;

      if (validCodes.length === 0) {
        return NextResponse.json(
          { error: 'Неверный или просроченный код подтверждения' },
          { status: 400 }
        );
      }

      // Помечаем код как использованный
      await sql`
        UPDATE phone_verification_codes
        SET verified = TRUE
        WHERE id = ${validCodes[0].id}::uuid
      `;

      // Проверяем существование пользователя
      const existing = await sql`
        SELECT * FROM users
        WHERE regexp_replace(phone, '\D', '', 'g') LIKE ${`%${clean10}`}
        LIMIT 1
      `;

      let createdUser;
      if (existing.length > 0) {
        const updateRes = await sql`
          UPDATE users
          SET name = ${name}, password = ${password}, role = ${role || 'guest'}
          WHERE id = ${existing[0].id}::uuid
          RETURNING *
        `;
        createdUser = updateRes[0];
      } else {
        const insertRes = await sql`
          INSERT INTO users (name, phone, password, role)
          VALUES (${name}, ${standardPhone}, ${password}, ${role || 'guest'})
          RETURNING *
        `;
        createdUser = insertRes[0];
      }

      return NextResponse.json({
        success: true,
        user: {
          id: createdUser.id,
          name: createdUser.name,
          phone: standardPhone,
          role: createdUser.role,
        },
      });
    }

    return NextResponse.json({ error: 'Неизвестное действие' }, { status: 400 });
  } catch (err) {
    console.error('Ошибка авторизации:', err);
    return NextResponse.json({ error: 'Ошибка сервера при регистрации' }, { status: 500 });
  }
}