import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { sql } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, name, phone, password, role = 'guest', code, skip_code_check } = body;

    if (!phone) {
      return NextResponse.json({ error: 'Номер телефона обязателен' }, { status: 400 });
    }

    const digitsOnly = phone.replace(/\D/g, '');
    const clean10 = digitsOnly.slice(-10);

    if (clean10.length < 10) {
      return NextResponse.json({ error: 'Некорректный формат номера телефона' }, { status: 400 });
    }

    // ==========================================
    // 1. РЕГИСТРАЦИЯ НОВОГО ПОЛЬЗОВАТЕЛЯ
    // ==========================================
    if (action === 'register') {
      if (!password || password.length < 4) {
        return NextResponse.json({ error: 'Пароль должен содержать минимум 4 символа' }, { status: 400 });
      }

      // Проверяем существование пользователя
      const existingUser = await sql`
        SELECT id FROM users
        WHERE regexp_replace(phone, '\D', '', 'g') LIKE ${`%${clean10}`}
        LIMIT 1
      `;

      if (existingUser.length > 0) {
        return NextResponse.json({ error: 'Пользователь с таким номером уже зарегистрирован' }, { status: 400 });
      }

      // Проверка кода верификации (если не был подтвержден входящим звонком)
      if (!skip_code_check) {
        if (!code) {
          return NextResponse.json({ error: 'Введите проверочный код' }, { status: 400 });
        }

        const validCode = await sql`
          SELECT id FROM phone_verification_codes
          WHERE phone LIKE ${`%${clean10}`} AND code = ${String(code).trim()} AND expires_at > NOW()
          LIMIT 1
        `;

        if (validCode.length === 0) {
          return NextResponse.json({ error: 'Неверный или истекший проверочный код' }, { status: 400 });
        }
      }

      // ХЭШИРУЕМ ПАРОЛЬ С СОЛЬЮ (10 раундов)
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      const formattedPhone = `8${clean10}`;
      const userName = name?.trim() || `Пользователь +7${clean10}`;

      const inserted = await sql`
        INSERT INTO users (name, phone, password, role)
        VALUES (${userName}, ${formattedPhone}, ${hashedPassword}, ${role})
        RETURNING id, name, phone, role
      `;

      return NextResponse.json({
        success: true,
        user: inserted[0],
      });
    }

    // ==========================================
    // 2. ВХОД В АККАУНТ
    // ==========================================
    if (action === 'login') {
      if (!password) {
        return NextResponse.json({ error: 'Введите пароль' }, { status: 400 });
      }

      const users = await sql`
        SELECT id, name, phone, password, role FROM users
        WHERE regexp_replace(phone, '\D', '', 'g') LIKE ${`%${clean10}`}
        LIMIT 1
      `;

      if (users.length === 0) {
        return NextResponse.json({ error: 'Пользователь с таким номером не найден' }, { status: 404 });
      }

      const user = users[0];
      const dbPassword = user.password || '';

      let isPasswordValid = false;

      // Проверяем bcrypt-хэш
      if (dbPassword.startsWith('$2a$') || dbPassword.startsWith('$2b$') || dbPassword.startsWith('$2y$')) {
        isPasswordValid = await bcrypt.compare(password, dbPassword);
      } else {
        // Поддержка старых нехэшированных паролей + их автомиграция в хэш
        isPasswordValid = (dbPassword === password);
        if (isPasswordValid) {
          const newHashed = await bcrypt.hash(password, 10);
          await sql`UPDATE users SET password = ${newHashed} WHERE id = ${user.id}::uuid`;
        }
      }

      if (!isPasswordValid) {
        return NextResponse.json({ error: 'Неверный пароль' }, { status: 401 });
      }

      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          phone: user.phone,
          role: user.role || 'guest',
        },
      });
    }

    return NextResponse.json({ error: 'Неизвестное действие' }, { status: 400 });
  } catch (error: any) {
    console.error('Ошибка в auth route:', error);
    return NextResponse.json({ error: 'Ошибка сервера при авторизации' }, { status: 500 });
  }
}