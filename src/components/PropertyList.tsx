'use client';

import React, { useState, useEffect } from 'react';
import { Property } from '@/types/property';
import { PropertyCard } from '@/components/PropertyCard';
import { BookingModal } from '@/components/BookingModal';
import { useFavorites } from '@/context/FavoritesContext';
import { useAuth } from '@/context/AuthContext';
import { SlidersHorizontal, Heart, Calendar, Users, RotateCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface BookedItem {
  property_id: string;
  unit_id?: string;
  check_in: string;
  check_out: string;
  status: string;
}

const FILTER_BONUSES = ['Wi-Fi', 'Кондиционер', 'Мангал', 'Бассейн', 'Беседка', 'Парковка', 'Вид на море'];

export const PropertyList: React.FC<{ properties: Property[] }> = ({ properties }) => {
  const router = useRouter();
  const { user } = useAuth();
  const { favorites } = useFavorites();
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  // Фильтры
  const [typeFilter, setTypeFilter] = useState<'all' | 'house' | 'room'>('all');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [guestsCount, setGuestsCount] = useState<number>(1);
  const [checkInDate, setCheckInDate] = useState<string>('');
  const [checkOutDate, setCheckOutDate] = useState<string>('');
  const [maxDistance, setMaxDistance] = useState<number>(1000);
  const [selectedBonuses, setSelectedBonuses] = useState<string[]>([]);

  // Загружаем все занятые даты из базы
  const [allBookings, setAllBookings] = useState<BookedItem[]>([]);

  useEffect(() => {
    async function loadBookings() {
      try {
        const res = await fetch('/api/bookings');
        if (res.ok) {
          const data = await res.json();
          setAllBookings(data || []);
        }
      } catch (e) {
        console.error('Ошибка загрузки броней:', e);
      }
    }
    loadBookings();
  }, []);

  const toggleBonus = (bonus: string) => {
    setSelectedBonuses((prev) =>
      prev.includes(bonus) ? prev.filter((b) => b !== bonus) : [...prev, bonus]
    );
  };

  // Точная проверка занятости по датам (YYYY-MM-DD)
  const isPropertyBookedOnDates = (property: Property, inStr: string, outStr: string) => {
    if (!inStr || !outStr || inStr >= outStr) return false;

    // Находим все брони этого объекта
    const propBookings = allBookings.filter((b) => b.property_id === property.id);
    if (propBookings.length === 0) return false;

    // Проверяем, есть ли брони, пересекающиеся с запрошенным интервалом
    // Пересечение: check_in < req_out И check_out > req_in
    const conflictingBookings = propBookings.filter((b) => {
      const bIn = b.check_in.slice(0, 10);
      const bOut = b.check_out.slice(0, 10);
      return bIn < outStr && bOut > inStr;
    });

    // Если у объекта есть под-юниты (например, 3 домика), проверяем, заняты ли ВСЕ юниты
    if (property.units && property.units.length > 0) {
      const bookedUnitIds = new Set(
        conflictingBookings.map((b) => b.unit_id).filter(Boolean)
      );
      // Если все домики заняты — объект недоступен
      return bookedUnitIds.size >= property.units.length;
    }

    // Для обычного объекта: если есть хотя бы 1 пересечение — он занят
    return conflictingBookings.length > 0;
  };

  // Фильтрация
  const filteredProperties = properties.filter((item) => {
    // 1. Избранное
    if (onlyFavorites && !favorites.includes(item.id)) return false;

    // 2. Тип объекта
    if (typeFilter !== 'all' && item.property_type !== typeFilter) return false;

    // 3. Вместимость гостей
    if (guestsCount > 1 && item.max_guests < guestsCount) return false;

    // 4. ФИЛЬТР ПО ДАТАМ (Скрываем занятые)
    if (checkInDate && checkOutDate) {
      if (isPropertyBookedOnDates(item, checkInDate, checkOutDate)) {
        return false;
      }
    }

    // 5. Цена
    if (minPrice && item.price_per_night < Number(minPrice)) return false;
    if (maxPrice && item.price_per_night > Number(maxPrice)) return false;

    // 6. Расстояние до моря
    if (item.distance_to_sea > maxDistance) return false;

    // 7. Бонусы
    if (selectedBonuses.length > 0) {
      const hasAll = selectedBonuses.every((b) => item.amenities?.includes(b));
      if (!hasAll) return false;
    }

    return true;
  });

  const handleFavoritesClick = () => {
    if (!user) {
      router.push('/login');
      return;
    }
    setOnlyFavorites(!onlyFavorites);
  };

  const resetFilters = () => {
    setTypeFilter('all');
    setOnlyFavorites(false);
    setMinPrice('');
    setMaxPrice('');
    setGuestsCount(1);
    setCheckInDate('');
    setCheckOutDate('');
    setMaxDistance(1000);
    setSelectedBonuses([]);
  };

  return (
    <div className="space-y-6">
      {/* ПАНЕЛЬ ФИЛЬТРОВ */}
      <div className="bg-white p-5 sm:p-7 rounded-3xl border border-slate-200 shadow-sm space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-2">
            <SlidersHorizontal className="w-5 h-5 text-blue-600" />
            <h3 className="font-extrabold text-slate-900 text-base">Фильтры поиска жилья</h3>
          </div>

          <div className="flex items-center space-x-2">
            {/* Кнопка «Только избранное» */}
            <button
              type="button"
              onClick={handleFavoritesClick}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                onlyFavorites
                  ? 'bg-rose-50 text-rose-600 border border-rose-200 shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <Heart className={`w-4 h-4 ${onlyFavorites ? 'fill-rose-500 text-rose-500' : ''}`} />
              <span>Только избранное ({favorites.length})</span>
            </button>

            {(typeFilter !== 'all' || onlyFavorites || minPrice || maxPrice || guestsCount > 1 || checkInDate || selectedBonuses.length > 0) && (
              <button
                type="button"
                onClick={resetFilters}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 cursor-pointer"
                title="Сбросить все фильтры"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* СЕТКА ГЛАВНЫХ ПАРАМЕТРОВ */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 1. Даты заезда и выезда */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1.5 flex items-center">
              <Calendar className="w-3.5 h-3.5 mr-1 text-blue-600" />
              <span>Даты отдыха (поиск свободных)</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] text-slate-400 block mb-0.5">Заезд</span>
                <input
                  type="date"
                  value={checkInDate}
                  onChange={(e) => setCheckInDate(e.target.value)}
                  className="w-full text-xs font-semibold bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-slate-800"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block mb-0.5">Выезд</span>
                <input
                  type="date"
                  value={checkOutDate}
                  onChange={(e) => setCheckOutDate(e.target.value)}
                  className="w-full text-xs font-semibold bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* 2. Количество гостей */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1.5 flex items-center">
              <Users className="w-3.5 h-3.5 mr-1 text-blue-600" />
              <span>Сколько гостей</span>
            </label>
            <div className="pt-2">
              <select
                value={guestsCount}
                onChange={(e) => setGuestsCount(Number(e.target.value))}
                className="w-full text-xs font-bold bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800"
              >
                <option value={1}>1+ гость</option>
                <option value={2}>2+ гостей</option>
                <option value={4}>4+ гостей</option>
                <option value={6}>6+ гостей</option>
                <option value={8}>8+ гостей</option>
                <option value={10}>10+ гостей</option>
              </select>
            </div>
          </div>

          {/* 3. Тип жилья */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1.5">Тип объекта</label>
            <div className="grid grid-cols-3 gap-1 pt-2">
              <button
                type="button"
                onClick={() => setTypeFilter('all')}
                className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  typeFilter === 'all' ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                Все
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter('house')}
                className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  typeFilter === 'house' ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                Дома
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter('room')}
                className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  typeFilter === 'room' ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                Номера
              </button>
            </div>
          </div>
        </div>

        {/* ЦЕНА, МОРЕ И УДОБСТВА */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-slate-100">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Цена за сутки (₽)</label>
            <div className="flex space-x-2">
              <input
                type="number"
                placeholder="От"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
              />
              <input
                type="number"
                placeholder="До"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase">До моря не далее</label>
              <span className="text-xs font-extrabold text-blue-600">{maxDistance} м</span>
            </div>
            <input
              type="range"
              min="50"
              max="1000"
              step="50"
              value={maxDistance}
              onChange={(e) => setMaxDistance(Number(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Удобства</label>
            <div className="flex flex-wrap gap-1">
              {FILTER_BONUSES.map((bonus) => {
                const isSelected = selectedBonuses.includes(bonus);
                return (
                  <button
                    key={bonus}
                    type="button"
                    onClick={() => toggleBonus(bonus)}
                    className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {bonus}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ЗАГОЛОВОК ВЫДАЧИ */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl sm:text-2xl font-black text-slate-900">
          {checkInDate && checkOutDate ? (
            <span>Свободные варианты с {checkInDate} по {checkOutDate} ({filteredProperties.length})</span>
          ) : (
            <span>Доступные варианты ({filteredProperties.length})</span>
          )}
        </h2>
      </div>

      {filteredProperties.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 space-y-3">
          <p className="text-slate-700 font-bold text-base">
            {onlyFavorites ? 'В избранном пока ничего нет' : 'На выбранные даты нет свободных объектов'}
          </p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {onlyFavorites
              ? 'Нажимайте на сердечко на карточке любого объявления, чтобы сохранить его в свой профиль.'
              : 'Попробуйте изменить даты заезда или сбросить фильтры.'}
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center space-x-1.5 bg-blue-50 text-blue-600 text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-blue-100 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Сбросить фильтры</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProperties.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              onBook={(prop) => setSelectedProperty(prop)}
            />
          ))}
        </div>
      )}

      <BookingModal
        property={selectedProperty}
        onClose={() => setSelectedProperty(null)}
      />
    </div>
  );
};