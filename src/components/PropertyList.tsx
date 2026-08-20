'use client';

import React, { useState, useEffect } from 'react';
import { Property } from '@/types/property';
import { PropertyCard } from '@/components/PropertyCard';
import { BookingModal } from '@/components/BookingModal';
import { useFavorites } from '@/context/FavoritesContext';
import { useAuth } from '@/context/AuthContext';
import {
  Search, SlidersHorizontal, Calendar, Users, Heart,
  RotateCcw, X, Waves, Check, Home, Building2
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

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
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { favorites } = useFavorites();
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  // Инициализация фильтров из URL параметров
  const [typeFilter, setTypeFilter] = useState<'all' | 'house' | 'room'>(
    () => (searchParams.get('type') as any) || 'all'
  );
  const [onlyFavorites, setOnlyFavorites] = useState(
    () => searchParams.get('fav') === '1'
  );
  const [minPrice, setMinPrice] = useState<string>(
    () => searchParams.get('min_price') || ''
  );
  const [maxPrice, setMaxPrice] = useState<string>(
    () => searchParams.get('max_price') || ''
  );
  const [guestsCount, setGuestsCount] = useState<number>(
    () => Number(searchParams.get('guests')) || 1
  );
  const [checkInDate, setCheckInDate] = useState<string>(
    () => searchParams.get('check_in') || ''
  );
  const [checkOutDate, setCheckOutDate] = useState<string>(
    () => searchParams.get('check_out') || ''
  );
  const [maxDistance, setMaxDistance] = useState<number>(
    () => Number(searchParams.get('distance')) || 1000
  );
  const [selectedBonuses, setSelectedBonuses] = useState<string[]>(
    () => (searchParams.get('bonuses') ? searchParams.get('bonuses')!.split(',').filter(Boolean) : [])
  );

  // Автоматическая синхронизация фильтров в URL (без перезагрузки и скролла)
  useEffect(() => {
    const params = new URLSearchParams();
    if (typeFilter !== 'all') params.set('type', typeFilter);
    if (onlyFavorites) params.set('fav', '1');
    if (minPrice) params.set('min_price', minPrice);
    if (maxPrice) params.set('max_price', maxPrice);
    if (guestsCount > 1) params.set('guests', String(guestsCount));
    if (checkInDate) params.set('check_in', checkInDate);
    if (checkOutDate) params.set('check_out', checkOutDate);
    if (maxDistance < 1000) params.set('distance', String(maxDistance));
    if (selectedBonuses.length > 0) params.set('bonuses', selectedBonuses.join(','));

    const queryString = params.toString();
    const targetUrl = queryString ? `/?${queryString}` : '/';
    router.replace(targetUrl, { scroll: false });
  }, [
    typeFilter, onlyFavorites, minPrice, maxPrice,
    guestsCount, checkInDate, checkOutDate, maxDistance,
    selectedBonuses, router
  ]);

  // Модалка расширенных фильтров
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

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
        console.error('Ошибка загрузки занятых дат:', e);
      }
    }
    loadBookings();
  }, []);

  const toggleBonus = (bonus: string) => {
    setSelectedBonuses((prev) =>
      prev.includes(bonus) ? prev.filter((b) => b !== bonus) : [...prev, bonus]
    );
  };

  const isPropertyBookedOnDates = (property: Property, inStr: string, outStr: string) => {
    if (!inStr || !outStr || inStr >= outStr) return false;

    const propBookings = allBookings.filter((b) => b.property_id === property.id);
    if (propBookings.length === 0) return false;

    const conflictingBookings = propBookings.filter((b) => {
      const bIn = b.check_in.slice(0, 10);
      const bOut = b.check_out.slice(0, 10);
      return bIn < outStr && bOut > inStr;
    });

    if (property.units && property.units.length > 0) {
      const bookedUnitIds = new Set(
        conflictingBookings.map((b) => b.unit_id).filter(Boolean)
      );
      return bookedUnitIds.size >= property.units.length;
    }

    return conflictingBookings.length > 0;
  };

  const filteredProperties = properties.filter((item) => {
    if (onlyFavorites && !favorites.includes(item.id)) return false;
    if (typeFilter !== 'all' && item.property_type !== typeFilter) return false;
    if (guestsCount > 1 && item.max_guests < guestsCount) return false;

    if (checkInDate && checkOutDate) {
      if (isPropertyBookedOnDates(item, checkInDate, checkOutDate)) {
        return false;
      }
    }

    if (minPrice && item.price_per_night < Number(minPrice)) return false;
    if (maxPrice && item.price_per_night > Number(maxPrice)) return false;
    if (item.distance_to_sea > maxDistance) return false;

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

  const activeFiltersCount =
    (typeFilter !== 'all' ? 1 : 0) +
    (minPrice || maxPrice ? 1 : 0) +
    (maxDistance < 1000 ? 1 : 0) +
    selectedBonuses.length;

  return (
    <div className="space-y-8">
      {/* 1. КОМПАКТНЫЙ ПРЕМИАЛЬНЫЙ ПОИСКОВЫЙ БАР */}
      <div className="bg-white rounded-3xl p-3 sm:p-4 shadow-xl shadow-slate-200/50 border border-slate-200/80 -mt-10 relative z-30 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-3 items-center">
          {/* Даты заезда / выезда */}
          <div className="sm:col-span-5 bg-slate-50 hover:bg-slate-100/80 transition-colors p-2.5 sm:p-3 rounded-2xl border border-slate-100 flex items-center space-x-2.5">
            <Calendar className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <div className="grid grid-cols-2 gap-2 w-full text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-600 block">Заезд</span>
                <input
                  type="date"
                  value={checkInDate}
                  onChange={(e) => setCheckInDate(e.target.value)}
                  className="w-full bg-transparent font-bold text-slate-900 focus:outline-none cursor-pointer"
                />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-600 block">Выезд</span>
                <input
                  type="date"
                  value={checkOutDate}
                  onChange={(e) => setCheckOutDate(e.target.value)}
                  className="w-full bg-transparent font-bold text-slate-900 focus:outline-none cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Гости */}
          <div className="sm:col-span-3 bg-slate-50 hover:bg-slate-100/80 transition-colors p-2.5 sm:p-3 rounded-2xl border border-slate-100 flex items-center space-x-2.5">
            <Users className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <div className="w-full text-xs">
              <span className="text-[10px] uppercase font-bold text-slate-600 block">Кто едет</span>
              <select
                value={guestsCount}
                onChange={(e) => setGuestsCount(Number(e.target.value))}
                className="w-full bg-transparent font-bold text-slate-900 focus:outline-none cursor-pointer"
              >
                <option value={1}>1 гость</option>
                <option value={2}>2 гостя</option>
                <option value={4}>4 гостя</option>
                <option value={6}>6+ гостей</option>
                <option value={8}>8+ гостей</option>
              </select>
            </div>
          </div>

          {/* Быстрые фильтры и кнопка */}
          <div className="sm:col-span-4 flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setIsFilterModalOpen(true)}
              className={`flex-1 flex items-center justify-center space-x-1.5 py-3.5 px-3 rounded-2xl text-xs font-bold transition-all border ${
                activeFiltersCount > 0
                  ? 'bg-blue-50 text-blue-600 border-blue-200 shadow-sm'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Фильтры</span>
              {activeFiltersCount > 0 && (
                <span className="bg-blue-600 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center ml-1">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {/* Быстрая кнопка Избранное */}
            <button
              type="button"
              onClick={handleFavoritesClick}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                onlyFavorites
                  ? 'bg-rose-50 text-rose-600 border-rose-200 shadow-sm'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
              title="Показать только избранные"
            >
              <Heart className={`w-4 h-4 ${onlyFavorites ? 'fill-rose-500 text-rose-500' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* 2. БЫСТРЫЕ ЧИПСЫ ТИПОВ ЖИЛЬЯ */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 max-w-full">
          <button
            onClick={() => setTypeFilter('all')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center space-x-1.5 whitespace-nowrap cursor-pointer ${
              typeFilter === 'all'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Waves className="w-3.5 h-3.5" />
            <span>Все варианты ({properties.length})</span>
          </button>
          <button
            onClick={() => setTypeFilter('house')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center space-x-1.5 whitespace-nowrap cursor-pointer ${
              typeFilter === 'house'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>Коттеджи и дома</span>
          </button>
          <button
            onClick={() => setTypeFilter('room')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center space-x-1.5 whitespace-nowrap cursor-pointer ${
              typeFilter === 'room'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Номера в отелях</span>
          </button>
        </div>

        {(typeFilter !== 'all' || onlyFavorites || minPrice || maxPrice || guestsCount > 1 || checkInDate || selectedBonuses.length > 0) && (
          <button
            type="button"
            onClick={resetFilters}
            className="text-xs font-bold text-slate-500 hover:text-slate-900 flex items-center space-x-1 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Сбросить поиск</span>
          </button>
        )}
      </div>

      {/* 3. КАТАЛОГ КАРТОЧЕК */}
      {filteredProperties.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-3">
          <p className="text-slate-900 font-extrabold text-lg">
            {onlyFavorites ? 'В избранном пока ничего нет' : 'На выбранные даты нет свободных объектов'}
          </p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {onlyFavorites
              ? 'Нажимайте на сердечко на понравившихся карточках, чтобы собрать список здесь.'
              : 'Попробуйте изменить даты заезда или уменьшить количество фильтров.'}
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center space-x-1.5 bg-blue-50 text-blue-600 text-xs font-bold px-5 py-3 rounded-2xl hover:bg-blue-100 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
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

      {/* 4. ВСПЛЫВАЮЩАЯ МОДАЛКА РАСШИРЕННЫХ ФИЛЬТРОВ */}
      {isFilterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 relative shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-2">
                <SlidersHorizontal className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-black text-slate-900">Все фильтры</h3>
              </div>
              <button
                onClick={() => setIsFilterModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Диапазон цены */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Цена за сутки (₽)</label>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  placeholder="От 2 000"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-bold"
                />
                <input
                  type="number"
                  placeholder="До 20 000"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-bold"
                />
              </div>
            </div>

            {/* Расстояние до моря */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-bold text-slate-700 uppercase">Расстояние до моря</label>
                <span className="text-xs font-black text-teal-600">до {maxDistance} метров</span>
              </div>
              <input
                type="range"
                min="50"
                max="1000"
                step="50"
                value={maxDistance}
                onChange={(e) => setMaxDistance(Number(e.target.value))}
                className="w-full accent-teal-600 cursor-pointer"
              />
            </div>

            {/* Бонусы */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Удобства на территории</label>
              <div className="flex flex-wrap gap-2">
                {FILTER_BONUSES.map((bonus) => {
                  const isSelected = selectedBonuses.includes(bonus);
                  return (
                    <button
                      key={bonus}
                      type="button"
                      onClick={() => toggleBonus(bonus)}
                      className={`text-xs font-bold px-3 py-2 rounded-xl border transition-all ${
                        isSelected
                          ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {isSelected ? '✓ ' : '+ '}{bonus}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between border-t border-slate-100">
              <button
                type="button"
                onClick={resetFilters}
                className="text-xs font-bold text-slate-500 hover:text-slate-900"
              >
                Сбросить
              </button>
              <button
                type="button"
                onClick={() => setIsFilterModalOpen(false)}
                className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-6 py-3 rounded-xl shadow-lg shadow-teal-500/25"
              >
                Показать варианты ({filteredProperties.length})
              </button>
            </div>
          </div>
        </div>
      )}

      <BookingModal
        property={selectedProperty}
        onClose={() => setSelectedProperty(null)}
      />
    </div>
  );
};