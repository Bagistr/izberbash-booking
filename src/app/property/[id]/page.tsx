import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { sql } from '@/lib/db';
import { Property } from '@/types/property';
import { Waves, ArrowLeft, MapPin, Users, Check, Phone } from 'lucide-react';

async function getProperty(id: string): Promise<Property | null> {
  try {
    const rows = await sql`SELECT * FROM properties WHERE id = ${id}`;
    if (!rows || rows.length === 0) return null;
    return rows[0] as Property;
  } catch (err) {
    console.error('Ошибка получения объекта из Neon:', err);
    return null;
  }
}

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const property = await getProperty(id);

  if (!property) {
    notFound();
  }

  const photos =
    property.photos && property.photos.length > 0
      ? property.photos
      : ['https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1000&q=80'];

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Хедер */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="bg-blue-600 p-2 rounded-xl text-white">
              <Waves className="w-6 h-6" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-slate-900">
              Избербаш<span className="text-blue-600">Море</span>
            </span>
          </Link>

          <Link href="/" className="inline-flex items-center text-sm font-medium text-slate-600 hover:text-slate-900">
            <ArrowLeft className="w-4 h-4 mr-1" /> К каталогу
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 pt-8">
        {/* Заголовок и адрес */}
        <div className="mb-6">
          <span className="inline-block bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full mb-2">
            {property.property_type === 'house' ? 'Коттедж / Дом' : 'Номер в отеле'}
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 mb-2">{property.title}</h1>
          <div className="flex items-center text-slate-600 text-sm">
            <MapPin className="w-4 h-4 mr-1 text-blue-600" />
            <span>{property.address}</span>
            <span className="mx-2">•</span>
            <span className="font-semibold text-blue-700">{property.distance_to_sea} м до моря</span>
          </div>
        </div>

        {/* Галерея фотографий */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          <div className="md:col-span-2 h-[350px] sm:h-[450px] rounded-3xl overflow-hidden border border-slate-200 shadow-sm">
            <img src={photos[0]} alt={property.title} className="w-full h-full object-cover" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-1 gap-4 h-[350px] sm:h-[450px]">
            {photos.slice(1, 3).map((photo, index) => (
              <div key={index} className="h-full rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                <img src={photo} alt={`${property.title} - ${index + 2}`} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>

        {/* Подробности */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Об объекте</h2>
              <p className="text-slate-600 leading-relaxed whitespace-pre-line text-sm sm:text-base">
                {property.description || 'Описание пока не заполнено.'}
              </p>
              
              <div className="mt-6 pt-6 border-t border-slate-100 flex items-center space-x-6 text-sm text-slate-700 font-medium">
                <div className="flex items-center">
                  <Users className="w-5 h-5 mr-2 text-blue-600" />
                  <span>До {property.max_guests} гостей</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Удобства и бонусы</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {property.amenities?.map((item, idx) => (
                  <div key={idx} className="flex items-center p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs sm:text-sm font-semibold text-slate-700">
                    <Check className="w-4 h-4 mr-2 text-emerald-500 flex-shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-lg sticky top-24 space-y-6">
              <div>
                <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Стоимость</span>
                <div className="flex items-baseline mt-1">
                  <span className="text-3xl font-black text-slate-900">{property.price_per_night.toLocaleString('ru-RU')} ₽</span>
                  <span className="text-slate-500 text-sm ml-1">/ ночь</span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-2">
                <ShieldCheck className="w-8 h-8 text-blue-600 mx-auto" />
                <p className="text-xs font-bold text-slate-800">Заселение через сервис</p>
                <p className="text-[11px] text-slate-500 leading-normal">
                  Контакты собственника и точный адрес будут доступны сразу после подтверждения бронирования.
                </p>
              </div>

              <button
                onClick={() => setIsBookingOpen(true)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-4 rounded-2xl transition-colors shadow-lg shadow-blue-500/25 flex items-center justify-center space-x-2"
              >
                <span>Забронировать онлайн</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}