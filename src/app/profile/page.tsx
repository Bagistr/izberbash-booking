'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Waves, LogOut, Calendar, MapPin, Phone, Heart, Compass, User, ArrowLeft } from 'lucide-react';
import { PropertyCard } from '@/components/PropertyCard';
import { Property } from '@/types/property';
import { useFavorites } from '@/context/FavoritesContext';

interface BookingRecord {
  id: string;
  property_title: string;
  address: string;
  landlord_phone: string;
  check_in: string;
  check_out: string;
  total_days: number;
  total_price: number;
  status: string;
}

export default function GuestProfilePage() {
  const router = useRouter();
  const { favorites } = useFavorites();
  const [user, setUser] = useState<{ id?: string; name: string; phone: string; role: string } | null>(null);
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [favoriteProperties, setFavoriteProperties] = useState<Property[]>([]);
  const [activeTab, setActiveTab] = useState<'bookings' | 'favorites'>('bookings');
  const [loading, setLoading] = useState(true);

  const { user, logout, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.push('/login');
      return;
    }

    if (user.role === 'landlord') {
      router.push('/dashboard');
      return;
    }

    loadProfileData();
  }, [user, isLoading, router, favorites]);

    const parsed = JSON.parse(stored);
    setUser(parsed);

    // Загружаем бронирования и объекты
    async function loadProfileData() {
      try {
        const [propsRes, bookingsRes] = await Promise.all([
          fetch('/api/properties'),
          fetch(`/api/guest/bookings?phone=${encodeURIComponent(parsed.phone)}`),
        ]);

        if (propsRes.ok) {
          const allProps: Property[] = await propsRes.json();
          setFavoriteProperties(allProps.filter((p) => favorites.includes(p.id)));
        }

        if (bookingsRes.ok) {
          const data = await bookingsRes.json();
          setBookings(data || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }

    loadProfileData();
  }, [router, favorites]);

  const handleLogout = () => {
    localStorage.removeItem('rp_user');
    localStorage.removeItem('landlord_user');
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-sm font-semibold text-slate-500 animate-pulse">Загрузка профиля...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 pb-16">
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

          <div className="flex items-center space-x-3">
            <Link href="/" className="text-xs font-bold text-slate-600 hover:text-blue-600 mr-2">
              В каталог
            </Link>
            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-red-600 rounded-xl hover:bg-slate-100 transition-colors"
              title="Выйти"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 pt-8 space-y-6">
        {/* Карточка пользователя */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-xl">
              {user?.name?.[0] || 'Т'}
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900">{user?.name}</h1>
              <p className="text-xs text-slate-500">{user?.phone} • Аккаунт туриста</p>
            </div>
          </div>

          <div className="flex space-x-2 bg-slate-100 p-1 rounded-2xl">
            <button
              onClick={() => setActiveTab('bookings')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center space-x-1.5 ${
                activeTab === 'bookings' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Мои поездки ({bookings.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('favorites')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center space-x-1.5 ${
                activeTab === 'favorites' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-600'
              }`}
            >
              <Heart className="w-3.5 h-3.5" />
              <span>Избранное ({favoriteProperties.length})</span>
            </button>
          </div>
        </div>

        {/* ТАБ 1: МОИ ПОЕЗДКИ */}
        {activeTab === 'bookings' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900">История бронирований</h2>

            {bookings.length === 0 ? (
              <div className="bg-white p-12 text-center rounded-3xl border border-slate-200 space-y-3">
                <Compass className="w-12 h-12 text-slate-300 mx-auto" />
                <p className="text-slate-700 font-bold text-sm">У вас пока нет активных бронирований</p>
                <p className="text-xs text-slate-400">Выберите подходящий домик в каталоге и забронируйте онлайн.</p>
                <Link
                  href="/"
                  className="inline-block bg-blue-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-colors"
                >
                  Перейти к выбору жилья
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {bookings.map((b) => (
                  <div key={b.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-bold text-slate-900 text-base">{b.property_title}</h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                          Подтверждено
                        </span>
                      </div>
                      <div className="flex items-center text-xs text-slate-500">
                        <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" />
                        <span>{b.address}</span>
                      </div>
                      <div className="flex items-center text-xs text-slate-700 pt-1">
                        <Calendar className="w-3.5 h-3.5 mr-1 text-blue-600" />
                        <span>Даты: <strong>с {b.check_in.slice(0, 10)} по {b.check_out.slice(0, 10)}</strong> ({b.total_days} н.)</span>
                      </div>
                    </div>

                    <div className="flex flex-col md:items-end justify-between border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                      <div>
                        <span className="text-xs text-slate-400 block md:text-right">Стоимость</span>
                        <span className="text-lg font-black text-blue-600">{Number(b.total_price).toLocaleString('ru-RU')} ₽</span>
                      </div>
                      <div className="flex items-center text-xs font-semibold text-slate-600 mt-2">
                        <Phone className="w-3.5 h-3.5 mr-1 text-blue-600" />
                        <span>Хозяин: <strong>{b.landlord_phone}</strong></span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ТАБ 2: ИЗБРАННОЕ */}
        {activeTab === 'favorites' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Сохраненные варианты</h2>

            {favoriteProperties.length === 0 ? (
              <div className="bg-white p-12 text-center rounded-3xl border border-slate-200 space-y-3">
                <Heart className="w-12 h-12 text-slate-300 mx-auto" />
                <p className="text-slate-700 font-bold text-sm">В избранном пока пусто</p>
                <p className="text-xs text-slate-400">Нажимайте на сердечко в каталоге, чтобы сохранить жилье сюда.</p>
                <Link
                  href="/"
                  className="inline-block bg-blue-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-colors"
                >
                  Смотреть каталог
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {favoriteProperties.map((property) => (
                  <PropertyCard key={property.id} property={property} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}