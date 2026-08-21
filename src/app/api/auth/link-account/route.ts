import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { userId, phone } = await request.json();

    if (!userId || !phone) {
      return NextResponse.json({ error: 'Параметры обязательны' }, { status: 400 });
    }

    const clean10 = phone.replace(/\D/g, '').slice(-10);
    if (clean10.length < 10) {
      return NextResponse.json({ error: 'Некорректный номер телефона' }, { status: 400 });
    }

    const formattedPhone = `8${clean10}`;

    // 1. Получаем текущего пользователя (например, вошедшего через TG)
    const currentUser = await sql`
      SELECT id, name, phone, telegram_id, role FROM users
      WHERE id = ${userId}::uuid
      LIMIT 1
    `;

    if (currentUser.length === 0) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
    }

    const curr = currentUser[0];

    // 2. Ищем существующего пользователя с таким номером телефона
    const existingPhoneUser = await sql`
      SELECT id, name, phone, telegram_id, role FROM users
      WHERE regexp_replace(phone, '\D', '', 'g') LIKE ${`%${clean10}`} AND id != ${curr.id}::uuid
      LIMIT 1
    `;

    if (existingPhoneUser.length > 0) {
      const phoneUser = existingPhoneUser[0];
      const tgId = curr.telegram_id || phoneUser.telegram_id;

      // Объединяем аккаунты: переносим telegram_id на основной аккаунт с телефоном
      await sql`
        UPDATE users
        SET telegram_id = ${tgId}
        WHERE id = ${phoneUser.id}::uuid
      `;

      // Переносим бронирования и объекты с временного TG аккаунта
      await sql`
        UPDATE bookings
        SET user_id = ${phoneUser.id}::uuid
        WHERE user_id = ${curr.id}::uuid
      `;

      // Удаляем временный дубликат
      await sql`
        DELETE FROM users
        WHERE id = ${curr.id}::uuid
      `;

      return NextResponse.json({
        success: true,
        user: {
          id: phoneUser.id,
          name: phoneUser.name,
          phone: phoneUser.phone,
          role: phoneUser.role || 'guest',
          telegram_id: tgId,
        },
        message: 'Аккаунты успешно синхронизированы',
      });
    } else {
      // Если пользователя с таким телефоном ещё не было — просто привязываем телефон к текущему аккаунту
      const updated = await sql`
        UPDATE users
        SET phone = ${formattedPhone}
        WHERE id = ${curr.id}::uuid
        RETURNING id, name, phone, telegram_id, role
      `;

      return NextResponse.json({
        success: true,
        user: updated[0],
        message: 'Номер телефона успешно привязан',
      });
    }
  } catch (error: any) {
    console.error('Ошибка синхронизации аккаунтов:', error);
    return NextResponse.json({ error: 'Ошибка сервера при объединении аккаунтов' }, { status: 500 });
  }
}
