import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { phone, amount, cardNumber, bankName } = await request.json();

    if (!phone || !amount || !cardNumber) {
      return NextResponse.json({ error: 'Заполните все обязательные поля' }, { status: 400 });
    }

    const clean10 = phone.replace(/\D/g, '').slice(-10);
    const withdrawAmount = Number(amount);

    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
      return NextResponse.json({ error: 'Некорректная сумма вывода' }, { status: 400 });
    }

    // Проверяем текущий баланс пользователя
    const userRows = await sql`
      SELECT id, balance
      FROM users
      WHERE regexp_replace(phone, '\D', '', 'g') LIKE ${`%${clean10}`}
      LIMIT 1
    `;

    if (userRows.length === 0) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
    }

    const user = userRows[0];
    const currentBalance = Number(user.balance || 0);

    if (currentBalance < withdrawAmount) {
      return NextResponse.json({ error: 'Недостаточно средств на балансе' }, { status: 400 });
    }

    // Списываем средства с баланса
    await sql`
      UPDATE users
      SET balance = balance - ${withdrawAmount},
          payout_card = ${cardNumber.trim()},
          payout_bank = ${bankName ? bankName.trim() : null}
      WHERE id = ${user.id}::uuid
    `;

    // Создаем запись заявки на вывод
    await sql`
      INSERT INTO payout_requests (landlord_id, amount, card_number, bank_name, status)
      VALUES (${user.id}::uuid, ${withdrawAmount}, ${cardNumber.trim()}, ${bankName || 'СБП / Карта'}, 'pending')
    `;

    return NextResponse.json({ success: true, newBalance: currentBalance - withdrawAmount });
  } catch (err: any) {
    console.error('Ошибка запроса на вывод:', err);
    return NextResponse.json({ error: 'Не удалось создать заявку' }, { status: 500 });
  }
}