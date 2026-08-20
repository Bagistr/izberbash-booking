'use client';

import React, { useState, TouchEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MapPin, Check, ChevronLeft, ChevronRight, Heart, Users } from 'lucide-react';
import { Property } from '@/types/property';
import { useFavorites } from '@/context/FavoritesContext';
import { useAuth } from '@/context/AuthContext';

interface PropertyCardProps {
  property: Property;
  onBook?: (property: Property) => void;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({ property, onBook }) => {
  const router = useRouter();
  const { user } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const isFav = isFavorite(property.id);

  const photos =
    property.photos && property.photos.length > 0
      ? property.photos
      : ['https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1000&q=80'];

  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const prevPhoto = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    setCurrentPhotoIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  const nextPhoto = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    setCurrentPhotoIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  };

  const handleTouchStart = (e: TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;

    if (diff > 40) {
      nextPhoto();
    } else if (diff < -40) {
      prevPhoto();
    }
    setTouchStartX(null);
  };

  const handleHeartClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      router.push('/login');
      return;
    }

    await toggleFavorite(property.id);
  };

  return (
    <div className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-200/80 flex flex-col h-full group relative">
      {/* Слайдер картинок */}
      <div
        className="relative h-64 w-full overflow-hidden bg-slate-100 select-none"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <Link href={`/property/${property.id}`} className="block w-full h-full">
          <img
            src={photos[currentPhotoIndex]}
            alt={property.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </Link>

        {/* Бейдж расстояния */}
        <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full z-10">
          {property.distance_to_sea} м до моря
        </div>

        {/* Кнопка сердечка (Коралловый акцент) */}
        <button
          type="button"
          onClick={handleHeartClick}
          className="absolute top-3 right-3 p-2.5 rounded-full bg-white/90 hover:bg-white backdrop-blur-md transition-all shadow-md z-20 cursor-pointer hover:scale-110 active:scale-95"
          title={user ? (isFav ? 'Удалить из избранного' : 'Добавить в избранное') : 'Войдите, чтобы сохранить'}
        >
          <Heart
            className={`w-5 h-5 transition-colors ${
              isFav ? 'fill-[#E11D48] text-[#E11D48]' : 'text-slate-600 hover:text-[#E11D48]'
            }`}
          />
        </button>

        {/* Стрелочки */}
        {photos.length > 1 && (
          <>
            <button
              onClick={prevPhoto}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-slate-800 p-1.5 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-10 hidden sm:block"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextPhoto}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-slate-800 p-1.5 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-10 hidden sm:block"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

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
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1.5">
            <div className="flex items-center">
              <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400 flex-shrink-0" />
              <span className="line-clamp-1">{property.address}</span>
            </div>
            <div className="flex items-center text-slate-700 font-bold flex-shrink-0 ml-2">
              <Users className="w-3.5 h-3.5 mr-1 text-blue-600" />
              <span>до {property.max_guests}</span>
            </div>
          </div>

          <Link href={`/property/${property.id}`}>
            <h3 className="text-base font-bold text-slate-900 mb-1 hover:text-blue-600 transition-colors line-clamp-1">
              {property.title}
            </h3>
          </Link>

          {/* Рейтинг «Уровень Рахата» ☀️ */}
          <div className="flex items-center space-x-1.5 mb-3">
            {property.reviews_count && property.reviews_count > 0 ? (
              <>
                <div className="inline-flex items-center space-x-1 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-lg text-amber-900 text-xs font-bold">
                  <span>☀️</span>
                  <span>{Number(property.rating).toFixed(1)}</span>
                  <span className="text-[10px] text-amber-700 font-semibold">Рахата</span>
                </div>
                <span className="text-[11px] text-slate-400 font-medium">
                  ({property.reviews_count} {property.reviews_count === 1 ? 'отзыв' : property.reviews_count < 5 ? 'отзыва' : 'отзывов'})
                </span>
              </>
            ) : (
              <div className="inline-flex items-center space-x-1 bg-blue-50 border border-blue-200/80 px-2 py-0.5 rounded-lg text-blue-800 text-xs font-bold">
                <span>☀️</span>
                <span>Ожидает первых гостей</span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5 mb-4">
            {property.amenities?.slice(0, 3).map((item, index) => (
              <span
                key={index}
                className="inline-flex items-center text-[11px] bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg font-medium"
              >
                <Check className="w-3 h-3 mr-1 text-teal-600" />
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-xl font-black text-slate-900">
              {property.price_per_night.toLocaleString('ru-RU')} ₽
            </span>
            <span className="text-slate-400 text-xs"> / ночь</span>
          </div>

          {/* Action Button: Teal (Морская волна) */}
          <button
            onClick={() => onBook?.(property)}
            className="bg-[#0D9488] hover:bg-[#0F766E] text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md shadow-teal-600/20 active:scale-95 cursor-pointer"
          >
            Забронировать
          </button>
        </div>
      </div>
    </div>
  );
};