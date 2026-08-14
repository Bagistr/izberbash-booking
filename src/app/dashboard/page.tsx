'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Waves, TrendingUp, DollarSign, Users, Calendar, Plus, LogOut, Edit2, Check, Eye, EyeOff } from 'lucide-react';
import { Property } from '@/types/property';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id?: string; name: string; phone: string } | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  // Редактирование объявления
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editDesc, setEditDesc] = useState<string>('');

  useEffect(() => {
    // 1. Проверяем авторизацию
    const stored = localStorage.getItem('landlord_user');
    if (!stored) {
      router.push('/login');
      return;
    }

    const parsedUser = JSON.parse(stored);
    setUser(parsedUser);

    // 2. Загружаем объекты именно этого владельца
    async function loadLandlordProperties() {
      try {
        const res = await fetch(`/api/landlord/properties?phone=${encodeURIComponent(parsedUser.phone)}`);
        if (res.ok) {
          const data = await res.json();
          setProperties(data.properties || []);
        }
      } catch (err) {
        console.error('Ошибка загрузки:', err);
      } finally {
        setLoading(false);
      }
    }

    loadLandlordProperties();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('landlord_user');
    router.push('/login');
  };

  const startEdit = (p: Property) => {
    setEditingId(p.id);
    setEditPrice(p.price_per_night);
    setEditDesc(p.description || '');
  };

  const saveEdit = async (id: string, is_active: boolean) => {
    try {
      const res = await fetch('/api/landlord/properties', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          price_per_night: editPrice,
          description: editDesc,
          is_active,
        }),
      });

      if (res.ok) {
        setProperties((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, price_per_night: editPrice, description: editDesc } : item
          )
        );
        setEditingId(null);
      }
    } catch (err) {
      console.error('Не удалось сохранить изменения', err);
    }
  };

  const toggleActiveStatus = async (p: Property) => {
    try {
      const updatedStatus = !p.is_active;
      const res = await fetch('/api/landlord/properties', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: p.id,
          price_per_night: p.price_per_night,
          description: p.description,
          is_active: updatedStatus,
        }),
      });

      if (res.ok) {
        setProperties((prev) =>
          prev.map((item) => (item.id === p.id ? { ...item, is_active: updatedStatus } : item))
        );
      }
    } catch (err) {
      console.error('Не удалось изменить статус', err);
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
      {/* Шапка дашборда */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
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
              title="Выйти"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Рабочий стол</h1>
            <p className="text-slate-500 text-sm mt-1">Управление объектами и финансовая аналитика.</p>
          </div>

          <Link
            href="/add-property"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-3 rounded-xl transition-colors inline-flex items-center space-x-1.5 shadow-lg shadow-blue-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Добавить новое жилье</span>
          </Link>
        </div>

        {/* СВОДКА И МЕТРИКИ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase">Активных объектов</span>
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <Waves className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900">{properties.filter((p) => p.is_active).length}</p>
            <p className="text-[11px] text-slate-400">Опубликовано на сайте</p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase">Комиссия сервиса</span>
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl font-black text-emerald-600">10%</p>
            <p className="text-[11px] text-slate-400">Фиксированная ставка</p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase">Привлечено заявок</span>
              <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900">Прямые брони</p>
            <p className="text-[11px] text-slate-400">Без переплат агентствам</p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase">Гарантия заезда</span>
              <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                <Calendar className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900">100%</p>
            <p className="text-[11px] text-slate-400">Защита от овербукинга</p>
          </div>
        </div>

        {/* РАЗДЕЛ: МОИ ОБЪЯВЛЕНИЯ */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="text-lg font-bold text-slate-900">Мои объявления ({properties.length})</h2>
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
                const isEditing = editingId === p.id;
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
                            {p.is_active ? 'Активно' : 'Скрыто'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{p.address} • {p.distance_to_sea} м до моря</p>

                        {isEditing ? (
                          <div className="mt-3 flex items-center space-x-2">
                            <input
                              type="number"
                              value={editPrice}
                              onChange={(e) => setEditPrice(Number(e.target.value))}
                              className="text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1 w-28 font-bold"
                            />
                            <span className="text-xs text-slate-500">₽ / ночь</span>
                          </div>
                        ) : (
                          <p className="text-sm font-black text-blue-600 mt-1">
                            {p.price_per_night.toLocaleString('ru-RU')} ₽ <span className="text-xs text-slate-400 font-normal">/ ночь</span>
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 w-full md:w-auto justify-end pt-2 md:pt-0 border-t md:border-t-0 border-slate-200">
                      {isEditing ? (
                        <button
                          onClick={() => saveEdit(p.id, p.is_active)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center space-x-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Сохранить</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => startEdit(p)}
                          className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold px-3 py-2 rounded-xl flex items-center space-x-1 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Изменить цену</span>
                        </button>
                      )}

                      <button
                        onClick={() => toggleActiveStatus(p)}
                        className={`p-2 rounded-xl text-xs font-bold transition-colors ${
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
    </main>
  );
}