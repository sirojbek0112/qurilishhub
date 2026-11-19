import { useEffect, useState } from 'react';
import { Heart, MessageSquare, ShoppingBag, Star } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { formatUzs, pickLocalized, t, UZBEKISTAN_REGIONS } from '../i18n/translations.ts';
import { apiFetch } from '../lib/api.ts';
import { ResilientImage } from '../components/ui/ResilientImage.tsx';
import type { Product, Service } from '../types.ts';

interface CategoryRow {
  id: number;
  slug: string;
  name_uz: string;
  name_ru: string;
  name_en: string;
}

export function MaterialsPage() {
  const { lang, navigate, addToCart, path } = useApp();
  const params = new URLSearchParams(path.split('?')[1] || '');
  const [q, setQ] = useState(params.get('q') || '');
  const [region, setRegion] = useState(params.get('region') || '');
  const [category, setCategory] = useState(params.get('category') || '');
  const [sort, setSort] = useState('newest');
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<{ productCategories: CategoryRow[] }>('/api/categories')
      .then((res) => setCategories(res.productCategories))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    setLoading(true);
    const sp = new URLSearchParams();
    if (q.trim()) sp.set('q', q.trim());
    if (region) sp.set('region', region);
    if (category) sp.set('category', category);
    if (sort) sp.set('sort', sort);
    apiFetch<{ items: Product[] }>(`/api/products?${sp.toString()}`)
      .then((res) => setItems(res.items))
      .finally(() => setLoading(false));
  }, [q, region, category, sort]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-white">{t(lang, 'navMaterials')}</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Sement, g&apos;isht, armatura, tom yopish va issiqlik izolyatsiyasi — {items.length} ta mahsulot
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/compare')}
          className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
        >
          {t(lang, 'navCompare')}
        </button>
      </div>

      {/* Filters */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setCategory('')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              category === ''
                ? 'bg-[#1E40AF] text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            Barchasi
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategory(cat.slug)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                category === cat.slug
                  ? 'bg-[#1E40AF] text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              {pickLocalized(cat as unknown as Record<string, unknown>, 'name', lang)}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t(lang, 'searchPlaceholder')}
            className="px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
          />
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
          >
            <option value="">{t(lang, 'allRegions')}</option>
            {UZBEKISTAN_REGIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
          >
            <option value="newest">Eng yangilari</option>
            <option value="price_asc">Arzondan qimmatga</option>
            <option value="price_desc">Qimmatdan arzonga</option>
            <option value="rating">Reyting bo&apos;yicha</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-80 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="p-12 text-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <p className="text-sm text-slate-500">Tanlangan filtrlar bo&apos;yicha mahsulot topilmadi.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((product) => (
            <article
              key={product.id}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden flex flex-col justify-between"
            >
              <div>
                <div
                  onClick={() => navigate(`/materials/${product.id}`)}
                  className="aspect-[4/3] bg-slate-100 dark:bg-slate-950 cursor-pointer"
                >
                  <ResilientImage
                    src={product.image_url}
                    alt={pickLocalized(product as unknown as Record<string, unknown>, 'name', lang)}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-5 space-y-2">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {pickLocalized(product as unknown as Record<string, unknown>, 'category', lang)} · {product.region}
                  </p>
                  <h2
                    onClick={() => navigate(`/materials/${product.id}`)}
                    className="font-display text-base font-semibold text-slate-900 dark:text-white cursor-pointer hover:text-[#1E40AF]"
                  >
                    {pickLocalized(product as unknown as Record<string, unknown>, 'name', lang)}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {product.seller_name} · ★ {product.rating} · Ombor: {product.stock_quantity} {product.unit}
                  </p>
                </div>
              </div>
              <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <p className="font-mono tabular-nums text-base font-bold text-slate-900 dark:text-white">
                    {formatUzs(product.price_uzs)}
                  </p>
                  <p className="text-xs text-slate-500">/ {product.unit}</p>
                </div>
                <button
                  type="button"
                  disabled={product.stock_quantity <= 0}
                  onClick={() => addToCart(product, 1)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#1E40AF] hover:bg-blue-800 disabled:opacity-50 text-white text-xs font-semibold"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  {t(lang, 'addToCart')}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export function ProductDetailPage({ id }: { id: number }) {
  const { user, lang, addToCart, navigate, showToast } = useApp();
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Array<{ id: number; author_name: string; rating: number; comment: string; created_at: string }>>([]);
  const [qty, setQty] = useState(10);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    apiFetch<{ product: Product; reviews: typeof reviews }>(`/api/products/${id}`)
      .then((res) => {
        setProduct(res.product);
        setReviews(res.reviews);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [id]);

  const handleToggleFavorite = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    const res = await apiFetch<{ favorited: boolean }>('/api/favorites/toggle', {
      method: 'POST',
      body: JSON.stringify({ targetType: 'PRODUCT', targetId: id }),
    });
    showToast(res.favorited ? 'Tanlanganlarga qo‘shildi' : 'Tanlanganlardan olib tashlandi', 'info');
  };

  const handleMessageSeller = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!product) return;
    await apiFetch('/api/conversations', {
      method: 'POST',
      body: JSON.stringify({
        peerId: product.seller_id,
        subject: pickLocalized(product as unknown as Record<string, unknown>, 'name', lang),
      }),
    });
    navigate('/dashboard?tab=messages');
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    await apiFetch('/api/reviews', {
      method: 'POST',
      body: JSON.stringify({ targetType: 'PRODUCT', targetId: id, rating, comment }),
    });
    setComment('');
    showToast('Sharhingiz saqlandi', 'success');
    load();
  };

  if (loading) return <div className="max-w-7xl mx-auto p-10 text-sm text-slate-500">Yuklanmoqda...</div>;
  if (!product) return <div className="max-w-7xl mx-auto p-10 text-sm text-red-500">Mahsulot topilmadi.</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-6 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <ResilientImage
            src={product.image_url}
            alt={pickLocalized(product as unknown as Record<string, unknown>, 'name', lang)}
            className="w-full aspect-[4/3] object-cover"
          />
        </div>

        <div className="lg:col-span-6 p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-5">
          <div className="space-y-1.5">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              SKU: {product.sku} · {product.region} · {product.seller_name}
            </p>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              {pickLocalized(product as unknown as Record<string, unknown>, 'name', lang)}
            </h1>
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span className="font-mono tabular-nums font-semibold">{product.rating}</span>
              <span>({product.review_count} sharh)</span>
              <span>·</span>
              <span>
                Ombor: {product.stock_quantity} {product.unit}
              </span>
            </div>
          </div>

          <div className="py-4 border-y border-slate-100 dark:border-slate-800">
            <p className="font-mono tabular-nums text-3xl font-bold text-slate-900 dark:text-white">
              {formatUzs(product.price_uzs)}
            </p>
            <p className="text-xs text-slate-500 mt-1">Birlik: {product.unit} · {product.delivery_options}</p>
          </div>

          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            {pickLocalized(product as unknown as Record<string, unknown>, 'description', lang)}
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <input
              type="number"
              min={1}
              max={product.stock_quantity || 1}
              value={qty}
              onChange={(e) => setQty(Math.max(1, Number(e.target.value)))}
              className="w-24 px-3 py-2.5 text-sm font-mono tabular-nums rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
            />
            <button
              type="button"
              onClick={() => addToCart(product, qty)}
              className="flex-1 py-2.5 px-5 rounded-lg bg-[#1E40AF] hover:bg-blue-800 text-white text-sm font-semibold"
            >
              {t(lang, 'addToCart')}
            </button>
            <button
              type="button"
              onClick={handleToggleFavorite}
              aria-label="Favorite"
              className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Heart className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={handleMessageSeller}
              className="inline-flex items-center gap-2 py-2.5 px-4 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <MessageSquare className="w-4 h-4" />
              Sotuvchiga yozish
            </button>
          </div>
        </div>
      </div>

      {/* Reviews */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-4">
          <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">Mijozlar sharhlari</h2>
          {reviews.length === 0 ? (
            <p className="text-sm text-slate-500">Hozircha sharhlar yo&apos;q.</p>
          ) : (
            reviews.map((r) => (
              <div key={r.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1.5">
                <div className="flex justify-between text-xs text-slate-500">
                  <strong className="text-slate-900 dark:text-white">{r.author_name}</strong>
                  <span>★ {r.rating}/5</span>
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-300">{r.comment}</p>
              </div>
            ))
          )}
        </div>
        <form
          onSubmit={handleSubmitReview}
          className="lg:col-span-5 p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3 h-fit"
        >
          <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white">Sharh qoldirish</h3>
          <select
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
          >
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {n} yulduz
              </option>
            ))}
          </select>
          <textarea
            required
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Mahsulot sifati va yetkazib berish haqida fikringiz..."
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
          />
          <button type="submit" className="w-full py-2 rounded-lg bg-[#1E40AF] text-white text-sm font-semibold">
            Yuborish
          </button>
        </form>
      </div>
    </div>
  );
}

export function ServicesPage() {
  const { lang, navigate, path } = useApp();
  const params = new URLSearchParams(path.split('?')[1] || '');
  const [q, setQ] = useState(params.get('q') || '');
  const [region, setRegion] = useState(params.get('region') || '');
  const [items, setItems] = useState<Service[]>([]);

  useEffect(() => {
    const sp = new URLSearchParams();
    if (q.trim()) sp.set('q', q.trim());
    if (region) sp.set('region', region);
    apiFetch<{ items: Service[] }>(`/api/services?${sp.toString()}`).then((res) => setItems(res.items));
  }, [q, region]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-white">{t(lang, 'navServices')}</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Poydevor, monolit, g&apos;isht terish, fasad va arxitektura xizmatlari
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Xizmat nomini qidiring..."
          className="px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
        />
        <select
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          className="px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
        >
          <option value="">{t(lang, 'allRegions')}</option>
          {UZBEKISTAN_REGIONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {items.map((svc) => (
          <div
            key={svc.id}
            onClick={() => navigate(`/services/${svc.id}`)}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden cursor-pointer hover:border-[#1E40AF]/50 transition-colors flex flex-col sm:flex-row"
          >
            <ResilientImage
              src={svc.image_url}
              alt={pickLocalized(svc as unknown as Record<string, unknown>, 'title', lang)}
              className="w-full sm:w-48 h-48 sm:h-auto object-cover shrink-0"
            />
            <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
              <div>
                <p className="text-xs text-slate-500">
                  {pickLocalized(svc as unknown as Record<string, unknown>, 'category', lang)} · {svc.region}
                </p>
                <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white mt-1">
                  {pickLocalized(svc as unknown as Record<string, unknown>, 'title', lang)}
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 line-clamp-2">
                  {pickLocalized(svc as unknown as Record<string, unknown>, 'description', lang)}
                </p>
              </div>
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  {svc.provider_name} · ★ {svc.rating}
                </span>
                <span className="font-mono tabular-nums text-sm font-bold text-[#EA580C]">
                  {formatUzs(svc.price_from_uzs)} / {svc.price_unit}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ServiceDetailPage({ id }: { id: number }) {
  const { user, lang, navigate, showToast } = useApp();
  const [service, setService] = useState<Service | null>(null);
  const [portfolios, setPortfolios] = useState<Array<{ id: number; title: string; region: string; area_sqm: number; image_url: string }>>([]);
  const [preferredDate, setPreferredDate] = useState('2026-12-01');
  const [budgetUzs, setBudgetUzs] = useState(25000000);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    apiFetch<{ service: Service; portfolios: typeof portfolios }>(`/api/services/${id}`).then((res) => {
      setService(res.service);
      setPortfolios(res.portfolios);
    });
  }, [id]);

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    await apiFetch('/api/service-bookings', {
      method: 'POST',
      body: JSON.stringify({ serviceId: id, preferredDate, budgetUzs, notes }),
    });
    setNotes('');
    showToast('Ish so‘rovingiz pudratchiga yuborildi!', 'success');
  };

  if (!service) return <div className="max-w-7xl mx-auto p-10 text-sm text-slate-500">Yuklanmoqda...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-6">
          <ResilientImage
            src={service.image_url}
            alt={pickLocalized(service as unknown as Record<string, unknown>, 'title', lang)}
            className="w-full aspect-[16/9] rounded-xl object-cover border border-slate-200 dark:border-slate-800"
          />
          <div className="space-y-3">
            <p className="text-xs text-slate-500">
              {service.region} · {service.provider_name} · ★ {service.rating}
            </p>
            <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-white">
              {pickLocalized(service as unknown as Record<string, unknown>, 'title', lang)}
            </h1>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {pickLocalized(service as unknown as Record<string, unknown>, 'description', lang)}
            </p>
          </div>

          {portfolios.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">Portfolio ishlari</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {portfolios.map((pf) => (
                  <div key={pf.id} className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900">
                    <ResilientImage src={pf.image_url} alt={pf.title} className="w-full aspect-[4/3] object-cover" />
                    <div className="p-3">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{pf.title}</p>
                      <p className="text-xs text-slate-500">{pf.region} · {pf.area_sqm} m²</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <form
          onSubmit={handleBook}
          className="lg:col-span-5 p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4 h-fit"
        >
          <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <p className="text-xs text-slate-500">Boshlang&apos;ich narx</p>
            <p className="font-mono tabular-nums text-2xl font-bold text-[#EA580C]">
              {formatUzs(service.price_from_uzs)} / {service.price_unit}
            </p>
          </div>
          <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-white">Buyurtma / Ish so‘rovi</h3>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Boshlash sanasi</label>
            <input
              type="date"
              value={preferredDate}
              onChange={(e) => setPreferredDate(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Taxminiy byudjet (UZS)</label>
            <input
              type="number"
              value={budgetUzs}
              onChange={(e) => setBudgetUzs(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm font-mono tabular-nums rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Obyekt haqida izoh</label>
            <textarea
              required
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Maydon, manzil va ish hajmi haqida yozing..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
            />
          </div>
          <button type="submit" className="w-full py-2.5 rounded-lg bg-[#1E40AF] text-white text-sm font-semibold">
            So&apos;rov yuborish
          </button>
          <button
            type="button"
            onClick={async () => {
              if (!user) {
                navigate('/login');
                return;
              }
              await apiFetch('/api/conversations', {
                method: 'POST',
                body: JSON.stringify({ peerId: service.provider_id, subject: service.title_uz }),
              });
              navigate('/dashboard?tab=messages');
            }}
            className="w-full py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-medium"
          >
            Pudratchi bilan chat
          </button>
        </form>
      </div>
    </div>
  );
}

export function PriceComparisonPage() {
  const { lang, addToCart, navigate } = useApp();
  const [items, setItems] = useState<Product[]>([]);
  const [catFilter, setCatFilter] = useState('');

  useEffect(() => {
    const qs = catFilter ? `?category=${catFilter}` : '';
    apiFetch<{ items: Product[] }>(`/api/price-comparison${qs}`).then((res) => setItems(res.items));
  }, [catFilter]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-white">
            Materiallar Narxlarini Taqqoslash
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            O&apos;zbekiston yetkazib beruvchilari bo&apos;yicha eng arzon UZS takliflar reytingi
          </p>
        </div>
        <select
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
          className="px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
        >
          <option value="">Barcha toifalar</option>
          <option value="cement-mixes">Sement va qorishmalar</option>
          <option value="bricks-blocks">G&apos;isht va bloklar</option>
          <option value="steel-rebar">Armatura va metall</option>
          <option value="roofing-timber">Tom va yog&apos;och</option>
        </select>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-left text-xs text-slate-500">
              <th className="py-3 px-4">Mahsulot</th>
              <th className="py-3 px-4">Yetkazib beruvchi</th>
              <th className="py-3 px-4">Hudud</th>
              <th className="py-3 px-4 text-right">Narx (UZS)</th>
              <th className="py-3 px-4 text-right">Ombor</th>
              <th className="py-3 px-4 text-right">Harakat</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {items.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-950/60">
                <td
                  onClick={() => navigate(`/materials/${row.id}`)}
                  className="py-3 px-4 font-medium text-slate-900 dark:text-white cursor-pointer hover:text-[#1E40AF]"
                >
                  {pickLocalized(row as unknown as Record<string, unknown>, 'name', lang)}
                </td>
                <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{row.seller_name}</td>
                <td className="py-3 px-4 text-slate-500">{row.region}</td>
                <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                  {formatUzs(row.price_uzs)} / {row.unit}
                </td>
                <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-600 dark:text-slate-400">
                  {row.stock_quantity}
                </td>
                <td className="py-3 px-4 text-right">
                  <button
                    type="button"
                    onClick={() => addToCart(row, 1)}
                    className="px-3 py-1.5 rounded-md bg-[#1E40AF] text-white text-xs font-semibold"
                  >
                    {t(lang, 'addToCart')}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
