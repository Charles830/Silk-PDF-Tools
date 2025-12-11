import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { translations, type Language } from '../translations';
import { type User } from '../types';

interface AppContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof translations['en'];
  
  // Auth
  user: User | null;
  login: (username: string, pass: string) => boolean;
  register: (username: string, pass: string) => boolean;
  logout: () => void;
  isAuthModalOpen: boolean;
  setAuthModalOpen: (isOpen: boolean) => void;
  authModalTab: 'login' | 'signup';
  setAuthModalTab: (tab: 'login' | 'signup') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [language, setLanguage] = useState<Language>('zh');
  
  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'signup'>('login');

  // Initialize theme
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // Load User from Session
  useEffect(() => {
    const savedUser = localStorage.getItem('silk_current_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const login = (username: string, pass: string): boolean => {
    const usersStr = localStorage.getItem('silk_users');
    const users: User[] = usersStr ? JSON.parse(usersStr) : [];
    
    const validUser = users.find(u => u.username === username && u.password === pass);
    if (validUser) {
      // Don't store password in session
      const cleanUser = { username: validUser.username };
      setUser(cleanUser);
      localStorage.setItem('silk_current_user', JSON.stringify(cleanUser));
      return true;
    }
    return false;
  };

  const register = (username: string, pass: string): boolean => {
    const usersStr = localStorage.getItem('silk_users');
    const users: User[] = usersStr ? JSON.parse(usersStr) : [];
    
    if (users.find(u => u.username === username)) {
      return false; // User exists
    }
    
    const newUser = { username, password: pass };
    users.push(newUser);
    localStorage.setItem('silk_users', JSON.stringify(users));
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('silk_current_user');
  };

  const t = translations[language];

  return (
    <AppContext.Provider value={{ 
      theme, 
      toggleTheme, 
      language, 
      setLanguage, 
      t,
      user,
      login,
      register,
      logout,
      isAuthModalOpen,
      setAuthModalOpen,
      authModalTab,
      setAuthModalTab
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};