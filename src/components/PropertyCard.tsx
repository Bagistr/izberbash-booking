'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { MapPin, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { Property } from '@/types/property';

interface PropertyCardProps {
  property: Property;
  onBook?: (property: Property) => void;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({ property, onBook }) => {
  const photos = property.photos && property.photos.length > 0 
    ? property.photos 
    : ['https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1000&q=80'];

  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  const prevPhoto = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentPhotoIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  const nextPhoto = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentPhotoIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-200 flex flex-col h-full group">
      {/* Слайдер картинок */}
      <div className="relative h-64 w-full overflow-hidden bg-slate-100">
        <Link href={`/property/${property.id}`} className="block w-full h-full">
          <img
            src={photos[currentPhotoIndex]}
            alt={property.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </Link>

        {/* Значок расстояния до моря */}
        <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full z-10">
          {property.distance_to_sea} м до моря
        </div>

        {/* Стрелки переключения фото (если больше 1 фото) */}
        {photos.length > 1 && (
          <>
            <button
              onClick={prevPhoto}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-slate-800 p-1.5 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-10"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextPhoto}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-slate-800 p-1.5 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-10"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Точки-индикаторы */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex space-x-1.5 z-10">
              {photos.map((_, idx) => (
                <div
                  key={idx}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    idx === currentPhotoIndex ? 'bg-white w-3' : 'bg-white/60'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Описание */}
      <div className="p-5 flex flex-col flex-grow justify-between">
        <div>
          <div className="flex items-center text-slate-500 text-xs mb-1.5">
            <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" />
            <span className="line-clamp-1">{property.address}</span>
          </div>

          <Link href={`/property/${property.id}`}>
            <h3 className="text-lg font-bold text-slate-900 mb-2 hover:text-blue-600 transition-colors line-clamp-1">
              {property.title}
            </h3>
          </Link>

          {/* Отображаем максимум 3 главных бонуса в каталоге */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {property.amenities?.slice(0, 3).map((item, index) => (
              <span
                key={index}
                className="inline-flex items-center text-[11px] bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg font-medium"
              >
                <Check className="w-3 h-3 mr-1 text-emerald-500" />
                {item}
              </span>
            ))}
            {property.amenities && property.amenities.length > 3 && (
              <span className="text-[11px] bg-blue-50 text-blue-600 px-2 py-1 rounded-lg font-semibold">
                +{property.amenities.length - 3} ещё
              </span>
            )}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-xl font-black text-slate-900">
              {property.price_per_night.toLocaleString('ru-RU')} ₽
            </span>
            <span className="text-slate-400 text-xs"> / ночь</span>
          </div>

          <button
            onClick={() => onBook?.(property)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
          >
            Забронировать
          </button>
        </div>
      </div>
    </div>
  );
};