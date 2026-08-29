'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Header } from '@/components/Header';
import { 
  Calendar, MapPin, Phone, Star, MessageSquare, CheckCircle, 
  Clock, ArrowRight, Loader2, Sparkles, X, User, CornerDownRight
} from 'lucide-react';

export default function MyBookingsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Модалка отзыва
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Модалка отмены
  const [cancellingBooking, setCancellingBooking] = useState<any | null>(null);
  const [cancellingLoader, setCancellingLoader] = useState(false);

  const fetchBookings = async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/bookings/my?userId=${user.id || ''}&phone=${encodeURIComponent(user.phone || '')}`);
      const data = await res.json();
      if (res.ok) setBookings(data.bookings || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [user]);

  const handleSendReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking || !user) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: selectedBooking.property_id,
          userId: user.id,
          bookingId: selectedBooking.id,
          rating,
          comment,
        }),
      });

      if (res.ok) {
        setSuccessMsg('Спасибо за ваш отзыв! Уровень Рахата зафиксирован ☀️');
        setTimeout(() => {
          setSelectedBooking(null);
          setSuccessMsg('');
          setComment('');
          fetchBookings();
        }, 1500);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const confirmCancel = async (bookingId: string) => {
    setCancellingLoader(true);
    try {
      const res = await fetch('/api/bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, status: 'cancelled' }),
      });
      if (res.ok) {
        setCancellingBooking(null);
        fetchBookings();
      }
    } catch (e) {
      console.error('Ошибка отмены:', e);
    } finally {
      setCancellingLoader(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <span className="bg-emerald-100 text-emerald-800 text-[11px] font-black px-2.5 py-1 rounded-full flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Подтверждено</span>;
      case 'completed':
        return <span className="bg-blue-100 text-blue-800 text-[11px] font-black px-2.5 py-1 rounded-full">Завершено</span>;
      case 'cancelled':
        return <span className="bg-rose-100 text-rose-800 text-[11px] font-black px-2.5 py-1 rounded-full">Отменено</span>;
      default:
        return <span className="bg-amber-100 text-amber-800 text-[11px] font-black px-2.5 py-1 rounded-full flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Ожидает ответа</span>;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center max-w-sm w-full shadow-sm">
            <Calendar className="w-12 h-12 text-blue-600 mx-auto mb-3" />
            <h2 className="text-lg font-black text-slate-900 mb-2">История поездок</h2>
            <p className="text-xs text-slate-500 mb-6">Войдите в профиль, чтобы просматривать свои бронирования и оставлять отзывы</p>
            <Link href="/login" className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-3.5 rounded-2xl shadow-md transition-all">
              Войти на сайт
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Заголовок */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-2">
              Мои поездки и бронирования 🏖️
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Здесь сохраняются все ваши заявки, контакты хозяев и история отдыха в Избербаше
            </p>
          </div>
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-3.5 py-2 rounded-xl transition-colors">
            Найти ещё жильё <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Список бронирований */}
        {loading ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
            <p className="text-xs text-slate-400 mt-2">Загрузка поездок...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800 mb-1">У вас пока нет поездок</h3>
            <p className="text-xs text-slate-400 mb-6 max-w-sm mx-auto">
              Забронируйте уютный домик или коттедж на берегу Каспийского моря в Избербаше прямо сейчас!
            </p>
            <Link href="/" className="inline-flex bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-6 py-3 rounded-2xl shadow-sm transition-all">
              Выбрать жильё
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((b) => {
              const rawPhotos = b.property_photos || b.property_images || [];
              const photos = Array.isArray(rawPhotos) ? rawPhotos : [];
              const cover = photos[0] || 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800';

              return (
                <div key={b.id} className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 items-start sm:items-center justify-between">
                    
                    <div className="flex gap-4 items-center">
                      <img 
                        src={cover} 
                        alt={b.property_title} 
                        className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border border-slate-100 flex-shrink-0"
                      />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {getStatusBadge(b.status)}
                          <span className="text-[11px] text-slate-400">
                            №{b.id ? b.id.slice(0, 8) : ''}
                          </span>
                        </div>
                        <h3 className="font-bold text-slate-900 text-sm sm:text-base hover:text-blue-600 transition-colors">
                          <Link href={`/property/${b.property_id}`}>{b.property_title}</Link>
                        </h3>
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" /> {b.property_address || 'Избербаш, побережье'}
                        </p>
                        <p className="text-xs text-slate-600 font-medium">
                          Даты: <strong>{new Date(b.check_in).toLocaleDateString('ru-RU')}</strong> — <strong>{new Date(b.check_out).toLocaleDateString('ru-RU')}</strong>
                        </p>
                        {b.host_phone && (
                          <p className="text-xs text-blue-700 font-semibold flex items-center gap-1 pt-0.5">
                            <Phone className="w-3 h-3 text-blue-600" /> Связь с хозяином: {b.host_phone}
                          </p>
                        )}
                        {(b.status === 'confirmed' || b.status === 'new') && (
                          <button
                            type="button"
                            onClick={() => setCancellingBooking(b)}
                            className="text-[11px] text-rose-600 hover:text-rose-700 font-bold bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-xl transition-all cursor-pointer inline-flex items-center gap-1 mt-2 shadow-xs"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Отменить бронирование</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 flex sm:flex-col justify-between sm:items-end gap-2">
                      <div className="text-left sm:text-right">
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Итоговая сумма</span>
                        <span className="text-base sm:text-lg font-black text-slate-900">{Number(b.total_price || 0).toLocaleString('ru-RU')} ₽</span>
                      </div>

                      {/* Кнопка отзыва или статус оценки */}
                      {b.review_id ? (
                        <div className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl text-amber-900 text-xs font-bold shadow-xs">
                          <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                          <span>☀️ {Number(b.review_rating)} / 5 Рахата</span>
                        </div>
                      ) : b.status === 'no_show' || b.status === 'cancelled' ? (
                        <span className="inline-flex items-center text-[11px] font-bold text-rose-600 bg-rose-50 border border-rose-100 px-3 py-1.5 rounded-xl">
                          Поездка не состоялась
                        </span>
                      ) : b.status === 'checked_in' || b.status === 'completed' ? (
                        <button
                          type="button"
                          onClick={() => setSelectedBooking(b)}
                          className="inline-flex items-center gap-1.5 bg-amber-400 hover:bg-amber-500 text-slate-950 text-xs font-black px-4 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer hover:scale-105 active:scale-95"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Оценить отдых ☀️</span>
                        </button>
                      ) : (
                        <span className="inline-flex items-center text-[11px] font-semibold text-slate-500 bg-slate-100 border border-slate-200/60 px-3 py-1.5 rounded-xl">
                          Отзыв после заселения 🔑
                        </span>
                      )}
                    </div>

                  </div>

                  {/* Если уже оставлен отзыв — показываем его и ответ владельца */}
                  {b.review_id && (
                    <div className="pt-3 border-t border-slate-100 text-xs space-y-2">
                      {b.review_comment && (
                        <div className="bg-slate-50 p-3 rounded-2xl text-slate-700">
                          <p className="font-bold text-slate-800 text-[11px] mb-1">Ваш отзыв:</p>
                          <p className="italic">«{b.review_comment}»</p>
                        </div>
                      )}

                      {b.host_reply && (
                        <div className="bg-blue-50 border border-blue-100 p-3 rounded-2xl text-blue-900 flex items-start gap-2">
                          <CornerDownRight className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-bold text-[11px] text-blue-800">Ответ хозяина:</p>
                            <p className="text-xs text-blue-900 mt-0.5">«{b.host_reply}»</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* МОДАЛЬНОЕ ОКНО ОЦЕНКИ («РАХАТ-РЕЙТИНГ») */}
        {selectedBooking && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
              
              <button 
                type="button"
                onClick={() => setSelectedBooking(null)}
                className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Sparkles className="w-6 h-6 text-amber-600" />
                </div>
                <h3 className="text-lg font-black text-slate-900">Как прошёл ваш отдых?</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Объект: <strong>{selectedBooking.property_title}</strong>
                </p>
              </div>

              {successMsg ? (
                <div className="p-4 bg-emerald-50 text-emerald-800 rounded-2xl text-xs font-bold text-center">
                  {successMsg}
                </div>
              ) : (
                <form onSubmit={handleSendReview} className="space-y-5">
                  
                  {/* Выбор Рахатов */}
                  <div className="text-center">
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-2">
                      Уровень Рахата (Шкала комфорта) ☀️
                    </label>
                    <div className="flex justify-center gap-2">
                      {[1, 2, 3, 4, 5].map((val) => (
                        <button
                          type="button"
                          key={val}
                          onClick={() => setRating(val)}
                          className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col items-center gap-1 hover:scale-105 ${
                            rating >= val 
                              ? 'bg-amber-50 border-amber-300 text-amber-600 shadow-sm' 
                              : 'bg-slate-50 border-slate-200 text-slate-300'
                          }`}
                        >
                          <Star className={`w-6 h-6 ${rating >= val ? 'fill-amber-400 text-amber-500' : 'text-slate-300'}`} />
                          <span className="text-[10px] font-bold">{val}</span>
                        </button>
                      ))}
                    </div>
                    <div className="mt-3 p-2 bg-amber-50/80 rounded-xl border border-amber-200/50">
                      <p className="text-xs font-bold text-amber-900">
                        {rating === 5 && '☀️ 5 / 5 — Полный Рахат! Идеальный отдых'}
                        {rating === 4 && '🏖️ 4 / 5 — Приятный кайф! Всё отлично'}
                        {rating === 3 && '👍 3 / 5 — Нормально, но есть нюансы'}
                        {rating === 2 && '⚠️ 2 / 5 — Требует улучшений'}
                        {rating === 1 && '🌧️ 1 / 5 — Не понравилось'}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Ваш честный отзыв
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Расскажите о чистоте, море, домике и гостеприимстве хозяина..."
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-2xl p-3.5 font-medium text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-3.5 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Опубликовать отзыв ☀️</span>}
                  </button>
                </form>
              )}

            </div>
          </div>
        )}

        {/* МОДАЛЬНОЕ ОКНО ОТМЕНЫ БРОНИРОВАНИЯ */}
        {cancellingBooking && (() => {
          const checkInDate = new Date(cancellingBooking.check_in);
          checkInDate.setHours(14, 0, 0, 0);
          const isFreeCancel = checkInDate.getTime() - Date.now() > 72 * 60 * 60 * 1000;

          return (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative border border-slate-100 animate-in fade-in zoom-in-95 duration-200 space-y-4">
                
                <button 
                  type="button"
                  onClick={() => setCancellingBooking(null)}
                  className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="text-center">
                  <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <X className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-black text-slate-900">Отмена бронирования</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Объект: <strong>{cancellingBooking.property_title}</strong>
                  </p>
                </div>

                <div className="p-4 rounded-2xl border text-xs leading-relaxed space-y-2">
                  <p>Даты проживания: <strong>{new Date(cancellingBooking.check_in).toLocaleDateString('ru-RU')}</strong> — <strong>{new Date(cancellingBooking.check_out).toLocaleDateString('ru-RU')}</strong></p>
                  
                  {isFreeCancel ? (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl font-medium">
                      ☀️ <strong>Бесплатная отмена доступна!</strong> До заселения осталось более 3 суток. Аванс 5% будет возвращен на вашу банковскую карту в течение 1-3 рабочих дней.
                    </div>
                  ) : (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl font-medium">
                      ⚠️ <strong>Внимание!</strong> До заселения осталось менее 3 суток (72 часа). Согласно правилам оферты, внесенный аванс (5%) не подлежит возврату и удерживается в качестве компенсации.
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setCancellingBooking(null)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs py-3.5 rounded-xl transition-all cursor-pointer text-center"
                  >
                    Назад
                  </button>
                  <button
                    type="button"
                    disabled={cancellingLoader}
                    onClick={() => confirmCancel(cancellingBooking.id)}
                    className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs py-3.5 rounded-xl transition-all shadow-md shadow-rose-600/20 cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {cancellingLoader ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Подтвердить отмену</span>}
                  </button>
                </div>

              </div>
            </div>
          );
        })()}

      </div>
    </div>
  );
}