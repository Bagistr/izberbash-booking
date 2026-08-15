'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';

interface FavoritesContextType {
  favorites: string[];
  toggleFavorite: (id: string) => Promise<boolean>;
  isFavorite: (id: string) => boolean;
  refreshFavorites: () => void;
}

const FavoritesContext = createContext<FavoritesContextType>({
  favorites: [],
  toggleFavorite: async () => false,
  isFavorite: () => false,
  refreshFavorites: () => {},
});

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<string[]>([]);

  const fetchCloudFavorites = useCallback(async (phone: string) => {
    try {
      const res = await fetch(`/api/favorites?phone=${encodeURIComponent(phone)}`);
      if (res.ok) {
        const data = await res.json();
        setFavorites(data.favorites || []);
      }
    } catch (e) {
      console.error('Ошибка загрузки избранного:', e);
    }
  }, []);

  useEffect(() => {
    if (user?.phone) {
      fetchCloudFavorites(user.phone);
    } else {
      setFavorites([]);
    }
  }, [user, fetchCloudFavorites]);

  const toggleFavorite = async (propertyId: string): Promise<boolean> => {
    if (!user?.phone) {
      return false; // Сигнал, что пользователь не авторизован
    }

    const isFav = favorites.includes(propertyId);
    const updated = isFav
      ? favorites.filter((id) => id !== propertyId)
      : [...favorites, propertyId];

    setFavorites(updated);

    try {
      await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: user.phone, property_id: propertyId }),
      });
    } catch (e) {
      console.error('Ошибка синхронизации избранного с базой:', e);
    }

    return true;
  };

  const isFavorite = (id: string) => favorites.includes(id);

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        toggleFavorite,
        isFavorite,
        refreshFavorites: () => {
          if (user?.phone) fetchCloudFavorites(user.phone);
        },
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => useContext(FavoritesContext);