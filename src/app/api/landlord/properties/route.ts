import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { sql } from '@/lib/db';

// 1. Получение объектов и аналитики владельца
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');

    if (!phone) {
      return NextResponse.json({ error: 'Номер телефона обязателен' }, { status: 400 });
    }

    const rawDigits = phone.replace(/\D/g, '');
    const clean10Digits = rawDigits.slice(-10);

    // Получаем ВСЕ объекты этого владельца (и активные, и скрытые)
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

    const paidBookings = bookings.filter(
      (b) => b.status !== 'blocked' && Number(b.total_price) > 0
    );

    const totalRevenue = paidBookings.reduce(
      (acc, b) => acc + Number(b.total_price || 0),
      0
    );
    const platformCommission = Math.round(totalRevenue * 0.07);
    const netRevenue = totalRevenue - platformCommission;

    const totalGuests = paidBookings.reduce(
      (acc, b) => acc + Number(b.guests_count || 1),
      0
    );

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

// 2. Обновление объекта (снятие с публикации / скрытие / редактирование)
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

    if (!id) {
      return NextResponse.json({ error: 'ID объекта не указан' }, { status: 400 });
    }

    // Если передан только статус публикации (is_active)
    if (is_active !== undefined && title === undefined) {
      await sql`
        UPDATE properties
        SET is_active = ${Boolean(is_active)}
        WHERE id = ${id}::uuid
      `;
    } else {
      // Полное обновление данных объекта
      const amenitiesArray = Array.isArray(amenities)
        ? amenities
        : typeof amenities === 'string'
        ? amenities.split(',').map((a: string) => a.trim()).filter(Boolean)
        : [];

      await sql`
        UPDATE properties
        SET 
          title = ${title},
          property_type = ${property_type},
          price_per_night = ${Number(price_per_night)},
          max_guests = ${Number(max_guests)},
          distance_to_sea = ${Number(distance_to_sea)},
          address = ${address},
          description = ${description || ''},
          amenities = ${amenitiesArray},
          is_active = ${is_active !== undefined ? Boolean(is_active) : true}
        WHERE id = ${id}::uuid
      `;
    }

    // Очищаем кэш главной страницы
    revalidatePath('/');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Ошибка обновления статуса публикации:', error);
    return NextResponse.json({ error: 'Не удалось обновить объект' }, { status: 500 });
  }
}