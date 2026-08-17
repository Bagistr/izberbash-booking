import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { phone, action = 'register' } = await request.json();

    if (!phone) {
      return NextResponse.json({ error: 'Укажите номер телефона' }, { status: 400 });
    }

    const digitsOnly = phone.replace(/\D/g, '');
    if (digitsOnly.length < 10) {
      return NextResponse.json({ error: 'Введите корректный номер телефона' }, { status: 400 });
    }

    const clean10 = digitsOnly.slice(-10);

    // --- ПРОВЕРКА В БАЗЕ ДАННЫХ ПЕРЕД ЗВОНКОМ ---
    const existingUser = await sql`
      SELECT id FROM users
      WHERE regexp_replace(phone, '\D', '', 'g') LIKE ${`%${clean10}`}
      LIMIT 1
    `;

    if (action === 'register' && existingUser.length > 0) {
      return NextResponse.json(
        { error: 'Пользователь с таким номером уже зарегистрирован. Пожалуйста, выполните вход.' },
        { status: 400 }
      );
    }

    // Если звонок запрашивается для сброса пароля / входа, а пользователя нет
    if (action === 'reset' && existingUser.length === 0) {
      return NextResponse.json(
        { error: 'Пользователь с таким номером не найден.' },
        { status: 404 }
      );
    }

    // Приводим к формату 79XXXXXXXXX
    let formattedPhone = digitsOnly;
    if (digitsOnly.length === 11 && (digitsOnly.startsWith('7') || digitsOnly.startsWith('8'))) {
      formattedPhone = `7${digitsOnly.slice(1)}`;
    }

    const publicKey = process.env.ZVONOK_PUBLIC_KEY;
    const campaignId = process.env.ZVONOK_CAMPAIGN_ID || '1904628465';

    if (!publicKey) {
      return NextResponse.json(
        { error: 'ZVONOK_PUBLIC_KEY не указан в настройках' },
        { status: 500 }
      );
    }

    const formData = new URLSearchParams();
    formData.append('public_key', publicKey.trim());
    formData.append('phone', `+${formattedPhone}`);
    formData.append('campaign_id', campaignId.trim());

    // 1. Вызов Flash Call
    let res = await fetch('https://zvonok.com/manager/cabapi_external/api/v1/phones/flashcall/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
    });

    let data = await res.json();

    // 2. Автоматический fallback на голосовой код, если в кабинете включен другой режим
    if (!data.pincode && (data.error?.includes('campaign') || data.message?.includes('campaign') || data.status !== 'ok')) {
      res = await fetch('https://zvonok.com/manager/cabapi_external/api/v1/phones/call_with_code/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
      });
      data = await res.json();
    }

    const pincode = data.pincode || data.data?.pincode || data.code;

    if (!pincode) {
      console.error('Ошибка Zvonok:', data);
      const detail = data.message || data.error || JSON.stringify(data);
      return NextResponse.json({ error: `Ошибка Zvonok: ${detail}` }, { status: 400 });
    }

    const code = String(pincode);

    // Записываем код подтверждения в базу
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