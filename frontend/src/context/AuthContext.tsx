import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '@/api/axios';
import { useNavigate } from 'react-router-dom';

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  allowed_branches: any[];
  allowed_warehouses: any[];
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (access: string, refresh: string) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const { data } = await api.get('/accounts/me/');
          setUser(data);
        } catch (error) {
          console.error('Failed to fetch user profile', error);
          logout();
        }
      }
      setIsLoading(false);
    };
    initAuth();
  }, [token]);

  const login = (access: string, refresh: string) => {
    localStorage.setItem('token', access);
    localStorage.setItem('refresh', refresh);
    setToken(access);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};