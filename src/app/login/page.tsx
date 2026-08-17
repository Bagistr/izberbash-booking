'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Waves, Phone, Lock, User, PhoneCall, Loader2, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { user, login } = useAuth();

  const [role, setRole] = useState<'guest' | 'landlord'>('guest');
  const [isRegister, setIsRegister] = useState(false);

  // Поля для классического входа по телефону
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');

  // Состояния звонка-сброса
  const [codeSent, setCodeSent] = useState(false);
  const [timer, setTimer] = useState(0);

  // Состояния Telegram авторизации
  const [tgLoading, setTgLoading] = useState(false);
  const [tgWaiting, setTgWaiting] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Если пользователь уже авторизован — перенаправляем
  useEffect(() => {
    if (user) {
      router.push(user.role === 'landlord' ? '/dashboard' : '/');
    }
  }, [user, router]);

  // Очистка таймера опроса при уходе со страницы
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // Таймер повторного звонка
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  // 1. БЕСШОВНЫЙ ВХОД ЧЕРЕЗ ПРИЛОЖЕНИЕ TELEGRAM (1 КЛИК)
  const handleTelegramDeepLinkLogin = async () => {
    setErrorMsg('');
    setTgLoading(true);

    try {
      // 1. Запрашиваем сессию авторизации
      const res = await fetch('/api/auth/tg-session', { method: 'POST' });
      const data = await res.json();

      if (!res.ok || !data.token || !data.tgUrl) {
        throw new Error(data.error || 'Не удалось создать сессию Telegram');
      }

      setTgWaiting(true);

      // 2. Открываем приложение Telegram
      window.open(data.tgUrl, '_blank');

      // 3. Запускаем опрос статуса сессии каждые 1.5 секунды
      pollingIntervalRef.current = setInterval(async () => {
        try {
          const checkRes = await fetch(`/api/auth/tg-session?token=${data.token}`);
          const checkData = await checkRes.json();

          if (checkData.status === 'authorized' && checkData.user) {
            if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
            setTgWaiting(false);
            setTgLoading(false);

            // Сохраняем пользователя в контекст
            login(checkData.user);
            router.push(checkData.user.role === 'landlord' ? '/dashboard' : '/');
          }
        } catch (pollErr) {
          console.error('Ошибка проверки Telegram-сессии:', pollErr);
        }
      }, 1500);

      // Автоматическая остановка опроса через 2 минуты
      setTimeout(() => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          setTgWaiting(false);
          setTgLoading(false);
        }
      }, 120000);

    } catch (err: any) {
      setErrorMsg(err.message || 'Ошибка открытия Telegram');
      setTgLoading(false);
      setTgWaiting(false);
    }
  };

  // 2. ЗАПРОС ЗВОНКА-СБРОСА (Zvonok.com)
  const handleRequestCall = async () => {
    if (!phone || phone.replace(/\D/g, '').length < 10) {
      setErrorMsg('Введите корректный номер телефона');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phone, 
          action: isRegister ? 'register' : 'login' 
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка запроса звонка');

      setCodeSent(true);
      setTimer(60);
    } catch (err: any) {
      setErrorMsg(err.message || 'Не удалось совершить звонок');
    } finally {
      setLoading(false);
    }
  };

  // 3. КЛАССИЧЕСКАЯ ОТПРАВКА ФОРМЫ (Телефон + Пароль)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: isRegister ? 'register' : 'login',
          name,
          phone,
          password,
          role,
          code,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка авторизации');

      login(data.user);
      router.push(data.user.role === 'landlord' ? '/dashboard' : '/');
    } catch (err: any) {
      setErrorMsg(err.message || 'Ошибка входа');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center space-x-2">
          <div className="bg-blue-600 p-2.5 rounded-2xl text-white shadow-md">
            <Waves className="w-6 h-6" />
          </div>
          <span className="font-black text-2xl tracking-tight text-slate-900">
            Райский<span className="text-blue-600">Пляж</span>
          </span>
        </Link>
        <h2 className="mt-4 text-xl sm:text-2xl font-black text-slate-900">
          {isRegister ? 'Создание аккаунта' : 'Вход в личный кабинет'}
        </h2>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          
          {/* Переключатель роли */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl">
            <button
              type="button"
              onClick={() => setRole('guest')}
              className={`py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                role === 'guest' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
              }`}
            >
              Я Турист
            </button>
            <button
              type="button"
              onClick={() => setRole('landlord')}
              className={`py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                role === 'landlord' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
              }`}
            >
              Я Владелец
            </button>
          </div>

          {errorMsg && (
            <div className="p-3.5 bg-red-50 text-red-600 border border-red-200 rounded-2xl text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          {/* ГЛАВНАЯ КНОПКА: ВХОД ЧЕРЕЗ ПРИЛОЖЕНИЕ TELEGRAM */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleTelegramDeepLinkLogin}
              disabled={tgLoading}
              className="w-full bg-[#229ED9] hover:bg-[#1E88E5] text-white font-bold text-sm py-3.5 px-4 rounded-2xl flex items-center justify-center space-x-2.5 shadow-lg shadow-blue-400/25 transition-all cursor-pointer disabled:opacity-75"
            >
              {tgLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
                </svg>
              )}
              <span>Войти через Telegram</span>
            </button>

            {tgWaiting && (
              <div className="p-3.5 bg-blue-50 border border-blue-100 rounded-2xl flex items-center space-x-3 text-left animate-pulse">
                <Loader2 className="w-5 h-5 text-blue-600 animate-spin flex-shrink-0" />
                <p className="text-xs text-blue-800 font-medium leading-relaxed">
                  Нажмите <b>«Запустить» (Start)</b> в открывшемся Telegram-боте для входа на сайт...
                </p>
              </div>
            )}

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink mx-3 text-[11px] font-bold text-slate-400 uppercase">или по номеру телефона</span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>
          </div>

          {/* КЛАССИЧЕСКАЯ ФОРМА ПО НОМЕРУ ТЕЛЕФОНА */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Ваше имя</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    placeholder="Например: Багаудин"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Номер телефона</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="tel"
                  required
                  placeholder="+7 (999) 000-00-00"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Пароль</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {isRegister && (
              <div className="pt-1 space-y-3">
                {!codeSent ? (
                  <button
                    type="button"
                    onClick={handleRequestCall}
                    disabled={loading}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs py-3 rounded-xl flex items-center justify-center space-x-2 transition-all cursor-pointer"
                  >
                    <PhoneCall className="w-4 h-4 text-blue-600" />
                    <span>Позвонить для подтверждения</span>
                  </button>
                ) : (
                  <div className="space-y-2">
                    <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-[11px] text-blue-800 leading-snug">
                      📞 Вам поступает входящий звонок. Введите <strong>последние 4 цифры</strong> номера.
                    </div>
                    <input
                      type="text"
                      maxLength={4}
                      required
                      placeholder="4 цифры"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      className="w-full text-center text-lg tracking-widest bg-slate-50 border border-slate-200 rounded-xl py-2.5 font-black text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                    {timer > 0 ? (
                      <p className="text-[11px] text-center text-slate-400">Повторный звонок через {timer} сек.</p>
                    ) : (
                      <button
                        type="button"
                        onClick={handleRequestCall}
                        className="text-[11px] text-blue-600 hover:underline w-full text-center font-bold"
                      >
                        Запросить звонок повторно
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || (isRegister && (!code || code.length !== 4))}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-3.5 rounded-xl transition-all disabled:bg-slate-200 disabled:text-slate-400 cursor-pointer"
            >
              {loading ? 'Обработка...' : isRegister ? 'Завершить регистрацию' : 'Войти по паролю'}
            </button>
          </form>

          {/* Переключение Вход / Регистрация */}
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setErrorMsg('');
                setCodeSent(false);
              }}
              className="text-xs text-slate-500 hover:text-slate-800 font-bold cursor-pointer"
            >
              {isRegister ? 'Уже есть аккаунт? Войти' : 'Впервые на сайте? Зарегистрироваться'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}