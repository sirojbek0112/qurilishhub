import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { CartItem, Language, Product, User } from '../types.ts';
import { apiFetch, clearAuthTokens, getAccessToken, setAuthTokens } from '../lib/api.ts';

interface ToastMessage {
  id: number;
  text: string;
  type: 'success' | 'error' | 'info';
}

interface AppContextValue {
  user: User | null;
  authLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
    role: string;
    region: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  lang: Language;
  setLang: (l: Language) => void;
  dark: boolean;
  toggleTheme: () => void;
  path: string;
  navigate: (to: string) => void;
  cart: CartItem[];
  addToCart: (product: Product, qty?: number) => void;
  updateCartQty: (productId: number, qty: number) => void;
  removeFromCart: (productId: number) => void;
  clearCart: () => void;
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  showToast: (text: string, type?: 'success' | 'error' | 'info') => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [lang, setLangState] = useState<Language>(() => {
    const saved = localStorage.getItem('qh_lang');
    return saved === 'ru' || saved === 'en' ? saved : 'uz';
  });
  const [dark, setDark] = useState<boolean>(() => {
    return localStorage.getItem('qh_theme') === 'dark';
  });
  const [path, setPath] = useState<string>(() => window.location.pathname + window.location.search);
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem('qh_cart');
      return raw ? (JSON.parse(raw) as CartItem[]) : [];
    } catch {
      return [];
    }
  });
  const [cartOpen, setCartOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((text: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((prev) => [...prev, { id, text, type }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, 3600);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add('dark');
      localStorage.setItem('qh_theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('qh_theme', 'light');
    }
  }, [dark]);

  const setLang = useCallback((nextLang: Language) => {
    setLangState(nextLang);
    localStorage.setItem('qh_lang', nextLang);
  }, []);

  const toggleTheme = useCallback(() => {
    setDark((prev) => !prev);
  }, []);

  const navigate = useCallback((to: string) => {
    if (to === window.location.pathname + window.location.search) return;
    window.history.pushState({}, '', to);
    setPath(to);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const onPop = () => {
      setPath(window.location.pathname + window.location.search);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  useEffect(() => {
    localStorage.setItem('qh_cart', JSON.stringify(cart));
  }, [cart]);

  const refreshUser = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setUser(null);
      setAuthLoading(false);
      return;
    }
    try {
      const data = await apiFetch<{
        user: {
          id: number;
          email: string;
          full_name: string;
          phone: string | null;
          role: User['role'];
          region: string;
          avatar_url: string | null;
          verified: number;
        };
      }>('/api/auth/me');
      setUser({
        id: data.user.id,
        email: data.user.email,
        fullName: data.user.full_name,
        phone: data.user.phone,
        role: data.user.role,
        region: data.user.region,
        avatarUrl: data.user.avatar_url,
        verified: data.user.verified,
      });
    } catch {
      clearAuthTokens();
      setUser(null);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    const data = await apiFetch<{ accessToken: string; refreshToken: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setAuthTokens(data.accessToken, data.refreshToken);
    setUser(data.user);
    showToast(`Xush kelibsiz, ${data.user.fullName}`, 'success');
  };

  const register = async (payload: {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
    role: string;
    region: string;
  }) => {
    const data = await apiFetch<{ accessToken: string; refreshToken: string; user: User }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    setAuthTokens(data.accessToken, data.refreshToken);
    setUser(data.user);
    showToast(`Hisob yaratildi: ${data.user.fullName}`, 'success');
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem('qh_refresh_token');
    try {
      await apiFetch('/api/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      });
    } catch {
      // Ignore network logout error
    }
    clearAuthTokens();
    setUser(null);
    navigate('/');
    showToast('Tizimdan chiqildi', 'info');
  };

  const addToCart = (product: Product, qty = 1) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + qty } : i
        );
      }
      return [...prev, { product, quantity: qty }];
    });
    showToast(`${product.name_uz} savatga qo‘shildi`, 'success');
  };

  const updateCartQty = (productId: number, qty: number) => {
    if (qty <= 0) {
      setCart((prev) => prev.filter((i) => i.product.id !== productId));
      return;
    }
    setCart((prev) => prev.map((i) => (i.product.id === productId ? { ...i, quantity: qty } : i)));
  };

  const removeFromCart = (productId: number) => {
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
  };

  const clearCart = () => setCart([]);

  return (
    <AppContext.Provider
      value={{
        user,
        authLoading,
        login,
        register,
        logout,
        refreshUser,
        lang,
        setLang,
        dark,
        toggleTheme,
        path,
        navigate,
        cart,
        addToCart,
        updateCartQty,
        removeFromCart,
        clearCart,
        cartOpen,
        setCartOpen,
        showToast,
      }}
    >
      {children}
      {toasts.length > 0 && (
        <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm no-print">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`px-4 py-3 rounded-lg border text-sm font-medium shadow-lg transition-all ${
                toast.type === 'error'
                  ? 'bg-red-50 text-red-900 border-red-200 dark:bg-red-950 dark:text-red-100 dark:border-red-800'
                  : toast.type === 'success'
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-100 dark:border-emerald-800'
                  : 'bg-white text-slate-900 border-slate-200 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-800'
              }`}
            >
              {toast.text}
            </div>
          ))}
        </div>
      )}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
