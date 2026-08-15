import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');

    if (!phone) {
      return NextResponse.json({ error: 'Номер телефона обязателен' }, { status: 400 });
    }

    const cleanPhone = phone.trim().replace(/[^0-9+]/g, '');

    // 1. Получаем объекты этого владельца
    const properties = await sql`
      SELECT * FROM properties
      WHERE landlord_phone LIKE ${`%${cleanPhone.slice(-10)}%`}
      ORDER BY created_at DESC
    `;

    // 2. Получаем все брони для этих объектов
    const propertyIds = properties.map((p) => p.id);

    let bookings: any[] = [];
    if (propertyIds.length > 0) {
      bookings = await sql`
        SELECT 
          b.id, b.property_id, b.unit_id, b.check_in, b.check_out, 
          b.total_days, b.total_price, b.guest_name, b.guest_phone, 
          b.guest_telegram, b.guests_count, b.status,
          p.title as property_title
        FROM bookings b
        JOIN properties p ON b.property_id = p.id
        WHERE b.property_id = ANY(${propertyIds}::uuid[])
        ORDER BY b.created_at DESC
      `;
    }

    // 3. Считаем статистику с комиссией 7% (0.07)
    const validBookings = bookings.filter((b) => b.status === 'confirmed');

    const totalRevenue = validBookings.reduce((acc, b) => acc + Number(b.total_price || 0), 0);
    const platformCommission = Math.round(totalRevenue * 0.07); // 7% комиссия сервиса
    const netRevenue = totalRevenue - platformCommission; // 93% доход владельца
    const totalGuests = validBookings.reduce((acc, b) => acc + Number(b.guests_count || 1), 0);

    const totalDays = validBookings.reduce((acc, b) => acc + Number(b.total_days || 1), 0);
    const avgDays = validBookings.length > 0 ? (totalDays / validBookings.length).toFixed(1) : '0';

    return NextResponse.json({
      properties,
      bookings,
      stats: {
        totalRevenue,
        netRevenue,
        platformCommission,
        totalGuests,
        avgDays,
      },
    });
  } catch (error) {
    console.error('Ошибка загрузки данных кабинета:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}