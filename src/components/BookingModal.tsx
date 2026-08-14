'use client';

import React, { useState, useEffect } from 'react';
import { X, User, Phone, Send, CheckCircle2, CalendarX, Home } from 'lucide-react';
import { Property } from '@/types/property';

interface BookingModalProps {
  property: Property | null;
  onClose: () => void;
}

interface BookedRange {
  check_in: string;
  check_out: string;
  unit_id?: string;
}

interface Unit {
  id: string;
  name: string;
}

export const BookingModal: React.FC<BookingModalProps> = ({ property, onClose }) => {
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestTelegram, setGuestTelegram] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guestsCount, setGuestsCount] = useState(1);

  // Список домиков и выбранный домик
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedUnitId, setSelectedUnitId] = useState<string>('');

  const [bookedRanges, setBookedRanges] = useState<BookedRange[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Загружаем занятые даты и список домиков для объекта
  useEffect(() => {
    if (!property) return;
    async function fetchBookedDates() {
      try {
        const res = await fetch(`/api/properties/${property?.id}/booked-dates?unit_id=${selectedUnitId || 'all'}`);
        if (res.ok) {
          const data = await res.json();
          setBookedRanges(data.bookings || []);
          if (data.units && data.units.length > 0 && units.length === 0) {
            setUnits(data.units);
            setSelectedUnitId(data.units[0].id);
          }
        }
      } catch (err) {
        console.error('Не удалось подгрузить даты', err);
      }
    }
    fetchBookedDates();
  }, [property, selectedUnitId]);

  if (!property) return null;

  const isDateRangeOverlapping = (startStr: string, endStr: string) => {
    if (!startStr || !endStr) return false;
    const start = new Date(startStr);
    const end = new Date(endStr);

    return bookedRanges.some((range) => {
      const bStart = new Date(range.check_in);
      const bEnd = new Date(range.check_out);
      return start < bEnd && end > bStart;
    });
  };

  const calculateTotal = () => {
    if (!checkIn || !checkOut) return { days: 0, price: 0 };
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = end.getTime() - start.getTime();
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (days <= 0) return { days: 0, price: 0 };
    return { days, price: days * property.price_per_night };
  };

  const { days, price } = calculateTotal();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (days <= 0) {
      setErrorMsg('Дата выезда должна быть позже даты заезда.');
      return;
    }

    if (isDateRangeOverlapping(checkIn, checkOut)) {
      setErrorMsg('К сожалению, этот домик уже забронирован на выбранные даты. Выберите другой домик или другие даты.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property_id: property.id,
          unit_id: selectedUnitId || null,
          check_in: checkIn,
          check_out: checkOut,
          total_days: days,
          total_price: price,
          guest_name: guestName,
          guest_phone: guestPhone,
          guest_telegram: guestTelegram,
          guests_count: guestsCount,
        }),
      });

      if (!res.ok) throw new Error('Ошибка при отправке');

      setIsSuccess(true);
    } catch (err) {
      setErrorMsg('Не удалось отправить заявку. Попробуйте ещё раз.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 relative shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {isSuccess ? (
          <div className="text-center py-8 space-y-4">
            <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto animate-bounce" />
            <h3 className="text-2xl font-black text-slate-800">Заявка отправлена!</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Спасибо, <strong>{guestName}</strong>! Менеджер свяжется с вами для подтверждения бронирования.
            </p>
            <button
              onClick={onClose}
              className="mt-4 w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition-colors"
            >
              Отлично
            </button>
          </div>
        ) : (
          <div>
            <h3 className="text-xl font-bold text-slate-900 mb-1">Забронировать жилье</h3>
            <p className="text-xs text-blue-600 font-medium mb-4 line-clamp-1">{property.title}</p>

            {/* Выбор домика, если в объекте их несколько */}
            {units.length > 1 && (
              <div className="mb-4">
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1 flex items-center">
                  <Home className="w-3.5 h-3.5 mr-1 text-blue-600" />
                  <span>Выберите домик / номер:</span>
                </label>
                <select
                  value={selectedUnitId}
                  onChange={(e) => setSelectedUnitId(e.target.value)}
                  className="w-full text-xs font-bold bg-blue-50/60 border border-blue-200 text-blue-900 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-500"
                >
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Занятые даты выбранного домика */}
            {bookedRanges.length > 0 && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-2xl">
                <div className="flex items-center text-amber-800 text-xs font-bold mb-1">
                  <CalendarX className="w-4 h-4 mr-1 text-amber-600" />
                  <span>Занятые даты для этого варианта:</span>
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {bookedRanges.map((r, i) => (
                    <span key={i} className="text-[11px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md font-medium">
                      с {r.check_in.slice(0, 10)} по {r.check_out.slice(0, 10)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {errorMsg && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-xs font-medium">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Заезд</label>
                  <input
                    type="date"
                    required
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Выезд</label>
                  <input
                    type="date"
                    required
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Количество гостей</label>
                <select
                  value={guestsCount}
                  onChange={(e) => setGuestsCount(Number(e.target.value))}
                  className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-500"
                >
                  {[...Array(property.max_guests)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {i + 1} {i === 0 ? 'гость' : i < 4 ? 'гостя' : 'гостей'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Ваше имя</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="Магомед"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Номер телефона</label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="tel"
                    required
                    placeholder="+7 988 000 00 00"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Telegram / WhatsApp</label>
                <div className="relative">
                  <Send className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="@username"
                    value={guestTelegram}
                    onChange={(e) => setGuestTelegram(e.target.value)}
                    className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {days > 0 && (
                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-blue-700 font-medium">{days} ночей × {property.price_per_night.toLocaleString('ru-RU')} ₽</p>
                    <p className="text-lg font-black text-blue-900">{price.toLocaleString('ru-RU')} ₽</p>
                  </div>
                  <span className="text-xs bg-blue-600 text-white font-bold px-3 py-1 rounded-full">Итого</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm py-3.5 rounded-xl transition-colors shadow-lg shadow-blue-500/30"
              >
                {loading ? 'Проверка дат...' : 'Подтвердить бронирование'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};