'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { 
  Calendar, MapPin, Phone, Star, MessageSquare, CheckCircle, 
  Clock, ArrowRight, Loader2, Sparkles, X 
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

  const fetchBookings = async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/bookings/my?userId=${user.id}&phone=${encodeURIComponent(user.phone || '')}`);
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
          fetchBookings();
        }, 1500);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
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
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center max-w-sm w-full shadow-sm">
          <Calendar className="w-12 h-12 text-blue-600 mx-auto mb-3" />
          <h2 className="text-lg font-black text-slate-900 mb-2">История поездок</h2>
          <p className="text-xs text-slate-500 mb-6">Войдите в профиль, чтобы просматривать свои бронирования и оставлять отзывы</p>
          <Link href="/login" className="block w-full bg-blue-600 text-white font-bold text-xs py-3.5 rounded-2xl shadow-md">
            Войти на сайт
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Заголовок */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              Мои поездки и бронирования 🏖️
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Здесь сохраняются все ваши заявки, контакты хозяев и история отдыха на Каспии
            </p>
          </div>
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700">
            Найти ещё домик <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Список бронирований */}
        {loading ? (
          <div className="text-center py-20">
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
            <Link href="/" className="inline-flex bg-slate-900 text-white text-xs font-bold px-6 py-3 rounded-2xl shadow-sm">
              Выбрать жильё
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((b) => {
              const images = Array.isArray(b.property_images) ? b.property_images : [];
              const cover = images[0] || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800';

              return (
                <div key={b.id} className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row gap-5 items-start md:items-center justify-between">
                  
                  <div className="flex gap-4 items-center">
                    <img 
                      src={cover} 
                      alt={b.property_title} 
                      className="w-24 h-24 rounded-2xl object-cover border border-slate-100 flex-shrink-0"
                    />
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(b.status)}
                        <span className="text-[11px] text-slate-400">
                          №{b.id.slice(0, 8)}
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-900 text-sm hover:text-blue-600 transition-colors">
                        <Link href={`/property/${b.property_id}`}>{b.property_title}</Link>
                      </h3>
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" /> {b.property_location || 'Избербаш, Приморский'}
                      </p>
                      <p className="text-xs text-slate-600 font-medium">
                        Даты: <strong>{new Date(b.check_in).toLocaleDateString('ru-RU')}</strong> — <strong>{new Date(b.check_out).toLocaleDateString('ru-RU')}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="w-full md:w-auto border-t md:border-t-0 pt-3 md:pt-0 flex md:flex-col justify-between md:items-end gap-2">
                    <div className="text-left md:text-right">
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Итоговая сумма</span>
                      <span className="text-base font-black text-slate-900">{Number(b.total_price || 0).toLocaleString('ru-RU')} ₽</span>
                    </div>

                    {/* Кнопка отзыва или статус оценки */}
                    {b.review_id ? (
                      <div className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl text-amber-800 text-xs font-bold">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                        <span>Ваша оценка: {b.review_rating} Рахата</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => setSelectedBooking(b)}
                        className="inline-flex items-center gap-1.5 bg-amber-400 hover:bg-amber-500 text-slate-950 text-xs font-bold px-4 py-2 rounded-xl shadow-sm transition-all cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Оценить отдых</span>
                      </button>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}

        {/* МОДАЛЬНОЕ ОКНО ОЦЕНКИ («РАХАТ-РЕЙТИНГ») */}
        {selectedBooking && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative border border-slate-100">
              
              <button 
                onClick={() => setSelectedBooking(null)}
                className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
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
                      Уровень Рахата (Шкала комфорта)
                    </label>
                    <div className="flex justify-center gap-2">
                      {[1, 2, 3, 4, 5].map((val) => (
                        <button
                          type="button"
                          key={val}
                          onClick={() => setRating(val)}
                          className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col items-center gap-1 ${
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
                    <p className="text-xs font-bold text-amber-700 mt-2">
                      {rating === 5 && '☀️ 5 / 5 — Полный рахат и кайф!'}
                      {rating === 4 && '🏖️ 4 / 5 — Отличный приятный отдых'}
                      {rating === 3 && '👍 3 / 5 — Нормально, есть нюансы'}
                      {rating <= 2 && '⚠️ Требует улучшений'}
                    </p>
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
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Опубликовать отзыв</span>}
                  </button>
                </form>
              )}

            </div>
          </div>
        )}

      </div>
    </div>
  );
}