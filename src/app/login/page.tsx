'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Waves, Phone, Lock, User, ArrowRight, ShieldCheck, CheckCircle2, PhoneCall } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { user, login } = useAuth();

  const [role, setRole] = useState<'guest' | 'landlord'>('guest');
  const [isRegister, setIsRegister] = useState(false);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');

  const [codeSent, setCodeSent] = useState(false);
  const [timer, setTimer] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const tgRef = useRef<HTMLDivElement>(null);

  // Перенаправляем, если уже залогинен
  useEffect(() => {
    if (user) {
      router.push(user.role === 'landlord' ? '/dashboard' : '/');
    }
  }, [user, router]);

  // Таймер обратного отсчета для повтора звонка
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  // Подключение Telegram Login Widget
  useEffect(() => {
    const botName = process.env.NEXT_PUBLIC_TELEGRAM_BOT_NAME;
    if (!botName || !tgRef.current) return;

    (window as any).onTelegramAuth = async (tgUser: any) => {
      try {
        setLoading(true);
        const res = await fetch('/api/auth/telegram', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...tgUser, role }),
        });

        const data = await res.json();
        if (res.ok && data.user) {
          login(data.user);
          router.push(data.user.role === 'landlord' ? '/dashboard' : '/');
        } else {
          setErrorMsg(data.error || 'Ошибка входа через Telegram');
        }
      } catch (e) {
        setErrorMsg('Не удалось войти через Telegram');
      } finally {
        setLoading(false);
      }
    };

    tgRef.current.innerHTML = '';
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.setAttribute('data-telegram-login', botName);
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-radius', '12');
    script.setAttribute('data-onauth', 'onTelegramAuth(user)');
    script.setAttribute('data-request-access', 'write');
    script.async = true;
    tgRef.current.appendChild(script);
  }, [role, login, router]);

  // Запрос входящего звонка через Zvonok.com
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
        body: JSON.stringify({ phone }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка запроса звонка');

      setCodeSent(true);
      setTimer(60);
    } catch (err: any) {
      setErrorMsg(err.message || 'Не удалось заказать звонок');
    } finally {
      setLoading(false);
    }
  };

  // Финальная отправка формы (Вход или Регистрация)
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
      setErrorMsg(err.message || 'Ошибка');
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
          
          {/* Выбор роли */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl">
            <button
              type="button"
              onClick={() => setRole('guest')}
              className={`py-2.5 text-xs font-bold rounded-xl transition-all ${
                role === 'guest' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
              }`}
            >
              Я Турист
            </button>
            <button
              type="button"
              onClick={() => setRole('landlord')}
              className={`py-2.5 text-xs font-bold rounded-xl transition-all ${
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

          {/* Быстрый вход через Telegram */}
          <div className="space-y-3">
            <div className="flex justify-center" ref={tgRef}></div>
            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink mx-3 text-[11px] font-bold text-slate-400 uppercase">или по номеру телефона</span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>
          </div>

          {/* Форма авторизации */}
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

            {/* Блок подтверждения звонком при регистрации */}
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
                      📞 Вам поступает входящий звонок-сброс. Введите <strong>последние 4 цифры</strong> номера, который вам звонит.
                    </div>
                    <input
                      type="text"
                      maxLength={4}
                      required
                      placeholder="Последние 4 цифры"
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
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-3.5 rounded-xl shadow-lg shadow-blue-500/20 transition-all disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none cursor-pointer"
            >
              {loading ? 'Обработка...' : isRegister ? 'Завершить регистрацию' : 'Войти'}
            </button>
          </form>

          {/* Переключение режима Вход / Регистрация */}
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setErrorMsg('');
                setCodeSent(false);
              }}
              className="text-xs text-slate-500 hover:text-slate-800 font-bold"
            >
              {isRegister ? 'Уже есть аккаунт? Войти' : 'Впервые на сайте? Зарегистрироваться'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}