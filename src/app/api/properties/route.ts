import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { sql } from '@/lib/db';

// Получение списка объектов с их домиками
export async function GET() {
  try {
    const properties = await sql`
      SELECT * FROM properties 
      WHERE is_active = true 
      ORDER BY created_at DESC
    `;

    const units = await sql`SELECT * FROM property_units`;

    const propertiesWithUnits = properties.map((p) => ({
      ...p,
      units: units.filter((u) => u.property_id === p.id),
    }));

    return NextResponse.json(propertiesWithUnits);
  } catch (error) {
    console.error('Ошибка получения объектов:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

// Создание объекта вместе с домиками/номерами
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      title,
      property_type,
      price_per_night,
      max_guests,
      distance_to_sea,
      address,
      description,
      amenities,
      photos,
      landlord_phone,
      units, // Массив названий домиков, например ['Коттедж №1', 'Коттедж №2']
    } = body;

    if (!title || !price_per_night || !distance_to_sea || !address || !landlord_phone) {
      return NextResponse.json(
        { error: 'Заполните все обязательные поля' },
        { status: 400 }
      );
    }

    const slug = `${title.toLowerCase().replace(/[^a-z0-9а-яё]/g, '-')}-${Date.now()}`;

    const amenitiesArray = Array.isArray(amenities)
      ? amenities
      : typeof amenities === 'string'
      ? amenities.split(',').map((a: string) => a.trim()).filter(Boolean)
      : [];

    const photosArray = Array.isArray(photos)
      ? photos
      : typeof photos === 'string'
      ? photos.split('\n').map((p: string) => p.trim()).filter(Boolean)
      : [];

    const finalPhotos = photosArray.length > 0
      ? photosArray
      : ['https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1000&q=80'];

    // 1. Создаем основной объект
    const propertyRows = await sql`
      INSERT INTO properties (
        title, slug, property_type, price_per_night, max_guests, 
        distance_to_sea, address, description, amenities, photos, 
        landlord_phone, is_active
      )
      VALUES (
        ${title}, ${slug}, ${property_type || 'house'}, ${Number(price_per_night)}, 
        ${Number(max_guests) || 2}, ${Number(distance_to_sea)}, ${address}, 
        ${description || ''}, ${amenitiesArray}, ${finalPhotos}, 
        ${landlord_phone}, true
      )
      RETURNING id
    `;

    const newPropertyId = propertyRows[0].id;

    // 2. Создаем домики (если указаны) или создаем 1 дефолтный
    const unitsList = units && Array.isArray(units) && units.length > 0
      ? units
      : ['Основной домик'];

    for (const unitName of unitsList) {
      if (unitName.trim()) {
        await sql`
          INSERT INTO property_units (property_id, name)
          VALUES (${newPropertyId}, ${unitName.trim()})
        `;
      }
    }

    revalidatePath('/');

    return NextResponse.json({ success: true, id: newPropertyId });
  } catch (error) {
    console.error('Ошибка добавления объекта:', error);
    return NextResponse.json(
      { error: 'Не удалось сохранить объект в базу' },
      { status: 500 }
    );
  }
}