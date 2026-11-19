import { useEffect, useState } from 'react';
import { CheckCircle2, FileText, MapPin, Phone } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { formatUzs, pickLocalized, t, UZBEKISTAN_REGIONS } from '../i18n/translations.ts';
import { apiFetch } from '../lib/api.ts';
import { ResilientImage } from '../components/ui/ResilientImage.tsx';
import type { Architect, Company, Project } from '../types.ts';

export function CompaniesPage() {
  const { lang, navigate } = useApp();
  const [region, setRegion] = useState('');
  const [items, setItems] = useState<Company[]>([]);

  useEffect(() => {
    const qs = region ? `?region=${encodeURIComponent(region)}` : '';
    apiFetch<{ items: Company[] }>(`/api/companies${qs}`).then((res) => setItems(res.items));
  }, [region]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-white">{t(lang, 'navCompanies')}</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Litsenziyalangan qurilish kompaniyalari va bosh pudratchilar
          </p>
        </div>
        <select
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          className="px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
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
        {items.map((comp) => (
          <div
            key={comp.id}
            onClick={() => navigate(`/companies/${comp.id}`)}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden cursor-pointer hover:border-[#1E40AF]/50 transition-colors"
          >
            <ResilientImage src={comp.cover_url} alt={comp.name} className="w-full h-44 object-cover" />
            <div className="p-6 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  {comp.name}
                  {comp.verified === 1 && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                </h2>
                <span className="font-mono tabular-nums text-sm font-semibold">★ {comp.rating}</span>
              </div>
              <p className="text-xs text-slate-500">
                {comp.region} · Litsenziya: {comp.license_number} · {comp.completed_projects} ta obyekt
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2">
                {pickLocalized(comp as unknown as Record<string, unknown>, 'description', lang)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CompanyDetailPage({ id }: { id: number }) {
  const { user, lang, navigate } = useApp();
  const [data, setData] = useState<{
    company: Company;
    employees: Array<{ id: number; full_name: string; position: string; specialty: string }>;
    projects: Project[];
  } | null>(null);

  useEffect(() => {
    apiFetch<typeof data>(`/api/companies/${id}`).then(setData);
  }, [id]);

  if (!data) return <div className="max-w-7xl mx-auto p-10 text-sm text-slate-500">Yuklanmoqda...</div>;
  const { company, employees, projects } = data;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        <ResilientImage src={company.cover_url} alt={company.name} className="w-full h-64 object-cover" />
        <div className="p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                {company.name}
                {company.verified === 1 && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                {company.region} · {company.address} · Litsenziya {company.license_number}
              </p>
            </div>
            <button
              type="button"
              onClick={async () => {
                if (!user) {
                  navigate('/login');
                  return;
                }
                await apiFetch('/api/conversations', {
                  method: 'POST',
                  body: JSON.stringify({ peerId: company.owner_id, subject: `${company.name} bilan hamkorlik` }),
                });
                navigate('/dashboard?tab=messages');
              }}
              className="px-5 py-2.5 rounded-lg bg-[#1E40AF] text-white text-sm font-semibold whitespace-nowrap"
            >
              Kompaniya bilan bog&apos;lanish
            </button>
          </div>
          <p className="text-sm text-slate-700 dark:text-slate-300">
            {pickLocalized(company as unknown as Record<string, unknown>, 'description', lang)}
          </p>
          <div className="flex flex-wrap gap-6 text-xs text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> {company.phone}</span>
            <span>Tashkil topgan: {company.founded_year}</span>
            <span>Yakunlangan obyektlar: {company.completed_projects}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
          <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">Muhandis va mutaxassislar</h2>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {employees.map((emp) => (
              <div key={emp.id} className="py-2.5 flex justify-between text-sm">
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">{emp.full_name}</p>
                  <p className="text-xs text-slate-500">{emp.position}</p>
                </div>
                <span className="text-xs text-slate-500">{emp.specialty}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
          <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">Kompaniya loyihalari</h2>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {projects.map((p) => (
              <div
                key={p.id}
                onClick={() => navigate(`/projects/${p.id}`)}
                className="py-2.5 flex justify-between text-sm cursor-pointer hover:text-[#1E40AF]"
              >
                <span>{p.name}</span>
                <span className="font-mono tabular-nums text-xs">{p.progress_percent}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ArchitectsPage() {
  const { lang, navigate } = useApp();
  const [items, setItems] = useState<Architect[]>([]);

  useEffect(() => {
    apiFetch<{ items: Architect[] }>('/api/architects').then((res) => setItems(res.items));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-white">{t(lang, 'navArchitects')}</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Uy-joy, villa va tijorat binolari uchun professional arxitektura studiyalari
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {items.map((arch) => (
          <div
            key={arch.id}
            onClick={() => navigate(`/architects/${arch.id}`)}
            className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row gap-5 cursor-pointer hover:border-[#1E40AF]/50 transition-colors"
          >
            <ResilientImage
              src={arch.avatar_url}
              alt={arch.full_name}
              className="w-28 h-28 rounded-xl object-cover shrink-0"
            />
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">{arch.full_name}</h2>
                <span className="font-mono tabular-nums text-xs font-semibold">★ {arch.rating}</span>
              </div>
              <p className="text-xs text-[#1E40AF] dark:text-blue-400 font-medium">
                {arch.studio_name} · {arch.license_code}
              </p>
              <p className="text-xs text-slate-500">
                {arch.region} · {arch.experience_years} yil tajriba · {arch.completed_designs} loyiha
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2">{arch.bio}</p>
              <p className="font-mono tabular-nums text-sm font-bold text-[#EA580C]">
                {formatUzs(arch.price_per_sqm_uzs)} / m²
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ArchitectDetailPage({ id }: { id: number }) {
  const { user, navigate } = useApp();
  const [data, setData] = useState<{
    architect: Architect;
    portfolios: Array<{ id: number; title: string; region: string; area_sqm: number; completion_year: number; image_url: string; description: string }>;
  } | null>(null);

  useEffect(() => {
    apiFetch<typeof data>(`/api/architects/${id}`).then(setData);
  }, [id]);

  if (!data) return <div className="max-w-7xl mx-auto p-10 text-sm text-slate-500">Yuklanmoqda...</div>;
  const { architect, portfolios } = data;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col md:flex-row gap-6 items-start">
        <ResilientImage
          src={architect.avatar_url}
          alt={architect.full_name}
          className="w-36 h-36 rounded-xl object-cover shrink-0"
        />
        <div className="flex-1 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-white">{architect.full_name}</h1>
              <p className="text-sm text-slate-500">
                {architect.studio_name} · {architect.region} · {architect.license_code}
              </p>
            </div>
            <button
              type="button"
              onClick={async () => {
                if (!user) {
                  navigate('/login');
                  return;
                }
                await apiFetch('/api/conversations', {
                  method: 'POST',
                  body: JSON.stringify({ peerId: architect.user_id, subject: `Arxitektura loyihasi: ${architect.studio_name}` }),
                });
                navigate('/dashboard?tab=messages');
              }}
              className="px-5 py-2.5 rounded-lg bg-[#1E40AF] text-white text-sm font-semibold"
            >
              Loyiha buyurtma qilish
            </button>
          </div>
          <p className="text-sm text-slate-700 dark:text-slate-300">{architect.bio}</p>
          <p className="font-mono tabular-nums text-base font-bold text-[#EA580C]">
            Loyihalash narxi: {formatUzs(architect.price_per_sqm_uzs)} / m²
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Arxitektura portfoliosi</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {portfolios.map((pf) => (
            <div key={pf.id} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
              <ResilientImage src={pf.image_url} alt={pf.title} className="w-full aspect-[16/9] object-cover" />
              <div className="p-5 space-y-1.5">
                <p className="text-xs text-slate-500">
                  {pf.region} · {pf.area_sqm} m² · {pf.completion_year}
                </p>
                <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-white">{pf.title}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">{pf.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ProjectsPage() {
  const { lang, navigate } = useApp();
  const [region, setRegion] = useState('');
  const [items, setItems] = useState<Project[]>([]);

  useEffect(() => {
    const qs = region ? `?region=${encodeURIComponent(region)}` : '';
    apiFetch<{ items: Project[] }>(`/api/projects${qs}`).then((res) => setItems(res.items));
  }, [region]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-white">{t(lang, 'navProjects')}</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Qurilish obyektlari, byudjet nazorati, vazifalar va maydon foto hisobotlari
          </p>
        </div>
        <select
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          className="px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
        >
          <option value="">{t(lang, 'allRegions')}</option>
          {UZBEKISTAN_REGIONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {items.map((proj) => (
          <div
            key={proj.id}
            onClick={() => navigate(`/projects/${proj.id}`)}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden cursor-pointer hover:border-[#1E40AF]/50 transition-colors"
          >
            <ResilientImage src={proj.image_url} alt={proj.name} className="w-full aspect-[16/9] object-cover" />
            <div className="p-5 space-y-3">
              <p className="text-xs text-slate-500">
                {proj.region} · {proj.building_area_sqm} m² · {proj.floors} qavat
              </p>
              <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">{proj.name}</h2>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Bajarilish</span>
                  <span className="font-mono tabular-nums font-semibold">{proj.progress_percent}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div className="h-full bg-[#1E40AF]" style={{ width: `${proj.progress_percent}%` }} />
                </div>
              </div>
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between text-xs">
                <span className="text-slate-500">Smeta</span>
                <span className="font-mono tabular-nums font-semibold">{formatUzs(proj.estimated_budget_uzs)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProjectDetailPage({ id }: { id: number }) {
  const [data, setData] = useState<{
    project: Project;
    members: Array<{ id: number; full_name: string; member_role: string }>;
    tasks: Array<{ id: number; title: string; status: string; priority: string; deadline: string; assignee_name: string }>;
    progress: Array<{ id: number; title: string; notes: string; percent_complete: number; photo_url: string; created_at: string }>;
    expenses: Array<{ id: number; category: string; title: string; amount_uzs: number; expense_date: string }>;
    documents: Array<{ id: number; title: string; doc_type: string; file_size_kb: number }>;
  } | null>(null);

  useEffect(() => {
    apiFetch<typeof data>(`/api/projects/${id}`).then(setData);
  }, [id]);

  if (!data) return <div className="max-w-7xl mx-auto p-10 text-sm text-slate-500">Yuklanmoqda...</div>;
  const { project, members, tasks, progress, expenses, documents } = data;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        <ResilientImage src={project.image_url} alt={project.name} className="w-full h-64 object-cover" />
        <div className="p-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-white">{project.name}</h1>
              <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-1">
                <MapPin className="w-4 h-4" />
                {project.address} · {project.building_area_sqm} m² · {project.floors} qavat
              </p>
            </div>
            <div className="text-left md:text-right">
              <p className="text-xs text-slate-500">Smeta / Sarflangan</p>
              <p className="font-mono tabular-nums text-lg font-bold text-slate-900 dark:text-white">
                {formatUzs(project.spent_uzs)} / {formatUzs(project.estimated_budget_uzs)}
              </p>
            </div>
          </div>
          <p className="text-sm text-slate-700 dark:text-slate-300">{project.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
            <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">Vazifalar (Tasks)</h2>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {tasks.map((task) => (
                <div key={task.id} className="py-3 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{task.title}</p>
                    <p className="text-xs text-slate-500">
                      {task.assignee_name || 'Tayinlanmagan'} · Muddat: {task.deadline || '—'}
                    </p>
                  </div>
                  <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {task.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
            <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">Qurilish jarayoni (Timeline)</h2>
            <div className="space-y-4">
              {progress.map((pr) => (
                <div key={pr.id} className="flex gap-4 pb-4 border-b border-slate-100 dark:border-slate-800 last:border-0">
                  <ResilientImage src={pr.photo_url} alt={pr.title} className="w-24 h-20 rounded-lg object-cover shrink-0" />
                  <div>
                    <p className="text-xs text-slate-500 font-mono tabular-nums">{pr.percent_complete}% · {pr.created_at.slice(0, 10)}</p>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{pr.title}</h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{pr.notes}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
            <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">Xarajatlar</h2>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {expenses.map((ex) => (
                <div key={ex.id} className="py-2.5 flex justify-between gap-2 text-sm">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">{ex.title}</p>
                    <p className="text-xs text-slate-500">{ex.category} · {ex.expense_date}</p>
                  </div>
                  <span className="font-mono tabular-nums font-semibold shrink-0">{formatUzs(ex.amount_uzs)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
            <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">Jamoa va hujjatlar</h2>
            <div className="space-y-2 text-sm">
              {members.map((m) => (
                <div key={m.id} className="flex justify-between">
                  <span>{m.full_name}</span>
                  <span className="text-xs text-slate-500">{m.member_role}</span>
                </div>
              ))}
            </div>
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                  <span className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> {doc.title}</span>
                  <span className="font-mono">{doc.doc_type}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
