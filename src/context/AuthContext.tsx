'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  id?: string;
  name: string;
  phone: string;
  role: 'guest' | 'landlord';
}

interface AuthContextType {
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: () => {},
  logout: () => {},
  isLoading: true,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('dagbooking_auth_user');
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem('dagbooking_auth_user', JSON.stringify(userData));
    // Чистим старые конфликтующие ключи
    localStorage.removeItem('rp_user');
    localStorage.removeItem('landlord_user');
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('dagbooking_auth_user');
    localStorage.removeItem('rp_user');
    localStorage.removeItem('landlord_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);