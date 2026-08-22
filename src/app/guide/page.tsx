'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Waves, ArrowLeft, Search, Calendar, CreditCard, Key, 
  Building2, ImagePlus, ShieldCheck, CheckCircle2, Sparkles, Phone, ArrowRight 
} from 'lucide-react';

export default function GuidePage() {
  const [activeTab, setActiveTab] = useState<'guest' | 'landlord'>('guest');

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Шапка */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="bg-blue-600 p-2 rounded-xl text-white">
              <Waves className="w-5 h-5" />
            </div>
            <span className="font-black text-xl tracking-tight text-slate-900">
              Райский<span className="text-blue-600">Пляж</span>
            </span>
          </Link>

          <Link href="/" className="inline-flex items-center text-xs font-bold text-slate-600 hover:text-slate-900">
            <ArrowLeft className="w-4 h-4 mr-1" /> В каталог
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 pt-10 space-y-8">
        {/* Заголовок */}
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center space-x-1.5 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Как устроен сервис</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Инструкция по пользованию платформой
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Простое, прозрачное и безопасное онлайн-бронирование коттеджей и номеров на берегу Каспийского моря в Избербаше.
          </p>
        </div>

        {/* Переключатель: Для туристов / Для арендодателей */}
        <div className="flex justify-center">
          <div className="bg-slate-200/80 p-1 rounded-2xl flex items-center space-x-1">
            <button
              onClick={() => setActiveTab('guest')}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                activeTab === 'guest'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🏖️ Инструкция для Туристов (Гостей)
            </button>
            <button
              onClick={() => setActiveTab('landlord')}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                activeTab === 'landlord'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🔑 Инструкция для Владельцев (Арендодателей)
            </button>
          </div>
        </div>

        {/* 1. ИНСТРУКЦИЯ ДЛЯ ТУРИСТОВ */}
        {activeTab === 'guest' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Шаг 1 */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3 relative overflow-hidden">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-black text-sm flex items-center justify-center">
                  1
                </div>
                <h3 className="font-bold text-slate-900 text-base">Поиск и выбор жилья</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Используйте удобные фильтры: количество гостей, расстояние до моря, наличие бассейна, мангала или Wi-Fi. Выберите нужные даты в календаре.
                </p>
              </div>

              {/* Шаг 2 */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3 relative overflow-hidden">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-black text-sm flex items-center justify-center">
                  2
                </div>
                <h3 className="font-bold text-slate-900 text-base">Бронь с авансом 5%</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Оплатите небольшой аванс 5% онлайн банковской картой или через СБП на защищенной платежной странице. Эти 5% гарантируют фиксацию дат за вами.
                </p>
              </div>

              {/* Шаг 3 */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3 relative overflow-hidden">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-black text-sm flex items-center justify-center">
                  3
                </div>
                <h3 className="font-bold text-slate-900 text-base">Заселение и отдых</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Приезжайте к 14:00. Остаток суммы (95%) вы оплачиваете напрямую хозяину при заселении. После отдыха оцените «Уровень Рахата» ☀️ на сайте!
                </p>
              </div>
            </div>

            {/* Блок преимуществ */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-black text-base text-slate-900">Гарантии для туристов:</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Бесплатная отмена за 3 дня до даты заезда</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Честные фото 16:9 и реальные отзывы гостей</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Прямая связь с владельцем домика</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Безопасная онлайн-оплата с фискальным чеком</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. ИНСТРУКЦИЯ ДЛЯ ВЛАДЕЛЬЦЕВ */}
        {activeTab === 'landlord' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Шаг 1 */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3 relative overflow-hidden">
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-black text-sm flex items-center justify-center">
                  1
                </div>
                <h3 className="font-bold text-slate-900 text-base">Добавление объекта</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Заполните описание, укажите цену, удобства и загрузите красивые фотографии домика. Загрузка занимает не более 2 минут.
                </p>
              </div>

              {/* Шаг 2 */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3 relative overflow-hidden">
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-black text-sm flex items-center justify-center">
                  2
                </div>
                <h3 className="font-bold text-slate-900 text-base">Интерактивная шахматка</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Управляйте бронированиями в удобном календаре. Блокируйте даты в один клик при бронях с Авито, звонков или для личного отдыха.
                </p>
              </div>

              {/* Шаг 3 */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3 relative overflow-hidden">
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-black text-sm flex items-center justify-center">
                  3
                </div>
                <h3 className="font-bold text-slate-900 text-base">0% комиссии и оплата</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Вы получаете 100% денег напрямую от гостя при заселении. Никаких скрытых сборов, вычетов или задержек выплат.
                </p>
              </div>
            </div>

            {/* Блок преимуществ владельца */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-6 sm:p-8 rounded-3xl shadow-lg space-y-4">
              <h3 className="font-black text-lg">Почему владельцы выбирают «Райский Пляж»?</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-emerald-100">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-300 flex-shrink-0" />
                  <span>0% комиссии с арендодателя (гость платит вам на руки)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-300 flex-shrink-0" />
                  <span>Защита от срыва дат (гости вносят залог)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-300 flex-shrink-0" />
                  <span>Кнопка «Не приехал» защищает рейтинг от необоснованных оценок</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-300 flex-shrink-0" />
                  <span>Удобный доступ к шахматке с любого смартфона</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Кнопка действия */}
        <div className="text-center pt-4">
          <Link
            href="/"
            className="bg-blue-600 hover:bg-blue-700 text-white font-black text-sm px-8 py-4 rounded-2xl transition-all shadow-lg shadow-blue-500/25 inline-flex items-center space-x-2"
          >
            <span>Перейти к каталогу домиков</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

      </div>
    </main>
  );
}
