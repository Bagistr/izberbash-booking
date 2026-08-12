import React from 'react';
import { MapPin, Check } from 'lucide-react';
import { Property } from '@/types/property';

interface PropertyCardProps {
  property: Property;
  onBook: (property: Property) => void;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({ property, onBook }) => {
  const mainPhoto = property.photos?.[0] || 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1000&q=80';

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 border border-slate-100 flex flex-col h-full">
      <div className="relative h-56 w-full overflow-hidden">
        <img
          src={mainPhoto}
          alt={property.title}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-3 left-3 bg-blue-600/90 backdrop-blur-md text-white text-xs font-semibold px-3 py-1 rounded-full">
          {property.distance_to_sea} м до моря
        </div>
      </div>

      <div className="p-5 flex flex-col flex-grow justify-between">
        <div>
          <div className="flex items-center text-slate-500 text-sm mb-1">
            <MapPin className="w-4 h-4 mr-1 text-slate-400" />
            <span>{property.address}</span>
          </div>

          <h3 className="text-xl font-bold text-slate-800 mb-2 line-clamp-1">
            {property.title}
          </h3>

          <p className="text-slate-600 text-sm line-clamp-2 mb-4">
            {property.description}
          </p>

          <div className="flex flex-wrap gap-2 mb-4">
            {property.amenities?.slice(0, 3).map((item, index) => (
              <span
                key={index}
                className="inline-flex items-center text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md font-medium"
              >
                <Check className="w-3 h-3 mr-1 text-blue-500" />
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-2xl font-bold text-slate-900">
              {property.price_per_night.toLocaleString('ru-RU')} ₽
            </span>
            <span className="text-slate-500 text-sm"> / ночь</span>
          </div>

          <button
            onClick={() => onBook(property)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
          >
            Забронировать
          </button>
        </div>
      </div>
    </div>
  );
};