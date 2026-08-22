'use client';

import React from 'react';
import Link from 'next/link';
import { Waves, Phone, Mail, Send, ShieldCheck, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 text-xs mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
        
        {/* Верхняя часть */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Колонка 1: О сервисе */}
          <div className="space-y-3">
            <Link href="/" className="flex items-center space-x-2 text-white">
              <div className="bg-blue-600 p-1.5 rounded-xl text-white">
                <Waves className="w-5 h-5" />
              </div>
              <span className="font-black text-lg tracking-tight">
                Райский<span className="text-blue-500">Пляж</span>
              </span>
            </Link>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Официальный сервис прямого онлайн-бронирования коттеджей, домиков и номеров на берегу Каспийского моря в Избербаше.
            </p>
            <div className="flex items-center space-x-2 pt-1 text-slate-300 text-[11px]">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Безопасная онлайн-оплата 54-ФЗ</span>
            </div>
          </div>

          {/* Колонка 2: Навигация и инструкции */}
          <div className="space-y-2.5">
            <h4 className="text-white font-bold uppercase tracking-wider text-[11px]">Навигация</h4>
            <ul className="space-y-2 text-[11px]">
              <li>
                <Link href="/" className="hover:text-white transition-colors">Каталог домиков</Link>
              </li>
              <li>
                <Link href="/guide" className="hover:text-white transition-colors">Как пользоваться сайтом (Гайд)</Link>
              </li>
              <li>
                <Link href="/rules" className="hover:text-white transition-colors">Правила заезда и выезда</Link>
              </li>
              <li>
                <Link href="/add-property" className="hover:text-white transition-colors">Сдать жилье (для владельцев)</Link>
              </li>
            </ul>
          </div>

          {/* Колонка 3: Юридическая информация */}
          <div className="space-y-2.5">
            <h4 className="text-white font-bold uppercase tracking-wider text-[11px]">Правовая информация</h4>
            <ul className="space-y-2 text-[11px]">
              <li>
                <Link href="/offer" className="hover:text-white transition-colors">Публичная оферта сервиса</Link>
              </li>
              <li>
                <Link href="/rules" className="hover:text-white transition-colors">Политика отмены и возвратов</Link>
              </li>
              <li>
                <Link href="/contacts" className="hover:text-white transition-colors">Реквизиты и контакты</Link>
              </li>
            </ul>
          </div>

          {/* Колонка 4: Поддержка */}
          <div className="space-y-2.5">
            <h4 className="text-white font-bold uppercase tracking-wider text-[11px]">Служба заботы</h4>
            <div className="space-y-2 text-[11px]">
              <a
                href="https://t.me/Bagistr"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Telegram: @Bagistr</span>
              </a>
              <a
                href="tel:+79645714606"
                className="flex items-center space-x-2 hover:text-white transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                <span>+7 (964) 571-46-06</span>
              </a>
              <a
                href="mailto:Baga1071@yandex.ru"
                className="flex items-center space-x-2 hover:text-white transition-colors"
              >
                <Mail className="w-3.5 h-3.5 text-amber-400" />
                <span>Baga1071@yandex.ru</span>
              </a>
              <p className="text-[10px] text-slate-500 pt-1">Ежедневно с 09:00 до 22:00 МСК</p>
            </div>
          </div>
        </div>

        {/* Плашки безопасности и платежные системы (Обязательно для эквайринга) */}
        <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] uppercase font-bold text-slate-500 mr-2">Принимаем к оплате:</span>
            <div className="bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700 font-bold text-white text-[10px]">
              МИР
            </div>
            <div className="bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700 font-bold text-white text-[10px]">
              СБП (QR-код)
            </div>
            <div className="bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700 font-bold text-white text-[10px]">
              Visa / Mastercard
            </div>
            <div className="bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700 font-bold text-emerald-400 text-[10px]">
              SSL 256-bit
            </div>
          </div>

          <div className="text-[11px] text-slate-500 text-center sm:text-right">
            ИП Ибрагимов З. А. • ИНН 056002553388 • ОГРНИП 323050000010499
          </div>
        </div>

        {/* Копирайт */}
        <div className="text-center text-[10px] text-slate-600 pt-2">
          © {new Date().getFullYear()} «Райский Пляж» (райскийпляж.рф). Все права защищены.
        </div>

      </div>
    </footer>
  );
};
