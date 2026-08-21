import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

// Метод получения активных броней для фильтра по датам
export async function GET() {
  try {
    const rows = await sql`
      SELECT 
        property_id, 
        unit_id, 
        TO_CHAR(check_in, 'YYYY-MM-DD') as check_in, 
        TO_CHAR(check_out, 'YYYY-MM-DD') as check_out, 
        status 
      FROM bookings 
      WHERE status IN ('new', 'confirmed', 'blocked')
    `;
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Ошибка получения броней:', error);
    return NextResponse.json([], { status: 500 });
  }
}

// Создание бронирования
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      property_id,
      unit_id,
      check_in,
      check_out,
      total_days,
      total_price,
      guest_name,
      guest_phone,
      guest_telegram,
      guests_count,
    } = body;

    if (!property_id || !check_in || !check_out || !guest_name || !guest_phone) {
      return NextResponse.json(
        { error: 'Заполните обязательные поля' },
        { status: 400 }
      );
    }

    const cleanPhone = guest_phone.trim().replace(/[^0-9+]/g, '');

    await sql`
      INSERT INTO bookings (
        property_id, unit_id, check_in, check_out, total_days, 
        total_price, guest_name, guest_phone, guest_phone_normalized, guest_telegram, 
        guests_count, status
      )
      VALUES (
        ${property_id}::uuid, 
        ${unit_id ? sql`${unit_id}::uuid` : null}, 
        ${check_in}::date, 
        ${check_out}::date, 
        ${Number(total_days)}, 
        ${Number(total_price)}, 
        ${guest_name}, 
        ${guest_phone}, 
        ${cleanPhone},
        ${guest_telegram || ''}, 
        ${Number(guests_count) || 1}, 
        'confirmed'
      )
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Ошибка сохранения бронирования:', error);
    return NextResponse.json(
      { error: 'Не удалось сохранить бронирование' },
      { status: 500 }
    );
  }
}

// Обновление статуса бронирования (Заселение, Выселение, Не приехал)
export async function PATCH(request: Request) {
  try {
    const { bookingId, status } = await request.json();

    if (!bookingId || !status) {
      return NextResponse.json({ error: 'bookingId и status обязательны' }, { status: 400 });
    }

    const validStatuses = ['confirmed', 'checked_in', 'no_show', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Недопустимый статус' }, { status: 400 });
    }

    await sql`
      UPDATE bookings
      SET status = ${status}
      WHERE id = ${bookingId}::uuid
    `;

    return NextResponse.json({ success: true, status });
  } catch (error: any) {
    console.error('Ошибка обновления статуса бронирования:', error);
    return NextResponse.json({ error: 'Ошибка сервера при обновлении статуса' }, { status: 500 });
  }
}