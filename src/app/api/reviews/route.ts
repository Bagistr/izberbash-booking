import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

// 1. Получить отзывы по объекту или пользователю
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const userId = searchParams.get('userId');

    if (propertyId) {
      const reviews = await sql`
        SELECT 
          r.id,
          r.rating,
          r.comment,
          r.host_reply,
          r.created_at,
          u.name as author_name
        FROM reviews r
        JOIN users u ON r.user_id = u.id
        WHERE r.property_id = ${propertyId}::uuid
        ORDER BY r.created_at DESC
      `;
      return NextResponse.json({ reviews });
    }

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

    return NextResponse.json({ error: 'Не указан ID' }, { status: 400 });
  } catch (err: any) {
    console.error('Ошибка reviews GET:', err);
    return NextResponse.json({ error: 'Ошибка загрузки отзывов' }, { status: 500 });
  }
}

// 2. Оставить новый отзыв
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { propertyId, userId, bookingId, rating, comment } = body;

    if (!propertyId || !userId || !rating || !comment) {
      return NextResponse.json({ error: 'Заполните все обязательные поля' }, { status: 400 });
    }

    // Проверяем, не оставлял ли гость уже отзыв по этому бронированию
    if (bookingId) {
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
      VALUES (${propertyId}::uuid, ${userId}::uuid, ${bookingId ? bookingId : null}::uuid, ${rating}, ${comment})
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
    return NextResponse.json({ error: 'Ошибка добавления ответа' }, { status: 500 });
  }
}