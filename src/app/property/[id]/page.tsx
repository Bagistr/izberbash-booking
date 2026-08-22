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

  // Отзывы и Уровень Рахата
  const [reviews, setReviews] = useState<any[]>([]);
  const [avgRating, setAvgRating] = useState<number>(5.0);
  const [reviewsTotal, setReviewsTotal] = useState<number>(0);

  // Полноэкранная галерея (Lightbox) и карусель
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const prevPhoto = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (lightboxIndex !== null) {
      setLightboxIndex(lightboxIndex === 0 ? photos.length - 1 : lightboxIndex - 1);
    } else {
      setCurrentPhotoIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
    }
  };

  const nextPhoto = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (lightboxIndex !== null) {
      setLightboxIndex(lightboxIndex === photos.length - 1 ? 0 : lightboxIndex + 1);
    } else {
      setCurrentPhotoIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (diff > 40) nextPhoto();
    else if (diff < -40) prevPhoto();
    setTouchStartX(null);
  };

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

        // Загрузка реальных отзывов
        const resRev = await fetch(`/api/reviews?propertyId=${id}`);
        if (resRev.ok) {
          const rData = await resRev.json();
          setReviews(rData.reviews || []);
          setAvgRating(rData.avgRating ? Number(rData.avgRating) : 5.0);
          setReviewsTotal(rData.total || 0);
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

  return (
    <main className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-16">
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
            {reviewsTotal > 0 ? (
              <div className="flex items-center text-slate-900 font-bold mr-2">
                <span className="text-amber-500 mr-1 text-sm">☀️</span>
                <span>{avgRating.toFixed(1)} Рахата</span>
                <span className="text-slate-500 font-normal ml-1">
                  ({reviewsTotal} {reviewsTotal === 1 ? 'отзыв' : reviewsTotal < 5 ? 'отзыва' : 'отзывов'})
                </span>
              </div>
            ) : (
              <div className="flex items-center text-blue-800 bg-blue-50 border border-blue-200/80 px-2.5 py-0.5 rounded-lg font-bold text-xs mr-2">
                <span className="mr-1">☀️</span>
                <span>Ожидает первых гостей</span>
              </div>
            )}
            <span className="mx-2 text-slate-300 hidden sm:inline">•</span>
            <div className="flex items-center">
              <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" />
              <span>{property.address}</span>
            </div>
            <span className="mx-2 text-slate-300">•</span>
            <span className="font-semibold text-blue-600">{property.distance_to_sea}м до моря</span>
          </div>
        </div>

        {/* 16:9 СТАНДАРТИЗИРОВАННАЯ КАРУСЕЛЬ С ЛЕНТОЙ МИНИАТЮР */}
        <div className="mb-10 space-y-3">
          <div
            className="relative aspect-video w-full rounded-3xl overflow-hidden shadow-lg border border-slate-200/80 bg-slate-950 select-none group"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <img
              src={photos[currentPhotoIndex]}
              alt={`${property.title} - фото ${currentPhotoIndex + 1}`}
              onClick={() => setLightboxIndex(currentPhotoIndex)}
              className="w-full h-full object-cover cursor-pointer transition-transform duration-500 group-hover:scale-102"
            />

            {/* Бейдж счетчика фото */}
            <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md text-white text-xs font-bold px-3.5 py-1.5 rounded-full border border-white/10 z-10">
              {currentPhotoIndex + 1} / {photos.length}
            </div>

            {/* Стрелки перелистывания */}
            {photos.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={prevPhoto}
                  className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-slate-800 p-2.5 sm:p-3 rounded-full shadow-lg transition-all hover:scale-110 active:scale-95 z-10 cursor-pointer"
                >
                  <ChevronLeft className="w-5 h-5 text-slate-800" />
                </button>
                <button
                  type="button"
                  onClick={nextPhoto}
                  className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-slate-800 p-2.5 sm:p-3 rounded-full shadow-lg transition-all hover:scale-110 active:scale-95 z-10 cursor-pointer"
                >
                  <ChevronRight className="w-5 h-5 text-slate-800" />
                </button>

                {/* Точки-индикаторы */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-1.5 z-10 bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full">
                  {photos.map((_, idx) => (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => setCurrentPhotoIndex(idx)}
                      className={`h-1.5 rounded-full transition-all cursor-pointer ${
                        idx === currentPhotoIndex ? 'bg-white w-4' : 'bg-white/50 w-1.5 hover:bg-white/80'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}

            {/* Кнопка "Смотреть все N фото" */}
            <button
              type="button"
              onClick={() => setLightboxIndex(currentPhotoIndex)}
              className="absolute bottom-4 right-4 bg-white/95 hover:bg-white text-slate-900 text-xs font-bold px-4 py-2.5 rounded-2xl shadow-xl border border-slate-200/80 flex items-center space-x-2 transition-all hover:scale-105 active:scale-95 cursor-pointer z-10"
            >
              <Grid className="w-4 h-4 text-blue-600" />
              <span>Все {photos.length} фото</span>
            </button>
          </div>

          {/* Миниатюры (лента предпросмотра) */}
          {photos.length > 1 && (
            <div className="flex space-x-2.5 overflow-x-auto pb-2 scrollbar-none">
              {photos.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentPhotoIndex(idx)}
                  className={`relative w-20 h-14 sm:w-24 sm:h-16 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all cursor-pointer ${
                    idx === currentPhotoIndex
                      ? 'border-blue-600 ring-2 ring-blue-500/30 scale-102'
                      : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={p} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* НИЖНЯЯ ЧАСТЬ (Описание, Удобства, Отзывы, Карточка бронирования) */}
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

            {/* ПРАВИЛА ЗАСЕЛЕНИЯ И ПРОЖИВАНИЯ */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-blue-600" />
                  <span>Правила заселения и проживания</span>
                </h2>
                <Link
                  href="/rules"
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Все правила →
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 bg-blue-50/60 rounded-2xl border border-blue-100 flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                    14:00
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Заезд с 14:00</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Хозяин подготовит домик к вашему приезду</p>
                  </div>
                </div>

                <div className="p-3.5 bg-amber-50/60 rounded-2xl border border-amber-100 flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                    12:00
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Выезд до 12:00</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Время для уборки перед следующими гостями</p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-600 space-y-1.5">
                <p>• <strong>Бесплатная отмена:</strong> за 3 дня до даты заезда (аванс 5% возвращается полностью).</p>
                <p>• <strong>Режим тишины:</strong> с 23:00 до 08:00 (уважаем отдых семей и соседей).</p>
                <p>• <strong>Курение:</strong> разрешено только в отведенных зонах на свежем воздухе.</p>
              </div>
            </div>

            {/* БЛОК ОТЗЫВОВ И УРОВЕНЬ РАХАТА ☀️ */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <span>Отзывы гостей и Уровень Рахата</span>
                    <span>☀️</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Честные отзывы от туристов, подтвердивших проживание через сервис
                  </p>
                </div>

                {reviewsTotal > 0 ? (
                  <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 px-3.5 py-1.5 rounded-2xl">
                    <span className="text-xl font-black text-amber-900">{avgRating.toFixed(1)}</span>
                    <div className="text-[10px] leading-tight text-amber-800 font-bold">
                      <p>из 5.0 Рахата</p>
                      <p className="text-slate-400 font-normal">{reviewsTotal} {reviewsTotal === 1 ? 'отзыв' : reviewsTotal < 5 ? 'отзыва' : 'отзывов'}</p>
                    </div>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-200 px-3.5 py-2 rounded-2xl text-blue-800 text-xs font-bold">
                    <span>☀️</span>
                    <span>Ожидает первых гостей</span>
                  </div>
                )}
              </div>

              {/* Список отзывов */}
              {reviews.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-6 space-y-3">
                  <span className="text-3xl">🏖️</span>
                  <p className="text-sm font-bold text-slate-800">Этот объект пока не имеет отзывов</p>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Будьте первыми, кто проведёт здесь незабываемый отдых на Каспийском побережье! После завершения поездки вы сможете выставить оценку «Уровень Рахата» в разделе «Мои поездки».
                  </p>
                  <div>
                    <button
                      type="button"
                      onClick={() => setIsBookingOpen(true)}
                      className="inline-flex items-center space-x-1.5 bg-amber-400 hover:bg-amber-500 text-slate-950 text-xs font-black px-4 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer hover:scale-105 active:scale-95"
                    >
                      <span>Станьте первым, кто оценит ☀️</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((rev) => (
                    <div key={rev.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-bold text-xs flex items-center justify-center">
                            {(rev.author_name || 'Г')[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900">{rev.author_name || 'Гость сервиса'}</p>
                            <p className="text-[10px] text-slate-400">
                              {rev.created_at ? new Date(rev.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Недавно'}
                            </p>
                          </div>
                        </div>

                        <div className="inline-flex items-center gap-1 bg-amber-100/70 border border-amber-200 text-amber-900 px-2.5 py-1 rounded-xl text-xs font-bold">
                          <span>☀️</span>
                          <span>{Number(rev.rating)} / 5</span>
                        </div>
                      </div>

                      <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                        {rev.comment}
                      </p>

                      {/* Ответ хозяина жилья */}
                      {rev.host_reply && (
                        <div className="bg-blue-50 border border-blue-100 p-3.5 rounded-xl text-xs text-blue-950 space-y-1">
                          <p className="font-bold text-blue-800 text-[11px] flex items-center gap-1">
                            <span>Ответ владельца</span>
                            <ShieldCheck className="w-3 h-3 text-blue-600 inline" />
                          </p>
                          <p className="text-blue-900 italic">«{rev.host_reply}»</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
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