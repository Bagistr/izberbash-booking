import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

// Получение объектов, бронирований и финансовой аналитики арендодателя
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const landlordPhone = searchParams.get('phone');

    if (!landlordPhone) {
      return NextResponse.json({ error: 'Не указан телефон' }, { status: 400 });
    }

    // 1. Объекты собственника
    const properties = await sql`
      SELECT * FROM properties 
      WHERE landlord_phone = ${landlordPhone} 
      ORDER BY created_at DESC
    `;

    // 2. Все бронирования его объектов
    const bookings = await sql`
      SELECT b.*, p.title as property_title
      FROM bookings b
      JOIN properties p ON b.property_id = p.id
      WHERE p.landlord_phone = ${landlordPhone}
      ORDER BY b.check_in ASC
    `;

    // 3. Расчет персональной статистики
    const totalRevenue = bookings.reduce((acc, b) => acc + Number(b.total_price || 0), 0);
    const commissionRate = 0.10; // 10% комиссия платформы
    const platformCommission = Math.round(totalRevenue * commissionRate);
    const netRevenue = totalRevenue - platformCommission;
    const totalGuests = bookings.length;
    const totalDays = bookings.reduce((acc, b) => acc + Number(b.total_days || 0), 0);
    const avgDays = totalGuests > 0 ? (totalDays / totalGuests).toFixed(1) : '0';

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
  } catch (err) {
    console.error('Ошибка загрузки данных кабинета:', err);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

// Полное редактирование объекта
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const {
      id,
      title,
      property_type,
      price_per_night,
      max_guests,
      distance_to_sea,
      address,
      description,
      amenities,
      is_active,
    } = body;

    const amenitiesArray = Array.isArray(amenities)
      ? amenities
      : typeof amenities === 'string'
      ? amenities.split(',').map((a: string) => a.trim()).filter(Boolean)
      : [];

    await sql`
      UPDATE properties 
      SET 
        title = ${title},
        property_type = ${property_type || 'house'},
        price_per_night = ${Number(price_per_night)},
        max_guests = ${Number(max_guests) || 2},
        distance_to_sea = ${Number(distance_to_sea)},
        address = ${address},
        description = ${description || ''},
        amenities = ${amenitiesArray},
        is_active = ${is_active}
      WHERE id = ${id}
    `;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Ошибка обновления объекта:', err);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}