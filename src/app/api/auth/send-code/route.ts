import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { phone, action = 'register' } = await request.json();

    if (!phone) {
      return NextResponse.json({ error: 'Укажите номер телефона' }, { status: 400 });
    }

    const digitsOnly = phone.replace(/\D/g, '');
    const clean10 = digitsOnly.slice(-10);

    if (clean10.length < 10) {
      return NextResponse.json({ error: 'Введите номер телефона (10 цифр)' }, { status: 400 });
    }

    // 1. Проверяем в базе
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

    if (action === 'reset_password' && existingUser.length === 0) {
      return NextResponse.json(
        { error: 'Пользователь с таким номером телефона не найден. Проверьте номер или зарегистрируйтесь.' },
        { status: 404 }
      );
    }

    const publicKey = process.env.ZVONOK_PUBLIC_KEY;
    const campaignId = process.env.ZVONOK_CAMPAIGN_ID || '2003856983';

    if (!publicKey) {
      return NextResponse.json({ error: 'ZVONOK_PUBLIC_KEY не задан в переменных Vercel' }, { status: 500 });
    }

    // 2. Вызываем официальный endpoint Zvonok для проверочного номера: /phones/confirm/
    const formData = new URLSearchParams();
    formData.append('public_key', publicKey.trim());
    formData.append('phone', `+7${clean10}`);
    formData.append('campaign_id', campaignId.trim());

    const zvonokRes = await fetch('https://zvonok.com/manager/cabapi_external/api/v1/phones/confirm/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
    });

    const data = await zvonokRes.json();

    if (data.status !== 'ok' && data.status !== 'success' && !data.data) {
      console.error('Ошибка Zvonok /confirm/:', data);
      const msg = data.data?.message || data.message || JSON.stringify(data);
      return NextResponse.json({ error: `Ошибка Zvonok: ${msg}` }, { status: 400 });
    }

    const callId = data.data?.call_id || data.call_id || clean10;
    // Номер из кампании Zvonok для звонков клиентов
    const targetCallPhone = data.data?.service_phone || data.service_phone || '+7 (930) 555-86-07';

    return NextResponse.json({
      success: true,
      callId,
      targetCallPhone,
      message: 'Позвоните на проверочный номер',
    });
  } catch (err: any) {
    console.error('Критическая ошибка send-code:', err);
    return NextResponse.json({ error: 'Ошибка сервера при подключении к сервису звонков' }, { status: 500 });
  }
}

// Проверка статуса звонка
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');
    const callId = searchParams.get('callId');

    if (!phone && !callId) return NextResponse.json({ verified: false });

    const publicKey = process.env.ZVONOK_PUBLIC_KEY;
    if (!publicKey) return NextResponse.json({ verified: false });

    // Проверяем по call_by_id или call_id в Zvonok
    let checkUrl = `https://zvonok.com/manager/cabapi_external/api/v1/phones/call_by_id/?public_key=${publicKey.trim()}&call_id=${callId}`;
    
    const checkRes = await fetch(checkUrl);
    const data = await checkRes.json();

    const status = data.data?.status || data.status;
    const isConfirmed = status === 'completed' || status === 'confirmed' || status === 'success' || data.data?.confirmed === true;

    return NextResponse.json({ verified: isConfirmed });
  } catch (err) {
    return NextResponse.json({ verified: false });
  }
}