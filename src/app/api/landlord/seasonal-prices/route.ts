import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { property_id, start_date, end_date, price } = body;

    if (!property_id || !start_date || !end_date) {
      return NextResponse.json({ error: 'Укажите объект и даты' }, { status: 400 });
    }

    const priceNum = Number(price);

    // Сначала удаляем любые пересекающиеся периоды
    await sql`
      DELETE FROM property_seasonal_prices
      WHERE property_id = ${property_id}::uuid
        AND start_date <= ${end_date}::date
        AND end_date >= ${start_date}::date
    `;

    // Если цена > 0, добавляем новый сезонный интервал цен
    if (priceNum > 0) {
      await sql`
        INSERT INTO property_seasonal_prices (property_id, start_date, end_date, price)
        VALUES (${property_id}::uuid, ${start_date}::date, ${end_date}::date, ${priceNum})
      `;
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Ошибка сохранения сезонной цены:', err);
    return NextResponse.json({ error: 'Ошибка сервера при сохранении цены' }, { status: 500 });
  }
}
