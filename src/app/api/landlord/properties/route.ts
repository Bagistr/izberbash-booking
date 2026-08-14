import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

// Получение объектов конкретного арендодателя
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const landlordPhone = searchParams.get('phone');

    if (!landlordPhone) {
      return NextResponse.json({ error: 'Не указан телефон' }, { status: 400 });
    }

    // Находим объекты по номеру телефона собственника
    const properties = await sql`
      SELECT * FROM properties 
      WHERE landlord_phone = ${landlordPhone} 
      ORDER BY created_at DESC
    `;

    return NextResponse.json({ properties });
  } catch (err) {
    console.error('Ошибка загрузки объектов арендодателя:', err);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

// Обновление (редактирование) объекта
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, price_per_night, is_active, description } = body;

    await sql`
      UPDATE properties 
      SET 
        price_per_night = ${Number(price_per_night)},
        is_active = ${is_active},
        description = ${description}
      WHERE id = ${id}
    `;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Ошибка обновления объекта:', err);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}