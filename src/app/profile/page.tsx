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
  const { user, login, logout, switchRole } = useAuth();

  const [switching, setSwitching] = useState(false);
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);

  // Привязка телефона к Telegram-аккаунту
  const [linkPhoneInput, setLinkPhoneInput] = useState('');
  const [linkingPhone, setLinkingPhone] = useState(false);
  const [linkMsg, setLinkMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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

  // Переключение роли
  const handleToggleRole = async (targetRole: 'guest' | 'landlord') => {
    setSwitching(true);
    try {
      await switchRole(targetRole);
      if (targetRole === 'landlord') {
        router.push('/dashboard');
      }
    } catch (err) {
      console.error('Ошибка смены роли:', err);
    } finally {
      setSwitching(false);
    }
  };

  // Привязка телефона
  const handleLinkPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !linkPhoneInput) return;
    setLinkingPhone(true);
    setLinkMsg(null);

    try {
      const res = await fetch('/api/auth/link-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, phone: linkPhoneInput }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка привязки');

      login(data.user);
      setLinkMsg({ type: 'success', text: 'Номер телефона успешно объединен с аккаунтом!' });
      setLinkPhoneInput('');
    } catch (err: any) {
      setLinkMsg({ type: 'error', text: err.message || 'Ошибка объединения' });
    } finally {
      setLinkingPhone(false);
    }
  };

  if (!user) {
    return null;
  }

  const isTgOnly = user.phone && user.phone.startsWith('tg_');

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

        {/* БАННЕР ПРИВЯЗКИ ТЕЛЕФОНА (если вход был через Telegram) */}
        {isTgOnly && (
          <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 shadow-sm space-y-3">
            <div className="flex items-center space-x-2 text-amber-900">
              <Phone className="w-5 h-5 text-amber-600" />
              <h3 className="font-bold text-sm">Синхронизация с номером телефона</h3>
            </div>
            <p className="text-xs text-amber-800">
              Вы вошли через Telegram. Привяжите ваш номер телефона, чтобы объединить все бронирования и объекты в один аккаунт.
            </p>
            {linkMsg && (
              <div className={`p-3 rounded-xl text-xs font-bold ${linkMsg.type === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                {linkMsg.text}
              </div>
            )}
            <form onSubmit={handleLinkPhone} className="flex flex-col sm:flex-row gap-2 max-w-md">
              <input
                type="tel"
                required
                placeholder="+7 (999) 000-00-00"
                value={linkPhoneInput}
                onChange={(e) => setLinkPhoneInput(e.target.value)}
                className="text-xs bg-white border border-amber-300 rounded-xl px-3.5 py-2.5 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <button
                type="submit"
                disabled={linkingPhone}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer whitespace-nowrap"
              >
                {linkingPhone ? 'Объединение...' : 'Объединить аккаунт'}
              </button>
            </form>
          </div>
        )}

        {/* КАРТОЧКА: ПЕРЕКЛЮЧЕНИЕ РОЛЕЙ */}
        {user.role !== 'landlord' ? (
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg shadow-blue-600/10">
            <div className="space-y-1.5">
              <div className="inline-flex items-center space-x-1.5 bg-white/10 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Сдавайте жилье на Райском Пляже</span>
              </div>
              <h3 className="text-xl font-black tracking-tight">
                {user.is_landlord ? 'Режим туриста активен' : 'Хотите сдавать свой дом или номер?'}
              </h3>
              <p className="text-xs sm:text-sm text-blue-100 max-w-lg">
                {user.is_landlord
                  ? 'Вы можете в любой момент вернуться в панель управления объектами и шахматкой занятости.'
                  : 'Переключите аккаунт в режим владельца: ведите шахматку занятости, принимайте заявки и зарабатывайте.'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleToggleRole('landlord')}
              disabled={switching}
              className="bg-white hover:bg-blue-50 text-blue-700 font-bold text-xs px-5 py-3.5 rounded-2xl flex items-center space-x-2 transition-all shadow-md flex-shrink-0 cursor-pointer"
            >
              <Building2 className="w-4 h-4" />
              <span>{switching ? 'Переключение...' : user.is_landlord ? 'В кабинет владельца 🔑' : 'Стать владельцем'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Вы в режиме Владельца</h3>
                <p className="text-xs text-slate-500">Управляйте шахматкой, ценами и бронированиями</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleToggleRole('guest')}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer"
              >
                Режим гостя 🏖️
              </button>
              <Link
                href="/dashboard"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm"
              >
                В кабинет 🔑
              </Link>
            </div>
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
            <div>
              <h2 className="text-lg font-black text-slate-900">Мои поездки и бронирования</h2>
              <p className="text-xs text-slate-500">Управляйте вашими поездками и оценивайте уровень комфорта</p>
            </div>
            <Link
              href="/my-bookings"
              className="inline-flex items-center space-x-1 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-xl transition-colors"
            >
              <span>Все поездки ({bookings.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
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
              {bookings.slice(0, 3).map((b) => (
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
                    <Link
                      href="/my-bookings"
                      className="text-xs font-bold px-3 py-1.5 bg-amber-400 hover:bg-amber-500 text-slate-950 rounded-xl transition-all shadow-xs"
                    >
                      Оценить отдых ☀️
                    </Link>
                  </div>
                </div>
              ))}

              {bookings.length > 3 && (
                <div className="text-center pt-2">
                  <Link
                    href="/my-bookings"
                    className="text-xs font-bold text-blue-600 hover:underline"
                  >
                    Посмотреть все {bookings.length} поездок →
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}