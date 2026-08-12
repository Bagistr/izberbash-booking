import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      property_id,
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
      return NextResponse.json({ error: 'Заполните все обязательные поля' }, { status: 400 });
    }

    await sql`
      INSERT INTO bookings (
        property_id, check_in, check_out, total_days, total_price, 
        guest_name, guest_phone, guest_telegram, guests_count
      )
      VALUES (
        ${property_id}, ${check_in}, ${check_out}, ${total_days}, ${total_price},
        ${guest_name}, ${guest_phone}, ${guest_telegram || null}, ${guests_count}
      )
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Ошибка сохранения бронирования:', error);
    return NextResponse.json({ error: 'Ошибка сервера при сохранении заявки' }, { status: 500 });
  }
}