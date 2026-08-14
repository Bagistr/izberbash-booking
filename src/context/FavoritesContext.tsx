'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

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
  const [favorites, setFavorites] = useState<string[]>([]);

  // Загружаем избранное (из базы если вошел, или из памяти)
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('rp_user');
      const localFavs = localStorage.getItem('rp_favorites');

      if (storedUser) {
        const user = JSON.parse(storedUser);
        fetch(`/api/favorites?phone=${encodeURIComponent(user.phone)}`)
          .then((res) => res.json())
          .then((data) => {
            if (data.favorites) {
              setFavorites(data.favorites);
              localStorage.setItem('rp_favorites', JSON.stringify(data.favorites));
            }
          })
          .catch(() => {});
      } else if (localFavs) {
        setFavorites(JSON.parse(localFavs));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const toggleFavorite = (propertyId: string) => {
    const isFav = favorites.includes(propertyId);
    const nextFavorites = isFav
      ? favorites.filter((id) => id !== propertyId)
      : [...favorites, propertyId];

    setFavorites(nextFavorites);
    localStorage.setItem('rp_favorites', JSON.stringify(nextFavorites));

    // Если турист вошел в профиль, синхронизируем с базой
    const storedUser = localStorage.getItem('rp_user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
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