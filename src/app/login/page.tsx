'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Waves, ArrowLeft, Compass, Building, Send, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [role, setRole] = useState<'guest' | 'landlord'>('guest');
  const [loadingTg, setLoadingTg] = useState(false);
  const [activeSessionToken, setActiveSessionToken] = useState<string | null>(null);
  const [waitingVerification, setWaitingVerification] = useState(false);

  // Опрос статуса подтверждения
  useEffect(() => {
    if (!activeSessionToken || !waitingVerification) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/auth/telegram-check?token=${activeSessionToken}`);
        if (res.ok) {
          const data = await res.json();
          if (data.verified && data.user) {
            clearInterval(interval);
            login({
              name: data.user.name,
              phone: data.user.phone,
              role: data.user.role || role,
            });

            if (role === 'landlord') {
              router.push('/dashboard');
            } else {
              router.push('/profile');
            }
          }
        }
      } catch (e) {
        console.error(e);
      }
    }, 2000); // проверяем каждые 2 секунды

    return () => clearInterval(interval);
  }, [activeSessionToken, waitingVerification, login, role, router]);

  const handleStartTelegramAuth = async () => {
    setLoadingTg(true);
    try {
      const res = await fetch('/api/auth/telegram-init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });

      const data = await res.json();
      if (data.telegramUrl) {
        setActiveSessionToken(data.sessionToken);
        setWaitingVerification(true);
        // Открываем Telegram в новом окне
        window.open(data.telegramUrl, '_blank');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingTg(false);
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
          Быстрый вход через Telegram
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          {role === 'guest'
            ? 'Кабинет туриста: бронирования и избранное'
            : 'Кабинет владельца: шахматка и управление объектами'}
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4">
        {/* Выбор роли */}
        <div className="grid grid-cols-2 gap-2 mb-4 bg-slate-200/80 p-1 rounded-2xl">
          <button
            type="button"
            onClick={() => setRole('guest')}
            className={`py-2.5 text-xs font-extrabold rounded-xl flex items-center justify-center space-x-1.5 transition-all ${
              role === 'guest' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Я Турист</span>
          </button>
          <button
            type="button"
            onClick={() => setRole('landlord')}
            className={`py-2.5 text-xs font-extrabold rounded-xl flex items-center justify-center space-x-1.5 transition-all ${
              role === 'landlord' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>Я Владелец</span>
          </button>
        </div>

        <div className="bg-white py-8 px-6 sm:px-10 rounded-3xl shadow-sm border border-slate-200 text-center space-y-5">
          {waitingVerification ? (
            <div className="py-4 space-y-3">
              <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto" />
              <h3 className="text-base font-bold text-slate-900">Ожидаем подтверждения в Telegram...</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Перейдите в открывшегося бота и нажмите кнопку «📱 Подтвердить номер телефона».
              </p>
              <button
                onClick={() => setWaitingVerification(false)}
                className="text-xs text-slate-400 hover:text-slate-700 underline pt-2"
              >
                Отмена
              </button>
            </div>
          ) : (
            <>
              <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-100 flex items-center space-x-3 text-left">
                <div className="p-2.5 bg-blue-600 text-white rounded-xl flex-shrink-0">
                  <Send className="w-5 h-5" />
                </div>
                <div className="text-xs text-slate-600">
                  <p className="font-bold text-slate-900">Вход в 1 клик</p>
                  <p>Без паролей и SMS-кодов — через официального бота.</p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleStartTelegramAuth}
                disabled={loadingTg}
                className="w-full bg-[#229ED9] hover:bg-[#1E88E5] text-white font-bold text-sm py-4 rounded-2xl transition-all shadow-lg shadow-[#229ED9]/25 flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>{loadingTg ? 'Подключение...' : 'Войти через Telegram'}</span>
              </button>
            </>
          )}
        </div>

        <div className="text-center mt-6">
          <Link href="/" className="inline-flex items-center text-xs text-slate-500 hover:text-slate-800">
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> На главную страницу
          </Link>
        </div>
      </div>
    </main>
  );
}