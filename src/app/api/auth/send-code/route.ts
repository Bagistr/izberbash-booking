import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { phone } = await request.json();

    if (!phone) {
      return NextResponse.json({ error: 'Номер телефона обязателен' }, { status: 400 });
    }

    const digitsOnly = phone.replace(/\D/g, '');
    if (digitsOnly.length < 10) {
      return NextResponse.json({ error: 'Введите корректный номер телефона' }, { status: 400 });
    }

    // Приводим к международному формату с плюсом
    let formattedPhone = digitsOnly;
    if (digitsOnly.length === 11 && (digitsOnly.startsWith('7') || digitsOnly.startsWith('8'))) {
      formattedPhone = `7${digitsOnly.slice(1)}`;
    }
    const clean10 = digitsOnly.slice(-10);

    const publicKey = process.env.ZVONOK_PUBLIC_KEY;
    const campaignId = process.env.ZVONOK_CAMPAIGN_ID;

    if (!publicKey || !campaignId) {
      return NextResponse.json(
        { error: 'Сервис звонков не настроен (проверьте ZVONOK_PUBLIC_KEY и ZVONOK_CAMPAIGN_ID)' },
        { status: 500 }
      );
    }

    // Отправляем POST-запрос с x-www-form-urlencoded
    const formData = new URLSearchParams();
    formData.append('public_key', publicKey.trim());
    formData.append('phone', `+${formattedPhone}`);
    formData.append('campaign_id', campaignId.trim());

    const zvonokRes = await fetch('https://zvonok.com/manager/cabapi_external/api/v1/phones/flashcall/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const data = await zvonokRes.json();

    // Извлекаем пинкод из ответа Zvonok
    const pincode = data.pincode || data.data?.pincode || data.code;

    if (!pincode) {
      console.error('Детали ошибки Zvonok API:', data);
      const errDetail = data.message || data.error || (data.data ? JSON.stringify(data.data) : 'Не удалось совершить звонок');
      return NextResponse.json({ error: `Ошибка Zvonok: ${errDetail}` }, { status: 400 });
    }

    const code = String(pincode);

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
      message: 'Вам поступает звонок. Введите последние 4 цифры номера.',
    });
  } catch (err: any) {
    console.error('Критическая ошибка send-code:', err);
    return NextResponse.json({ error: `Ошибка сервера: ${err?.message || 'Сбой соединения'}` }, { status: 500 });
  }
}