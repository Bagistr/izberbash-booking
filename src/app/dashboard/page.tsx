'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  Waves, DollarSign, TrendingUp, Users, Calendar as CalendarIcon,
  Plus, LogOut, Edit3, Eye, EyeOff, ChevronLeft, ChevronRight,
  X, Lock, Unlock, Phone, User, PlusCircle, CreditCard, ArrowUpRight,
  Star, MessageSquare, CornerDownRight, Sparkles, Send, Loader2
} from 'lucide-react';
import { Property } from '@/types/property';

interface BookingItem {
  id: string;
  property_id: string;
  unit_id?: string;
  property_title: string;
  guest_name: string;
  guest_phone: string;
  guest_telegram?: string;
  check_in: string;
  check_out: string;
  total_days: number;
  total_price: number;
  status: string;
}

const PRESET_AMENITIES = [
  'Wi-Fi', 'Кондиционер', 'Мангал', 'Бассейн', 'Беседка', 
  'Лежак / Шезлонг', 'Парковка', 'Баня / Сауна', 'Вид на море', 
  'Стиральная машина', 'Телевизор', 'Детская площадка'
];

const MONTH_NAMES = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];
const DAY_NAMES = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

export default function DashboardPage() {
  const router = useRouter();
  const { user, logout, isLoading } = useAuth();

  const [properties, setProperties] = useState<Property[]>([]);
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    netRevenue: 0,
    platformCommission: 0,
    totalGuests: 0,
    avgDays: '0',
  });
  const [dataLoading, setDataLoading] = useState(true);

  // Состояния для баланса и вывода средств
  const [balance, setBalance] = useState<number>(0);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawMsg, setWithdrawMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Календарь
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedPropertyFilter, setSelectedPropertyFilter] = useState<string>('all');
  const [selectedDayBookings, setSelectedDayBookings] = useState<BookingItem[] | null>(null);
  const [selectedDayDate, setSelectedDayDate] = useState<string | null>(null);

  // Модалка блокировки дат
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [blockForm, setBlockForm] = useState({
    property_id: '',
    unit_id: '',
    check_in: '',
    check_out: '',
    source_note: 'Авито',
  });
  const [savingBlock, setSavingBlock] = useState(false);
  const [blockError, setBlockError] = useState('');

  // Редактирование
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [editFormData, setEditFormData] = useState<any>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  // Отзывы гостей и ответы владельца
  const [reviews, setReviews] = useState<any[]>([]);
  const [replyingReviewId, setReplyingReviewId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [savingReply, setSavingReply] = useState(false);

  const loadData = useCallback(async (phone: string) => {
    try {
      const res = await fetch(`/api/landlord/properties?phone=${encodeURIComponent(phone)}`);
      if (res.ok) {
        const data = await res.json();
        setProperties(data.properties || []);
        setBookings(data.bookings || []);
        if (data.stats) setStats(data.stats);

        if (data.properties && data.properties.length > 0) {
          setBlockForm((prev) => ({
            ...prev,
            property_id: prev.property_id || data.properties[0].id,
          }));
        }
      }

      // Загрузка отзывов для всех объектов владельца
      const reviewsRes = await fetch(`/api/reviews?ownerPhone=${encodeURIComponent(phone)}`);
      if (reviewsRes.ok) {
        const revData = await reviewsRes.json();
        setReviews(revData.reviews || []);
      }

      // Загрузка баланса
      const balanceRes = await fetch(`/api/landlord/balance?phone=${encodeURIComponent(phone)}`);
      if (balanceRes.ok) {
        const balanceData = await balanceRes.json();
        setBalance(balanceData.balance || 0);
        if (balanceData.payout_card) setCardNumber(balanceData.payout_card);
        if (balanceData.payout_bank) setBankName(balanceData.payout_bank);
      }
    } catch (err) {
      console.error('Ошибка загрузки дашборда:', err);
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.push('/login');
      return;
    }

    if (user.role !== 'landlord') {
      router.push('/profile');
      return;
    }

    loadData(user.phone);
  }, [user, isLoading, router, loadData]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawLoading(true);
    setWithdrawMsg(null);

    try {
      const res = await fetch('/api/landlord/payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: user?.phone,
          amount: Number(withdrawAmount),
          cardNumber,
          bankName,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка вывода');

      setWithdrawMsg({ type: 'success', text: 'Заявка на вывод отправлена! Средства поступят на карту.' });
      setBalance(data.newBalance);
      setWithdrawAmount('');
      setTimeout(() => {
        setShowWithdrawModal(false);
        setWithdrawMsg(null);
      }, 2500);
    } catch (err: any) {
      setWithdrawMsg({ type: 'error', text: err.message || 'Ошибка' });
    } finally {
      setWithdrawLoading(false);
    }
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  let startDayOfWeek = firstDayOfMonth.getDay() - 1;
  if (startDayOfWeek === -1) startDayOfWeek = 6;

  const filteredBookings = selectedPropertyFilter === 'all'
    ? bookings
    : bookings.filter((b) => b.property_id === selectedPropertyFilter);

  const getBookingsForDate = (dateStr: string) => {
    const target = new Date(dateStr).getTime();
    return filteredBookings.filter((b) => {
      const inDate = new Date(b.check_in.slice(0, 10)).getTime();
      const outDate = new Date(b.check_out.slice(0, 10)).getTime();
      return target >= inDate && target < outDate;
    });
  };

  const handleFreeDayClick = (dateStr: string) => {
    const nextDate = new Date(dateStr);
    nextDate.setDate(nextDate.getDate() + 1);
    const nextDateStr = nextDate.toISOString().slice(0, 10);

    setBlockForm((prev) => ({
      ...prev,
      property_id: selectedPropertyFilter !== 'all' ? selectedPropertyFilter : (properties[0]?.id || ''),
      check_in: dateStr,
      check_out: nextDateStr,
      source_note: 'Авито',
    }));
    setBlockError('');
    setIsBlockModalOpen(true);
  };

  const handleSaveBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBlock(true);
    setBlockError('');

    try {
      const res = await fetch('/api/landlord/block-dates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(blockForm),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка при закрытии дат');

      setIsBlockModalOpen(false);
      if (user) loadData(user.phone);
    } catch (err: any) {
      setBlockError(err.message || 'Не удалось заблокировать даты');
    } finally {
      setSavingBlock(false);
    }
  };

  const handleUnlockBooking = async (bookingId: string) => {
    if (!confirm('Вы уверены, что хотите разблокировать эти даты?')) return;

    try {
      const res = await fetch(`/api/landlord/block-dates?id=${bookingId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setSelectedDayBookings(null);
        if (user) loadData(user.phone);
      }
    } catch (err) {
      console.error('Ошибка удаления блокировки:', err);
    }
  };

  const handleOpenEdit = (p: Property) => {
    setEditingProperty(p);
    setEditFormData({
      ...p,
      amenities: p.amenities || [],
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFormData) return;
    setSavingEdit(true);

    try {
      const res = await fetch('/api/landlord/properties', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData),
      });

      if (res.ok) {
        setProperties((prev) =>
          prev.map((p) => (p.id === editFormData.id ? { ...editFormData } : p))
        );
        setEditingProperty(null);
      }
    } catch (err) {
      console.error('Ошибка сохранения:', err);
    } finally {
      setSavingEdit(false);
    }
  };

  const toggleAmenity = (amenity: string) => {
    if (!editFormData) return;
    const current = editFormData.amenities || [];
    const updated = current.includes(amenity)
      ? current.filter((a: string) => a !== amenity)
      : [...current, amenity];
    setEditFormData({ ...editFormData, amenities: updated });
  };

  const togglePropertyStatus = async (p: Property) => {
    const updatedStatus = !p.is_active;

    setProperties((prev) =>
      prev.map((item) => (item.id === p.id ? { ...item, is_active: updatedStatus } : item))
    );

    try {
      const res = await fetch('/api/landlord/properties', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: p.id, is_active: updatedStatus }),
      });

      if (!res.ok) {
        throw new Error('Ошибка обновления статуса');
      }
    } catch (err) {
      console.error('Ошибка изменения статуса:', err);
      setProperties((prev) =>
        prev.map((item) => (item.id === p.id ? { ...item, is_active: !updatedStatus } : item))
      );
    }
  };

  const handleSendReply = async (reviewId: string) => {
    if (!replyText.trim()) return;
    setSavingReply(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId, hostReply: replyText.trim() }),
      });
      if (res.ok) {
        setReplyingReviewId(null);
        setReplyText('');
        if (user?.phone) loadData(user.phone);
      }
    } catch (e) {
      console.error('Ошибка отправки ответа:', e);
    } finally {
      setSavingReply(false);
    }
  };

  if (isLoading || dataLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-sm font-semibold text-slate-500 animate-pulse">Загрузка кабинета владельца...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-16">
      {/* Хедер */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="bg-blue-600 p-2 rounded-xl text-white">
              <Waves className="w-6 h-6" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-slate-900">
              Кабинет <span className="text-blue-600">Владельца</span>
            </span>
          </Link>

          <div className="flex items-center space-x-3">
            <span className="text-xs font-bold text-slate-600 hidden sm:inline-block">
              {user?.name} ({user?.phone})
            </span>
            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-red-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              title="Выйти"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Панель управления</h1>
            <p className="text-slate-500 text-sm mt-1">
              Финансовый учет и шахматка бронирований в реальном времени.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsBlockModalOpen(true)}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-3 rounded-2xl transition-colors inline-flex items-center space-x-1.5 shadow-sm cursor-pointer"
            >
              <Lock className="w-4 h-4 text-amber-400" />
              <span>Закрыть даты</span>
            </button>

            <Link
              href="/add-property"
              className="bg-[#0D9488] hover:bg-[#0F766E] text-white font-bold text-xs px-4 py-3 rounded-2xl transition-colors inline-flex items-center space-x-1.5 shadow-lg shadow-teal-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>Добавить жилье</span>
            </Link>
          </div>
        </div>

        {/* 1. КАРТОЧКА БАЛАНСА ВЛАДЕЛЬЦА */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Баланс предоплат (10%)
              </span>
              <span className="text-[11px] text-emerald-600 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                0% комиссии платформы
              </span>
            </div>
            <div className="flex items-baseline space-x-2">
              <h3 className="text-3xl sm:text-4xl font-black text-slate-900">
                {balance.toLocaleString('ru-RU')} ₽
              </h3>
            </div>
            <p className="text-xs text-slate-500 max-w-xl">
              Предоплата 10% от гостей зачисляется сюда в момент бронирования. Вы можете вывести её на карту в любой момент.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowWithdrawModal(true)}
            disabled={balance <= 0}
            className={`px-5 py-3.5 rounded-2xl font-bold text-xs transition-all flex items-center space-x-2 flex-shrink-0 cursor-pointer ${
              balance > 0
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Вывести на карту</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 2. БЛОК АНАЛИТИКИ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase">Общий оборот</span>
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900">{stats.totalRevenue.toLocaleString('ru-RU')} ₽</p>
            <p className="text-[11px] text-emerald-600 font-bold">100% сумма бронирований</p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase">Комиссия сервиса</span>
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl font-black text-emerald-600">0 ₽</p>
            <p className="text-[11px] text-slate-400">Бесплатно для владельцев</p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase">Заселено гостей</span>
              <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900">{stats.totalGuests} туристов</p>
            <p className="text-[11px] text-slate-400">Прямые бронирования</p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase">Средний срок брони</span>
              <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                <CalendarIcon className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900">{stats.avgDays} ночи</p>
            <p className="text-[11px] text-slate-400">Средняя продолжительность</p>
          </div>
        </div>

        {/* 3. ИНТЕРАКТИВНАЯ ШАХМАТКА ЗАСЕЛЕННОСТИ */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <CalendarIcon className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Шахматка заселённости</h2>
                <p className="text-xs text-slate-500">Кликните по любой свободной ячейке, чтобы быстро закрыть дату</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <select
                value={selectedPropertyFilter}
                onChange={(e) => setSelectedPropertyFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-800"
              >
                <option value="all">Все мои объекты</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>

              <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl">
                <button onClick={prevMonth} className="p-1.5 hover:bg-white rounded-lg transition-colors text-slate-700">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-bold text-slate-800 px-2 min-w-[120px] text-center">
                  {MONTH_NAMES[month]} {year}
                </span>
                <button onClick={nextMonth} className="p-1.5 hover:bg-white rounded-lg transition-colors text-slate-700">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div>
            <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-bold text-slate-400">
              {DAY_NAMES.map((d, i) => (
                <div key={i}>{d}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {[...Array(startDayOfWeek)].map((_, i) => (
                <div key={`empty-${i}`} className="h-16 sm:h-20 bg-slate-50/50 rounded-2xl border border-dashed border-slate-100" />
              ))}

              {[...Array(daysInMonth)].map((_, i) => {
                const dayNum = i + 1;
                const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                const dayBookings = getBookingsForDate(formattedDate);
                const isOccupied = dayBookings.length > 0;
                const hasPlatformBooking = dayBookings.some((b) => b.status !== 'blocked');

                return (
                  <div
                    key={dayNum}
                    onClick={() => {
                      if (isOccupied) {
                        setSelectedDayBookings(dayBookings);
                        setSelectedDayDate(formattedDate);
                      } else {
                        handleFreeDayClick(formattedDate);
                      }
                    }}
                    className={`h-16 sm:h-20 p-1.5 sm:p-2 rounded-2xl border transition-all flex flex-col justify-between group cursor-pointer ${
                      isOccupied
                        ? hasPlatformBooking
                          ? 'bg-blue-50 border-blue-200 hover:border-blue-400 shadow-sm'
                          : 'bg-slate-100 border-slate-300 hover:border-slate-400 shadow-sm'
                        : 'bg-white border-slate-200 hover:border-teal-500 hover:bg-teal-50/30'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className={`text-xs font-bold ${isOccupied ? (hasPlatformBooking ? 'text-blue-700' : 'text-slate-700') : 'text-slate-600'}`}>
                        {dayNum}
                      </span>
                      {isOccupied ? (
                        <span className={`w-2 h-2 rounded-full ${hasPlatformBooking ? 'bg-blue-600' : 'bg-slate-500'}`}></span>
                      ) : (
                        <PlusCircle className="w-3.5 h-3.5 text-teal-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>

                    {isOccupied && (
                      <div className="space-y-0.5">
                        {dayBookings.slice(0, 2).map((b, idx) => (
                          <div
                            key={idx}
                            className={`text-[9px] sm:text-[10px] font-bold text-white rounded-lg px-1.5 py-0.5 truncate ${
                              b.status === 'blocked' ? 'bg-slate-600' : 'bg-blue-600'
                            }`}
                          >
                            {b.status === 'blocked' ? `🔒 ${b.guest_name}` : b.guest_name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 4. МОИ ОБЪЯВЛЕНИЯ */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="text-lg font-bold text-slate-900">Мои объекты ({properties.length})</h2>
          </div>

          {properties.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-slate-500 text-sm mb-4">У вас пока нет добавленных объектов.</p>
              <Link href="/add-property" className="bg-[#0D9488] text-white font-bold text-xs px-5 py-3 rounded-2xl hover:bg-[#0F766E] transition-colors inline-block">
                Добавить объект
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {properties.map((p) => {
                const photo = p.photos?.[0] || 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=600&q=80';

                return (
                  <div key={p.id} className="p-4 sm:p-5 rounded-2xl border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-50/50">
                    <div className="flex items-center space-x-4">
                      <img src={photo} alt={p.title} className="w-20 h-20 rounded-2xl object-cover flex-shrink-0" />
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-bold text-slate-900 text-sm sm:text-base">{p.title}</h3>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${p.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                            {p.is_active ? 'Опубликован' : 'Скрыт'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{p.address} • {p.distance_to_sea} м до моря</p>
                        <p className="text-sm font-black text-blue-600 mt-1">
                          {p.price_per_night.toLocaleString('ru-RU')} ₽ <span className="text-xs text-slate-400 font-normal">/ ночь</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 w-full md:w-auto justify-end pt-2 md:pt-0 border-t md:border-t-0 border-slate-200">
                      <button onClick={() => handleOpenEdit(p)} className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl flex items-center space-x-1.5 transition-colors">
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Редактировать</span>
                      </button>

                      <button onClick={() => togglePropertyStatus(p)} className={`p-2.5 rounded-xl text-xs font-bold transition-colors ${p.is_active ? 'bg-slate-200 hover:bg-slate-300 text-slate-700' : 'bg-blue-600 text-white'}`}>
                        {p.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 5. ОТЗЫВЫ ГОСТЕЙ И УРОВЕНЬ РАХАТА */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <span>Отзывы гостей и рейтинг «Уровень Рахата»</span>
                <span>☀️</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Отзывы путешественников на ваши объекты. Отвечайте гостям для укрепления репутации!
              </p>
            </div>
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl self-start sm:self-auto">
              Всего отзывов: {reviews.length}
            </span>
          </div>

          {reviews.length === 0 ? (
            <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-6 space-y-2">
              <span className="text-3xl">🏖️</span>
              <p className="text-sm font-bold text-slate-700">Пока нет отзывов от гостей</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Когда туристы проживут в ваших домиках и выставят оценку «Уровень Рахата», отзывы появятся здесь.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((rev) => (
                <div key={rev.id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{rev.author_name || 'Гость'}</span>
                        <span className="text-xs text-slate-400">• {rev.property_title}</span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        {rev.created_at ? new Date(rev.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Недавно'}
                      </p>
                    </div>

                    <div className="inline-flex items-center gap-1.5 bg-amber-100/70 border border-amber-200 text-amber-900 px-3 py-1 rounded-xl text-xs font-bold self-start sm:self-auto">
                      <span>☀️</span>
                      <span>{Number(rev.rating)} / 5 Рахата</span>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
                    «{rev.comment}»
                  </p>

                  {/* Блок ответа хозяина */}
                  {rev.host_reply ? (
                    <div className="bg-blue-50/80 border border-blue-100 p-3.5 rounded-xl space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-blue-900 text-xs flex items-center gap-1">
                          <CornerDownRight className="w-3.5 h-3.5 text-blue-600" />
                          <span>Ваш официальный ответ:</span>
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setReplyingReviewId(rev.id);
                            setReplyText(rev.host_reply);
                          }}
                          className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer"
                        >
                          Изменить
                        </button>
                      </div>
                      <p className="text-xs text-blue-950 italic">«{rev.host_reply}»</p>
                    </div>
                  ) : null}

                  {/* Форма ответа */}
                  {replyingReviewId === rev.id ? (
                    <div className="pt-2 space-y-2">
                      <label className="block text-[11px] font-bold text-slate-600 uppercase">
                        {rev.host_reply ? 'Редактировать ответ' : 'Ваш ответ гостю (будет виден на странице жилья)'}
                      </label>
                      <textarea
                        rows={2}
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Например: Спасибо за тёплые слова! Будем рады видеть вас снова ☀️"
                        className="w-full text-xs bg-white border border-slate-300 rounded-xl p-3 font-medium text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleSendReply(rev.id)}
                          disabled={savingReply || !replyText.trim()}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          {savingReply ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                          <span>Сохранить ответ</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setReplyingReviewId(null);
                            setReplyText('');
                          }}
                          className="text-slate-500 hover:text-slate-700 text-xs font-bold px-3 py-2 rounded-xl transition-colors cursor-pointer"
                        >
                          Отмена
                        </button>
                      </div>
                    </div>
                  ) : !rev.host_reply ? (
                    <button
                      type="button"
                      onClick={() => {
                        setReplyingReviewId(rev.id);
                        setReplyText('');
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer pt-1"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Ответить гостю</span>
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* МОДАЛКА ВЫВОДА СРЕДСТВ */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900">Вывод средств</h3>
              <button
                type="button"
                onClick={() => setShowWithdrawModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {withdrawMsg && (
              <div
                className={`p-3.5 rounded-2xl text-xs font-semibold ${
                  withdrawMsg.type === 'success'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-red-50 text-red-600 border border-red-200'
                }`}
              >
                {withdrawMsg.text}
              </div>
            )}

            <form onSubmit={handleWithdraw} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Сумма к выводу (доступно: {balance.toLocaleString('ru-RU')} ₽)
                </label>
                <input
                  type="number"
                  required
                  max={balance}
                  min={100}
                  placeholder="Например: 5000"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Номер карты или телефон для СБП
                </label>
                <input
                  type="text"
                  required
                  placeholder="2200 0000 0000 0000 или +7 9..."
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Банк получателя
                </label>
                <input
                  type="text"
                  placeholder="Сбер, Т-Банк, ВТБ..."
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={withdrawLoading || !withdrawAmount || Number(withdrawAmount) > balance}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-3.5 rounded-xl shadow-lg shadow-blue-500/20 transition-all disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none cursor-pointer"
              >
                {withdrawLoading ? 'Отправка заявки...' : 'Подтвердить вывод'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* МОДАЛКА БЫСТРОГО ЗАКРЫТИЯ ДАТ */}
      {isBlockModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 relative shadow-2xl space-y-4">
            <button onClick={() => setIsBlockModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2">
              <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Закрыть даты</h3>
                <p className="text-xs text-slate-500">Заблокирует возможность бронирования на сайте</p>
              </div>
            </div>

            {blockError && (
              <div className="p-3 bg-red-50 text-red-600 text-xs rounded-xl">{blockError}</div>
            )}

            <form onSubmit={handleSaveBlock} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Объект</label>
                <select
                  value={blockForm.property_id}
                  onChange={(e) => setBlockForm({ ...blockForm, property_id: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-semibold text-slate-800"
                >
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">С даты</label>
                  <input
                    type="date"
                    required
                    value={blockForm.check_in}
                    onChange={(e) => setBlockForm({ ...blockForm, check_in: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">По дату</label>
                  <input
                    type="date"
                    required
                    value={blockForm.check_out}
                    onChange={(e) => setBlockForm({ ...blockForm, check_out: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Источник</label>
                <select
                  value={blockForm.source_note}
                  onChange={(e) => setBlockForm({ ...blockForm, source_note: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 font-semibold"
                >
                  <option value="Авито">Бронь с Авито</option>
                  <option value="Суточно.ру">Бронь с Суточно.ру</option>
                  <option value="Звонок / Постоянные клиенты">Звонок / Постоянный клиент</option>
                  <option value="Личный приезд / Семья">Личный приезд / Семья</option>
                  <option value="Ремонт / Уборка">Ремонт / Генеральная уборка</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={savingBlock}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-3.5 rounded-xl transition-colors mt-2 cursor-pointer"
              >
                {savingBlock ? 'Сохранение...' : 'Заблокировать даты'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ДЕТАЛИ ЗАНЯТОСТИ НА ДАТУ */}
      {selectedDayBookings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 relative shadow-2xl space-y-4">
            <button onClick={() => setSelectedDayBookings(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900">
              Занятость на {selectedDayDate}
            </h3>

            <div className="space-y-3">
              {selectedDayBookings.map((b) => {
                const isBlocked = b.status === 'blocked';

                return (
                  <div key={b.id} className={`p-4 rounded-2xl border space-y-2 ${isBlocked ? 'bg-slate-100 border-slate-200' : 'bg-blue-50 border-blue-100'}`}>
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-sm text-slate-900">{b.property_title}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${isBlocked ? 'bg-slate-200 text-slate-700' : 'bg-blue-600 text-white'}`}>
                        {isBlocked ? 'Своя блокировка' : 'Райский Пляж'}
                      </span>
                    </div>

                    <div className="text-xs text-slate-700 space-y-1">
                      <p><span>{isBlocked ? 'Источник:' : 'Гость:'} <strong>{b.guest_name}</strong></span></p>
                      {!isBlocked && (
                        <p><span>Телефон: <strong>{b.guest_phone}</strong></span></p>
                      )}
                      <p><span>Даты: с {b.check_in.slice(0, 10)} по {b.check_out.slice(0, 10)} ({b.total_days} н.)</span></p>
                      {!isBlocked && (
                        <p><span>Сумма: <strong>{b.total_price.toLocaleString('ru-RU')} ₽</strong></span></p>
                      )}
                    </div>

                    {isBlocked && (
                      <div className="pt-2 border-t border-slate-200">
                        <button
                          type="button"
                          onClick={() => handleUnlockBooking(b.id)}
                          className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs py-2 rounded-xl flex items-center justify-center space-x-1 transition-colors cursor-pointer"
                        >
                          <Unlock className="w-3.5 h-3.5" />
                          <span>Разблокировать дату</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* РЕДАКТИРОВАНИЕ */}
      {editingProperty && editFormData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 relative shadow-2xl max-h-[90vh] overflow-y-auto">
            <button onClick={() => setEditingProperty(null)} className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
              <X className="w-6 h-6" />
            </button>

            <h3 className="text-xl font-bold text-slate-900 mb-4">Редактирование объявления</h3>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Название объекта</label>
                <input
                  type="text"
                  required
                  value={editFormData.title}
                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Тип жилья</label>
                  <select
                    value={editFormData.property_type}
                    onChange={(e) => setEditFormData({ ...editFormData, property_type: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5"
                  >
                    <option value="house">Дом / Коттедж</option>
                    <option value="room">Номер в отеле</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Цена за сутки (₽)</label>
                  <input
                    type="number"
                    required
                    value={editFormData.price_per_night}
                    onChange={(e) => setEditFormData({ ...editFormData, price_per_night: Number(e.target.value) })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-bold text-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">До моря (метров)</label>
                  <input
                    type="number"
                    required
                    value={editFormData.distance_to_sea}
                    onChange={(e) => setEditFormData({ ...editFormData, distance_to_sea: Number(e.target.value) })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Макс. гостей</label>
                  <input
                    type="number"
                    required
                    value={editFormData.max_guests}
                    onChange={(e) => setEditFormData({ ...editFormData, max_guests: Number(e.target.value) })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Адрес объекта</label>
                <input
                  type="text"
                  required
                  value={editFormData.address}
                  onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Описание</label>
                <textarea
                  rows={3}
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Удобства и бонусы</label>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_AMENITIES.map((amenity) => {
                    const isSelected = editFormData.amenities?.includes(amenity);
                    return (
                      <button
                        key={amenity}
                        type="button"
                        onClick={() => toggleAmenity(amenity)}
                        className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all ${
                          isSelected ? 'bg-teal-600 text-white border-teal-600' : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}{amenity}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end space-x-3">
                <button type="button" onClick={() => setEditingProperty(null)} className="text-xs font-bold text-slate-600 px-4 py-2.5 rounded-xl hover:bg-slate-100 cursor-pointer">
                  Отмена
                </button>
                <button type="submit" disabled={savingEdit} className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-md shadow-teal-600/20 cursor-pointer">
                  {savingEdit ? 'Сохранение...' : 'Сохранить изменения'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}