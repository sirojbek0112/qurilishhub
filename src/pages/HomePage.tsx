import { useEffect, useState } from 'react';
import { ArrowRight, Calculator, CheckCircle2, Search, ShoppingBag, Star } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { formatUzs, pickLocalized, t, UZBEKISTAN_REGIONS } from '../i18n/translations.ts';
import { apiFetch } from '../lib/api.ts';
import { ResilientImage } from '../components/ui/ResilientImage.tsx';
import type { Architect, BlogPost, Company, Product, Project, Service } from '../types.ts';

export function HomePage() {
  const { lang, navigate, addToCart } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchRegion, setSearchRegion] = useState('');
  const [searchScope, setSearchScope] = useState<'materials' | 'services' | 'companies' | 'projects'>('materials');

  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [architects, setArchitects] = useState<Architect[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [stats, setStats] = useState({ products: 0, companies: 0, projects: 0, professionals: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([
      apiFetch<{ items: Product[] }>('/api/products'),
      apiFetch<{ items: Service[] }>('/api/services'),
      apiFetch<{ items: Company[] }>('/api/companies'),
      apiFetch<{ items: Architect[] }>('/api/architects'),
      apiFetch<{ items: Project[] }>('/api/projects'),
      apiFetch<{ items: BlogPost[] }>('/api/blog'),
      apiFetch<{ products: number; companies: number; projects: number; professionals: number }>('/api/stats/public'),
    ])
      .then(([prodRes, svcRes, compRes, archRes, projRes, blogRes, statsRes]) => {
        if (!active) return;
        setProducts(prodRes.items.slice(0, 6));
        setServices(svcRes.items.slice(0, 4));
        setCompanies(compRes.items.slice(0, 2));
        setArchitects(archRes.items.slice(0, 2));
        setProjects(projRes.items.slice(0, 3));
        setBlogs(blogRes.items.slice(0, 3));
        setStats(statsRes);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set('q', searchQuery.trim());
    if (searchRegion) params.set('region', searchRegion);
    const qs = params.toString() ? `?${params.toString()}` : '';
    navigate(`/${searchScope}${qs}`);
  };

  return (
    <div className="space-y-20 pb-20">
      {/* Hero Section */}
      <section className="bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-10 pb-12 space-y-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <p className="text-xs font-medium text-[#1E40AF] dark:text-blue-400">
                  O&apos;zbekiston · 14 ta hudud · UZS shaffof narxlar
                </p>
                <h1
                  className="font-display font-bold tracking-tight text-slate-900 dark:text-white text-balance leading-[1.08]"
                  style={{ fontSize: 'clamp(2.25rem, 3.8vw, 3.5rem)' }}
                >
                  {t(lang, 'heroTitle')}
                </h1>
                <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
                  {t(lang, 'heroSubtitle')}
                </p>
              </div>

              {/* Construction Search Interface */}
              <form
                onSubmit={handleHeroSearch}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 space-y-3"
              >
                <div className="flex flex-wrap gap-1.5">
                  {(
                    [
                      { key: 'materials', label: t(lang, 'navMaterials') },
                      { key: 'services', label: t(lang, 'navServices') },
                      { key: 'companies', label: t(lang, 'navCompanies') },
                      { key: 'projects', label: t(lang, 'navProjects') },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setSearchScope(tab.key)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                        searchScope === tab.key
                          ? 'bg-[#1E40AF] text-white'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                  <div className="sm:col-span-6 relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={t(lang, 'searchPlaceholder')}
                      className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1E40AF]"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <select
                      value={searchRegion}
                      onChange={(e) => setSearchRegion(e.target.value)}
                      className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                    >
                      <option value="">{t(lang, 'allRegions')}</option>
                      {UZBEKISTAN_REGIONS.map((reg) => (
                        <option key={reg} value={reg}>
                          {reg}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-3">
                    <button
                      type="submit"
                      className="w-full py-2.5 px-4 rounded-lg bg-[#EA580C] hover:bg-orange-700 text-white text-sm font-semibold transition-colors whitespace-nowrap"
                    >
                      {t(lang, 'searchBtn')}
                    </button>
                  </div>
                </div>
              </form>

              <div className="flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={() => navigate('/calculator')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#1E40AF] hover:bg-blue-800 text-white text-sm font-semibold transition-colors whitespace-nowrap"
                >
                  <Calculator className="w-4 h-4" />
                  {t(lang, 'openCalculator')}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/compare')}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-[#1E40AF] dark:hover:text-blue-400"
                >
                  {t(lang, 'navCompare')}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="relative h-72 sm:h-88 lg:h-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
                <ResilientImage
                  src="/src/assets/images/hero_tashkent_construction_1794912446373.jpg"
                  alt="Tashkent modern construction site"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <p className="text-xs text-slate-200">Toshkent · Samarqand · Buxoro · Farg&apos;ona</p>
                  <p className="font-display text-lg font-semibold mt-0.5">
                    Loyihalashdan materiallar yetkazib berishgacha to&apos;liq nazorat
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 4-column KPI strip below hero split */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <p className="text-xs text-slate-500 dark:text-slate-400">Katalog materiallari</p>
              <p className="font-mono tabular-nums text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {stats.products || 10}+ SKU
              </p>
            </div>
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <p className="text-xs text-slate-500 dark:text-slate-400">Tasdiqlangan kompaniyalar</p>
              <p className="font-mono tabular-nums text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {stats.companies || 2} litsenziyali
              </p>
            </div>
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <p className="text-xs text-slate-500 dark:text-slate-400">Ustalar va arxitektorlar</p>
              <p className="font-mono tabular-nums text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {stats.professionals || 4} jamoa
              </p>
            </div>
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <p className="text-xs text-slate-500 dark:text-slate-400">Faol obyektlar</p>
              <p className="font-mono tabular-nums text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {stats.projects || 3} loyiha
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Building Materials */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              {t(lang, 'featuredMaterials')}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Zavod va rasmiy dilerlardan to&apos;g&apos;ridan-to&apos;g&apos;ri UZS narxlarida
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/materials')}
            className="text-sm font-semibold text-[#1E40AF] dark:text-blue-400 hover:underline whitespace-nowrap shrink-0"
          >
            {t(lang, 'viewAll')}
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-80 rounded-xl bg-slate-200/70 dark:bg-slate-800 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <article
                key={product.id}
                className="group rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden transition-transform duration-150 hover:-translate-y-0.5 flex flex-col"
              >
                <div
                  onClick={() => navigate(`/materials/${product.id}`)}
                  className="aspect-[4/3] bg-slate-100 dark:bg-slate-950 overflow-hidden cursor-pointer"
                >
                  <ResilientImage
                    src={product.image_url}
                    alt={pickLocalized(product as unknown as Record<string, unknown>, 'name', lang)}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  />
                </div>
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span>{pickLocalized(product as unknown as Record<string, unknown>, 'category', lang)}</span>
                      <span aria-hidden="true">·</span>
                      <span>{product.region}</span>
                    </div>
                    <h3
                      onClick={() => navigate(`/materials/${product.id}`)}
                      className="font-display text-base font-semibold text-slate-900 dark:text-white cursor-pointer hover:text-[#1E40AF] dark:hover:text-blue-400 line-clamp-2"
                    >
                      {pickLocalized(product as unknown as Record<string, unknown>, 'name', lang)}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <span>{product.seller_name}</span>
                      <span aria-hidden="true">·</span>
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span className="font-mono tabular-nums">{product.rating}</span>
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                    <div>
                      <p className="font-mono tabular-nums text-base font-bold text-slate-900 dark:text-white">
                        {formatUzs(product.price_uzs)}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">/ {product.unit}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => addToCart(product, 1)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#1E40AF] hover:bg-blue-800 text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      {t(lang, 'addToCart')}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Services & Verified Companies/Architects */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              {t(lang, 'popularServices')}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Litsenziyalangan qurilish brigadalari, muhandislar va arxitektorlar
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/services')}
            className="text-sm font-semibold text-[#1E40AF] dark:text-blue-400 hover:underline whitespace-nowrap shrink-0"
          >
            {t(lang, 'viewAll')}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {services.map((svc) => (
            <div
              key={svc.id}
              onClick={() => navigate(`/services/${svc.id}`)}
              className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 cursor-pointer hover:border-[#1E40AF]/40 transition-colors"
            >
              <ResilientImage
                src={svc.image_url}
                alt={pickLocalized(svc as unknown as Record<string, unknown>, 'title', lang)}
                className="w-full sm:w-40 h-32 rounded-lg object-cover shrink-0"
              />
              <div className="flex-1 flex flex-col justify-between space-y-2">
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <span>{pickLocalized(svc as unknown as Record<string, unknown>, 'category', lang)}</span>
                    <span aria-hidden="true">·</span>
                    <span>{svc.region}</span>
                  </div>
                  <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white mt-1">
                    {pickLocalized(svc as unknown as Record<string, unknown>, 'title', lang)}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
                    {pickLocalized(svc as unknown as Record<string, unknown>, 'description', lang)}
                  </p>
                </div>
                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="font-medium text-slate-700 dark:text-slate-300">{svc.provider_name}</span>
                  <span className="font-mono tabular-nums font-bold text-[#EA580C]">
                    {formatUzs(svc.price_from_uzs)} / {svc.price_unit}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
          <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                {t(lang, 'verifiedCompanies')}
              </h3>
              <button
                type="button"
                onClick={() => navigate('/companies')}
                className="text-xs font-semibold text-[#1E40AF] dark:text-blue-400 hover:underline"
              >
                {t(lang, 'viewAll')}
              </button>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {companies.map((comp) => (
                <div
                  key={comp.id}
                  onClick={() => navigate(`/companies/${comp.id}`)}
                  className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4 cursor-pointer"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                      {comp.name}
                      {comp.verified === 1 && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {comp.region} · {comp.completed_projects} loyiha · {comp.license_number}
                    </p>
                  </div>
                  <span className="font-mono tabular-nums text-sm font-semibold text-slate-900 dark:text-white shrink-0">
                    ★ {comp.rating}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                {t(lang, 'featuredArchitects')}
              </h3>
              <button
                type="button"
                onClick={() => navigate('/architects')}
                className="text-xs font-semibold text-[#1E40AF] dark:text-blue-400 hover:underline"
              >
                {t(lang, 'viewAll')}
              </button>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {architects.map((arch) => (
                <div
                  key={arch.id}
                  onClick={() => navigate(`/architects/${arch.id}`)}
                  className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4 cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <ResilientImage
                      src={arch.avatar_url}
                      alt={arch.full_name}
                      className="w-11 h-11 rounded-lg object-cover shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {arch.full_name} — {arch.studio_name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {arch.region} · {arch.experience_years} yil tajriba
                      </p>
                    </div>
                  </div>
                  <span className="font-mono tabular-nums text-xs font-semibold text-slate-700 dark:text-slate-300 shrink-0">
                    {formatUzs(arch.price_per_sqm_uzs)}/m²
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Active Construction Projects & Testimonials & Blog */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              {t(lang, 'latestProjects')}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Ochiq byudjet, bajarilish foizi va maydon hisobotlari bilan
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/projects')}
            className="text-sm font-semibold text-[#1E40AF] dark:text-blue-400 hover:underline whitespace-nowrap shrink-0"
          >
            {t(lang, 'viewAll')}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {projects.map((proj) => (
            <div
              key={proj.id}
              onClick={() => navigate(`/projects/${proj.id}`)}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden cursor-pointer hover:border-[#1E40AF]/40 transition-colors"
            >
              <div className="aspect-[16/9] bg-slate-100 dark:bg-slate-950">
                <ResilientImage src={proj.image_url} alt={proj.name} className="w-full h-full object-cover" />
              </div>
              <div className="p-5 space-y-3">
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {proj.region} · {proj.building_area_sqm} m² · {proj.floors} qavat
                </div>
                <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white">{proj.name}</h3>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400">Bajarilish</span>
                    <span className="font-mono tabular-nums font-semibold text-slate-900 dark:text-white">
                      {proj.progress_percent}%
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-[#1E40AF] rounded-full"
                      style={{ width: `${proj.progress_percent}%` }}
                    />
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">Smeta</span>
                  <span className="font-mono tabular-nums font-semibold text-slate-900 dark:text-white">
                    {formatUzs(proj.estimated_budget_uzs)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials & Blog */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <blockquote className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
            <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed">
              &ldquo;Yunusoboddagi 320 m² uyimiz qurilishida smeta va materiallar yetkazib berishni QurilishHub orqali yuritdik. Armatura va sement xarajatlarimiz 14% ga tejaldi.&rdquo;
            </p>
            <footer className="text-xs text-slate-500 dark:text-slate-400">
              <strong className="text-slate-900 dark:text-white">Azizbek Karimov</strong> · Xususiy buyurtmachi, Toshkent shahri
            </footer>
          </blockquote>
          <blockquote className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
            <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed">
              &ldquo;Barcha obyektlarimizdagi vazifalar, prorab hisobotlari va ombor buyurtmalari yagona boshqaruv panelida jamlangani mijozlarimiz ishonchini keskin oshirdi.&rdquo;
            </p>
            <footer className="text-xs text-slate-500 dark:text-slate-400">
              <strong className="text-slate-900 dark:text-white">Rustam Xolmatov</strong> · Bosh muhandis, Toshkent City Build Group
            </footer>
          </blockquote>
        </div>

        <div className="space-y-5">
          <div className="flex items-end justify-between">
            <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">{t(lang, 'blogArticles')}</h2>
            <button
              type="button"
              onClick={() => navigate('/blog')}
              className="text-sm font-semibold text-[#1E40AF] dark:text-blue-400 hover:underline"
            >
              {t(lang, 'viewAll')}
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {blogs.map((post) => (
              <article
                key={post.id}
                onClick={() => navigate(`/blog/${post.id}`)}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden cursor-pointer hover:border-[#1E40AF]/40 transition-colors"
              >
                <div className="aspect-[4/3] bg-slate-100 dark:bg-slate-950">
                  <ResilientImage
                    src={post.image_url}
                    alt={pickLocalized(post as unknown as Record<string, unknown>, 'title', lang)}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-5 space-y-2">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {post.category} · {post.read_minutes} min
                  </p>
                  <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white line-clamp-2">
                    {pickLocalized(post as unknown as Record<string, unknown>, 'title', lang)}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                    {pickLocalized(post as unknown as Record<string, unknown>, 'excerpt', lang)}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
