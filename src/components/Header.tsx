import { useState } from 'react';
import { Menu, Moon, ShoppingBag, Sun, X } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { t } from '../i18n/translations.ts';
import type { Language } from '../types.ts';

export function Header() {
  const { user, lang, setLang, dark, toggleTheme, path, navigate, cart, setCartOpen } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const currentRoute = path.split('?')[0];

  const navLinks = [
    { href: '/materials', label: t(lang, 'navMaterials') },
    { href: '/services', label: t(lang, 'navServices') },
    { href: '/projects', label: t(lang, 'navProjects') },
    { href: '/calculator', label: t(lang, 'navCalculator') },
    { href: '/companies', label: t(lang, 'navCompanies') },
  ];

  const go = (href: string) => {
    setMobileOpen(false);
    navigate(href);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-sm no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-6">
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            go('/');
          }}
          className="font-display text-xl font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0"
        >
          QurilishHub
        </a>

        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
          {navLinks.map((item) => {
            const active = currentRoute === item.href || currentRoute.startsWith(`${item.href}/`);
            return (
              <a
                key={item.href}
                href={item.href}
                onClick={(e) => {
                  e.preventDefault();
                  go(item.href);
                }}
                className={`whitespace-nowrap shrink-0 py-1 transition-colors hover:text-slate-900 dark:hover:text-white ${
                  active ? 'text-[#1E40AF] dark:text-blue-400 border-b-2 border-[#1E40AF] dark:border-blue-400' : ''
                }`}
              >
                {item.label}
              </a>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="hidden sm:flex items-center border border-slate-200 dark:border-slate-800 rounded-md p-0.5 bg-slate-50 dark:bg-slate-900">
            {(['uz', 'ru', 'en'] as Language[]).map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => setLang(code)}
                className={`px-2 py-1 text-xs font-medium rounded whitespace-nowrap shrink-0 transition-colors ${
                  lang === code
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {code.toUpperCase()}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors shrink-0"
          >
            {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={() => setCartOpen(true)}
            aria-label="Open cart"
            className="relative p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors shrink-0"
          >
            <ShoppingBag className="w-4 h-4" />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 rounded-full bg-[#EA580C] text-white text-[11px] font-mono tabular-nums font-semibold flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => go(user ? '/dashboard' : '/login')}
            className="hidden sm:inline-flex items-center px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-[#1E40AF] hover:bg-blue-800 text-white transition-colors whitespace-nowrap shrink-0"
          >
            {user ? t(lang, 'dashboard') : t(lang, 'signIn')}
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label="Menu"
            className="lg:hidden p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-4 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {navLinks.map((item) => (
              <button
                key={item.href}
                type="button"
                onClick={() => go(item.href)}
                className="text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900"
              >
                {item.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => go('/architects')}
              className="text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900"
            >
              {t(lang, 'navArchitects')}
            </button>
            <button
              type="button"
              onClick={() => go('/compare')}
              className="text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900"
            >
              {t(lang, 'navCompare')}
            </button>
            <button
              type="button"
              onClick={() => go('/blog')}
              className="text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900"
            >
              {t(lang, 'navBlog')}
            </button>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-1">
              {(['uz', 'ru', 'en'] as Language[]).map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setLang(code)}
                  className={`px-2.5 py-1 text-xs font-medium rounded ${
                    lang === code ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'text-slate-500'
                  }`}
                >
                  {code.toUpperCase()}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => go(user ? '/dashboard' : '/login')}
              className="px-4 py-2 text-sm font-semibold rounded-lg bg-[#1E40AF] text-white"
            >
              {user ? t(lang, 'dashboard') : t(lang, 'signIn')}
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
