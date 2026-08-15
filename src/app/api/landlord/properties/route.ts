import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');

    if (!phone) {
      return NextResponse.json({ error: 'Номер телефона обязателен' }, { status: 400 });
    }

    const rawDigits = phone.replace(/\D/g, '');
    const clean10Digits = rawDigits.slice(-10);

    // 1. Находим объекты владельца
    const properties = await sql`
      SELECT * FROM properties
      WHERE regexp_replace(landlord_phone, '\D', '', 'g') LIKE ${`%${clean10Digits}`}
      ORDER BY created_at DESC
    `;

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

    // 2. Считаем коммерческие бронирования (с сайта)
    const paidBookings = bookings.filter(
      (b) => b.status !== 'blocked' && Number(b.total_price) > 0
    );

    const totalRevenue = paidBookings.reduce(
      (acc, b) => acc + Number(b.total_price || 0),
      0
    );
    const platformCommission = Math.round(totalRevenue * 0.07); // 7% комиссия
    const netRevenue = totalRevenue - platformCommission; // 93% чистый доход

    const totalGuests = paidBookings.reduce(
      (acc, b) => acc + Number(b.guests_count || 1),
      0
    );

    // 3. Средний срок бронирования по всем броням и заездам
    const allOccupiedBookings = bookings.filter((b) => Number(b.total_days) > 0);
    const totalDays = allOccupiedBookings.reduce(
      (acc, b) => acc + Number(b.total_days || 0),
      0
    );
    const avgDays =
      allOccupiedBookings.length > 0
        ? (totalDays / allOccupiedBookings.length).toFixed(1)
        : '0';

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