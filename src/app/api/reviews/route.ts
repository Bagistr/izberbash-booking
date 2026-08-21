import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

async function ensureReviewsTable() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS reviews (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        property_id UUID NOT NULL,
        user_id UUID,
        booking_id UUID,
        rating NUMERIC(3, 1) NOT NULL DEFAULT 5.0,
        comment TEXT,
        host_reply TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_reviews_property_id ON reviews(property_id);
      CREATE INDEX IF NOT EXISTS idx_reviews_booking_id ON reviews(booking_id);
    `;
  } catch (e) {
    // Таблица уже создана или нет прав на DDL
  }
}

// 1. Получить отзывы по объекту, пользователю или владельцу
export async function GET(request: Request) {
  try {
    await ensureReviewsTable();

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const userId = searchParams.get('userId');
    const ownerPhone = searchParams.get('ownerPhone');

    // 1.1 Отзывы конкретного объекта
    if (propertyId) {
      const reviews = await sql`
        SELECT 
          r.id,
          r.property_id,
          r.rating,
          r.comment,
          r.host_reply,
          r.created_at,
          COALESCE(u.name, 'Гость') as author_name
        FROM reviews r
        LEFT JOIN users u ON r.user_id = u.id
        WHERE r.property_id = ${propertyId}::uuid
        ORDER BY r.created_at DESC
      `;

      // Расчет средней оценки
      let avgRating = 5.0;
      if (reviews.length > 0) {
        const sum = reviews.reduce((acc, item) => acc + Number(item.rating || 5), 0);
        avgRating = Number((sum / reviews.length).toFixed(1));
      }

      return NextResponse.json({ 
        reviews, 
        total: reviews.length, 
        avgRating 
      });
    }

    // 1.2 Все отзывы на объекты конкретного владельца (для дашборда)
    if (ownerPhone) {
      const clean10 = ownerPhone.replace(/\D/g, '').slice(-10);
      const reviews = await sql`
        SELECT 
          r.id,
          r.property_id,
          r.rating,
          r.comment,
          r.host_reply,
          r.created_at,
          p.title as property_title,
          COALESCE(u.name, 'Гость') as author_name
        FROM reviews r
        JOIN properties p ON r.property_id = p.id
        LEFT JOIN users u_host ON p.owner_id = u_host.id
        LEFT JOIN users u ON r.user_id = u.id
        WHERE (
          regexp_replace(p.landlord_phone, '\D', '', 'g') LIKE ${`%${clean10}`}
          OR (u_host.phone IS NOT NULL AND regexp_replace(u_host.phone, '\D', '', 'g') LIKE ${`%${clean10}`})
        )
        ORDER BY r.created_at DESC
      `;
      return NextResponse.json({ reviews });
    }

    // 1.3 Отзывы конкретного пользователя
    if (userId) {
      const reviews = await sql`
        SELECT r.*, p.title as property_title 
        FROM reviews r
        JOIN properties p ON r.property_id = p.id
        WHERE r.user_id = ${userId}::uuid
        ORDER BY r.created_at DESC
      `;
      return NextResponse.json({ reviews });
    }

    return NextResponse.json({ error: 'Не указан параметр фильтрации' }, { status: 400 });
  } catch (err: any) {
    console.error('Ошибка reviews GET:', err);
    return NextResponse.json({ error: 'Ошибка загрузки отзывов' }, { status: 500 });
  }
}

// 2. Оставить новый отзыв туристом
export async function POST(request: Request) {
  try {
    await ensureReviewsTable();

    const body = await request.json();
    const { propertyId, userId, bookingId, rating, comment } = body;

    if (!propertyId || !rating || !comment) {
      return NextResponse.json({ error: 'Заполните все обязательные поля' }, { status: 400 });
    }

    // Проверяем статус бронирования и дубликаты
    if (bookingId) {
      const bookingCheck = await sql`
        SELECT status FROM bookings
        WHERE id = ${bookingId}::uuid
        LIMIT 1
      `;
      if (bookingCheck.length > 0) {
        const bStatus = bookingCheck[0].status;
        if (bStatus === 'no_show' || bStatus === 'cancelled') {
          return NextResponse.json(
            { error: 'Отзыв недоступен, так как поездка была отменена или гость не заселился' },
            { status: 400 }
          );
        }
      }

      const existing = await sql`
        SELECT id FROM reviews 
        WHERE booking_id = ${bookingId}::uuid
        LIMIT 1
      `;
      if (existing.length > 0) {
        return NextResponse.json({ error: 'Вы уже оставили отзыв для этой поездки' }, { status: 400 });
      }
    }

    const inserted = await sql`
      INSERT INTO reviews (property_id, user_id, booking_id, rating, comment)
      VALUES (
        ${propertyId}::uuid, 
        ${userId ? sql`${userId}::uuid` : null}, 
        ${bookingId ? sql`${bookingId}::uuid` : null}, 
        ${rating}, 
        ${comment}
      )
      RETURNING *
    `;

    return NextResponse.json({ success: true, review: inserted[0] });
  } catch (err: any) {
    console.error('Ошибка reviews POST:', err);
    return NextResponse.json({ error: 'Ошибка сохранения отзыва' }, { status: 500 });
  }
}

// 3. Ответ арендодателя на отзыв
export async function PATCH(request: Request) {
  try {
    await ensureReviewsTable();

    const body = await request.json();
    const { reviewId, hostReply } = body;

    if (!reviewId || !hostReply) {
      return NextResponse.json({ error: 'Некорректные данные' }, { status: 400 });
    }

    await sql`
      UPDATE reviews
      SET host_reply = ${hostReply}
      WHERE id = ${reviewId}::uuid
    `;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Ошибка reviews PATCH:', err);
    return NextResponse.json({ error: 'Ошибка добавления ответа' }, { status: 500 });
  }
}