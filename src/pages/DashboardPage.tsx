import { useEffect, useState } from 'react';
import {
  Bell,
  Briefcase,
  Building2,
  Calculator,
  CreditCard,
  FileText,
  FolderKanban,
  Heart,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Package,
  Plus,
  Settings,
  Shield,
  ShoppingBag,
  Trash2,
  Users,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { formatUzs, t, UZBEKISTAN_REGIONS } from '../i18n/translations.ts';
import { apiFetch } from '../lib/api.ts';
import { HorizontalBarChart } from '../components/ui/Charts.tsx';
import { RealTimeChatView } from './dashboard/RealTimeChatView.tsx';
import { ProjectWorkspaceView } from './dashboard/ProjectWorkspaceView.tsx';
import { AdminWorkspaceView } from './dashboard/AdminWorkspaceView.tsx';
import type { OrderStatus, Product, Project } from '../types.ts';

type DashTab =
  | 'overview'
  | 'projects'
  | 'orders'
  | 'products'
  | 'services'
  | 'company'
  | 'estimates'
  | 'messages'
  | 'payments'
  | 'contracts'
  | 'favorites'
  | 'notifications'
  | 'profile'
  | 'admin';

export function DashboardPage() {
  const { user, authLoading, lang, logout, navigate, refreshUser, showToast, path } = useApp();
  const initialTab = (new URLSearchParams(path.split('?')[1] || '').get('tab') as DashTab) || 'overview';
  const [tab, setTab] = useState<DashTab>(initialTab);

  const [projects, setProjects] = useState<Project[]>([]);
  const [orders, setOrders] = useState<
    Array<{ id: number; order_number: string; status: OrderStatus; total_uzs: number; customer_name: string; seller_name: string; created_at: string }>
  >([]);
  const [sellerProducts, setSellerProducts] = useState<Product[]>([]);
  const [estimates, setEstimates] = useState<Array<{ id: number; title: string; building_area_sqm: number; floors: number; region: string; total_estimated_uzs: number }>>([]);
  const [payments, setPayments] = useState<Array<{ id: number; payment_ref: string; provider: string; amount_uzs: number; status: string; created_at: string }>>([]);
  const [contracts, setContracts] = useState<Array<{ id: number; contract_number: string; title: string; amount_uzs: number; status: string; project_name: string }>>([]);
  const [favorites, setFavorites] = useState<Product[]>([]);
  const [notifications, setNotifications] = useState<Array<{ id: number; title: string; body: string; is_read: number; created_at: string }>>([]);
  const [bookings, setBookings] = useState<Array<{ id: number; service_title: string; customer_name: string; provider_name: string; budget_uzs: number; status: string; preferred_date: string }>>([]);
  const [employees, setEmployees] = useState<Array<{ id: number; full_name: string; position: string; specialty: string; salary_uzs: number }>>([]);

  // Seller Add Product form
  const [prodName, setProdName] = useState('');
  const [prodPrice, setProdPrice] = useState(50000);
  const [prodStock, setProdStock] = useState(100);
  const [prodUnit, setProdUnit] = useState('dona');
  const [prodCategory, setProdCategory] = useState(1);

  // Contractor/Architect Add Service & Portfolio
  const [svcTitle, setSvcTitle] = useState('');
  const [svcPrice, setSvcPrice] = useState(180000);
  const [svcUnit, setSvcUnit] = useState('m²');

  // Company Add Employee
  const [empName, setEmpName] = useState('');
  const [empPos, setEmpPos] = useState('Muhandis');
  const [empSpec, setEmpSpec] = useState('Monolit');

  // Profile Edit
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [region, setRegion] = useState(user?.region || UZBEKISTAN_REGIONS[0]);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName);
      setPhone(user.phone || '');
      setRegion(user.region);
    }
  }, [user]);

  const loadWorkspaceData = () => {
    if (!user) return;
    apiFetch<{ items: Project[] }>('/api/projects?mine=true').then((r) => setProjects(r.items)).catch(() => undefined);
    apiFetch<{ items: typeof orders }>(`/api/orders?scope=${user.role === 'SELLER' ? 'seller' : 'customer'}`)
      .then((r) => setOrders(r.items))
      .catch(() => undefined);
    apiFetch<{ items: typeof estimates }>('/api/estimates').then((r) => setEstimates(r.items)).catch(() => undefined);
    apiFetch<{ items: typeof payments }>('/api/payments').then((r) => setPayments(r.items)).catch(() => undefined);
    apiFetch<{ items: typeof contracts }>('/api/contracts').then((r) => setContracts(r.items)).catch(() => undefined);
    apiFetch<{ products: Product[] }>('/api/favorites').then((r) => setFavorites(r.products)).catch(() => undefined);
    apiFetch<{ items: typeof notifications }>('/api/notifications').then((r) => setNotifications(r.items)).catch(() => undefined);
    apiFetch<{ items: typeof bookings }>('/api/service-bookings').then((r) => setBookings(r.items)).catch(() => undefined);

    if (user.role === 'SELLER' || user.role === 'ADMIN') {
      apiFetch<{ items: Product[] }>(`/api/products?sellerId=${user.id}`)
        .then((r) => setSellerProducts(r.items))
        .catch(() => undefined);
    }
    if (user.role === 'COMPANY') {
      apiFetch<{ items: Array<{ id: number; owner_id: number }> }>('/api/companies')
        .then(async (res) => {
          const mine = res.items.find((c) => c.owner_id === user.id);
          if (mine) {
            const detail = await apiFetch<{ employees: typeof employees }>(`/api/companies/${mine.id}`);
            setEmployees(detail.employees);
          }
        })
        .catch(() => undefined);
    }
  };

  useEffect(() => {
    loadWorkspaceData();
  }, [user?.id, user?.role]);

  if (authLoading) {
    return <div className="max-w-7xl mx-auto p-10 text-sm text-slate-500">Yuklanmoqda...</div>;
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center space-y-4">
        <h1 className="font-display text-xl font-bold text-slate-900 dark:text-white">Kirish talab etiladi</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Shaxsiy kabinet va loyihalar boshqaruvi uchun tizimga kiring.
        </p>
        <button
          type="button"
          onClick={() => navigate('/login')}
          className="px-5 py-2.5 rounded-lg bg-[#1E40AF] text-white text-sm font-semibold"
        >
          {t(lang, 'signIn')}
        </button>
      </div>
    );
  }

  const totalBudget = projects.reduce((s, p) => s + p.estimated_budget_uzs, 0);
  const totalSpent = projects.reduce((s, p) => s + p.spent_uzs, 0);
  const unreadNotifications = notifications.filter((n) => n.is_read === 0).length;

  const navItems: Array<{ key: DashTab; label: string; icon: React.ComponentType<{ className?: string }>; roles?: string[] }> = [
    { key: 'overview', label: 'Umumiy ko‘rsatkichlar', icon: LayoutDashboard },
    { key: 'projects', label: 'Loyihalarim', icon: FolderKanban },
    { key: 'orders', label: 'Buyurtmalar', icon: ShoppingBag },
    { key: 'products', label: 'Mahsulotlar va ombor', icon: Package, roles: ['SELLER', 'ADMIN'] },
    { key: 'services', label: 'Xizmatlar va so‘rovlar', icon: Briefcase, roles: ['CONTRACTOR', 'ARCHITECT', 'CUSTOMER', 'COMPANY', 'ADMIN'] },
    { key: 'company', label: 'Kompaniya xodimlari', icon: Users, roles: ['COMPANY'] },
    { key: 'estimates', label: 'Smetalarim', icon: Calculator },
    { key: 'messages', label: 'Xabarlar (Live Chat)', icon: MessageSquare },
    { key: 'payments', label: "To'lovlar va obuna", icon: CreditCard },
    { key: 'contracts', label: 'Shartnomalar', icon: FileText },
    { key: 'favorites', label: 'Tanlanganlar', icon: Heart },
    { key: 'notifications', label: `Bildirishnomalar (${unreadNotifications})`, icon: Bell },
    { key: 'admin', label: 'Admin Panel', icon: Shield, roles: ['ADMIN'] },
    { key: 'profile', label: 'Profil va sozlamalar', icon: Settings },
  ];

  const visibleNav = navItems.filter((item) => !item.roles || item.roles.includes(user.role));

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    await apiFetch('/api/products', {
      method: 'POST',
      body: JSON.stringify({
        categoryId: prodCategory,
        nameUz: prodName,
        descriptionUz: `${prodName} — QurilishHub yetkazib beruvchisidan.`,
        priceUzs: prodPrice,
        unit: prodUnit,
        stockQuantity: prodStock,
        region: user.region,
        deliveryOptions: 'Yetkazib berish / Olib ketish',
      }),
    });
    setProdName('');
    loadWorkspaceData();
    showToast('Yangi mahsulot qo‘shildi', 'success');
  };

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    await apiFetch('/api/services', {
      method: 'POST',
      body: JSON.stringify({
        categoryId: 1,
        titleUz: svcTitle,
        descriptionUz: `${svcTitle} — kafolatli shartnoma asosida.`,
        priceFromUzs: svcPrice,
        priceUnit: svcUnit,
        region: user.region,
      }),
    });
    setSvcTitle('');
    showToast('Xizmat katalogga qo‘shildi', 'success');
  };

  const handleSubscribeSandbox = async (plan: 'PRO_SELLER' | 'ENTERPRISE_COMPANY') => {
    const pay = await apiFetch<{ id: number }>('/api/payments/initiate', {
      method: 'POST',
      body: JSON.stringify({ provider: 'CLICK', subscriptionPlan: plan }),
    });
    await apiFetch(`/api/payments/${pay.id}/confirm-sandbox`, { method: 'POST' });
    loadWorkspaceData();
    showToast(`${plan} obunasi Click Sandbox orqali faollashtirildi`, 'success');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Sidebar */}
        <aside className="lg:col-span-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-4">
          <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <p className="text-xs font-mono font-semibold text-[#1E40AF] dark:text-blue-400">{user.role}</p>
            <p className="font-display text-base font-bold text-slate-900 dark:text-white truncate mt-0.5">
              {user.fullName}
            </p>
            <p className="text-xs text-slate-500 truncate">{user.region}</p>
          </div>

          <nav className="space-y-1">
            {visibleNav.map((item) => {
              const Icon = item.icon;
              const active = tab === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setTab(item.key)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${
                    active
                      ? 'bg-[#1E40AF] text-white'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>

          <button
            type="button"
            onClick={() => void logout()}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
          >
            <LogOut className="w-4 h-4" />
            {t(lang, 'logout')}
          </button>
        </aside>

        {/* Main Viewport */}
        <main className="lg:col-span-9 space-y-6">
          {tab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <p className="text-xs text-slate-500">Jami loyihalar</p>
                  <p className="font-mono tabular-nums text-2xl font-bold mt-1">{projects.length}</p>
                </div>
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <p className="text-xs text-slate-500">Jami smeta byudjeti</p>
                  <p className="font-mono tabular-nums text-lg font-bold mt-1">{formatUzs(totalBudget)}</p>
                </div>
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <p className="text-xs text-slate-500">Sarflangan xarajat</p>
                  <p className="font-mono tabular-nums text-lg font-bold text-[#EA580C] mt-1">{formatUzs(totalSpent)}</p>
                </div>
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <p className="text-xs text-slate-500">Qolgan byudjet</p>
                  <p className="font-mono tabular-nums text-lg font-bold text-emerald-600 mt-1">
                    {formatUzs(Math.max(0, totalBudget - totalSpent))}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
                  <h2 className="font-display text-base font-bold">Loyihalar byudjeti taqqoslanishi</h2>
                  {projects.length === 0 ? (
                    <p className="text-xs text-slate-500">Hozircha loyihalar mavjud emas.</p>
                  ) : (
                    <HorizontalBarChart
                      data={projects.map((p) => ({
                        label: p.name,
                        value: p.estimated_budget_uzs,
                      }))}
                    />
                  )}
                </div>

                <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                  <h2 className="font-display text-base font-bold">So&apos;nggi buyurtmalar</h2>
                  {orders.length === 0 ? (
                    <p className="text-xs text-slate-500">Buyurtmalar yo&apos;q.</p>
                  ) : (
                    orders.slice(0, 5).map((ord) => (
                      <div key={ord.id} className="flex items-center justify-between text-sm py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                        <div>
                          <p className="font-mono font-semibold text-xs">{ord.order_number}</p>
                          <p className="text-xs text-slate-500">{ord.status}</p>
                        </div>
                        <span className="font-mono tabular-nums font-semibold">{formatUzs(ord.total_uzs)}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {tab === 'projects' && <ProjectWorkspaceView />}

          {tab === 'orders' && (
            <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
              <h2 className="font-display text-xl font-bold">Buyurtmalar boshqaruvi</h2>
              {orders.length === 0 ? (
                <p className="text-sm text-slate-500">Buyurtmalar mavjud emas.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-left text-xs text-slate-500">
                        <th className="py-2.5 pr-4">Raqam</th>
                        <th className="py-2.5 pr-4">Mijoz / Sotuvchi</th>
                        <th className="py-2.5 pr-4">Summa</th>
                        <th className="py-2.5">Holat</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {orders.map((ord) => (
                        <tr key={ord.id}>
                          <td className="py-3 pr-4 font-mono text-xs font-semibold">{ord.order_number}</td>
                          <td className="py-3 pr-4 text-xs">
                            {user.role === 'SELLER' ? ord.customer_name : ord.seller_name}
                          </td>
                          <td className="py-3 pr-4 font-mono tabular-nums font-semibold">{formatUzs(ord.total_uzs)}</td>
                          <td className="py-3">
                            {user.role === 'SELLER' || user.role === 'ADMIN' ? (
                              <select
                                value={ord.status}
                                onChange={async (e) => {
                                  await apiFetch(`/api/orders/${ord.id}/status`, {
                                    method: 'PATCH',
                                    body: JSON.stringify({ status: e.target.value }),
                                  });
                                  loadWorkspaceData();
                                  showToast('Buyurtma holati yangilandi', 'success');
                                }}
                                className="px-2 py-1 text-xs font-mono rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
                              >
                                {['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((st) => (
                                  <option key={st} value={st}>
                                    {st}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <span className="font-mono text-xs">{ord.status}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {tab === 'products' && (
            <div className="space-y-6">
              <form
                onSubmit={handleAddProduct}
                className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 grid grid-cols-1 sm:grid-cols-5 gap-3"
              >
                <input
                  required
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  placeholder="Yangi mahsulot nomi"
                  className="sm:col-span-2 px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
                />
                <input
                  type="number"
                  value={prodPrice}
                  onChange={(e) => setProdPrice(Number(e.target.value))}
                  placeholder="Narx UZS"
                  className="px-3 py-2 text-sm font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
                />
                <input
                  type="number"
                  value={prodStock}
                  onChange={(e) => setProdStock(Number(e.target.value))}
                  placeholder="Ombor soni"
                  className="px-3 py-2 text-sm font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
                />
                <button type="submit" className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-[#1E40AF] text-white text-sm font-semibold">
                  <Plus className="w-4 h-4" /> Qo&apos;shish
                </button>
              </form>

              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-left text-xs text-slate-500">
                      <th className="py-3 px-4">Mahsulot</th>
                      <th className="py-3 px-4">Narx</th>
                      <th className="py-3 px-4">Ombor</th>
                      <th className="py-3 px-4 text-right">Amal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {sellerProducts.map((p) => (
                      <tr key={p.id}>
                        <td className="py-3 px-4 font-medium">{p.name_uz}</td>
                        <td className="py-3 px-4 font-mono tabular-nums">{formatUzs(p.price_uzs)}</td>
                        <td className="py-3 px-4 font-mono tabular-nums">{p.stock_quantity} {p.unit}</td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={async () => {
                              await apiFetch(`/api/products/${p.id}`, { method: 'DELETE' });
                              loadWorkspaceData();
                              showToast('Mahsulot o‘chirildi', 'info');
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'services' && (
            <div className="space-y-6">
              {(user.role === 'CONTRACTOR' || user.role === 'ARCHITECT' || user.role === 'COMPANY') && (
                <form
                  onSubmit={handleAddService}
                  className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 grid grid-cols-1 sm:grid-cols-4 gap-3"
                >
                  <input
                    required
                    value={svcTitle}
                    onChange={(e) => setSvcTitle(e.target.value)}
                    placeholder="Yangi xizmat nomi"
                    className="sm:col-span-2 px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
                  />
                  <input
                    type="number"
                    value={svcPrice}
                    onChange={(e) => setSvcPrice(Number(e.target.value))}
                    className="px-3 py-2 text-sm font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
                  />
                  <button type="submit" className="px-4 py-2 rounded-lg bg-[#1E40AF] text-white text-sm font-semibold">
                    Xizmat qo&apos;shish
                  </button>
                </form>
              )}

              <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                <h2 className="font-display text-lg font-bold">Xizmat buyurtmalari va ish so&apos;rovlari</h2>
                {bookings.length === 0 ? (
                  <p className="text-sm text-slate-500">Hozircha xizmat so&apos;rovlari yo&apos;q.</p>
                ) : (
                  bookings.map((b) => (
                    <div key={b.id} className="py-3 border-b border-slate-100 dark:border-slate-800 flex flex-wrap justify-between items-center gap-3 text-sm">
                      <div>
                        <p className="font-semibold">{b.service_title}</p>
                        <p className="text-xs text-slate-500">
                          {b.customer_name} ↔ {b.provider_name} · {b.preferred_date} · {formatUzs(b.budget_uzs)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs">{b.status}</span>
                        {b.status === 'PENDING' && (user.role === 'CONTRACTOR' || user.role === 'ARCHITECT') && (
                          <button
                            type="button"
                            onClick={async () => {
                              await apiFetch(`/api/service-bookings/${b.id}`, {
                                method: 'PATCH',
                                body: JSON.stringify({ status: 'ACCEPTED' }),
                              });
                              loadWorkspaceData();
                            }}
                            className="px-3 py-1 rounded bg-emerald-600 text-white text-xs font-semibold"
                          >
                            Qabul qilish
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {tab === 'company' && (
            <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-5">
              <h2 className="font-display text-xl font-bold flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#1E40AF]" /> Kompaniya xodimlari
              </h2>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  await apiFetch('/api/companies/employees', {
                    method: 'POST',
                    body: JSON.stringify({ fullName: empName, position: empPos, specialty: empSpec, salaryUzs: 12000000 }),
                  });
                  setEmpName('');
                  loadWorkspaceData();
                  showToast('Xodim qo‘shildi', 'success');
                }}
                className="grid grid-cols-1 sm:grid-cols-4 gap-2"
              >
                <input
                  required
                  value={empName}
                  onChange={(e) => setEmpName(e.target.value)}
                  placeholder="F.I.Sh"
                  className="px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
                />
                <input
                  value={empPos}
                  onChange={(e) => setEmpPos(e.target.value)}
                  placeholder="Lavozimi"
                  className="px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
                />
                <input
                  value={empSpec}
                  onChange={(e) => setEmpSpec(e.target.value)}
                  placeholder="Yo‘nalishi"
                  className="px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
                />
                <button type="submit" className="px-4 py-2 rounded-lg bg-[#1E40AF] text-white text-sm font-semibold">
                  Xodim qo&apos;shish
                </button>
              </form>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {employees.map((emp) => (
                  <div key={emp.id} className="py-3 flex justify-between text-sm">
                    <div>
                      <p className="font-medium">{emp.full_name}</p>
                      <p className="text-xs text-slate-500">{emp.position} · {emp.specialty}</p>
                    </div>
                    <span className="font-mono tabular-nums text-xs">{formatUzs(emp.salary_uzs)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'estimates' && (
            <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="font-display text-xl font-bold">Saqlangan smetalar</h2>
                <button
                  type="button"
                  onClick={() => navigate('/calculator')}
                  className="px-4 py-2 rounded-lg bg-[#1E40AF] text-white text-xs font-semibold"
                >
                  Yangi smeta hisoblash
                </button>
              </div>
              {estimates.map((est) => (
                <div key={est.id} className="py-3 border-b border-slate-100 dark:border-slate-800 flex justify-between text-sm">
                  <div>
                    <p className="font-medium">{est.title}</p>
                    <p className="text-xs text-slate-500">
                      {est.region} · {est.building_area_sqm} m² · {est.floors} qavat
                    </p>
                  </div>
                  <span className="font-mono tabular-nums font-bold">{formatUzs(est.total_estimated_uzs)}</span>
                </div>
              ))}
            </div>
          )}

          {tab === 'messages' && <RealTimeChatView />}

          {tab === 'payments' && (
            <div className="space-y-6">
              <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
                <h2 className="font-display text-lg font-bold">Tarif rejalari (Click / Payme / Uzum Sandbox)</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                    <p className="font-display font-bold">PRO_SELLER — 490,000 UZS / oy</p>
                    <p className="text-xs text-slate-500">Cheksiz mahsulotlar va sotuv analitikasi</p>
                    <button
                      type="button"
                      onClick={() => handleSubscribeSandbox('PRO_SELLER')}
                      className="px-4 py-2 rounded-lg bg-[#1E40AF] text-white text-xs font-semibold"
                    >
                      Sandbox orqali ulash
                    </button>
                  </div>
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                    <p className="font-display font-bold">ENTERPRISE_COMPANY — 1,490,000 UZS / oy</p>
                    <p className="text-xs text-slate-500">Xodimlar boshqaruvi, shartnomalar va korporativ smetalar</p>
                    <button
                      type="button"
                      onClick={() => handleSubscribeSandbox('ENTERPRISE_COMPANY')}
                      className="px-4 py-2 rounded-lg bg-[#EA580C] text-white text-xs font-semibold"
                    >
                      Sandbox orqali ulash
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                <h3 className="font-display text-base font-bold">Tranzaksiyalar tarixi</h3>
                {payments.map((p) => (
                  <div key={p.id} className="py-2.5 border-b border-slate-100 dark:border-slate-800 flex justify-between text-xs">
                    <div>
                      <p className="font-mono font-semibold">{p.payment_ref} · {p.provider}</p>
                      <p className="text-slate-500">{p.created_at}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono tabular-nums font-bold">{formatUzs(p.amount_uzs)}</p>
                      <p className="text-emerald-600 font-mono">{p.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'contracts' && (
            <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
              <h2 className="font-display text-xl font-bold">Shartnomalar</h2>
              {contracts.map((c) => (
                <div key={c.id} className="py-3 border-b border-slate-100 dark:border-slate-800 flex justify-between text-sm">
                  <div>
                    <p className="font-semibold">{c.title}</p>
                    <p className="text-xs text-slate-500 font-mono">{c.contract_number} · {c.project_name}</p>
                  </div>
                  <span className="font-mono tabular-nums font-bold">{formatUzs(c.amount_uzs)}</span>
                </div>
              ))}
            </div>
          )}

          {tab === 'favorites' && (
            <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
              <h2 className="font-display text-xl font-bold">Tanlangan materiallar</h2>
              {favorites.length === 0 ? (
                <p className="text-sm text-slate-500">Tanlangan mahsulotlar yo&apos;q.</p>
              ) : (
                favorites.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => navigate(`/materials/${p.id}`)}
                    className="py-3 border-b border-slate-100 dark:border-slate-800 flex justify-between text-sm cursor-pointer"
                  >
                    <span>{p.name_uz}</span>
                    <span className="font-mono tabular-nums font-semibold">{formatUzs(p.price_uzs)}</span>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === 'notifications' && (
            <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="font-display text-xl font-bold">Bildirishnomalar</h2>
                <button
                  type="button"
                  onClick={async () => {
                    await apiFetch('/api/notifications/read-all', { method: 'POST' });
                    loadWorkspaceData();
                  }}
                  className="text-xs font-semibold text-[#1E40AF] hover:underline"
                >
                  Barchasini o&apos;qilgan deb belgilash
                </button>
              </div>
              {notifications.map((n) => (
                <div key={n.id} className={`p-3 rounded-lg border ${n.is_read ? 'border-slate-100 dark:border-slate-800' : 'border-blue-200 dark:border-blue-900 bg-blue-50/40 dark:bg-blue-950/20'}`}>
                  <p className="text-sm font-semibold">{n.title}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{n.body}</p>
                </div>
              ))}
            </div>
          )}

          {tab === 'admin' && user.role === 'ADMIN' && <AdminWorkspaceView />}

          {tab === 'profile' && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await apiFetch('/api/auth/profile', {
                  method: 'PATCH',
                  body: JSON.stringify({ fullName, phone, region, preferredLang: lang }),
                });
                await refreshUser();
                showToast('Profil yangilandi', 'success');
              }}
              className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4 max-w-xl"
            >
              <h2 className="font-display text-xl font-bold">Profil va sozlamalar</h2>
              <div>
                <label className="block text-xs text-slate-500 mb-1">To&apos;liq ism</label>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Telefon</label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Hudud</label>
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
                >
                  {UZBEKISTAN_REGIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              <button type="submit" className="px-5 py-2 rounded-lg bg-[#1E40AF] text-white text-sm font-semibold">
                Saqlash
              </button>
            </form>
          )}
        </main>
      </div>
    </div>
  );
}
