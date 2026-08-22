'use client';

import React from 'react';
import Link from 'next/link';
import { Waves, ArrowLeft, Clock, ShieldCheck, AlertCircle, Sparkles, Ban, Volume2, CheckCircle2 } from 'lucide-react';

export default function RulesPage() {
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
            <ArrowLeft className="w-4 h-4 mr-1" /> На главную
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 pt-10 space-y-8">
        {/* Заголовок */}
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-1.5 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Стандарты проживания и безопасности</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Правила заселения, выселения и проживания
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
            Для комфортного и безопасного отдыха всех гостей на платформе «Райский Пляж» действуют единые общепринятые правила.
          </p>
        </div>

        {/* 1. ВРЕМЯ ЗАЕЗДА И ВЫЕЗДА */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Время заезда</span>
              <h3 className="text-2xl font-black text-slate-900 mt-0.5">с 14:00</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Хозяин подготавливает и тщательно убирает домик к 14:00. Ранний заезд возможен по предварительному согласованию с владельцем, если объект свободен.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Время выезда</span>
              <h3 className="text-2xl font-black text-slate-900 mt-0.5">до 12:00</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Освобождение номера до 12:00 необходимо для качественной уборки и санитарной подготовки жилья к приезду следующих гостей.
            </p>
          </div>
        </div>

        {/* 2. ПРАВИЛА ПРОЖИВАНИЯ */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <span>Основные правила дома и территории</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm text-slate-700">
            <div className="flex items-start space-x-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <Volume2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="block text-slate-900 font-bold mb-1">Режим тишины (с 23:00 до 08:00)</strong>
                <span>Просим соблюдать тишину в ночное время и с уважением относиться к отдыху соседей и других отдыхающих семей.</span>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <Ban className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="block text-slate-900 font-bold mb-1">Курение в помещениях запрещено</strong>
                <span>Курение сигарет, кальянов и вейпов разрешено исключительно на открытом воздухе в специально оборудованных местах.</span>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="block text-slate-900 font-bold mb-1">Бережное отношение к имуществу</strong>
                <span>Пожалуйста, бережно относитесь к мебели, технике и посуде. В случае случайного повреждения сообщите хозяину.</span>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="block text-slate-900 font-bold mb-1">Количество гостей</strong>
                <span>В домике могут проживать только указанное при бронировании количество гостей. Размещение свыше нормы согласовывается отдельно.</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. ПОЛИТИКА ОТМЕНЫ И ВОЗВРАТА */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-6 sm:p-8 rounded-3xl shadow-lg space-y-4">
          <div className="inline-flex items-center space-x-1.5 bg-white/10 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm">
            <span>Гарантия возврата</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black">Политика отмены бронирования</h2>
          <div className="space-y-3 text-xs sm:text-sm text-blue-100 leading-relaxed">
            <p>
              • <strong>Бесплатная отмена за 3 дня до даты заезда:</strong> При отмене бронирования более чем за 3 суток (72 часа) до 14:00 дня заселения сумма внесенного аванса (5%) возвращается туристу в полном объеме на ту же банковскую карту.
            </p>
            <p>
              • <strong>Отмена менее чем за 3 дня или незаезд:</strong> В случае поздней отмены или неприбытия гостя внесенный аванс не возвращается и удерживается в качестве компенсации фактических расходов на резервирование объекта.
            </p>
          </div>
        </div>

        {/* 4. БЛОК ПОДДЕРЖКИ */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div>
            <h3 className="font-bold text-sm text-slate-900">Остались вопросы по правилам или заселению?</h3>
            <p className="text-xs text-slate-500 mt-0.5">Наша служба заботы на связи ежедневно с 09:00 до 22:00 МСК</p>
          </div>
          <Link
            href="/contacts"
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-5 py-3 rounded-xl transition-all flex-shrink-0"
          >
            Связаться с поддержкой
          </Link>
        </div>

      </div>
    </main>
  );
}
