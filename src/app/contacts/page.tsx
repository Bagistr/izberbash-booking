'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Waves, ArrowLeft, Phone, Mail, Send, Clock, 
  MapPin, ShieldCheck, CheckCircle2, MessageCircle 
} from 'lucide-react';

export default function ContactsPage() {
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formData, setFormData] = useState({ name: '', contact: '', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
  };

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
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-1.5 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">
            <MessageCircle className="w-3.5 h-3.5" />
            <span>Служба заботы о клиентах</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Контакты и поддержка
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
            Возник вопрос по бронированию, размещению объекта или оплате? Мы всегда на связи и готовы оперативно помочь.
          </p>
        </div>

        {/* Сетка контактов */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Telegram */}
          <a
            href="https://t.me/Bagistr"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3 hover:border-blue-500 hover:shadow-md transition-all group block"
          >
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Telegram-поддержка</span>
              <h3 className="text-base font-black text-slate-900 mt-0.5">@Bagistr</h3>
            </div>
            <p className="text-xs text-slate-500">Самый быстрый ответ: оператор на связи онлайн</p>
          </a>

          {/* Телефон */}
          <a
            href="tel:+79645714606"
            className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3 hover:border-emerald-500 hover:shadow-md transition-all group block"
          >
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Горячая линия</span>
              <h3 className="text-base font-black text-slate-900 mt-0.5">+7 (964) 571-46-06</h3>
            </div>
            <p className="text-xs text-slate-500">Прямой звонок для срочных вопросов</p>
          </a>

          {/* Email */}
          <a
            href="mailto:Baga1071@yandex.ru"
            className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3 hover:border-purple-500 hover:shadow-md transition-all group block"
          >
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Электронная почта</span>
              <h3 className="text-base font-black text-slate-900 mt-0.5">Baga1071@yandex.ru</h3>
            </div>
            <p className="text-xs text-slate-500">Для предложений, чеков и сотрудничества</p>
          </a>
        </div>

        {/* Время работы и Реквизиты */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <span>Режим работы службы заботы</span>
            </h3>
            <div className="space-y-2 text-xs text-slate-600">
              <p>• <strong>Понедельник — Воскресенье:</strong> с 09:00 до 22:00 (по МСК)</p>
              <p>• <strong>Экстренные вопросы по заселению:</strong> круглосуточно в Telegram</p>
              <p>• <strong>Локация сервиса:</strong> Республика Дагестан, г. Избербаш, побережье Каспийского моря</p>
            </div>
          </div>

          <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-sm space-y-3">
            <div className="inline-flex items-center space-x-1.5 bg-white/10 px-3 py-1 rounded-full text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Официальные реквизиты</span>
            </div>
            <div className="space-y-1.5 text-xs text-slate-300">
              <p><strong className="text-white">ИП:</strong> Ибрагимов Завур Абдурагимович</p>
              <p><strong className="text-white">ИНН:</strong> 056002553388</p>
              <p><strong className="text-white">ОГРНИП:</strong> 323050000010499</p>
              <p><strong className="text-white">Юридический адрес:</strong> Республика Дагестан</p>
            </div>
          </div>
        </div>

        {/* ФОРМА ОБРАТНОЙ СВЯЗИ */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="space-y-1">
            <h2 className="text-lg font-black text-slate-900">Написать нам обращение</h2>
            <p className="text-xs text-slate-500">Оставьте сообщение, и мы свяжемся с вами в течение 15 минут</p>
          </div>

          {formSubmitted ? (
            <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <h3 className="font-bold text-sm text-emerald-900">Сообщение успешно отправлено!</h3>
              <p className="text-xs text-emerald-700">Мы уже получили ваше обращение и ответим вам в ближайшее время.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Ваше имя</label>
                <input
                  type="text"
                  required
                  placeholder="Как к вам обращаться"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Телефон или Telegram</label>
                <input
                  type="text"
                  required
                  placeholder="+7 (999) 000-00-00 или @username"
                  value={formData.contact}
                  onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Ваш вопрос или сообщение</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Опишите ваш вопрос..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-6 py-3.5 rounded-xl transition-all shadow-md shadow-blue-500/20 cursor-pointer"
              >
                Отправить обращение ✉️
              </button>
            </form>
          )}
        </div>

      </div>
    </main>
  );
}
