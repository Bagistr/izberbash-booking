import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const unitId = searchParams.get('unit_id');

    let bookings;
    if (unitId && unitId !== 'all') {
      bookings = await sql`
        SELECT check_in, check_out, unit_id, status
        FROM bookings 
        WHERE (property_id = ${id} OR unit_id = ${unitId})
          AND unit_id = ${unitId}
          AND status IN ('new', 'confirmed', 'blocked')
      `;
    } else {
      bookings = await sql`
        SELECT check_in, check_out, unit_id, status
        FROM bookings 
        WHERE property_id = ${id} AND status IN ('new', 'confirmed', 'blocked')
      `;
    }

    const units = await sql`
      SELECT id, name FROM property_units WHERE property_id = ${id} ORDER BY created_at ASC
    `;

    let seasonalPrices: any[] = [];
    try {
      seasonalPrices = await sql`
        SELECT start_date, end_date, price
        FROM property_seasonal_prices
        WHERE property_id = ${id}
        ORDER BY start_date ASC
      `;
    } catch (e) {
      // Игнорируем, если таблица еще не создана
    }

    return NextResponse.json({ bookings, units, seasonalPrices });
  } catch (error) {
    console.error('Ошибка загрузки занятых дат:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}