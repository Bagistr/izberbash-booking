'use client';

import React from 'react';
import Link from 'next/link';
import { Waves, User, LayoutDashboard, LogOut, MessageCircle, HelpCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export const Header: React.FC = () => {
  const { user, logout, switchRole } = useAuth();

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Логотип */}
        <Link href="/" className="flex items-center space-x-1.5 sm:space-x-2">
          <div className="bg-blue-600 p-1.5 sm:p-2 rounded-xl text-white">
            <Waves className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <span className="font-extrabold text-base sm:text-xl tracking-tight text-slate-900">
            Райский<span className="text-blue-600">Пляж</span>
          </span>
        </Link>

        {/* Правая часть: Вход / Кабинет / Мои поездки / Сдать жилье / Поддержка */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Ссылка на поддержку */}
          <Link
            href="/contacts"
            className="inline-flex items-center space-x-1 text-slate-600 hover:text-blue-600 text-xs font-semibold px-2 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
            title="Служба заботы"
          >
            <HelpCircle className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">Помощь</span>
          </Link>

          {user ? (
            <div className="flex items-center space-x-2">
              {/* Прямая ссылка на Мои поездки */}
              <Link
                href="/my-bookings"
                className="inline-flex items-center space-x-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80 text-xs font-bold px-2.5 sm:px-3 py-2 rounded-xl transition-all shadow-xs"
              >
                <span>Мои поездки</span>
                <span className="text-sm">🏖️</span>
              </Link>

              {/* Быстрое переключение роли для арендодателей */}
              {user.is_landlord && (
                <button
                  type="button"
                  onClick={() => {
                    const nextRole = user.role === 'landlord' ? 'guest' : 'landlord';
                    switchRole(nextRole);
                  }}
                  className="inline-flex items-center space-x-1 text-[11px] font-bold px-2.5 py-2 rounded-xl border transition-all cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200"
                  title="Переключить режим"
                >
                  <span>{user.role === 'landlord' ? '🏖️ Режим гостя' : '🔑 Кабинет владельца'}</span>
                </button>
              )}

              {/* Профиль / Личный кабинет */}
              <Link
                href={user.role === 'landlord' ? '/dashboard' : '/profile'}
                className="inline-flex items-center space-x-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold px-3 py-2 rounded-xl transition-all"
              >
                {user.role === 'landlord' ? (
                  <LayoutDashboard className="w-4 h-4 text-blue-600 flex-shrink-0" />
                ) : (
                  <User className="w-4 h-4 text-blue-600 flex-shrink-0" />
                )}
                <span className="max-w-[80px] sm:max-w-[120px] truncate">{user.name || 'Профиль'}</span>
              </Link>

              {user.role === 'landlord' && (
                <Link
                  href="/add-property"
                  className="bg-blue-600 text-white font-bold text-xs px-3 sm:px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors shadow-sm shadow-blue-500/20 whitespace-nowrap hidden md:inline-block"
                >
                  + Сдать жилье
                </Link>
              )}

              <button
                onClick={logout}
                className="p-2 text-slate-400 hover:text-red-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                title="Выйти из аккаунта"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link
                href="/login"
                className="inline-flex items-center space-x-1 text-xs font-bold text-slate-700 hover:text-blue-600 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-xl transition-all"
              >
                <User className="w-3.5 h-3.5 text-blue-600" />
                <span>Войти</span>
              </Link>

              <Link
                href="/add-property"
                className="bg-blue-600 text-white font-bold text-xs px-3 sm:px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors shadow-sm shadow-blue-500/20 whitespace-nowrap"
              >
                Сдать жилье
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};