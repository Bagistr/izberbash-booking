'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  id?: string;
  name: string;
  phone: string;
  role: 'guest' | 'landlord';
  activeRole?: 'guest' | 'landlord';
  telegram_id?: string;
  is_landlord?: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
  switchRole: (newRole: 'guest' | 'landlord') => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: () => {},
  logout: () => {},
  switchRole: async () => {},
  isLoading: true,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('dagbooking_auth_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.role === 'landlord') {
          parsed.is_landlord = true;
        }
        setUser(parsed);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = (userData: User) => {
    const updated = {
      ...userData,
      is_landlord: userData.role === 'landlord' || userData.is_landlord === true,
      activeRole: userData.activeRole || userData.role,
    };
    setUser(updated);
    localStorage.setItem('dagbooking_auth_user', JSON.stringify(updated));
    localStorage.removeItem('rp_user');
    localStorage.removeItem('landlord_user');
  };

  const switchRole = async (newRole: 'guest' | 'landlord') => {
    if (!user) return;

    try {
      if (user.phone) {
        await fetch('/api/auth/switch-role', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: user.phone, newRole }),
        });
      }
    } catch (e) {
      console.error('Ошибка синхронизации роли с сервером:', e);
    }

    const updatedUser: User = {
      ...user,
      role: newRole,
      activeRole: newRole,
      is_landlord: user.is_landlord || newRole === 'landlord' || user.role === 'landlord',
    };
    setUser(updatedUser);
    localStorage.setItem('dagbooking_auth_user', JSON.stringify(updatedUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('dagbooking_auth_user');
    localStorage.removeItem('rp_user');
    localStorage.removeItem('landlord_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, switchRole, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);