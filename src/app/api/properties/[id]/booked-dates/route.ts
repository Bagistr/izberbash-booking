import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Получаем все бронирования данного объекта со статусом new или confirmed
    const bookings = await sql`
      SELECT check_in, check_out 
      FROM bookings 
      WHERE property_id = ${id} AND status IN ('new', 'confirmed')
    `;

    return NextResponse.json({ bookings });
  } catch (error) {
    console.error('Ошибка загрузки занятых дат:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}