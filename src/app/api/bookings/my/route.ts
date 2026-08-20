import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const phone = searchParams.get('phone');

    if (!userId && !phone) {
      return NextResponse.json({ error: 'Укажите пользователя' }, { status: 400 });
    }

    let clean10 = '';
    if (phone) {
      clean10 = phone.replace(/\D/g, '').slice(-10);
    }

    const bookings = await sql`
      SELECT 
        b.id,
        b.property_id,
        b.check_in,
        b.check_out,
        b.total_price,
        b.status,
        b.created_at,
        p.title as property_title,
        p.address as property_address,
        p.photos as property_photos,
        p.price_per_night,
        p.landlord_phone as host_phone,
        u_host.name as host_name,
        r.id as review_id,
        r.rating as review_rating,
        r.comment as review_comment,
        r.host_reply
      FROM bookings b
      JOIN properties p ON b.property_id = p.id
      LEFT JOIN users u_host ON p.owner_id = u_host.id
      LEFT JOIN reviews r ON r.booking_id = b.id
      WHERE (
        ${userId ? sql`b.user_id = ${userId}::uuid` : sql`FALSE`}
        OR (${clean10 ? sql`regexp_replace(b.guest_phone, '\D', '', 'g') LIKE ${`%${clean10}`}` : sql`FALSE`})
      )
      ORDER BY b.created_at DESC
    `;

    return NextResponse.json({ bookings });
  } catch (err: any) {
    console.error('Ошибка bookings/my:', err);
    return NextResponse.json({ error: 'Ошибка получения бронирований' }, { status: 500 });
  }
}