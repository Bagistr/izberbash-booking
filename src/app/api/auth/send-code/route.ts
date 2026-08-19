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
      return NextResponse.json({ error: 'Введите корректный номер телефона (10 цифр)' }, { status: 400 });
    }

    // 1. Проверяем в БД: не занят ли номер
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

    const publicKey = process.env.ZVONOK_PUBLIC_KEY;
    const campaignId = process.env.ZVONOK_CAMPAIGN_ID || '2003856983';

    if (!publicKey) {
      return NextResponse.json({ error: 'Ключ ZVONOK_PUBLIC_KEY не задан в переменных Vercel' }, { status: 500 });
    }

    // 2. Отправляем запрос в Zvonok для создания ожидания звонка от клиента
    const formData = new URLSearchParams();
    formData.append('public_key', publicKey.trim());
    formData.append('phone', `+7${clean10}`);
    formData.append('campaign_id', campaignId.trim());

    const zvonokRes = await fetch('https://zvonok.com/manager/cabapi_external/api/v1/phones/call_in/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
    });

    const data = await zvonokRes.json();

    // Проверочный номер из ответа Zvonok или общий проверочный номер по умолчанию
    const targetCallPhone = data.service_phone || data.data?.service_phone || '+7 (930) 555-86-07';

    return NextResponse.json({
      success: true,
      targetCallPhone,
      message: 'Пожалуйста, совершите бесплатный звонок на проверочный номер.',
    });
  } catch (err: any) {
    console.error('Ошибка send-code:', err);
    return NextResponse.json({ error: 'Ошибка сервера при подключении к сервису звонков' }, { status: 500 });
  }
}

// Опрос: зафиксирован ли входящий звонок
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');

    if (!phone) return NextResponse.json({ verified: false });

    const clean10 = phone.replace(/\D/g, '').slice(-10);
    const publicKey = process.env.ZVONOK_PUBLIC_KEY;
    const campaignId = process.env.ZVONOK_CAMPAIGN_ID || '2003856983';

    if (!publicKey) return NextResponse.json({ verified: false });

    const params = new URLSearchParams({
      public_key: publicKey.trim(),
      campaign_id: campaignId.trim(),
      phone: `+7${clean10}`,
    });

    const checkRes = await fetch(`https://zvonok.com/manager/cabapi_external/api/v1/phones/call_in_status/?${params.toString()}`);
    const data = await checkRes.json();

    const isConfirmed = data.status === 'confirmed' || data.data?.status === 'confirmed' || data.confirmed === true;

    return NextResponse.json({ verified: isConfirmed });
  } catch (err) {
    return NextResponse.json({ verified: false });
  }
}