import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '../types.ts';
import { api } from '../services/api.ts';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  register: (payload: any) => Promise<void>;
  logout: () => void;
  switchDemoRole: (role: UserRole) => Promise<void>;
  showAuthModal: boolean;
  setShowAuthModal: (open: boolean) => void;
  authModalTab: 'login' | 'register';
  setAuthModalTab: (tab: 'login' | 'register') => void;
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('campus_token'));
  const [loading, setLoading] = useState<boolean>(true);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register'>('login');

  useEffect(() => {
    async function loadUser() {
      const storedToken = localStorage.getItem('campus_token');
      if (storedToken) {
        try {
          const res = await api.auth.me();
          setUser(res.user);
        } catch (err) {
          console.warn('Session expired or invalid token:', err);
          localStorage.removeItem('campus_token');
          setToken(null);
          setUser(null);
        }
      } else {
        // Auto-login default demo student so the preview is immediately active and usable!
        try {
          const res = await api.auth.login('student@campus.edu', 'student123');
          localStorage.setItem('campus_token', res.token);
          setToken(res.token);
          setUser(res.user);
        } catch {
          // Ignore if login fails
        }
      }
      setLoading(false);
    }
    loadUser();
  }, []);

  const login = async (identifier: string, password: string) => {
    const res = await api.auth.login(identifier, password);
    localStorage.setItem('campus_token', res.token);
    setToken(res.token);
    setUser(res.user);
    setShowAuthModal(false);
  };

  const register = async (payload: any) => {
    const res = await api.auth.register(payload);
    localStorage.setItem('campus_token', res.token);
    setToken(res.token);
    setUser(res.user);
    setShowAuthModal(false);
  };

  const logout = () => {
    localStorage.removeItem('campus_token');
    setToken(null);
    setUser(null);
  };

  const updateUser = (updates: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...updates } : null));
  };

  const switchDemoRole = async (role: UserRole) => {
    let email = 'student@campus.edu';
    let pass = 'student123';
    if (role === 'faculty') {
      email = 'faculty@campus.edu';
      pass = 'faculty123';
    } else if (role === 'admin') {
      email = 'admin@campus.edu';
      pass = 'admin123';
    }

    setLoading(true);
    try {
      const res = await api.auth.login(email, pass);
      localStorage.setItem('campus_token', res.token);
      setToken(res.token);
      setUser(res.user);
    } catch (err) {
      console.error('Failed to switch demo role:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        switchDemoRole,
        showAuthModal,
        setShowAuthModal,
        authModalTab,
        setAuthModalTab,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
