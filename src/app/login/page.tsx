'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Waves, ArrowLeft, Lock, Phone, User, AlertCircle, Compass, Home } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [role, setRole] = useState<'guest' | 'landlord'>('guest');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

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
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Ошибка входа');
      }

      // Сохраняем сессию пользователя
      localStorage.setItem('rp_user', JSON.stringify(data.user));
      localStorage.setItem('landlord_user', JSON.stringify(data.user)); // для обратной совместимости

      if (data.user.role === 'landlord') {
        router.push('/dashboard');
      } else {
        router.push('/profile');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Произошла ошибка при авторизации');
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
          {role === 'guest' ? 'Личный кабинет туриста и история поездок' : 'Панель управления для владельцев жилья'}
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4">
        {/* Переключатель: Турист / Арендодатель */}
        <div className="grid grid-cols-2 gap-2 mb-4 bg-slate-200/70 p-1 rounded-2xl">
          <button
            type="button"
            onClick={() => setRole('guest')}
            className={`py-2 text-xs font-bold rounded-xl flex items-center justify-center space-x-1.5 transition-all ${
              role === 'guest' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Я Турист</span>
          </button>
          <button
            type="button"
            onClick={() => setRole('landlord')}
            className={`py-2 text-xs font-bold rounded-xl flex items-center justify-center space-x-1.5 transition-all ${
              role === 'landlord' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Home className="w-4 h-4" />
            <span>Я Владелец</span>
          </button>
        </div>

        <div className="bg-white py-8 px-6 sm:px-10 rounded-3xl shadow-sm border border-slate-200">
          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-xs font-semibold rounded-xl flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            {isRegister && (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Ваше имя</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="Магомед"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Номер телефона</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="tel"
                  required
                  placeholder="+7 988 000 00 00"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Пароль</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-3.5 rounded-xl transition-colors shadow-lg shadow-blue-500/25 mt-2 cursor-pointer"
            >
              {loading ? 'Проверка...' : isRegister ? 'Зарегистрироваться' : 'Войти в кабинет'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <button
              onClick={() => {
                setIsRegister(!isRegister);
                setErrorMsg('');
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