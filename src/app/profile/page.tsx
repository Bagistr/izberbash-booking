'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { 
  Waves, ArrowLeft, Building2, User, Phone, 
  Calendar, MapPin, Sparkles, ArrowRight, LogOut, ShieldCheck 
} from 'lucide-react';

interface BookingItem {
  id: string;
  property_title: string;
  check_in: string;
  check_out: string;
  total_price: number;
  status: string;
  guests_count: number;
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, login, logout } = useAuth();

  const [switching, setSwitching] = useState(false);
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);

  // Если не авторизован — отправляем на страницу входа
  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  // Загрузка бронирований туриста
  useEffect(() => {
    if (!user?.phone) return;

    async function loadBookings() {
      try {
        const res = await fetch(`/api/bookings/my?phone=${encodeURIComponent(user?.phone || '')}`);
        if (res.ok) {
          const data = await res.json();
          setBookings(data.bookings || []);
        }
      } catch (e) {
        console.error('Ошибка загрузки бронирований:', e);
      } finally {
        setLoadingBookings(false);
      }
    }

    loadBookings();
  }, [user]);

  // Переключение роли на Владельца
  const handleBecomeLandlord = async () => {
    if (!user?.phone) return;
    setSwitching(true);

    try {
      const res = await fetch('/api/auth/switch-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: user.phone, newRole: 'landlord' }),
      });

      if (res.ok) {
        // Обновляем роль в локальной сессии
        login({
          ...user,
          role: 'landlord',
        });
        // Мгновенно перенаправляем в панель управления жильем
        router.push('/dashboard');
      }
    } catch (err) {
      console.error('Ошибка смены роли:', err);
    } finally {
      setSwitching(false);
    }
  };

  if (!user) {
    return null;
  }

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

          <div className="flex items-center space-x-4">
            <Link href="/" className="inline-flex items-center text-xs font-bold text-slate-600 hover:text-slate-900">
              <ArrowLeft className="w-4 h-4 mr-1" /> В каталог
            </Link>
            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-xl transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 mr-1" /> Выйти
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 pt-8 space-y-6">
        {/* КАРТОЧКА: ПЕРЕКЛЮЧЕНИЕ НА ВЛАДЕЛЬЦА */}
        {user.role !== 'landlord' ? (
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg shadow-blue-600/10">
            <div className="space-y-1.5">
              <div className="inline-flex items-center space-x-1.5 bg-white/10 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Сдавайте жилье на Райском Пляже</span>
              </div>
              <h3 className="text-xl font-black tracking-tight">Хотите сдавать свой дом или номер?</h3>
              <p className="text-xs sm:text-sm text-blue-100 max-w-lg">
                Переключите аккаунт в режим владельца: ведите шахматку занятости, принимайте прямые заявки и зарабатывайте с минимальной комиссией 7%.
              </p>
            </div>

            <button
              type="button"
              onClick={handleBecomeLandlord}
              disabled={switching}
              className="bg-white hover:bg-blue-50 text-blue-700 font-bold text-xs px-5 py-3.5 rounded-2xl flex items-center space-x-2 transition-all shadow-md flex-shrink-0 cursor-pointer"
            >
              <Building2 className="w-4 h-4" />
              <span>{switching ? 'Переключение...' : 'Стать владельцем'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 flex items-center justify-between shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Вы являетесь владельцем жилья</h3>
                <p className="text-xs text-slate-500">Управляйте шахматкой, ценами и объектами в личном кабинете</p>
              </div>
            </div>
            <Link
              href="/dashboard"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all"
            >
              В кабинет владельца
            </Link>
          </div>
        )}

        {/* ДАННЫЕ ПРОФИЛЯ */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <h2 className="text-lg font-black text-slate-900">Данные аккаунта</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="p-2.5 bg-white text-slate-700 rounded-xl shadow-sm">
                <User className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase">Имя</p>
                <p className="text-sm font-bold text-slate-900">{user.name || 'Не указано'}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="p-2.5 bg-white text-slate-700 rounded-xl shadow-sm">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase">Телефон</p>
                <p className="text-sm font-bold text-slate-900">{user.phone}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ИСТОРИЯ ПОЕЗДОК И БРОНЕЙ */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-900">Мои бронирования</h2>
            <span className="text-xs font-bold text-slate-400">{bookings.length} поездок</span>
          </div>

          {loadingBookings ? (
            <p className="text-xs text-slate-400 py-4 animate-pulse">Загрузка бронирований...</p>
          ) : bookings.length === 0 ? (
            <div className="text-center py-10 space-y-3">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl w-fit mx-auto">
                <Calendar className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-800">У вас пока нет активных бронирований</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Выберите подходящий коттедж или номер на берегу моря в нашем каталоге.
              </p>
              <Link
                href="/"
                className="inline-block bg-blue-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-all shadow-md shadow-blue-500/20"
              >
                Выбрать жилье
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {bookings.map((b) => (
                <div
                  key={b.id}
                  className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-900">{b.property_title}</h4>
                    <div className="flex items-center text-xs text-slate-500 space-x-3">
                      <span>Заезд: {new Date(b.check_in).toLocaleDateString('ru-RU')}</span>
                      <span>•</span>
                      <span>Выезд: {new Date(b.check_out).toLocaleDateString('ru-RU')}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end space-x-4">
                    <span className="text-sm font-black text-slate-900">
                      {Number(b.total_price).toLocaleString('ru-RU')} ₽
                    </span>
                    <span className="text-[11px] font-bold px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-lg">
                      Подтверждено
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}