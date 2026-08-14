'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

interface FavoritesContextType {
  favorites: string[];
  toggleFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
}

const FavoritesContext = createContext<FavoritesContextType>({
  favorites: [],
  toggleFavorite: () => {},
  isFavorite: () => false,
});

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    if (user?.phone) {
      fetch(`/api/favorites?phone=${encodeURIComponent(user.phone)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.favorites) {
            setFavorites(data.favorites);
            localStorage.setItem('rp_favorites', JSON.stringify(data.favorites));
          }
        })
        .catch(() => {});
    } else {
      const local = localStorage.getItem('rp_favorites');
      if (local) setFavorites(JSON.parse(local));
    }
  }, [user]);

  const toggleFavorite = (propertyId: string) => {
    const isFav = favorites.includes(propertyId);
    const next = isFav ? favorites.filter((id) => id !== propertyId) : [...favorites, propertyId];
    setFavorites(next);
    localStorage.setItem('rp_favorites', JSON.stringify(next));

    if (user?.phone) {
      fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: user.phone, property_id: propertyId }),
      }).catch(console.error);
    }
  };

  const isFavorite = (id: string) => favorites.includes(id);

  return (
    <FavoritesContext.Provider value={{ favorites, toggleFavorite, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => useContext(FavoritesContext);