import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { sql } from '@/lib/db';

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
    } = body;

    if (!title || !price_per_night || !distance_to_sea || !address || !landlord_phone) {
      return NextResponse.json(
        { error: 'Заполните все обязательные поля' },
        { status: 400 }
      );
    }

    const slug = `${title.toLowerCase().replace(/[^a-z0-9а-яё]/g, '-')}-${Date.now()}`;

    const amenitiesArray = typeof amenities === 'string' 
      ? amenities.split(',').map((a: string) => a.trim()).filter(Boolean)
      : amenities || [];

    const photosArray = typeof photos === 'string'
      ? photos.split('\n').map((p: string) => p.trim()).filter(Boolean)
      : photos || [];

    const finalPhotos = photosArray.length > 0 
      ? photosArray 
      : ['https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1000&q=80'];

    await sql`
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
    `;

    // Принудительно очищаем кэш главной страницы
    revalidatePath('/');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Ошибка добавления объекта:', error);
    return NextResponse.json(
      { error: 'Не удалось сохранить объект в базу' },
      { status: 500 }
    );
  }
}