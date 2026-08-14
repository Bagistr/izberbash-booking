import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');

    if (!phone) {
      return NextResponse.json([]);
    }

    const cleanPhone = phone.trim().replace(/[^0-9+]/g, '');

    const bookings = await sql`
      SELECT 
        b.id, b.check_in, b.check_out, b.total_days, b.total_price, b.status,
        p.title as property_title, p.address, p.landlord_phone
      FROM bookings b
      JOIN properties p ON b.property_id = p.id
      WHERE b.guest_phone LIKE ${`%${cleanPhone.slice(-10)}%`}
      ORDER BY b.created_at DESC
    `;

    return NextResponse.json(bookings);
  } catch (e) {
    console.error('Ошибка получения броней туриста:', e);
    return NextResponse.json([]);
  }
}