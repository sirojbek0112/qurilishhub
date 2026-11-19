import { useEffect, useState } from 'react';
import { Building2, Mail, MapPin, Phone, ShieldCheck } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { pickLocalized, t, UZBEKISTAN_REGIONS } from '../i18n/translations.ts';
import { apiFetch } from '../lib/api.ts';
import { ResilientImage } from '../components/ui/ResilientImage.tsx';
import type { BlogPost } from '../types.ts';

export function AboutPage() {
  const { navigate } = useApp();
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-10">
      <div className="space-y-4">
        <p className="text-xs font-medium text-[#1E40AF] dark:text-blue-400">QurilishHub Uzbekistan</p>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
          O&apos;zbekiston qurilish bozori uchun yagona shaffof raqamli ekotizim
        </h1>
        <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed">
          QurilishHub buyurtmachilar, qurilish materiallari yetkazib beruvchilari, pudratchilar, arxitektorlar va yirik
          qurilish kompaniyalarini bitta boshqaruv va savdo platformasida birlashtiradi. Bizning maqsadimiz — smeta
          hisob-kitobidan tortib obyekt topshirilishigacha bo&apos;lgan barcha jarayonlarni shaffof va nazorat qilinadigan
          qilish.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            title: '01. Materiallar bozori',
            desc: 'Toshkent, Samarqand, Buxoro va barcha viloyatlardagi rasmiy dilerlardan UZS narxlarida xarid.',
          },
          {
            title: '02. Tekshirilgan mutaxassislar',
            desc: 'Litsenziyalangan qurilish kompaniyalari, muhandislar, ustalar va arxitektura studiyalari.',
          },
          {
            title: '03. Loyiha va moliya nazorati',
            desc: 'Vazifalar, foto hisobotlar, xarajatlar daftari, shartnomalar va real vaqtli chat.',
          },
        ].map((card) => (
          <div key={card.title} className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
            <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">{card.title}</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">{card.desc}</p>
          </div>
        ))}
      </div>

      <div className="p-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white">Loyihangizni boshlashga tayyormisiz?</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Aqlli kalkulyator yordamida dastlabki smetangizni bepul hisoblang.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/calculator')}
          className="px-5 py-2.5 rounded-lg bg-[#1E40AF] text-white text-sm font-semibold whitespace-nowrap"
        >
          Kalkulyatorni ochish
        </button>
      </div>
    </div>
  );
}

export function BlogPage() {
  const { lang, navigate } = useApp();
  const [posts, setPosts] = useState<BlogPost[]>([]);

  useEffect(() => {
    apiFetch<{ items: BlogPost[] }>('/api/blog').then((res) => setPosts(res.items));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-white">{t(lang, 'navBlog')}</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Smeta, muhandislik standartlari va qurilish texnologiyalari bo&apos;yicha ekspert maqolalari
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {posts.map((post) => (
          <article
            key={post.id}
            onClick={() => navigate(`/blog/${post.id}`)}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden cursor-pointer hover:border-[#1E40AF]/50 transition-colors"
          >
            <ResilientImage
              src={post.image_url}
              alt={pickLocalized(post as unknown as Record<string, unknown>, 'title', lang)}
              className="w-full aspect-[4/3] object-cover"
            />
            <div className="p-5 space-y-2">
              <p className="text-xs text-slate-500">
                {post.category} · {post.read_minutes} min · {post.author_name}
              </p>
              <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                {pickLocalized(post as unknown as Record<string, unknown>, 'title', lang)}
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3">
                {pickLocalized(post as unknown as Record<string, unknown>, 'excerpt', lang)}
              </p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

export function BlogDetailPage({ id }: { id: string }) {
  const { lang, navigate } = useApp();
  const [post, setPost] = useState<BlogPost | null>(null);

  useEffect(() => {
    apiFetch<{ post: BlogPost }>(`/api/blog/${id}`).then((res) => setPost(res.post));
  }, [id]);

  if (!post) return <div className="max-w-4xl mx-auto p-10 text-sm text-slate-500">Yuklanmoqda...</div>;

  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-6">
      <button type="button" onClick={() => navigate('/blog')} className="text-xs font-medium text-[#1E40AF] hover:underline">
        ← Blogga qaytish
      </button>
      <div className="space-y-2">
        <p className="text-xs text-slate-500">
          {post.category} · {post.read_minutes} min · {post.author_name} · {post.created_at.slice(0, 10)}
        </p>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
          {pickLocalized(post as unknown as Record<string, unknown>, 'title', lang)}
        </h1>
      </div>
      <ResilientImage
        src={post.image_url}
        alt={pickLocalized(post as unknown as Record<string, unknown>, 'title', lang)}
        className="w-full aspect-[16/9] rounded-xl object-cover border border-slate-200 dark:border-slate-800"
      />
      <p className="text-base text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
        {pickLocalized(post as unknown as Record<string, unknown>, 'content', lang)}
      </p>
    </article>
  );
}

export function ContactPage() {
  const { showToast } = useApp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/api/contact', {
        method: 'POST',
        body: JSON.stringify({ name, email, phone, subject, message }),
      });
      setSent(true);
      setName('');
      setEmail('');
      setPhone('');
      setSubject('');
      setMessage('');
      showToast('Xabaringiz yuborildi!', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Xatolik yuz berdi', 'error');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 grid grid-cols-1 md:grid-cols-12 gap-8">
      <div className="md:col-span-5 space-y-5">
        <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-white">Biz bilan bog&apos;lanish</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Hamkorlik, korporativ ulanish va texnik yordam masalalari bo&apos;yicha murojaat qiling.
        </p>
        <div className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
          <p className="flex items-center gap-2.5"><MapPin className="w-4 h-4 text-[#1E40AF]" /> Toshkent sh., Amir Temur shoh ko&apos;chasi 107B</p>
          <p className="flex items-center gap-2.5"><Phone className="w-4 h-4 text-[#1E40AF]" /> +998 71 200 90 90</p>
          <p className="flex items-center gap-2.5"><Mail className="w-4 h-4 text-[#1E40AF]" /> support@qurilishhub.uz</p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="md:col-span-7 p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4"
      >
        {sent && (
          <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 text-sm">
            Murojaatingiz qabul qilindi. Tez orada mutaxassisimiz bog&apos;lanadi.
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            required
            type="text"
            placeholder="Ismingiz"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
          />
          <input
            required
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            type="text"
            placeholder="Telefon (+998 ...)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
          />
          <input
            required
            type="text"
            placeholder="Mavzu"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
          />
        </div>
        <textarea
          required
          rows={4}
          placeholder="Xabaringiz matni..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
        />
        <button type="submit" className="px-5 py-2.5 rounded-lg bg-[#1E40AF] text-white text-sm font-semibold">
          Xabar yuborish
        </button>
      </form>
    </div>
  );
}

export function LoginPage() {
  const { login, navigate, showToast } = useApp();
  const [email, setEmail] = useState('customer@qurilishhub.uz');
  const [password, setPassword] = useState('Password123!');
  const [loading, setLoading] = useState(false);

  const demoAccounts = [
    { role: 'CUSTOMER', email: 'customer@qurilishhub.uz', title: 'Buyurtmachi (Azizbek)' },
    { role: 'SELLER', email: 'seller@qurilishhub.uz', title: 'Sotuvchi (Bunyod Stroy)' },
    { role: 'CONTRACTOR', email: 'contractor@qurilishhub.uz', title: 'Pudratchi (Dilshod)' },
    { role: 'ARCHITECT', email: 'architect@qurilishhub.uz', title: 'Arxitektor (Sardorbek)' },
    { role: 'COMPANY', email: 'company@qurilishhub.uz', title: 'Kompaniya (TCBG)' },
    { role: 'ADMIN', email: 'admin@qurilishhub.uz', title: 'Administrator' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Kirishda xatolik', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
      <form
        onSubmit={handleSubmit}
        className="md:col-span-6 p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4"
      >
        <div className="flex items-center gap-2 text-[#1E40AF] dark:text-blue-400">
          <Building2 className="w-5 h-5" />
          <span className="font-display font-bold text-lg">QurilishHub</span>
        </div>
        <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Tizimga kirish</h1>
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Email</label>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Parol</label>
          <input
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-lg bg-[#1E40AF] hover:bg-blue-800 text-white text-sm font-semibold"
        >
          {loading ? 'Tekshirilmoqda...' : 'Kirish'}
        </button>
        <div className="flex items-center justify-between text-xs pt-2">
          <button type="button" onClick={() => navigate('/forgot-password')} className="text-slate-500 hover:underline">
            Parolni unutdingizmi?
          </button>
          <button type="button" onClick={() => navigate('/register')} className="font-semibold text-[#1E40AF] hover:underline">
            Ro&apos;yxatdan o&apos;tish
          </button>
        </div>
      </form>

      <div className="md:col-span-6 p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
            Tezkor rol sinovi (6 ta rol)
          </h2>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Har bir rolning haqiqiy JWT sessiyasi, huquqlari va boshqaruv panelini sinash uchun tanlang (Parol: <code className="font-mono">Password123!</code>):
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {demoAccounts.map((acc) => (
            <button
              key={acc.role}
              type="button"
              onClick={async () => {
                setEmail(acc.email);
                setPassword('Password123!');
                await login(acc.email, 'Password123!');
                navigate('/dashboard');
              }}
              className="text-left p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-[#1E40AF] bg-slate-50 dark:bg-slate-950 transition-colors"
            >
              <p className="text-xs font-mono font-semibold text-[#1E40AF] dark:text-blue-400">{acc.role}</p>
              <p className="text-xs font-medium text-slate-800 dark:text-slate-200 mt-0.5">{acc.title}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function RegisterPage() {
  const { register, navigate, showToast } = useApp();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+998 90 ');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('CUSTOMER');
  const [region, setRegion] = useState<string>(UZBEKISTAN_REGIONS[0]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register({ email, password, fullName, phone, role, region });
      navigate('/dashboard');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Ro‘yxatdan o‘tishda xatolik', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 py-12">
      <form
        onSubmit={handleSubmit}
        className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4"
      >
        <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Hisob yaratish</h1>
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">To&apos;liq ism / Kompaniya nomi</label>
          <input
            required
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Email</label>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Telefon</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Rol</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
            >
              <option value="CUSTOMER">Buyurtmachi (Customer)</option>
              <option value="SELLER">Material sotuvchisi (Seller)</option>
              <option value="CONTRACTOR">Pudratchi / Usta (Contractor)</option>
              <option value="ARCHITECT">Arxitektor (Architect)</option>
              <option value="COMPANY">Qurilish kompaniyasi (Company)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Hudud</label>
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
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Parol (kamida 6 belgi)</label>
          <input
            required
            minLength={6}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-lg bg-[#1E40AF] text-white text-sm font-semibold"
        >
          {loading ? 'Yaratilmoqda...' : "Ro'yxatdan o'tish"}
        </button>
        <p className="text-xs text-center text-slate-500">
          Hisobingiz bormi?{' '}
          <button type="button" onClick={() => navigate('/login')} className="font-semibold text-[#1E40AF] hover:underline">
            Kirish
          </button>
        </p>
      </form>
    </div>
  );
}

export function ForgotPasswordPage() {
  const { navigate, showToast } = useApp();
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await apiFetch<{ message: string }>('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
    setMsg(res.message);
    showToast('So‘rov yuborildi', 'info');
  };

  return (
    <div className="max-w-md mx-auto px-4 py-14">
      <form
        onSubmit={handleSubmit}
        className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4"
      >
        <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Parolni tiklash</h1>
        {msg && <p className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950 text-xs text-blue-800 dark:text-blue-200">{msg}</p>}
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email manzilingiz"
          className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
        />
        <button type="submit" className="w-full py-2.5 rounded-lg bg-[#1E40AF] text-white text-sm font-semibold">
          Tiklash havolasini yuborish
        </button>
        <button type="button" onClick={() => navigate('/login')} className="w-full text-xs text-slate-500 hover:underline">
          Kirish sahifasiga qaytish
        </button>
      </form>
    </div>
  );
}
