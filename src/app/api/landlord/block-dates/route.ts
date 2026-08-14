import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { property_id, unit_id, check_in, check_out, source_note } = body;

    if (!property_id || !check_in || !check_out) {
      return NextResponse.json({ error: 'Укажите объект и даты' }, { status: 400 });
    }

    const start = new Date(check_in);
    const end = new Date(check_out);
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    if (totalDays <= 0) {
      return NextResponse.json({ error: 'Дата выезда должна быть позже даты заезда' }, { status: 400 });
    }

    // 100% ПРОВЕРКА ПЕРЕСЕЧЕНИЯ ДАТ В POSTGRESQL (С ЯВНЫМ ПРИВЕДЕНИЕМ ::date)
    const conflicts = await sql`
      SELECT id, check_in, check_out, guest_name, status
      FROM bookings
      WHERE property_id = ${property_id}::uuid
        AND status IN ('new', 'confirmed', 'blocked')
        AND DATE(check_in) < ${check_out}::date
        AND DATE(check_out) > ${check_in}::date
    `;

    if (conflicts && conflicts.length > 0) {
      const c = conflicts[0];
      const fromStr = String(c.check_in).slice(0, 10);
      const toStr = String(c.check_out).slice(0, 10);
      const isSelfBlock = c.status === 'blocked';

      return NextResponse.json(
        {
          error: `Ошибка: диапазон пересекается с уже закрытыми датами (с ${fromStr} по ${toStr}) — ${
            isSelfBlock ? 'ранее закрыто вами' : `бронь гостя (${c.guest_name})`
          }.`,
        },
        { status: 400 }
      );
    }

    const note = source_note?.trim() || 'Своя бронь / Закрыто';

    await sql`
      INSERT INTO bookings (
        property_id, unit_id, check_in, check_out, total_days, 
        total_price, guest_name, guest_phone, guests_count, status
      )
      VALUES (
        ${property_id}::uuid, ${unit_id ? sql`${unit_id}::uuid` : null}, 
        ${check_in}::date, ${check_out}::date, 
        ${totalDays}, 0, ${note}, 'Ручная блокировка', 1, 'blocked'
      )
    `;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Ошибка ручной блокировки дат:', err);
    return NextResponse.json({ error: 'Ошибка базы данных при закрытии дат' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get('id');

    if (!bookingId) {
      return NextResponse.json({ error: 'Не указан ID записи' }, { status: 400 });
    }

    await sql`DELETE FROM bookings WHERE id = ${bookingId}::uuid`;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Ошибка удаления блокировки:', err);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}