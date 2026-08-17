import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { phone } = await request.json();

    if (!phone) {
      return NextResponse.json({ error: 'Номер телефона обязателен' }, { status: 400 });
    }

    const clean10 = phone.replace(/\D/g, '').slice(-10);
    const standardPhone = `7${clean10}`; // Zvonok ожидает формат 79XXXXXXXXX

    const publicKey = process.env.ZVONOK_PUBLIC_KEY;
    const campaignId = process.env.ZVONOK_CAMPAIGN_ID;

    if (!publicKey || !campaignId) {
      return NextResponse.json(
        { error: 'Сервис звонков не настроен в .env.local' },
        { status: 500 }
      );
    }

    // Вызываем Zvonok.com Flash Call API
    const params = new URLSearchParams({
      public_key: publicKey,
      phone: `+${standardPhone}`,
      campaign_id: campaignId,
    });

    const zvonokRes = await fetch(`https://zvonok.com/manager/cabapi_external/api/v1/phones/flashcall/?${params.toString()}`, {
      method: 'GET',
    });

    const data = await zvonokRes.json();

    if (data.status !== 'ok' && !data.pincode) {
      console.error('Ошибка Zvonok API:', data);
      return NextResponse.json(
        { error: data.message || 'Не удалось совершить звонок' },
        { status: 400 }
      );
    }

    // PIN-код из ответа Zvonok (последние 4 цифры номера звонящего)
    const code = String(data.pincode || data.data?.pincode);

    // Сохраняем код в базе данных (действителен 3 минуты)
    await sql`
      INSERT INTO phone_verification_codes (phone, code, expires_at)
      VALUES (
        ${`8${clean10}`}, 
        ${code}, 
        NOW() + INTERVAL '3 minutes'
      )
    `;

    return NextResponse.json({
      success: true,
      message: 'Вам поступает звонок. Введите последние 4 цифры входящего номера.',
    });
  } catch (err: any) {
    console.error('Ошибка send-code:', err);
    return NextResponse.json({ error: 'Ошибка сервера при отправке кода' }, { status: 500 });
  }
}