import type { Language } from '../types.ts';

export const UZBEKISTAN_REGIONS = [
  'Toshkent shahri',
  'Toshkent viloyati',
  'Samarqand',
  'Buxoro',
  "Farg'ona",
  'Andijon',
  'Namangan',
  'Xorazm',
  'Qashqadaryo',
  'Surxondaryo',
  'Navoiy',
  'Jizzax',
  'Sirdaryo',
  "Qoraqalpog'iston",
] as const;

export function formatUzs(amount: number): string {
  return `${Math.round(amount).toLocaleString('en-US')} UZS`;
}

export function pickLocalized<T extends Record<string, unknown>>(
  obj: T,
  baseField: string,
  lang: Language
): string {
  const key = `${baseField}_${lang}`;
  const fallback = `${baseField}_uz`;
  return String(obj[key] || obj[fallback] || '');
}

const dict = {
  uz: {
    brand: 'QurilishHub',
    navMaterials: 'Materiallar',
    navServices: 'Xizmatlar',
    navProjects: 'Loyihalar',
    navCalculator: 'Kalkulyator',
    navCompanies: 'Kompaniyalar',
    navArchitects: 'Arxitektorlar',
    navCompare: 'Narxlar',
    navBlog: 'Blog',
    navAbout: 'Biz haqimizda',
    navContact: 'Aloqa',
    signIn: 'Kirish',
    register: "Ro'yxatdan o'tish",
    dashboard: 'Boshqaruv paneli',
    heroTitle: "O'zbekiston qurilish ekotizimi yagona raqamli platformada",
    heroSubtitle:
      "Qurilish materiallari, tekshirilgan pudratchilar, arxitektorlar, loyiha nazorati va aqlli smeta kalkulyatori — Toshkentdan Qoraqalpog'istongacha.",
    searchPlaceholder: 'Sement, armatura, usta yoki kompaniya qidiring...',
    allRegions: 'Barcha hududlar',
    searchBtn: 'Qidirish',
    openCalculator: 'Smeta hisoblash',
    featuredMaterials: 'Ommabop qurilish materiallari',
    popularServices: 'Qurilish xizmatlari va ustalar',
    verifiedCompanies: 'Tasdiqlangan qurilish kompaniyalari',
    featuredArchitects: 'Yetakchi arxitektorlar',
    latestProjects: 'Faol qurilish loyihalari',
    blogArticles: 'Qurilish bo‘yicha maqolalar',
    addToCart: 'Savatga qo‘shish',
    viewAll: 'Barchasini ko‘rish',
    inStock: 'Omborda bor',
    outOfStock: 'Tugagan',
    cartTitle: 'Buyurtma savati',
    checkout: 'Buyurtmani rasmiylashtirish',
    emptyCart: 'Savatingiz hozircha bo‘sh',
    total: 'Jami',
    estimateDisclaimer:
      "Taxminiy hisob-kitob: ushbu smeta bozor narxlariga asoslangan bo'lib, sertifikatlangan muhandislik loyihasi o'rnini bosmaydi.",
    downloadPdf: 'PDF Smeta yuklab olish',
    saveEstimate: 'Smetani saqlash',
    logout: 'Chiqish',
  },
  ru: {
    brand: 'QurilishHub',
    navMaterials: 'Материалы',
    navServices: 'Услуги',
    navProjects: 'Проекты',
    navCalculator: 'Калькулятор',
    navCompanies: 'Компании',
    navArchitects: 'Архитекторы',
    navCompare: 'Сравнение',
    navBlog: 'Блог',
    navAbout: 'О нас',
    navContact: 'Контакты',
    signIn: 'Войти',
    register: 'Регистрация',
    dashboard: 'Кабинет',
    heroTitle: 'Строительная экосистема Узбекистана на единой платформе',
    heroSubtitle:
      'Стройматериалы, проверенные подрядчики, архитекторы, управление стройкой и умный калькулятор сметы по всем регионам страны.',
    searchPlaceholder: 'Поиск цемента, арматуры, подрядчика или компании...',
    allRegions: 'Все регионы',
    searchBtn: 'Найти',
    openCalculator: 'Рассчитать смету',
    featuredMaterials: 'Популярные стройматериалы',
    popularServices: 'Строительные услуги и бригады',
    verifiedCompanies: 'Проверенные строительные компании',
    featuredArchitects: 'Ведущие архитекторы',
    latestProjects: 'Активные строительные проекты',
    blogArticles: 'Статьи и руководства',
    addToCart: 'В корзину',
    viewAll: 'Смотреть все',
    inStock: 'В наличии',
    outOfStock: 'Нет в наличии',
    cartTitle: 'Корзина заказов',
    checkout: 'Оформить заказ',
    emptyCart: 'Ваша корзина пуста',
    total: 'Итого',
    estimateDisclaimer:
      'Предварительная смета: расчёты ориентировочны и не заменяют сертифицированный инженерный проект.',
    downloadPdf: 'Скачать PDF смету',
    saveEstimate: 'Сохранить смету',
    logout: 'Выйти',
  },
  en: {
    brand: 'QurilishHub',
    navMaterials: 'Materials',
    navServices: 'Services',
    navProjects: 'Projects',
    navCalculator: 'Calculator',
    navCompanies: 'Companies',
    navArchitects: 'Architects',
    navCompare: 'Compare',
    navBlog: 'Blog',
    navAbout: 'About',
    navContact: 'Contact',
    signIn: 'Sign In',
    register: 'Register',
    dashboard: 'Dashboard',
    heroTitle: "Uzbekistan's complete construction ecosystem in one platform",
    heroSubtitle:
      'Source verified building materials, hire licensed contractors and architects, track construction progress, and estimate project costs in UZS.',
    searchPlaceholder: 'Search cement, rebar, contractors, or companies...',
    allRegions: 'All regions',
    searchBtn: 'Search',
    openCalculator: 'Open Estimator',
    featuredMaterials: 'Featured Building Materials',
    popularServices: 'Construction Services',
    verifiedCompanies: 'Verified Construction Companies',
    featuredArchitects: 'Featured Architects',
    latestProjects: 'Active Construction Projects',
    blogArticles: 'Construction Insights',
    addToCart: 'Add to Cart',
    viewAll: 'View All',
    inStock: 'In Stock',
    outOfStock: 'Out of Stock',
    cartTitle: 'Order Cart',
    checkout: 'Proceed to Checkout',
    emptyCart: 'Your cart is empty',
    total: 'Total',
    estimateDisclaimer:
      'Preliminary estimate only: market projections are indicative and do not constitute certified engineering calculations.',
    downloadPdf: 'Download PDF Estimate',
    saveEstimate: 'Save Estimate',
    logout: 'Sign Out',
  },
} as const;

export type TranslationKey = keyof typeof dict.uz;

export function t(lang: Language, key: TranslationKey): string {
  return dict[lang][key] || dict.uz[key];
}
