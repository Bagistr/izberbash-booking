'use client';

import React, { useState } from 'react';
import { Property } from '@/types/property';
import { PropertyCard } from '@/components/PropertyCard';
import { BookingModal } from '@/components/BookingModal';

export const PropertyList: React.FC<{ properties: Property[] }> = ({ properties }) => {
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {properties.map((property) => (
          <PropertyCard
            key={property.id}
            property={property}
            onBook={(prop) => setSelectedProperty(prop)}
          />
        ))}
      </div>

      <BookingModal
        property={selectedProperty}
        onClose={() => setSelectedProperty(null)}
      />
    </>
  );
};