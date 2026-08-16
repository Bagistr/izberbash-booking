'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Waves, ArrowLeft, Lock, Phone, User as UserIcon, AlertCircle, Compass, Building, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

// Функция маскирования номера в формат 8 (***) *** - ** - **
export function formatPhoneNumber(value: string): string {
  const digits = value.replace(/\D/g, '');
  // Берем только 10 цифр после префикса
  let clean = digits;
  if (clean.startsWith('7') || clean.startsWith('8')) {
    clean = clean.slice(1);
  }
  clean = clean.slice(0, 10);

  if (clean.length === 0) return '';
  if (clean.length <= 3) return `8 (${clean}`;
  if (clean.length <= 6) return `8 (${clean.slice(0, 3)}) ${clean.slice(3)}`;
  if (clean.length <= 8) return `8 (${clean.slice(0, 3)}) ${clean.slice(3, 6)} - ${clean.slice(6)}`;
  return `8 (${clean.slice(0, 3)}) ${clean.slice(3, 6)} - ${clean.slice(6, 8)} - ${clean.slice(8, 10)}`;
}

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [isRegister, setIsRegister] = useState(false);
  const [role, setRole] = useState<'guest' | 'landlord'>('guest');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  
  // Код подтверждения (для регистрации)
  const [codeSent, setCodeSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [timer, setTimer] = useState(0);
  const [sendingCode, setSendingCode] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Таймер обратного отсчета
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhoneNumber(e.target.value));
  };

  const isPhoneComplete = phone.replace(/\D/g, '').length >= 11;

  // Отправка кода подтверждения
  const handleSendCode = async () => {
    if (!isPhoneComplete) {
      setErrorMsg('Пожалуйста, введите полный номер телефона из 10 цифр');
      return;
    }
    setErrorMsg('');
    setSendingCode(true);

    try {
      const res = await fetch('/api/auth/send-telegram-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка отправки кода');

      setCodeSent(true);
      setTimer(45);
      setSuccessMsg('Код подтверждения сформирован и отправлен!');
    } catch (err: any) {
      setErrorMsg(err.message || 'Не удалось отправить код');
    } finally {
      setSendingCode(false);
    }
  };

  // Финальная отправка формы
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    if (!isPhoneComplete) {
      setErrorMsg('Введите полный номер телефона в формате 8 (***) *** - ** - **');
      setLoading(false);
      return;
    }

    if (isRegister && (!verificationCode || verificationCode.length !== 4)) {
      setErrorMsg('Введите 4-значный код подтверждения');
      setLoading(false);
      return;
    }

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
          code: verificationCode,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка входа');

      login(data.user);

      if (data.user.role === 'landlord') {
        router.push('/dashboard');
      } else {
        router.push('/profile');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Ошибка авторизации');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center space-x-2 mb-4">
          <div className="bg-blue-600 p-2 rounded-xl text-white">
            <Waves className="w-6 h-6" />
          </div>
          <span className="font-extrabold text-2xl tracking-tight text-slate-900">
            Райский<span className="text-blue-600">Пляж</span>
          </span>
        </Link>

        <h2 className="text-2xl font-black text-slate-900">
          {isRegister ? 'Регистрация' : 'Вход в аккаунт'}
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          {role === 'guest' ? 'Кабинет туриста: история броней и избранное' : 'Кабинет владельца: шахматка и управление объектами'}
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4">
        {/* Крупный выбор роли */}
        <div className="grid grid-cols-2 gap-2 mb-4 bg-slate-200/80 p-1 rounded-2xl">
          <button
            type="button"
            onClick={() => setRole('guest')}
            className={`py-2.5 text-xs font-extrabold rounded-xl flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
              role === 'guest' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Я Турист</span>
          </button>
          <button
            type="button"
            onClick={() => setRole('landlord')}
            className={`py-2.5 text-xs font-extrabold rounded-xl flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
              role === 'landlord' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>Я Владелец</span>
          </button>
        </div>

        <div className="bg-white py-8 px-6 sm:px-10 rounded-3xl shadow-sm border border-slate-200">
          {errorMsg && (
            <div className="mb-4 p-3.5 bg-red-50 border border-red-200 text-red-600 text-xs font-semibold rounded-2xl flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-2xl flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* ИМЯ (только при регистрации) */}
            {isRegister && (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Ваше имя</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  <input
                    type="text"
                    required
                    placeholder="Магомед"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none font-semibold text-slate-900"
                  />
                </div>
              </div>
            )}

            {/* НОМЕР ТЕЛЕФОНА С ЖЕСТКОЙ МАСКОЙ */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Номер телефона</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <input
                  type="tel"
                  required
                  placeholder="8 (988) 000 - 00 - 00"
                  value={phone}
                  onChange={handlePhoneChange}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none font-bold text-slate-900 tracking-wider"
                />
              </div>
            </div>

            {/* ПАРОЛЬ */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Пароль</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900"
                />
              </div>
            </div>

            {/* ПОДТВЕРЖДЕНИЕ КОДОМ (Только при регистрации) */}
            {isRegister && (
              <div className="pt-2 border-t border-slate-100 space-y-3">
                {!codeSent ? (
                  <button
                    type="button"
                    onClick={handleSendCode}
                    disabled={!isPhoneComplete || sendingCode}
                    className={`w-full text-xs font-bold py-3 rounded-xl transition-all cursor-pointer ${
                      isPhoneComplete
                        ? 'bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    {sendingCode ? 'Отправка...' : 'Получить код подтверждения'}
                  </button>
                ) : (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="block text-xs font-bold text-slate-700 uppercase">
                        4-значный код
                      </label>
                      {timer > 0 ? (
                        <span className="text-[11px] font-semibold text-slate-400">
                          Повтор через {timer} сек
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleSendCode}
                          className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer"
                        >
                          Отправить повторно
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      maxLength={4}
                      placeholder="0000"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                      className="w-full text-center text-lg tracking-[0.5em] font-black bg-slate-50 border border-slate-200 rounded-xl py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900"
                    />
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || (isRegister && (!codeSent || verificationCode.length !== 4))}
              className={`w-full font-bold text-xs py-3.5 rounded-xl transition-all shadow-lg mt-2 cursor-pointer ${
                loading || (isRegister && (!codeSent || verificationCode.length !== 4))
                  ? 'bg-slate-300 text-slate-500 shadow-none cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/25'
              }`}
            >
              {loading
                ? 'Проверка...'
                : isRegister
                ? 'Завершить регистрацию'
                : 'Войти в аккаунт'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setErrorMsg('');
                setSuccessMsg('');
                setCodeSent(false);
                setVerificationCode('');
              }}
              className="text-xs text-blue-600 font-bold hover:underline cursor-pointer"
            >
              {isRegister ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Зарегистрироваться'}
            </button>
          </div>
        </div>

        <div className="text-center mt-4">
          <Link href="/" className="inline-flex items-center text-xs text-slate-500 hover:text-slate-800">
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> На главную страницу
          </Link>
        </div>
      </div>
    </main>
  );
}