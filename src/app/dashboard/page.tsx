'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Waves, DollarSign, TrendingUp, Users, Calendar as CalendarIcon,
  Plus, LogOut, Edit3, Eye, EyeOff, ChevronLeft, ChevronRight,
  X, Check, MapPin, Building, Home, Phone, User
} from 'lucide-react';
import { Property } from '@/types/property';

interface BookingItem {
  id: string;
  property_id: string;
  property_title: string;
  guest_name: string;
  guest_phone: string;
  guest_telegram?: string;
  check_in: string;
  check_out: string;
  total_days: number;
  total_price: number;
  status: string;
}

const PRESET_AMENITIES = [
  'Wi-Fi', 'Кондиционер', 'Мангал', 'Бассейн', 'Беседка', 
  'Лежак / Шезлонг', 'Парковка', 'Баня / Сауна', 'Вид на море', 
  'Стиральная машина', 'Телевизор', 'Детская площадка'
];

const MONTH_NAMES = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];

const DAY_NAMES = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id?: string; name: string; phone: string } | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    netRevenue: 0,
    platformCommission: 0,
    totalGuests: 0,
    avgDays: '0',
  });
  const [loading, setLoading] = useState(true);

  // Календарь
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedPropertyFilter, setSelectedPropertyFilter] = useState<string>('all');
  const [selectedDayBookings, setSelectedDayBookings] = useState<BookingItem[] | null>(null);
  const [selectedDayDate, setSelectedDayDate] = useState<string | null>(null);

  // Редактирование объекта
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [editFormData, setEditFormData] = useState<any>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('landlord_user');
    if (!stored) {
      router.push('/login');
      return;
    }

    const parsedUser = JSON.parse(stored);
    setUser(parsedUser);

    async function loadData() {
      try {
        const res = await fetch(`/api/landlord/properties?phone=${encodeURIComponent(parsedUser.phone)}`);
        if (res.ok) {
          const data = await res.json();
          setProperties(data.properties || []);
          setBookings(data.bookings || []);
          if (data.stats) setStats(data.stats);
        }
      } catch (err) {
        console.error('Ошибка загрузки данных кабинета:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('landlord_user');
    router.push('/login');
  };

  // Переключение месяцев
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Логика построения дней календаря
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  // Приводим к понедельнику (0 = Пн, 6 = Вс)
  let startDayOfWeek = firstDayOfMonth.getDay() - 1;
  if (startDayOfWeek === -1) startDayOfWeek = 6;

  // Фильтр броней по выбранному объекту
  const filteredBookings = selectedPropertyFilter === 'all'
    ? bookings
    : bookings.filter((b) => b.property_id === selectedPropertyFilter);

  // Поиск бронирований на конкретную дату YYYY-MM-DD
  const getBookingsForDate = (dateStr: string) => {
    const target = new Date(dateStr).getTime();
    return filteredBookings.filter((b) => {
      const inDate = new Date(b.check_in.slice(0, 10)).getTime();
      const outDate = new Date(b.check_out.slice(0, 10)).getTime();
      return target >= inDate && target < outDate;
    });
  };

  // Открытие модалки редактирования
  const handleOpenEdit = (p: Property) => {
    setEditingProperty(p);
    setEditFormData({
      ...p,
      amenities: p.amenities || [],
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFormData) return;
    setSavingEdit(true);

    try {
      const res = await fetch('/api/landlord/properties', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData),
      });

      if (res.ok) {
        setProperties((prev) =>
          prev.map((p) => (p.id === editFormData.id ? { ...editFormData } : p))
        );
        setEditingProperty(null);
      }
    } catch (err) {
      console.error('Ошибка сохранения:', err);
    } finally {
      setSavingEdit(false);
    }
  };

  const toggleAmenity = (amenity: string) => {
    if (!editFormData) return;
    const current = editFormData.amenities || [];
    const updated = current.includes(amenity)
      ? current.filter((a: string) => a !== amenity)
      : [...current, amenity];
    setEditFormData({ ...editFormData, amenities: updated });
  };

  const togglePropertyStatus = async (p: Property) => {
    const updatedStatus = !p.is_active;
    try {
      const res = await fetch('/api/landlord/properties', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...p, is_active: updatedStatus }),
      });
      if (res.ok) {
        setProperties((prev) =>
          prev.map((item) => (item.id === p.id ? { ...item, is_active: updatedStatus } : item))
        );
      }
    } catch (err) {
      console.error('Ошибка изменения статуса:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-sm font-semibold text-slate-500 animate-pulse">Загрузка данных кабинета...</p>
      </div>
    );
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
              Кабинет <span className="text-blue-600">Владельца</span>
            </span>
          </Link>

          <div className="flex items-center space-x-3">
            <span className="text-xs font-bold text-slate-600 hidden sm:inline-block">
              {user?.name} ({user?.phone})
            </span>
            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-red-600 rounded-xl hover:bg-slate-100 transition-colors"
              title="Выйти из аккаунта"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Панель управления</h1>
            <p className="text-slate-500 text-sm mt-1">
              Финансовый отчет, шахматка занятости и управление домами.
            </p>
          </div>

          <Link
            href="/add-property"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-3 rounded-xl transition-colors inline-flex items-center space-x-1.5 shadow-lg shadow-blue-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Добавить новое жилье</span>
          </Link>
        </div>

        {/* 1. БЛОК АНАЛИТИКИ И ВЫРУЧКИ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase">Чистый заработок</span>
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900">{stats.netRevenue.toLocaleString('ru-RU')} ₽</p>
            <p className="text-[11px] text-emerald-600 font-semibold">После вычета комиссии 10%</p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase">Комиссия сервиса</span>
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl font-black text-blue-600">{stats.platformCommission.toLocaleString('ru-RU')} ₽</p>
            <p className="text-[11px] text-slate-400">Плата за привлечение клиентов</p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase">Заселено гостей</span>
              <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900">{stats.totalGuests} туристов</p>
            <p className="text-[11px] text-slate-400">Оформили бронирование</p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase">Средний срок брони</span>
              <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                <CalendarIcon className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900">{stats.avgDays} ночи</p>
            <p className="text-[11px] text-slate-400">В среднем живут гости</p>
          </div>
        </div>

        {/* 2. ИНТЕРАКТИВНЫЙ КАЛЕНДАРЬ ЗАСЕЛЕННОСТИ */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <CalendarIcon className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Шахматка заселённости</h2>
                <p className="text-xs text-slate-500">Нажмите на любой занятый день, чтобы увидеть детали брони</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* Фильтр по объектам */}
              <select
                value={selectedPropertyFilter}
                onChange={(e) => setSelectedPropertyFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold"
              >
                <option value="all">Все мои объекты</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>

              {/* Листание месяцев */}
              <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={prevMonth}
                  className="p-1.5 hover:bg-white rounded-lg transition-colors text-slate-700"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-bold text-slate-800 px-2 min-w-[120px] text-center">
                  {MONTH_NAMES[month]} {year}
                </span>
                <button
                  onClick={nextMonth}
                  className="p-1.5 hover:bg-white rounded-lg transition-colors text-slate-700"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Сетка календаря */}
          <div>
            <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-bold text-slate-400">
              {DAY_NAMES.map((d, i) => (
                <div key={i} className="py-1">{d}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {/* Пустые ячейки до начала месяца */}
              {[...Array(startDayOfWeek)].map((_, i) => (
                <div key={`empty-${i}`} className="h-16 sm:h-20 bg-slate-50/50 rounded-2xl border border-dashed border-slate-100" />
              ))}

              {/* Дни месяца */}
              {[...Array(daysInMonth)].map((_, i) => {
                const dayNum = i + 1;
                const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                const dayBookings = getBookingsForDate(formattedDate);
                const isOccupied = dayBookings.length > 0;

                return (
                  <div
                    key={dayNum}
                    onClick={() => {
                      if (isOccupied) {
                        setSelectedDayBookings(dayBookings);
                        setSelectedDayDate(formattedDate);
                      }
                    }}
                    className={`h-16 sm:h-20 p-1.5 sm:p-2 rounded-2xl border transition-all flex flex-col justify-between ${
                      isOccupied
                        ? 'bg-blue-50/80 border-blue-200 hover:border-blue-400 cursor-pointer shadow-sm hover:scale-[1.02]'
                        : 'bg-white border-slate-100 text-slate-400'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className={`text-xs font-bold ${isOccupied ? 'text-blue-700' : 'text-slate-600'}`}>
                        {dayNum}
                      </span>
                      {isOccupied && (
                        <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                      )}
                    </div>

                    {isOccupied && (
                      <div className="space-y-0.5">
                        {dayBookings.slice(0, 2).map((b, idx) => (
                          <div
                            key={idx}
                            className="text-[9px] sm:text-[10px] font-bold bg-blue-600 text-white rounded-lg px-1.5 py-0.5 truncate"
                          >
                            {b.guest_name}
                          </div>
                        ))}
                        {dayBookings.length > 2 && (
                          <span className="text-[9px] text-blue-600 font-bold">+{dayBookings.length - 2} еще</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 3. МОИ ОБЪЯВЛЕНИЯ С ПОЛНЫМ РЕДАКТИРОВАНИЕМ */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="text-lg font-bold text-slate-900">Мои объекты недвижимости ({properties.length})</h2>
          </div>

          {properties.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-slate-500 text-sm mb-4">У вас пока нет добавленных объектов.</p>
              <Link
                href="/add-property"
                className="bg-blue-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-colors inline-block"
              >
                Добавить первый дом
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {properties.map((p) => {
                const photo = p.photos?.[0] || 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=600&q=80';

                return (
                  <div
                    key={p.id}
                    className="p-4 sm:p-5 rounded-2xl border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-slate-300 transition-all bg-slate-50/50"
                  >
                    <div className="flex items-center space-x-4">
                      <img src={photo} alt={p.title} className="w-20 h-20 rounded-2xl object-cover flex-shrink-0" />
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-bold text-slate-900 text-sm sm:text-base">{p.title}</h3>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                              p.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {p.is_active ? 'Опубликован' : 'Снят с публикации'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {p.address} • {p.distance_to_sea} м до моря • до {p.max_guests} гостей
                        </p>
                        <p className="text-sm font-black text-blue-600 mt-1">
                          {p.price_per_night.toLocaleString('ru-RU')} ₽ <span className="text-xs text-slate-400 font-normal">/ ночь</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 w-full md:w-auto justify-end pt-2 md:pt-0 border-t md:border-t-0 border-slate-200">
                      <button
                        onClick={() => handleOpenEdit(p)}
                        className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl flex items-center space-x-1.5 transition-colors shadow-sm"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Редактировать всё</span>
                      </button>

                      <button
                        onClick={() => togglePropertyStatus(p)}
                        className={`p-2.5 rounded-xl text-xs font-bold transition-colors ${
                          p.is_active ? 'bg-slate-200 hover:bg-slate-300 text-slate-700' : 'bg-blue-600 text-white'
                        }`}
                        title={p.is_active ? 'Скрыть объявление' : 'Опубликовать'}
                      >
                        {p.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* МОДАЛЬНОЕ ОКНО: ДЕТАЛИ БРОНИ В ВЫБРАННЫЙ ДЕНЬ */}
      {selectedDayBookings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 relative shadow-2xl space-y-4">
            <button
              onClick={() => setSelectedDayBookings(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900">
              Бронирование на {selectedDayDate}
            </h3>

            <div className="space-y-3">
              {selectedDayBookings.map((b) => (
                <div key={b.id} className="p-4 bg-blue-50 rounded-2xl border border-blue-100 space-y-2">
                  <p className="font-bold text-sm text-blue-950">{b.property_title}</p>
                  <div className="text-xs text-slate-700 space-y-1">
                    <div className="flex items-center">
                      <User className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
                      <span>Гость: <strong>{b.guest_name}</strong></span>
                    </div>
                    <div className="flex items-center">
                      <Phone className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
                      <span>Телефон: <strong>{b.guest_phone}</strong></span>
                    </div>
                    <div className="flex items-center">
                      <CalendarIcon className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
                      <span>Даты: с {b.check_in.slice(0, 10)} по {b.check_out.slice(0, 10)} ({b.total_days} н.)</span>
                    </div>
                    <div className="flex items-center">
                      <DollarSign className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
                      <span>Сумма: <strong>{b.total_price.toLocaleString('ru-RU')} ₽</strong></span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* МОДАЛЬНОЕ ОКНО: ПОЛНОЕ РЕДАКТИРОВАНИЕ ОБЪЕКТА */}
      {editingProperty && editFormData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 relative shadow-2xl max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setEditingProperty(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-6 h-6" />
            </button>

            <h3 className="text-xl font-bold text-slate-900 mb-4">Редактирование объявления</h3>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Название объекта</label>
                <input
                  type="text"
                  required
                  value={editFormData.title}
                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Тип жилья</label>
                  <select
                    value={editFormData.property_type}
                    onChange={(e) => setEditFormData({ ...editFormData, property_type: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5"
                  >
                    <option value="house">Дом / Коттедж</option>
                    <option value="room">Номер в отеле</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Цена за сутки (₽)</label>
                  <input
                    type="number"
                    required
                    value={editFormData.price_per_night}
                    onChange={(e) => setEditFormData({ ...editFormData, price_per_night: Number(e.target.value) })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-bold text-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">До моря (метров)</label>
                  <input
                    type="number"
                    required
                    value={editFormData.distance_to_sea}
                    onChange={(e) => setEditFormData({ ...editFormData, distance_to_sea: Number(e.target.value) })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Макс. гостей</label>
                  <input
                    type="number"
                    required
                    value={editFormData.max_guests}
                    onChange={(e) => setEditFormData({ ...editFormData, max_guests: Number(e.target.value) })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Адрес объекта</label>
                <input
                  type="text"
                  required
                  value={editFormData.address}
                  onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Описание</label>
                <textarea
                  rows={3}
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5"
                />
              </div>

              {/* Удобства и бонусы */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Удобства и бонусы</label>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_AMENITIES.map((amenity) => {
                    const isSelected = editFormData.amenities?.includes(amenity);
                    return (
                      <button
                        key={amenity}
                        type="button"
                        onClick={() => toggleAmenity(amenity)}
                        className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}{amenity}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setEditingProperty(null)}
                  className="text-xs font-bold text-slate-600 px-4 py-2.5 rounded-xl hover:bg-slate-100"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-lg shadow-blue-500/25"
                >
                  {savingEdit ? 'Сохранение...' : 'Сохранить изменения'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}