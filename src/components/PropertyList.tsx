'use client';

import React, { useState } from 'react';
import { Property } from '@/types/property';
import { PropertyCard } from '@/components/PropertyCard';
import { BookingModal } from '@/components/BookingModal';
import { SlidersHorizontal, Waves, Home, Building } from 'lucide-react';

const FILTER_BONUSES = ['Wi-Fi', 'Кондиционер', 'Мангал', 'Бассейн', 'Беседка', 'Парковка', 'Вид на море'];

export const PropertyList: React.FC<{ properties: Property[] }> = ({ properties }) => {
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  // Состояние фильтров
  const [typeFilter, setTypeFilter] = useState<'all' | 'house' | 'room'>('all');
  const [maxDistance, setMaxDistance] = useState<number>(1000);
  const [selectedBonuses, setSelectedBonuses] = useState<string[]>([]);

  const toggleBonus = (bonus: string) => {
    setSelectedBonuses((prev) =>
      prev.includes(bonus) ? prev.filter((b) => b !== bonus) : [...prev, bonus]
    );
  };

  // Логика фильтрации
  const filteredProperties = properties.filter((item) => {
    // 1. Фильтр по типу
    if (typeFilter !== 'all' && item.property_type !== typeFilter) return false;

    // 2. Фильтр по морю
    if (item.distance_to_sea > maxDistance) return false;

    // 3. Фильтр по бонусам
    if (selectedBonuses.length > 0) {
      const hasAllBonuses = selectedBonuses.every((b) => item.amenities?.includes(b));
      if (!hasAllBonuses) return false;
    }

    return true;
  });

  return (
    <div>
      {/* ПАНЕЛЬ ФИЛЬТРОВ */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm mb-8 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-2">
            <SlidersHorizontal className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-slate-900 text-base">Фильтры жилья</h3>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            Найдено вариантов: <strong>{filteredProperties.length}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Тип объекта */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Тип жилья</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setTypeFilter('all')}
                className={`py-2 px-3 text-xs font-bold rounded-xl transition-all ${
                  typeFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Все
              </button>
              <button
                onClick={() => setTypeFilter('house')}
                className={`py-2 px-3 text-xs font-bold rounded-xl flex items-center justify-center space-x-1 transition-all ${
                  typeFilter === 'house' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Home className="w-3.5 h-3.5 mr-1" /> Дома
              </button>
              <button
                onClick={() => setTypeFilter('room')}
                className={`py-2 px-3 text-xs font-bold rounded-xl flex items-center justify-center space-x-1 transition-all ${
                  typeFilter === 'room' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Building className="w-3.5 h-3.5 mr-1" /> Номера
              </button>
            </div>
          </div>

          {/* Удаленность от моря */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-bold text-slate-700 uppercase">Макс. до моря</label>
              <span className="text-xs font-extrabold text-blue-600">{maxDistance} метров</span>
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

          {/* Бонусы */}
          <div className="md:col-span-2 lg:col-span-1">
            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Удобства и бонусы</label>
            <div className="flex flex-wrap gap-1.5">
              {FILTER_BONUSES.map((bonus) => {
                const isSelected = selectedBonuses.includes(bonus);
                return (
                  <button
                    key={bonus}
                    onClick={() => toggleBonus(bonus)}
                    className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all ${
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

      {/* КАТАЛОГ ОБЪЕКТОВ */}
      {filteredProperties.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-3xl border border-slate-200">
          <p className="text-slate-500 font-medium">К сожалению, по выбранным фильтрам ничего не найдено.</p>
          <button
            onClick={() => {
              setTypeFilter('all');
              setMaxDistance(1000);
              setSelectedBonuses([]);
            }}
            className="mt-3 text-xs font-bold text-blue-600 hover:underline"
          >
            Сбросить фильтры
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