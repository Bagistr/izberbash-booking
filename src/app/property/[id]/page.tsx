'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Property } from '@/types/property';
import { BookingModal } from '@/components/BookingModal';
import { useFavorites } from '@/context/FavoritesContext';
import { useAuth } from '@/context/AuthContext';
import {
  Waves, ArrowLeft, MapPin, Users, Check, ShieldCheck,
  X, ChevronLeft, ChevronRight, Share2, Heart, Star, Grid
} from 'lucide-react';

export default function PropertyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const { user } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Полноэкранная галерея (Lightbox)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!id) return;

    async function loadProperty() {
      try {
        const res = await fetch('/api/properties');
        if (res.ok) {
          const list: Property[] = await res.json();
          const found = list.find((p) => String(p.id) === String(id));
          setProperty(found || null);
        }
      } catch (err) {
        console.error('Ошибка загрузки объекта:', err);
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
        <p className="text-sm text-slate-500 mb-4">Возможно, объявление было удалено.</p>
        <Link href="/" className="bg-blue-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl">
          Вернуться в каталог
        </Link>
      </div>
    );
  }

  const rawPhotos = property.photos || [];
  const photos = rawPhotos.length > 0
    ? rawPhotos
    : ['https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1000&q=80'];

  const isFav = isFavorite(property.id);

  const handleHeartClick = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    await toggleFavorite(property.id);
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

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

      <div className="max-w-6xl mx-auto px-4 pt-6">
        {/* Заголовок, действия и инфо-строка */}
        <div className="space-y-2 mb-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {property.title}
            </h1>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleShare}
                className="inline-flex items-center space-x-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 shadow-sm transition-all cursor-pointer"
              >
                <Share2 className="w-4 h-4 text-slate-500" />
                <span>{copied ? 'Ссылка скопирована!' : 'Поделиться'}</span>
              </button>

              <button
                type="button"
                onClick={handleHeartClick}
                className={`inline-flex items-center space-x-1.5 text-xs font-bold px-3 py-2 rounded-xl border transition-all shadow-sm cursor-pointer ${
                  isFav
                    ? 'bg-rose-50 border-rose-200 text-rose-600'
                    : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                }`}
              >
                <Heart className={`w-4 h-4 ${isFav ? 'fill-rose-500 text-rose-500' : 'text-slate-500'}`} />
                <span>{isFav ? 'В избранном' : 'В избранное'}</span>
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center text-xs sm:text-sm text-slate-600 font-medium gap-y-1">
            <div className="flex items-center text-slate-900 font-bold mr-2">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500 mr-1" />
              <span>4.95</span>
              <span className="text-slate-500 font-normal ml-1">(18 отзывов)</span>
            </div>
            <span className="mx-2 text-slate-300 hidden sm:inline">•</span>
            <div className="flex items-center">
              <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" />
              <span>{property.address}</span>
            </div>
            <span className="mx-2 text-slate-300">•</span>
            <span className="font-semibold text-blue-600">{property.distance_to_sea}м до моря</span>
          </div>
        </div>

        {/* АДАПТИВНАЯ ГАЛЕРЕЯ */}
        <div className="mb-10 rounded-3xl overflow-hidden shadow-sm border border-slate-200/80 bg-slate-100 h-[320px] sm:h-[420px]">
          {photos.length === 1 ? (
            /* Вариант 1: Только 1 фото на всю ширину */
            <div
              onClick={() => setLightboxIndex(0)}
              className="relative w-full h-full cursor-pointer group overflow-hidden"
            >
              <img
                src={photos[0]}
                alt={property.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
          ) : photos.length === 2 ? (
            /* Вариант 2: Ровно 2 фото (50% / 50%) */
            <div className="grid grid-cols-2 gap-2 h-full">
              <div
                onClick={() => setLightboxIndex(0)}
                className="relative h-full cursor-pointer group overflow-hidden"
              >
                <img
                  src={photos[0]}
                  alt={`${property.title} 1`}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div
                onClick={() => setLightboxIndex(1)}
                className="relative h-full cursor-pointer group overflow-hidden"
              >
                <img
                  src={photos[1]}
                  alt={`${property.title} 2`}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
            </div>
          ) : (
            /* Вариант 3: 3 и более фото (Главное 50% + Справа 2 горизонтальных с кнопкой) */
            <div className="grid grid-cols-1 md:grid-cols-12 gap-2 h-full">
              {/* Главное фото слева (50% ширины) */}
              <div
                onClick={() => setLightboxIndex(0)}
                className="md:col-span-6 relative h-full cursor-pointer group overflow-hidden bg-slate-200"
              >
                <img
                  src={photos[0]}
                  alt={`${property.title} - Главное`}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>

              {/* Правая колонка: 2 фото по 50% высоты каждое */}
              <div className="hidden md:grid md:col-span-6 grid-rows-2 gap-2 h-full">
                {/* Фото 2 */}
                <div
                  onClick={() => setLightboxIndex(1)}
                  className="relative h-full cursor-pointer group overflow-hidden bg-slate-200"
                >
                  <img
                    src={photos[1]}
                    alt={`${property.title} - Фото 2`}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>

                {/* Фото 3 с плашкой "Все фото" */}
                <div
                  onClick={() => setLightboxIndex(2)}
                  className="relative h-full cursor-pointer group overflow-hidden bg-slate-200"
                >
                  <img
                    src={photos[2]}
                    alt={`${property.title} - Фото 3`}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/15 group-hover:bg-black/25 transition-colors" />

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLightboxIndex(0);
                    }}
                    className="absolute bottom-3 right-3 bg-white/95 hover:bg-white text-slate-900 text-xs font-bold px-3.5 py-2 rounded-xl shadow-lg border border-slate-200 flex items-center space-x-1.5 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    <Grid className="w-3.5 h-3.5 text-slate-700" />
                    <span>Все {photos.length} фото</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* НИЖНЯЯ ЧАСТЬ (Описание, Удобства, Карточка бронирования) */}
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
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-4 rounded-2xl transition-colors shadow-lg shadow-blue-500/25 flex items-center justify-center space-x-2 cursor-pointer"
              >
                <span>Забронировать онлайн</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Полноэкранный просмотр фото */}
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

      {isBookingOpen && (
        <BookingModal
          property={property}
          onClose={() => setIsBookingOpen(false)}
        />
      )}
    </main>
  );
}