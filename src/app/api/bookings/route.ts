import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

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

    await sql`
      INSERT INTO bookings (
        property_id, unit_id, check_in, check_out, total_days, 
        total_price, guest_name, guest_phone, guest_telegram, 
        guests_count, status
      )
      VALUES (
        ${property_id}, ${unit_id || null}, ${check_in}, ${check_out}, 
        ${Number(total_days)}, ${Number(total_price)}, ${guest_name}, 
        ${guest_phone}, ${guest_telegram || ''}, ${Number(guests_count) || 1}, 
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