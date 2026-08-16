import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, name, phone, password, role, code } = body;

    if (!phone || !password) {
      return NextResponse.json({ error: 'Заполните номер телефона и пароль' }, { status: 400 });
    }

    // Чистые 10 цифр номера (например 9645714606)
    const clean10 = phone.replace(/\D/g, '').slice(-10);
    const standardPhone = `8${clean10}`;

    // ==========================================
    // 1. ВХОД В АККАУНТ (LOGIN)
    // ==========================================
    if (action === 'login') {
      const users = await sql`
        SELECT * FROM users
        WHERE phone LIKE ${`%${clean10}`}
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

    // ==========================================
    // 2. РЕГИСТРАЦИЯ (REGISTER)
    // ==========================================
    if (action === 'register') {
      if (!name || !name.trim()) {
        return NextResponse.json({ error: 'Укажите ваше имя' }, { status: 400 });
      }

      if (!code || code.trim().length !== 4) {
        return NextResponse.json({ error: 'Введите 4-значный код подтверждения' }, { status: 400 });
      }

      // 1. Проверяем код в базе (за последние 10 минут)
      const validCodes = await sql`
        SELECT id FROM phone_verification_codes
        WHERE phone LIKE ${`%${clean10}`}
          AND code = ${code.trim()}
          AND verified = FALSE
          AND expires_at > NOW()
        ORDER BY created_at DESC
        LIMIT 1
      `;

      if (validCodes.length === 0) {
        return NextResponse.json(
          { error: 'Неверный или просроченный код подтверждения. Запросите новый код.' },
          { status: 400 }
        );
      }

      // 2. Сохраняем/обновляем пользователя в таблице users
      const existingUsers = await sql`
        SELECT id FROM users
        WHERE phone LIKE ${`%${clean10}`}
        LIMIT 1
      `;

      let userObj;
      if (existingUsers.length > 0) {
        const updated = await sql`
          UPDATE users
          SET name = ${name.trim()}, password = ${password}, role = ${role || 'guest'}
          WHERE id = ${existingUsers[0].id}::uuid
          RETURNING id, name, phone, role
        `;
        userObj = updated[0];
      } else {
        const inserted = await sql`
          INSERT INTO users (name, phone, password, role)
          VALUES (${name.trim()}, ${standardPhone}, ${password}, ${role || 'guest'})
          RETURNING id, name, phone, role
        `;
        userObj = inserted[0];
      }

      // 3. Только после успешного создания пользователя гасим код
      await sql`
        UPDATE phone_verification_codes
        SET verified = TRUE
        WHERE id = ${validCodes[0].id}::uuid
      `;

      return NextResponse.json({
        success: true,
        user: {
          id: userObj.id,
          name: userObj.name,
          phone: standardPhone,
          role: userObj.role,
        },
      });
    }

    return NextResponse.json({ error: 'Неизвестное действие' }, { status: 400 });
  } catch (err: any) {
    console.error('Ошибка в API авторизации:', err);
    return NextResponse.json(
      { error: `Ошибка базы данных: ${err?.message || 'Не удалось сохранить пользователя'}` },
      { status: 500 }
    );
  }
}