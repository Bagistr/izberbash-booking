'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Property } from '@/types/property';
import { BookingModal } from '@/components/BookingModal';
import {
  Waves, ArrowLeft, MapPin, Users, Check, ShieldCheck,
  Maximize2, X, ChevronLeft, ChevronRight
} from 'lucide-react';

export default function PropertyDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  // Состояние полноэкранного просмотра фото
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!id) return;

    async function loadProperty() {
      try {
        const res = await fetch(`/api/properties`);
        if (res.ok) {
          const list: Property[] = await res.json();
          const found = list.find((p) => String(p.id) === String(id));
          setProperty(found || null);
        }
      } catch (err) {
        console.error('Ошибка загрузки данных объекта:', err);
      } finally {
        setLoading(false);
      }
    }

    loadProperty();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-sm font-semibold text-slate-500 animate-pulse">Загрузка информации об объекте...</p>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Объект не найден</h1>
        <p className="text-sm text-slate-500 mb-4">Возможно, объявление было удалено или перемещено.</p>
        <Link href="/" className="bg-blue-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl">
          Вернуться в каталог
        </Link>
      </div>
    );
  }

  const photos =
    property.photos && property.photos.length > 0
      ? property.photos
      : ['https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1000&q=80'];

  const prevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (lightboxIndex !== null) {
      setLightboxIndex(lightboxIndex === 0 ? photos.length - 1 : lightboxIndex - 1);
    }
  };

  const nextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (lightboxIndex !== null) {
      setLightboxIndex(lightboxIndex === photos.length - 1 ? 0 : lightboxIndex + 1);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Шапка */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="bg-blue-600 p-2 rounded-xl text-white">
              <Waves className="w-6 h-6" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-slate-900">
              Райский<span className="text-blue-600">Пляж</span>
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

        {/* Галерея кликабельных фотографий с зумом */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          <div
            onClick={() => setLightboxIndex(0)}
            className="md:col-span-2 h-[350px] sm:h-[450px] rounded-3xl overflow-hidden border border-slate-200 shadow-sm relative group cursor-pointer"
          >
            <img src={photos[0]} alt={property.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
            <div className="absolute inset-0 bg-slate-900/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-sm space-x-2 backdrop-blur-[2px]">
              <Maximize2 className="w-5 h-5" />
              <span>Нажмите для увеличения</span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-1 gap-4 h-[350px] sm:h-[450px]">
            {photos.slice(1, 3).map((photo, index) => (
              <div
                key={index}
                onClick={() => setLightboxIndex(index + 1)}
                className="h-full rounded-2xl overflow-hidden border border-slate-200 shadow-sm relative group cursor-pointer"
              >
                <img src={photo} alt={`${property.title} - ${index + 2}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-slate-900/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-xs space-x-1 backdrop-blur-[2px]">
                  <Maximize2 className="w-4 h-4" />
                  <span>Увеличить</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Основная информация */}
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

          {/* Карточка бронирования */}
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
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-4 rounded-2xl transition-colors shadow-lg shadow-blue-500/25 flex items-center justify-center space-x-2 cursor-pointer"
              >
                <span>Забронировать онлайн</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ПОЛНОЭКРАННЫЙ ПРОСМОТР ФОТО (LIGHTBOX) */}
      {lightboxIndex !== null && (
        <div
          onClick={() => setLightboxIndex(null)}
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 select-none"
        >
          <button
            onClick={() => setLightboxIndex(null)}
            className="absolute top-5 right-5 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors z-10 cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="absolute top-6 left-6 text-white/80 font-bold text-sm bg-black/50 px-3 py-1.5 rounded-full border border-white/10">
            {lightboxIndex + 1} / {photos.length}
          </div>

          {photos.length > 1 && (
            <>
              <button
                onClick={prevPhoto}
                className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 text-white bg-white/10 hover:bg-white/25 p-3 rounded-full transition-colors z-10 cursor-pointer"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={nextPhoto}
                className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 text-white bg-white/10 hover:bg-white/25 p-3 rounded-full transition-colors z-10 cursor-pointer"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-5xl max-h-[85vh] flex items-center justify-center"
          >
            <img
              src={photos[lightboxIndex]}
              alt={`Фото ${lightboxIndex + 1}`}
              className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"
            />
          </div>
        </div>
      )}

      {/* Модалка бронирования */}
      {isBookingOpen && (
        <BookingModal
          property={property}
          onClose={() => setIsBookingOpen(false)}
        />
      )}
    </main>
  );
}