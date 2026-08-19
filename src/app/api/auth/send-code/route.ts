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

    // Проверяем существование пользователя
    const existingUser = await sql`
      SELECT id FROM users
      WHERE regexp_replace(phone, '\D', '', 'g') LIKE ${`%${clean10}`}
      LIMIT 1
    `;

    if (action === 'register' && existingUser.length > 0) {
      return NextResponse.json(
        { error: 'Пользователь с таким номером уже зарегистрирован. Пожалуйста, войдите.' },
        { status: 400 }
      );
    }

    const publicKey = process.env.ZVONOK_PUBLIC_KEY;
    const campaignId = process.env.ZVONOK_CAMPAIGN_ID || '2003856983';

    if (!publicKey) {
      return NextResponse.json({ error: 'ZVONOK_PUBLIC_KEY не указан' }, { status: 500 });
    }

    // Регистрируем ожидание звонка от клиента в Zvonok
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

    // Проверочный номер, на который клиенту нужно позвонить
    const targetCallPhone = data.service_phone || data.data?.service_phone || '+78122420000';
    const callId = data.call_id || data.data?.id || clean10;

    return NextResponse.json({
      success: true,
      targetCallPhone,
      callId,
      message: 'Пожалуйста, совершите бесплатный звонок на указанный номер',
    });
  } catch (err: any) {
    console.error('Ошибка call_in:', err);
    return NextResponse.json({ error: 'Ошибка сервиса звонков' }, { status: 500 });
  }
}

// Эндпоинт для опроса: поступил ли звонок от клиента
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');
    const callId = searchParams.get('callId');

    if (!phone) {
      return NextResponse.json({ error: 'Номер телефона обязателен' }, { status: 400 });
    }

    const clean10 = phone.replace(/\D/g, '').slice(-10);
    const publicKey = process.env.ZVONOK_PUBLIC_KEY;
    const campaignId = process.env.ZVONOK_CAMPAIGN_ID || '2003856983';

    if (!publicKey) {
      return NextResponse.json({ verified: false });
    }

    // Проверяем статус входящего звонка в Zvonok API
    const params = new URLSearchParams({
      public_key: publicKey.trim(),
      campaign_id: campaignId.trim(),
      phone: `+7${clean10}`,
    });

    const checkRes = await fetch(`https://zvonok.com/manager/cabapi_external/api/v1/phones/call_in_status/?${params.toString()}`);
    const data = await checkRes.json();

    // Если звонок зафиксирован
    const isConfirmed = data.status === 'confirmed' || data.data?.status === 'confirmed' || data.confirmed === true;

    return NextResponse.json({ verified: isConfirmed });
  } catch (err) {
    return NextResponse.json({ verified: false });
  }
}