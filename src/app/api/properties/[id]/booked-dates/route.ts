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

    // Если передан конкретный домик, ищем брони для него, иначе для всего объекта
    let bookings;
    if (unitId && unitId !== 'all') {
      bookings = await sql`
        SELECT check_in, check_out, unit_id
        FROM bookings 
        WHERE (property_id = ${id} OR unit_id = ${unitId})
          AND unit_id = ${unitId}
          AND status IN ('new', 'confirmed')
      `;
    } else {
      bookings = await sql`
        SELECT check_in, check_out, unit_id
        FROM bookings 
        WHERE property_id = ${id} AND status IN ('new', 'confirmed')
      `;
    }

    // Также отдаем список всех доступных домиков
    const units = await sql`
      SELECT id, name FROM property_units WHERE property_id = ${id} ORDER BY created_at ASC
    `;

    return NextResponse.json({ bookings, units });
  } catch (error) {
    console.error('Ошибка загрузки занятых дат:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}