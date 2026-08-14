import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

// Получение списка избранных ID для пользователя
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');

    if (!phone) {
      return NextResponse.json({ favorites: [] });
    }

    const rows = await sql`
      SELECT property_id FROM favorites WHERE user_phone = ${phone}
    `;

    const favIds = rows.map((r) => r.property_id);
    return NextResponse.json({ favorites: favIds });
  } catch (e) {
    console.error('Ошибка загрузки избранного:', e);
    return NextResponse.json({ favorites: [] });
  }
}

// Добавление / удаление из избранного
export async function POST(request: Request) {
  try {
    const { phone, property_id } = await request.json();

    if (!phone || !property_id) {
      return NextResponse.json({ error: 'Не все данные переданы' }, { status: 400 });
    }

    const existing = await sql`
      SELECT id FROM favorites WHERE user_phone = ${phone} AND property_id = ${property_id}
    `;

    if (existing && existing.length > 0) {
      await sql`
        DELETE FROM favorites WHERE user_phone = ${phone} AND property_id = ${property_id}
      `;
      return NextResponse.json({ action: 'removed' });
    } else {
      await sql`
        INSERT INTO favorites (user_phone, property_id) VALUES (${phone}, ${property_id})
      `;
      return NextResponse.json({ action: 'added' });
    }
  } catch (e) {
    console.error('Ошибка обновления избранного:', e);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}