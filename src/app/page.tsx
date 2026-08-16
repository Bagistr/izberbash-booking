'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Property } from '@/types/property';
import { useAuth } from '@/context/AuthContext';
import { useFavorites } from '@/context/FavoritesContext';
import {
  Waves, Search, MapPin, Users, Heart, Star,
  SlidersHorizontal, Sparkles, Building, User, LogIn
} from 'lucide-react';

export default function HomePage() {
  const { user } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();

  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  // Фильтры
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'house' | 'room'>('all');
  const [maxDistance, setMaxDistance] = useState<number>(1000);
  const [guestsCount, setGuestsCount] = useState<number>(1);

  useEffect(() => {
    async function loadProperties() {
      try {
        const res = await fetch('/api/properties');
        if (res.ok) {
          const data: Property[] = await res.json();
          setProperties(data);
        }
      } catch (err) {
        console.error('Ошибка загрузки объектов:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProperties();
  }, []);

  // Фильтрация каталога
  const filteredProperties = properties.filter((p) => {
    // 1. Только опубликованные объекты
    if (p.is_active === false) return false;

    // 2. Поиск по названию или адресу
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.address.toLowerCase().includes(searchQuery.toLowerCase());

    // 3. По типу жилья
    const matchesType = selectedType === 'all' || p.property_type === selectedType;

    // 4. По расстоянию до моря
    const matchesDistance = Number(p.distance_to_sea) <= maxDistance;

    // 5. По количеству гостей
    const matchesGuests = Number(p.max_guests) >= guestsCount;

    return matchesSearch && matchesType && matchesDistance && matchesGuests;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between text-slate-900">
      {/* 1. ШАПКА САЙТА */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2.5">
            <div className="bg-blue-600 p-2.5 rounded-2xl text-white shadow-md shadow-blue-500/20">
              <Waves className="w-6 h-6" />
            </div>
            <span className="font-black text-2xl tracking-tight text-slate-900">
              Райский<span className="text-blue-600">Пляж</span>
            </span>
          </Link>

          <div className="flex items-center space-x-3">
            {user ? (
              <div className="flex items-center space-x-2">
                {user.role === 'landlord' ? (
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center space-x-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs px-4 py-2.5 rounded-xl border border-blue-200 transition-all"
                  >
                    <Building className="w-4 h-4" />
                    <span>Кабинет владельца</span>
                  </Link>
                ) : (
                  <Link
                    href="/profile"
                    className="inline-flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl transition-all"
                  >
                    <User className="w-4 h-4" />
                    <span>{user.name || 'Профиль'}</span>
                  </Link>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md shadow-blue-500/20"
              >
                <LogIn className="w-4 h-4" />
                <span>Войти</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* 2. ОСНОВНОЙ КОНТЕНТ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-8">
        {/* БАННЕР ПОИСКА И ФИЛЬТРОВ */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="max-w-2xl">
            <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Отдых на первой линии Каспийского моря
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-2">
              Аренда проверенных коттеджей, домиков и номеров в Избербаше без наценок и переплат.
            </p>
          </div>

          {/* Строка поиска и быстрые фильтры */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2">
            <div className="sm:col-span-6 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder="Поиск по названию или улице (напр. Райский пляж)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-3 font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="sm:col-span-3">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as any)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="all">Все типы жилья</option>
                <option value="house">Дома и коттеджи</option>
                <option value="room">Номера и отели</option>
              </select>
            </div>

            <div className="sm:col-span-3">
              <select
                value={maxDistance}
                onChange={(e) => setMaxDistance(Number(e.target.value))}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value={100}>До 100 метров от моря</option>
                <option value={250}>До 250 метров от моря</option>
                <option value={500}>До 500 метров от моря</option>
                <option value={2000}>Любое расстояние</option>
              </select>
            </div>
          </div>
        </div>

        {/* КАТАЛОГ ОБЪЕКТОВ */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-900">
              Доступные варианты ({filteredProperties.length})
            </h2>
          </div>

          {loading ? (
            <div className="text-center py-20">
              <p className="text-xs font-bold text-slate-400 animate-pulse">Загрузка каталога жилья...</p>
            </div>
          ) : filteredProperties.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
              <Sparkles className="w-8 h-8 text-slate-400 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">По вашему запросу ничего не найдено</h3>
              <p className="text-xs text-slate-500">Попробуйте изменить параметры поиска или фильтры расстояния.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProperties.map((property) => {
                const isFav = isFavorite(property.id);
                const mainPhoto =
                  property.photos && property.photos.length > 0
                    ? property.photos[0]
                    : 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80';

                return (
                  <div
                    key={property.id}
                    className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between"
                  >
                    <div>
                      {/* Фотокарточка */}
                      <Link href={`/property/${property.id}`} className="block relative aspect-video overflow-hidden bg-slate-100">
                        <img
                          src={mainPhoto}
                          alt={property.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleFavorite(property.id);
                          }}
                          className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all ${
                            isFav
                              ? 'bg-rose-500 text-white shadow-md'
                              : 'bg-black/30 hover:bg-black/50 text-white'
                          }`}
                        >
                          <Heart className={`w-4 h-4 ${isFav ? 'fill-white' : ''}`} />
                        </button>

                        <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-xl">
                          {property.distance_to_sea}м до моря
                        </div>
                      </Link>

                      {/* Описание */}
                      <div className="p-5 space-y-2">
                        <div className="flex items-center justify-between">
                          <Link href={`/property/${property.id}`}>
                            <h3 className="font-bold text-base text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                              {property.title}
                            </h3>
                          </Link>
                          <div className="flex items-center text-xs font-bold text-slate-900">
                            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 mr-1" />
                            <span>4.95</span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-500 flex items-center line-clamp-1">
                          <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400 flex-shrink-0" />
                          <span>{property.address}</span>
                        </p>

                        <div className="flex items-center text-xs text-slate-500 space-x-3 pt-1">
                          <span className="flex items-center">
                            <Users className="w-3.5 h-3.5 mr-1 text-slate-400" />
                            До {property.max_guests} гостей
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Цена и кнопка */}
                    <div className="px-5 pb-5 pt-2 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-lg font-black text-slate-900">
                          {property.price_per_night.toLocaleString('ru-RU')} ₽
                        </span>
                        <span className="text-[11px] text-slate-400"> / ночь</span>
                      </div>

                      <Link
                        href={`/property/${property.id}`}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-blue-500/20"
                      >
                        Подробнее
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* 3. ПОДВАЛ САЙТА (FOOTER) С ЮРИДИЧЕСКИМИ ССЫЛКАМИ ДЛЯ ROBOKASSA */}
      <footer className="bg-white border-t border-slate-200 mt-20 py-10 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            <p className="font-bold text-slate-800">© 2026 Райский Пляж. Все права защищены.</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Индивидуальный предприниматель Ибрагимов Завур Абдурагимович • ИНН 056002553388
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <Link href="/offer" className="font-semibold hover:text-blue-600 underline transition-colors">
              Публичная оферта[cite: 2]
            </Link>
            <Link href="/offer" className="font-semibold hover:text-blue-600 underline transition-colors">
              Политика конфиденциальности[cite: 2]
            </Link>
            <a href="mailto:Baga1071@yandex.ru" className="font-semibold hover:text-blue-600 transition-colors">
              Поддержка: Baga1071@yandex.ru[cite: 2]
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}