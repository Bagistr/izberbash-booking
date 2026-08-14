import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

// 1. Создание ручной блокировки дат (Своя бронь / Авито / Ремонт)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      property_id,
      unit_id,
      check_in,
      check_out,
      source_note, // Например: 'Авито', 'Звонок от клиента', 'Ремонт'
    } = body;

    if (!property_id || !check_in || !check_out) {
      return NextResponse.json({ error: 'Укажите объект и даты' }, { status: 400 });
    }

    const start = new Date(check_in);
    const end = new Date(check_out);
    const diffTime = end.getTime() - start.getTime();
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (totalDays <= 0) {
      return NextResponse.json({ error: 'Дата выезда должна быть позже даты заезда' }, { status: 400 });
    }

    const note = source_note?.trim() || 'Своя бронь / Закрыто';

    await sql`
      INSERT INTO bookings (
        property_id, unit_id, check_in, check_out, total_days, 
        total_price, guest_name, guest_phone, guests_count, status
      )
      VALUES (
        ${property_id}, ${unit_id || null}, ${check_in}, ${check_out}, 
        ${totalDays}, 0, ${note}, 'Ручная блокировка', 1, 'blocked'
      )
    `;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Ошибка ручной блокировки дат:', err);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

// 2. Снятие блокировки / удаление закрытых дат
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get('id');

    if (!bookingId) {
      return NextResponse.json({ error: 'Не указан ID записи' }, { status: 400 });
    }

    await sql`DELETE FROM bookings WHERE id = ${bookingId}`;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Ошибка удаления блокировки:', err);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}