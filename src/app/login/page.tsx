'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Waves, Phone, Lock, User, PhoneCall, Loader2, CheckCircle2, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { user, login } = useAuth();

  const [role, setRole] = useState<'guest' | 'landlord'>('guest');
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot'>('login');

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Звонок от клиента
  const [waitingCall, setWaitingCall] = useState(false);
  const [targetPhone, setTargetPhone] = useState('+7 (930) 555-86-07');
  const [callVerified, setCallVerified] = useState(false);

  // Telegram
  const [tgLoading, setTgLoading] = useState(false);
  const [tgWaiting, setTgWaiting] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const callCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (user) {
      router.push(user.role === 'landlord' ? '/dashboard' : '/');
    }
  }, [user, router]);

  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
      if (callCheckIntervalRef.current) clearInterval(callCheckIntervalRef.current);
    };
  }, []);

  // Форматирование номера телефона в красивый формат: +7 (999) 000-00-00
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value.replace(/\D/g, '');
    let clean = input;

    if (clean.startsWith('7') || clean.startsWith('8')) {
      clean = clean.slice(1);
    }
    clean = clean.slice(0, 10); // Строго максимум 10 цифр после +7

    let formatted = '+7';
    if (clean.length > 0) {
      formatted += ` (${clean.slice(0, 3)}`;
    }
    if (clean.length >= 4) {
      formatted += `) ${clean.slice(3, 6)}`;
    }
    if (clean.length >= 7) {
      formatted += `-${clean.slice(6, 8)}`;
    }
    if (clean.length >= 9) {
      formatted += `-${clean.slice(8, 10)}`;
    }

    setPhone(clean.length === 0 ? '' : formatted);
  };

  // Вход через Telegram
  const handleTelegramLogin = async () => {
    setErrorMsg('');
    setTgLoading(true);

    try {
      const res = await fetch('/api/auth/tg-session', { method: 'POST' });
      const data = await res.json();

      if (!res.ok || !data.tgUrl) throw new Error(data.error || 'Ошибка создания сессии');

      setTgWaiting(true);
      window.open(data.tgUrl, '_blank');

      pollingIntervalRef.current = setInterval(async () => {
        try {
          const checkRes = await fetch(`/api/auth/tg-session?token=${data.token}`);
          const checkData = await checkRes.json();

          if (checkData.status === 'authorized' && checkData.user) {
            if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
            login(checkData.user);
            router.push(checkData.user.role === 'landlord' ? '/dashboard' : '/');
          }
        } catch (e) {
          console.error(e);
        }
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Не удалось открыть Telegram');
      setTgLoading(false);
      setTgWaiting(false);
    }
  };

  // Запуск проверки звонком
  const handleInitClientCall = async () => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 11) {
      setErrorMsg('Введите полный номер телефона (10 цифр)');
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
          action: authMode === 'forgot' ? 'reset_password' : authMode === 'register' ? 'register' : 'login',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка проверки номера');

      setTargetPhone(data.targetCallPhone || '+7 (930) 555-86-07');
      setWaitingCall(true);

      callCheckIntervalRef.current = setInterval(async () => {
        try {
          const statusRes = await fetch(`/api/auth/send-code?phone=${encodeURIComponent(phone)}`);
          const statusData = await statusRes.json();

          if (statusData.verified) {
            if (callCheckIntervalRef.current) clearInterval(callCheckIntervalRef.current);
            setCallVerified(true);
            setWaitingCall(false);
          }
        } catch (e) {
          console.error(e);
        }
      }, 2000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Ошибка сервиса звонков');
    } finally {
      setLoading(false);
    }
  };

  // Сброс пароля
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!callVerified) {
      setErrorMsg('Пожалуйста, подтвердите номер звонком');
      return;
    }
    if (!newPassword || newPassword.length < 4) {
      setErrorMsg('Пароль должен содержать минимум 4 символа');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password: newPassword }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка сброса пароля');

      setSuccessMsg('Пароль успешно изменен! Выполняется вход...');
      setTimeout(() => {
        login(data.user);
        router.push(data.user.role === 'landlord' ? '/dashboard' : '/');
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Ошибка смены пароля');
    } finally {
      setLoading(false);
    }
  };

  // Авторизация / Регистрация
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: authMode === 'register' ? 'register' : 'login',
          name,
          phone,
          password,
          role,
          skip_code_check: callVerified,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка входа');

      login(data.user);
      router.push(data.user.role === 'landlord' ? '/dashboard' : '/');
    } catch (err: any) {
      setErrorMsg(err.message || 'Ошибка авторизации');
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
          {authMode === 'forgot'
            ? 'Восстановление пароля'
            : authMode === 'register'
            ? 'Создание аккаунта'
            : 'Вход в личный кабинет'}
        </h2>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          
          {authMode !== 'forgot' && (
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
          )}

          {errorMsg && (
            <div className="p-3.5 bg-red-50 text-red-600 border border-red-200 rounded-2xl text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-2xl text-xs font-semibold">
              {successMsg}
            </div>
          )}

          {/* Быстрый вход через Telegram (только для режима входа/регистрации) */}
          {authMode !== 'forgot' && (
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleTelegramLogin}
                disabled={tgLoading}
                className="w-full bg-[#229ED9] hover:bg-[#1E88E5] text-white font-bold text-sm py-3.5 px-4 rounded-2xl flex items-center justify-center space-x-2.5 shadow-lg shadow-blue-400/25 transition-all cursor-pointer"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
                </svg>
                <span>Войти через Telegram</span>
              </button>

              {tgWaiting && (
                <div className="p-3.5 bg-blue-50 border border-blue-100 rounded-2xl flex items-center space-x-3 text-left">
                  <Loader2 className="w-5 h-5 text-blue-600 animate-spin flex-shrink-0" />
                  <p className="text-xs text-blue-800 font-medium leading-relaxed">
                    Нажмите <b>«Запустить» (Start)</b> в открывшемся боте — страница автоматически откроется.
                  </p>
                </div>
              )}

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink mx-3 text-[11px] font-bold text-slate-400 uppercase">или по номеру телефона</span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>
            </div>
          )}

          {/* ФОРМА ВОССТАНОВЛЕНИЯ ПАРОЛЯ */}
          {authMode === 'forgot' ? (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Ваш номер телефона</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="tel"
                    required
                    disabled={callVerified}
                    placeholder="+7 (999) 000-00-00"
                    value={phone}
                    onChange={handlePhoneChange}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-slate-100"
                  />
                </div>
              </div>

              {/* Звонок для подтверждения сброса */}
              <div className="pt-1 space-y-3">
                {!waitingCall && !callVerified && (
                  <button
                    type="button"
                    onClick={handleInitClientCall}
                    disabled={loading}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs py-3 rounded-xl flex items-center justify-center space-x-2 transition-all cursor-pointer"
                  >
                    <PhoneCall className="w-4 h-4 text-blue-600" />
                    <span>Подтвердить номер звонком</span>
                  </button>
                )}

                {waitingCall && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl text-center space-y-2">
                    <p className="text-xs text-slate-700 font-semibold">
                      Пожалуйста, позвоните на бесплатный номер:
                    </p>
                    <a
                      href={`tel:${targetPhone}`}
                      className="block text-lg font-black text-blue-600 bg-white py-2 rounded-xl border border-blue-200 shadow-sm tracking-wider hover:bg-blue-50 transition-colors"
                    >
                      {targetPhone}
                    </a>
                    <div className="flex items-center justify-center space-x-1.5 text-[11px] text-slate-500 animate-pulse pt-1">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Ожидаем звонок (сбросится автоматически)...</span>
                    </div>
                  </div>
                )}

                {callVerified && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center space-x-2 text-emerald-700 text-xs font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Номер подтвержден! Введите новый пароль.</span>
                  </div>
                )}
              </div>

              {callVerified && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Новый пароль</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="password"
                      required
                      placeholder="Минимум 4 символа"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !callVerified}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-3.5 rounded-xl transition-all disabled:bg-slate-200 disabled:text-slate-400 cursor-pointer"
              >
                {loading ? 'Сохранение...' : 'Установить новый пароль и войти'}
              </button>
            </form>
          ) : (
            /* СТАНДАРТНАЯ ФОРМА ВХОДА И РЕГИСТРАЦИИ */
            <form onSubmit={handleSubmit} className="space-y-4">
              {authMode === 'register' && (
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
                    onChange={handlePhoneChange}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase">Пароль</label>
                  {authMode === 'login' && (
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('forgot');
                        setErrorMsg('');
                        setWaitingCall(false);
                        setCallVerified(false);
                      }}
                      className="text-[11px] text-blue-600 hover:text-blue-800 font-bold cursor-pointer"
                    >
                      Забыли пароль?
                    </button>
                  )}
                </div>
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

              {/* Подтверждение входящим звонком от клиента при регистрации */}
              {authMode === 'register' && (
                <div className="pt-1 space-y-3">
                  {!waitingCall && !callVerified && (
                    <button
                      type="button"
                      onClick={handleInitClientCall}
                      disabled={loading}
                      className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs py-3 rounded-xl flex items-center justify-center space-x-2 transition-all cursor-pointer"
                    >
                      <PhoneCall className="w-4 h-4 text-blue-600" />
                      <span>Подтвердить номер звонком</span>
                    </button>
                  )}

                  {waitingCall && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl text-center space-y-2">
                      <p className="text-xs text-slate-700 font-semibold">
                        Пожалуйста, позвоните на бесплатный номер:
                      </p>
                      <a
                        href={`tel:${targetPhone}`}
                        className="block text-lg font-black text-blue-600 bg-white py-2 rounded-xl border border-blue-200 shadow-sm tracking-wider hover:bg-blue-50 transition-colors"
                      >
                        {targetPhone}
                      </a>
                      <div className="flex items-center justify-center space-x-1.5 text-[11px] text-slate-500 animate-pulse pt-1">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Ожидаем звонок (сбросится автоматически)...</span>
                      </div>
                    </div>
                  )}

                  {callVerified && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center space-x-2 text-emerald-700 text-xs font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span>Номер успешно подтвержден!</span>
                    </div>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || (authMode === 'register' && !callVerified)}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-3.5 rounded-xl transition-all disabled:bg-slate-200 disabled:text-slate-400 cursor-pointer"
              >
                {loading ? 'Обработка...' : authMode === 'register' ? 'Завершить регистрацию' : 'Войти'}
              </button>
            </form>
          )}

          <div className="text-center pt-2">
            {authMode === 'forgot' ? (
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setErrorMsg('');
                  setWaitingCall(false);
                  setCallVerified(false);
                }}
                className="text-xs text-slate-500 hover:text-slate-800 font-bold cursor-pointer"
              >
                ← Вернуться ко входу
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setAuthMode(authMode === 'login' ? 'register' : 'login');
                  setErrorMsg('');
                  setWaitingCall(false);
                  setCallVerified(false);
                }}
                className="text-xs text-slate-500 hover:text-slate-800 font-bold cursor-pointer"
              >
                {authMode === 'register' ? 'Уже есть аккаунт? Войти' : 'Впервые на сайте? Зарегистрироваться'}
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}