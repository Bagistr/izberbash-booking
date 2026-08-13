import React from 'react';
import Link from 'next/link';
import { sql } from '@/lib/db';
import { Waves, TrendingUp, DollarSign, Users, Calendar, Building, Plus } from 'lucide-react';

export const dynamic = 'force-dynamic';

async function getLandlordStats() {
  try {
    // Агрегированная аналитика из базы
    const statsResult = await sql`
      SELECT 
        COUNT(b.id) as total_bookings,
        COALESCE(SUM(b.total_price), 0) as total_revenue,
        COALESCE(AVG(b.total_days), 0) as avg_days
      FROM bookings b
      WHERE b.status IN ('confirmed', 'new')
    `;

    const propertiesResult = await sql`
      SELECT * FROM properties ORDER BY created_at DESC
    `;

    const recentBookings = await sql`
      SELECT b.*, p.title as property_title
      FROM bookings b
      JOIN properties p ON b.property_id = p.id
      ORDER BY b.created_at DESC
      LIMIT 10
    `;

    const stats = statsResult[0];
    const totalRevenue = Number(stats.total_revenue || 0);
    const commissionRate = 0.10; // 10% комиссия платформы
    const platformCommission = totalRevenue * commissionRate;
    const netRevenue = totalRevenue - platformCommission;

    return {
      totalBookings: Number(stats.total_bookings || 0),
      totalRevenue,
      netRevenue,
      platformCommission,
      avgDays: Number(stats.avg_days || 0).toFixed(1),
      properties: propertiesResult,
      recentBookings,
    };
  } catch (err) {
    console.error('Ошибка загрузки аналитики:', err);
    return null;
  }
}

export default async function DashboardPage() {
  const data = await getLandlordStats();

  if (!data) {
    return <div className="p-10 text-center">Ошибка загрузки панели управления.</div>;
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Шапка */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="bg-blue-600 p-2 rounded-xl text-white">
              <Waves className="w-6 h-6" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-slate-900">
              Рабочий стол <span className="text-blue-600">Арендодателя</span>
            </span>
          </Link>

          <Link
            href="/add-property"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-colors flex items-center space-x-1"
          >
            <Plus className="w-4 h-4" />
            <span>Добавить объект</span>
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Панель управления и аналитика</h1>
          <p className="text-slate-500 text-sm mt-1">Отслеживайте финансовые показатели, загрузку и заезд туристов.</p>
        </div>

        {/* МЕТРИКИ И АНАЛИТИКА */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase">Чистая выручка</span>
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900">{data.netRevenue.toLocaleString('ru-RU')} ₽</p>
            <p className="text-[11px] text-slate-400">С учетом комиссии 10%</p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase">Комиссия сервиса</span>
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl font-black text-blue-600">{data.platformCommission.toLocaleString('ru-RU')} ₽</p>
            <p className="text-[11px] text-slate-400">Плата за привлечение клиентов</p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase">Привлечено туристов</span>
              <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900">{data.totalBookings} гостей</p>
            <p className="text-[11px] text-slate-400">Оформлено через платформу</p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase">Средний срок брони</span>
              <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                <Calendar className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900">{data.avgDays} ночи</p>
            <p className="text-[11px] text-slate-400">Среднее время проживания</p>
          </div>
        </div>

        {/* СПИСОК ПОСЛЕДНИХ БРОНИРОВАНИЙ (КАЛЕНДАРЬ ЗАНЯТОСТИ) */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-slate-900">Календарь и история заездов</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 uppercase text-[10px] font-bold text-slate-400">
                <tr>
                  <th className="p-3">Объект</th>
                  <th className="p-3">Имя гостя</th>
                  <th className="p-3">Телефон</th>
                  <th className="p-3">Даты заезда</th>
                  <th className="p-3">Дней</th>
                  <th className="p-3">Сумма</th>
                  <th className="p-3">Статус</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.recentBookings.map((b: any) => (
                  <tr key={b.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-3 font-bold text-slate-900">{b.property_title}</td>
                    <td className="p-3">{b.guest_name}</td>
                    <td className="p-3 font-mono">{b.guest_phone}</td>
                    <td className="p-3 font-semibold text-blue-700">
                      {String(b.check_in).slice(0, 10)} — {String(b.check_out).slice(0, 10)}
                    </td>
                    <td className="p-3">{b.total_days} н.</td>
                    <td className="p-3 font-black text-slate-900">{b.total_price.toLocaleString('ru-RU')} ₽</td>
                    <td className="p-3">
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-1 rounded-md">
                        Подтверждено
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}