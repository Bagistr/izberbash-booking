import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');

    if (!phone) {
      return NextResponse.json({ error: 'Номер телефона обязателен' }, { status: 400 });
    }

    const clean10 = phone.replace(/\D/g, '').slice(-10);

    const userRows = await sql`
      SELECT id, balance, payout_card, payout_bank
      FROM users
      WHERE regexp_replace(phone, '\D', '', 'g') LIKE ${`%${clean10}`}
      LIMIT 1
    `;

    if (userRows.length === 0) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
    }

    const landlord = userRows[0];

    // Загружаем историю заявок на вывод
    const payouts = await sql`
      SELECT * FROM payout_requests
      WHERE landlord_id = ${landlord.id}::uuid
      ORDER BY created_at DESC
      LIMIT 10
    `;

    return NextResponse.json({
      balance: Number(landlord.balance || 0),
      payout_card: landlord.payout_card || '',
      payout_bank: landlord.payout_bank || '',
      payouts,
    });
  } catch (err: any) {
    console.error('Ошибка баланса:', err);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}